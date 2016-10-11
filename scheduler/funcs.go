package main

import (
	"database/sql"
	"log"
)

func checkError(err error, message string) {
	if err != nil {
		log.Println(message)
		log.SetFlags(log.Llongfile | log.Ldate | log.Ltime)
		log.Fatal(err)
	}
}

func getRowsCount(rows *sql.Rows) int {
	var count int
	for rows.Next() {
		err := rows.Scan(&count)
		checkError(err, "Can't count rows.")
	}
	return count
}
