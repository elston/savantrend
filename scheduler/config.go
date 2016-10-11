package main

type Config struct {
	CsvFolder      string `json:"CsvFolder"`
	BackupFolder   string `json:"BackupFolder"`
	LogsFolder     string `json:"LogsFolder"`
	DbName         string `json:"DbName"`
	DbUser         string `json:"DbUser"`
	DbPassword     string `json:"DbPassword"`
	TimeInterval   int    `json:"TimeInterval"`
	TableReport    string
	TableSite      string
	TableChain     string
	TableZone      string
	TableUser      string
	TableUserChain string
	TableUserSite  string
	TableUserZone  string
}

func (c *Config) SetDefaults() {
	c.TableReport = "web_report"
	c.TableSite = "web_site"
	c.TableChain = "web_chain"
	c.TableZone = "web_zone"
	c.TableUser = "web_user"
	c.TableUserChain = "web_user_chain"
	c.TableUserSite = "web_user_site"
	c.TableUserZone = "web_user_zone"
}

func (c *Config) getTimeIntervalSeconds() int {
	return c.TimeInterval * 60
}
