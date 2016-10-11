package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"time"

	_ "github.com/lib/pq"
)

var (
	config *Config
)

func main() {
	scanPtr := flag.Bool("scan", false, "")
	debugPtr := flag.Bool("debug", false, "")
	// scan forever (server mode)
	foreverPtr := flag.Bool("forever", false, "")

	flag.Parse()

	parseSettings()

	if *debugPtr == false {
		// Set logging to file in production
		t := time.Now()

		folder := fmt.Sprintf("%s/%d/%02d", config.LogsFolder, t.Year(), t.Month())
		folder = path.Clean(folder)
		err := os.MkdirAll(folder, 0755)
		checkError(err, "Can't create log directory")

		logFile := fmt.Sprintf("%s/%02d.txt", folder, t.Day())
		f, err := os.OpenFile(logFile, os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0644)
		defer f.Close()

		log.SetOutput(f)
	}

	if *scanPtr == true {
		startScanner(*foreverPtr)
	} else {
		fmt.Println("Please provide correct arguments.")
	}
}

// Starts scaner
func startScanner(forever bool) {
	runScanner()
	if forever == false {
		return
	}

	currentTick := 0
	for {
		time.Sleep(1 * time.Second)
		currentTick += 1

		if currentTick > config.getTimeIntervalSeconds() {
			runScanner()
			currentTick = 0
		}
	}
}

// Scans csv folder and loads data to database
func runScanner() {
	log.Println("Starting to scan csv folder...")

	scanner := &Scanner{}

	scanner.connect()
	scanner.scan()

	scanner.disconnect()
}

// Parses settings.json
func parseSettings() {
	dir, err := os.Getwd()
	checkError(err, "Can't get current directory.")

	file := dir + "/settings.json"
	data, err := ioutil.ReadFile(file)
	checkError(err, "Can't open settings.json")

	err = json.Unmarshal(data, &config)
	checkError(err, "Can't get correct JSON from settings.json")

	config.SetDefaults()
}
