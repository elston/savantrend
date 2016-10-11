package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
)

type Scanner struct {
	db *sql.DB
}

func (s *Scanner) connect() {
	cs := fmt.Sprintf("user=%s password=%s dbname=%s port=5432 sslmode=disable", config.DbUser, config.DbPassword, config.DbName)
	db, err := sql.Open("postgres", cs)
	checkError(err, "Can't connect to PostgreSQL database")
	s.db = db
	s.db.SetMaxIdleConns(10)
}

func (s *Scanner) disconnect() {
	s.db.Close()
}

func (s *Scanner) scan() {
	files, err := ioutil.ReadDir(config.CsvFolder)
	checkError(err, "Can't scan csv folder")

	for _, f := range files {
		file := fmt.Sprintf("%s/%s", config.CsvFolder, f.Name())
		file = path.Clean(file)

		if !strings.HasSuffix(file, ".csv") {
			continue
		}

		if !strings.HasPrefix(path.Base(file), "data_") {
			continue
		}

		s.processFile(file)
	}
}

func (s *Scanner) processFile(file string) {
	re := regexp.MustCompile("data_([0-9]+)_")
	res := re.FindStringSubmatch(file)
	if len(res) != 2 {
		return
	}

	// Getting clientId from filename
	clientId, _ := strconv.Atoi(res[1])

	// Check if user exists
	s.isUserExists(clientId)

	// Fill foreign keys before main processing
	s.fillForeignKeys(file, clientId)

	f, err := os.Open(file)
	checkError(err, fmt.Sprintf("processFile: Can't open file: %s", file))
	defer f.Close()

	tx, err := s.db.Begin()
	checkError(err, fmt.Sprintf("processFile: Can't start transaction: %s", file))

	stmt, err := tx.Prepare(pq.CopyIn(config.TableReport,
		"datetime",
		"visitors_in",
		"visitors_out",
		"sales",
		"transactions",
		"associates",
		"items",
		"zone_name",
		"site_name",
		"chain_name",
		"chain_id",
		"site_id",
		"zone_id",
		"client_id",
	))
	checkError(err, fmt.Sprintf("processFile: Can't start statement: %s", file))

	// start timer
	start := time.Now()

	// mapping of client's chain_id, site_id, zone_id to real foreign keys
	muc := s.getUserChainMap(clientId)
	mus := s.getUserSiteMap(clientId)
	muz := s.getUserZoneMap(clientId)

	count := 0
	bs := bufio.NewScanner(f)
	for bs.Scan() {
		rowString := bs.Text()

		row := &Row{}
		res := row.parseRow(rowString)
		if !res {
			continue
		}

		_, err := stmt.Exec(
			row.dateTime,
			row.visitorsIn,
			row.visitorsOut,
			row.sales,
			row.transactions,
			row.associates,
			row.items,
			row.zoneName,
			row.siteName,
			row.chainName,
			muc[row.chainId],
			mus[row.siteId],
			muz[row.zoneId],
			clientId,
		)

		if err != nil {
			log.Printf("Problem with inserting row: %s\n", rowString)
			log.Println(err)
		} else {
			count += 1
		}
	}

	stmt.Exec()
	stmt.Close()
	tx.Commit()

	elapsed := time.Since(start)
	log.Printf("Processing file %s: %s\n", path.Base(file), elapsed)
	log.Printf("Inserted %d rows\n", count)

	f.Close() // close before moving
	s.moveFileToBackup(file)
}

func (s *Scanner) moveFileToBackup(file string) {
	t := time.Now()

	folder := fmt.Sprintf("%s/%d/%02d/%02d/%02d", config.BackupFolder, t.Year(), t.Month(), t.Day(), t.Hour())
	folder = path.Clean(folder)
	err := os.MkdirAll(folder, 0755)
	checkError(err, "Can't create backup directory")

	fileName := path.Base(file)
	dst := fmt.Sprintf("%s/%s", folder, fileName)

	err = os.Rename(file, dst)
	checkError(err, "Can't copy file to backup")

}

