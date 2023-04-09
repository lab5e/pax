package main

import (
	"fmt"
	"log"
	"math"
	"os"
	"os/signal"
	"syscall"

	"github.com/lab5e/pax/pkg/server"
	"github.com/lab5e/pax/pkg/span"
	"github.com/lab5e/pax/pkg/store"
	"github.com/lab5e/pax/pkg/store/sqlitestore"
)

type serverCmd struct {
	SkipCatchup bool `long:"skip-catchup" description:"skip catchup from Span"`
	FetchOnNew  bool `long:"fetch-on-new" description:"fetch entire backlog if empty DB"`
}

func (s *serverCmd) Execute([]string) error {
	db, err := sqlitestore.New(opt.DB)
	if err != nil {
		return fmt.Errorf("error opening database [%s]: %v", opt.DB, err)
	}
	defer db.Close()

	if s.FetchOnNew {
		err := s.maybeFetchBacklog(db)
		if err != nil {
			return fmt.Errorf("error fetching backlog: %v", err)
		}
	}

	if !s.SkipCatchup {
		lastSample, err := db.GetLastSample()
		if err != nil {
			log.Printf("unable to get last sample: %v", err)
		} else {
			fetch := span.Fetch{
				Token:               opt.Token,
				CollectionID:        opt.CollectionID,
				DB:                  db,
				FetchUntilMessageID: lastSample.MessageID,
			}
			err = fetch.Execute()
			if err != nil {
				log.Printf("unable to catch up new samples from Span: %v", err)
			}
		}
	}

	server.Create(server.Config{
		DB:               db,
		HTTPListenAddr:   opt.HTTPListenAddr,
		GRPCListenAddr:   opt.GRPCListenAddr,
		SpanToken:        opt.Token,
		SpanCollectionID: opt.CollectionID,
	})

	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	return nil
}

func (s *serverCmd) maybeFetchBacklog(db store.Store) error {
	samples, err := db.ListSamples(0, math.MaxInt64, 1)
	if err != nil {
		return fmt.Errorf("db error: %v", err)
	}

	// if we have some data there is no need to fetch the backlog
	if len(samples) > 0 {
		return nil
	}

	log.Printf("fetching entire data backlog, his may take a while")
	fetch := span.Fetch{
		Token:        opt.Token,
		CollectionID: opt.CollectionID,
		DB:           db,
	}
	return fetch.Execute()
}
