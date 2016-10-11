#!/bin/sh

# Assume we're using postgresql 9.4 (latest stable at the current moment)
PG_VERSION=9.4
DBUSER=savant
DBPASS=AWCvTqs425MM671
DBNAME=savant

# CAUTION: THIS FILE IS INTENDED TO BE RUN ON UBUNTU!
PGPKGLIST=`apt-cache search postgresql-$PG_VERSION`
if [ -z "$PGPKGLIST" ]; then
    echo "Package postgres-$PG_VERSION not found, trying to add repo"
    UBUNTU_CODENAME=`lsb_release -c -s`
    sudo sh -c "echo \"deb http://apt.postgresql.org/pub/repos/apt/ $UBUNTU_CODENAME-pgdg main\" > /etc/apt/sources.list.d/pgdg.list"
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt-get update
fi

sudo apt-get install -y postgresql-$PG_VERSION postgresql-contrib-$PG_VERSION postgresql-server-dev-$PG_VERSION

sudo su postgres -c "/usr/lib/postgresql/$PG_VERSION/bin/initdb /var/lib/postgresql/$PG_VERSION/main"

sudo service postgresql start

echo "CREATE USER $DBUSER WITH LOGIN PASSWORD '$DBPASS';" | sudo -u postgres psql
echo "CREATE DATABASE $DBNAME OWNER $DBUSER;" | sudo -u postgres psql
echo "CREATE EXTENSION pg_trgm;" | sudo -u postgres psql -d $DBNAME