func (s *Scanner) fillForeignKeys(file string, clientId int) {
	// Before main processing - we should scan file and create foreign keys.
	// To not loose speed of inserts to main large report table

	f, err := os.Open(file)
	checkError(err, fmt.Sprintf("fillForeignKeys: Can't open file: %s", file))
	defer f.Close()

	// cache existing info to memory
	exChains := s.getChains(clientId)
	exSites := s.getSites(clientId)
	exZones := s.getZones(clientId)

	newChains := map[int]*Chain{}
	newSites := map[int]*Site{}
	newZones := map[int]*Zone{}

	// First - get all chains, sites and zones
	// And add to memory only those that not exist
	bs := bufio.NewScanner(f)
	for bs.Scan() {
		rowString := bs.Text()

		row := &Row{}
		res := row.parseRow(rowString)
		if !res {
			continue
		}

		if _, ok := exChains[row.chainId]; !ok {
			exChains[row.chainId] = true
			newChains[row.chainId] = &Chain{0, row.chainId, row.chainName, clientId}
		}

		if _, ok := exSites[row.siteId]; !ok {
			exSites[row.siteId] = true
			newSites[row.siteId] = &Site{0, row.siteId, row.siteName, row.chainId, clientId}
		}

		if _, ok := exZones[row.zoneId]; !ok {
			exZones[row.zoneId] = true
			newZones[row.zoneId] = &Zone{0, row.zoneId, row.zoneName, clientId, row.siteId}
		}
	}

	stmt_c, err := s.db.Prepare(fmt.Sprintf("INSERT INTO %q (name, chain_id, client_id) values ($1, $2, $3)", config.TableChain))
	checkError(err, "Can't start statement 'stmt_c'")
	defer stmt_c.Close()

	// chain_id is primary key here
	stmt_s, err := s.db.Prepare(fmt.Sprintf("INSERT INTO %q (name, site_id, chain_id, client_id) values ($1, $2, $3, $4)", config.TableSite))
	checkError(err, "Can't start statement 'stmt_s'")
	defer stmt_s.Close()

	// site_id is primary key here
	stmt_z, err := s.db.Prepare(fmt.Sprintf("INSERT INTO %q (name, zone_id, client_id, site_id) values ($1, $2, $3, $4)", config.TableZone))
	checkError(err, "Can't start statement 'stmt_z'")
	defer stmt_z.Close()

	// chain_id is relation to primary key here
	stmt_pc, err := s.db.Prepare(fmt.Sprintf("INSERT INTO %q (user_id, chain_id) values ($1, $2)", config.TableUserChain))
	checkError(err, "Can't start statement 'stmt_pc'")
	defer stmt_pc.Close()

	// site_id is relation to primary key here
	stmt_ps, err := s.db.Prepare(fmt.Sprintf("INSERT INTO %q (user_id, site_id) values ($1, $2)", config.TableUserSite))
	checkError(err, "Can't start statement 'stmt_ps'")
	defer stmt_ps.Close()

	// zone_id is relation to primary key here
	stmt_pz, err := s.db.Prepare(fmt.Sprintf("INSERT INTO %q (user_id, zone_id) values ($1, $2)", config.TableUserZone))
	checkError(err, "Can't start statement 'stmt_pz'")
	defer stmt_pz.Close()

	// Insert new chains
	for _, chain := range newChains {
		_, err := stmt_c.Exec(chain.Name, chain.ChainId, chain.ClientId)
		checkError(err, "Error in stmt_c")

		// postgre doesn't support lastinsertid
		id := s.getChainLastInsertId(clientId, chain.ChainId)

		// inserting many to many relation
		_, err = stmt_pc.Exec(clientId, id)
		checkError(err, "Error in stmt_pc")
	}

	muc := s.getUserChainMap(clientId)

	// Insert new sites
	for _, site := range newSites {
		_, err := stmt_s.Exec(site.Name, site.SiteId, muc[site.ChainId], site.ClientId)
		checkError(err, "Error in stmt_s")

		id := s.getSiteLastInsertId(clientId, site.SiteId)

		// inserting many to many relation
		_, err = stmt_ps.Exec(clientId, id)
		checkError(err, "Error in stmt_ps")
	}

	mus := s.getUserSiteMap(clientId)

	// Insert new zones
	for _, zone := range newZones {
		_, err := stmt_z.Exec(zone.Name, zone.ZoneId, zone.ClientId, mus[zone.SiteId])
		checkError(err, "Error in stmt_z")

		id := s.getZoneLastInsertId(clientId, zone.ZoneId)

		// inserting many to many relation
		_, err = stmt_pz.Exec(clientId, id)
		checkError(err, "Error in stmt_pz")

		// Insert profile zones if any
		// query := fmt.Sprintf(
		// 	"select count(*) as count FROM %q where user_id=%d and zone_id=%d",
		// 	config.TableUserZone, clientId, zone.ZoneId)
		// rows, err := s.db.Query(query)
		// checkError(err, fmt.Sprintf("Error in: ", query))

		// count := getRowsCount(rows)
		// if count == 0 {
		// 	_, err := stmt_pz.Exec(clientId, zone.ZoneId)
		// 	checkError(err, "Error in stmt_pz")
		// }
	}
}

