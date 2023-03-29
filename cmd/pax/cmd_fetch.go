package main

import (
	"fmt"
	"log"

	"github.com/borud/paxcli/pkg/span"
	"github.com/borud/paxcli/pkg/store/sqlitestore"
)

type fetchCmd struct{}

func (f *fetchCmd) Execute([]string) error {
	db, err := sqlitestore.New(opt.DB)
	if err != nil {
		return fmt.Errorf("error opening database [%s]: %v", opt.DB, err)
	}
	defer db.Close()

	log.Printf("fetching data into [%s]", opt.DB)
	fetch := span.Fetch{
		Token:        opt.Token,
		CollectionID: opt.CollectionID,
		DB:           db,
	}

	return fetch.Execute()
}
