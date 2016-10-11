package main

import (
	"strconv"
	"strings"
)

type Row struct {
	clientId     int
	chainId      int
	chainName    string
	siteId       int
	siteName     string
	zoneId       int
	zoneName     string
	dateTime     string
	visitorsIn   int
	visitorsOut  int
	sales        string
	transactions int
	associates   int
	items        int
}

func (row *Row) parseRow(rowString string) bool {
	l := strings.Split(rowString, ",")
	if len(l) != 13 {
		return false
	}

	chainId, err := strconv.Atoi(l[0])
	if err != nil {
		return false
	}
	row.chainId = chainId

	row.chainName = l[1]

	siteId, err := strconv.Atoi(l[2])
	if err != nil {
		return false
	}
	row.siteId = siteId

	row.siteName = l[3]

	zoneId, err := strconv.Atoi(l[4])
	if err != nil {
		return false
	}
	row.zoneId = zoneId

	row.zoneName = l[5]

	dateTime := l[6]
	if len(dateTime) < 16 {
		return false
	}
	row.dateTime = dateTime[:16]

	// re := regexp.MustCompile("([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})")
	// res := re.FindStringSubmatch(dateTime)

	visitorsIn, err := strconv.Atoi(l[7])
	if err != nil {
		return false
	}
	row.visitorsIn = visitorsIn

	visitorsOut, err := strconv.Atoi(l[8])
	if err != nil {
		return false
	}
	row.visitorsOut = visitorsOut

	row.sales = l[9]

	transactions, err := strconv.Atoi(l[10])
	if err != nil {
		return false
	}
	row.transactions = transactions

	associates, err := strconv.Atoi(l[11])
	if err != nil {
		return false
	}
	row.associates = associates

	items, err := strconv.Atoi(l[12])
	if err != nil {
		return false
	}
	row.items = items
	return true
}