// cache chains for particular client initially from database
func (s *Scanner) getChains(clientId int) map[int]bool {
	query := fmt.Sprintf("select chain_id from %q where client_id=$1", config.TableChain)
	rows, err := s.db.Query(query, clientId)
	checkError(err, "Can't getChains")
	defer rows.Close()

	chains := map[int]bool{}

	for rows.Next() {
		chain := &Chain{}
		rows.Scan(&chain.ChainId)
		chains[chain.ChainId] = true
	}
	return chains
}

// cache sites for particular client initially from database
func (s *Scanner) getSites(clientId int) map[int]bool {
	query := fmt.Sprintf("select site_id from %q where client_id=$1", config.TableSite)
	rows, err := s.db.Query(query, clientId)
	checkError(err, "Can't getSites")
	defer rows.Close()

	sites := map[int]bool{}

	for rows.Next() {
		site := &Site{}
		rows.Scan(&site.SiteId)
		sites[site.SiteId] = true
	}
	return sites
}

// cache zones for particular initially from database
func (s *Scanner) getZones(clientId int) map[int]bool {
	query := fmt.Sprintf("select zone_id from %q where client_id=$1", config.TableZone)
	rows, err := s.db.Query(query, clientId)
	checkError(err, "Can't getZones")
	defer rows.Close()

	zones := map[int]bool{}

	for rows.Next() {
		zone := &Zone{}
		rows.Scan(&zone.ZoneId)
		zones[zone.ZoneId] = true
	}
	return zones
}

// we need mapping: key: chain_id, value: id(pk)
func (s *Scanner) getUserChainMap(clientId int) map[int]int {
	query := fmt.Sprintf("select id, chain_id from %q where client_id=$1", config.TableChain)
	rows, err := s.db.Query(query, clientId)
	checkError(err, "Can't getUserChainMap")
	defer rows.Close()

	m := map[int]int{}

	for rows.Next() {
		chain := &Chain{}
		rows.Scan(&chain.Id, &chain.ChainId)
		m[chain.ChainId] = chain.Id
	}
	return m
}

// we need mapping: key: site_id, value: id(pk)
func (s *Scanner) getUserSiteMap(clientId int) map[int]int {
	query := fmt.Sprintf("select id, site_id from %q where client_id=$1", config.TableSite)
	rows, err := s.db.Query(query, clientId)
	checkError(err, "Can't getUserSiteMap")
	defer rows.Close()

	m := map[int]int{}

	for rows.Next() {
		site := &Site{}
		rows.Scan(&site.Id, &site.SiteId)
		m[site.SiteId] = site.Id
	}
	return m
}

// we need mapping: key: site_id, value: id(pk)
func (s *Scanner) getUserZoneMap(clientId int) map[int]int {
	query := fmt.Sprintf("select id, zone_id from %q where client_id=$1", config.TableZone)
	rows, err := s.db.Query(query, clientId)
	checkError(err, "Can't getUserZoneMap")
	defer rows.Close()

	m := map[int]int{}

	for rows.Next() {
		zone := &Zone{}
		rows.Scan(&zone.Id, &zone.ZoneId)
		m[zone.ZoneId] = zone.Id
	}
	return m
}

func (s *Scanner) getChainLastInsertId(clientId int, chainId int) int {
	query := fmt.Sprintf("select id from %q where client_id=%d and chain_id=%d", config.TableChain, clientId, chainId)
	row := s.db.QueryRow(query)
	var id int
	err := row.Scan(&id)
	checkError(err, "Can't getChainLastInsertId")
	return id
}

func (s *Scanner) getSiteLastInsertId(clientId int, siteId int) int {
	query := fmt.Sprintf("select id from %q where client_id=%d and site_id=%d", config.TableSite, clientId, siteId)
	row := s.db.QueryRow(query)
	var id int
	err := row.Scan(&id)
	checkError(err, "Can't getSiteLastInsertId")
	return id
}

func (s *Scanner) getZoneLastInsertId(clientId int, zoneId int) int {
	query := fmt.Sprintf("select id from %q where client_id=%d and zone_id=%d", config.TableZone, clientId, zoneId)
	row := s.db.QueryRow(query)
	var id int
	err := row.Scan(&id)
	checkError(err, "Can't getZoneLastInsertId")
	return id
}

func (s *Scanner) isUserExists(clientId int) {
	query := fmt.Sprintf("select count(*) as count FROM %q where id=%d", config.TableUser, clientId)
	rows, err := s.db.Query(query)
	checkError(err, fmt.Sprintf("Error in: ", query))

	count := getRowsCount(rows)
	if count == 0 {
		fmt.Sprintf("Client with id: %d doesn not exist.", clientId)
		os.Exit(0)
	}
}
