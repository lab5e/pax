package sqlitestore

import (
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/borud/paxcli/pkg/store"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite" // include driver
)

type sqliteStore struct {
	dbSpec string
	mu     sync.RWMutex
	db     *sqlx.DB

	sample sampleStatements
	device deviceStatements
}

var pragmas = []string{
	"PRAGMA foreign_keys = ON",    // turn on foreign keys
	"PRAGMA cache_size = -200000", // cache size in kibibytes, approx 200Mb
	"PRAGMA journal_mode = WAL",   // turn on write-ahead journaling mode
	"PRAGMA secure_delete = OFF",  // we do not need to overwrite deleted data with zeroes
	"PRAGMA synchronous = NORMAL", // this is the appropriate setting for WAL
	"PRAGMA temp_store = MEMORY",  // store any temporary tables and indices in memory
}

func (s *sqliteStore) initializePreparedStatements() error {
	return FirstError(
		s.initSampleStatements(),
		s.initDeviceStatements(),
	)
}

// New opens a database. If the database did not already exist or it is a memory based database
// it will populate the schema.
func New(dbSpec string) (store.Store, error) {
	db, err := openDB(dbSpec)
	if err != nil {
		return nil, err
	}

	// execute pragmas
	for _, pragma := range pragmas {
		_, err := db.Exec(pragma)
		if err != nil {
			return nil, fmt.Errorf("error while executing pragma [%s]: %w", pragma, err)
		}
	}

	store := &sqliteStore{
		dbSpec: dbSpec,
		db:     db,
	}

	return store, store.initializePreparedStatements()
}

// Close the sqliteStore.
func (s *sqliteStore) Close() error {
	return s.db.Close()
}

// openDB opens a database. If it does not exist it is created and the schema is
// populated.  If it is memory based the schema is always created.
func openDB(dbSpec string) (*sqlx.DB, error) {
	// If the file does not already exist or the database is an in-memory database
	// we need to create the schema.
	dbNeedsCreation := true
	if !strings.Contains(dbSpec, ":memory:") {
		_, err := os.Stat(dbSpec)
		dbNeedsCreation = os.IsNotExist(err)
	}

	db, err := sqlx.Open("sqlite", dbSpec)
	if err != nil {
		return nil, fmt.Errorf("unable to open database: %w", err)
	}

	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	if dbNeedsCreation {
		err := createSchema(db)
		if err != nil {
			return nil, fmt.Errorf("unable to create schema: %w", err)
		}
		log.Printf("created datatase [%s]", dbSpec)
	}

	return db, nil
}
