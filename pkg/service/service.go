package service

import (
	paxv1 "github.com/borud/paxcli/pkg/pax/v1"
	"github.com/borud/paxcli/pkg/store"
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
