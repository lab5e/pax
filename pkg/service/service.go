package service

import (
	paxv1 "github.com/lab5e/pax/pkg/pax/v1"
	"github.com/lab5e/pax/pkg/store"
)

// Service implements our gRPC service.
type Service interface {
	paxv1.PaxServiceServer
}

type service struct {
	db store.Store
}

// New creates a new service instance.
func New(db store.Store) Service {
	return &service{
		db: db,
	}
}
