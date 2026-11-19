#!/bin/sh
# Runs once, on first initialisation of the data volume: creates the test database next to the dev one.
# (scripts/run.mjs re-checks both databases, so volumes created before this script existed still work.)
set -eu
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE \"${DB_NAME_TEST}\""
