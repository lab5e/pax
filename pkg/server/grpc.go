package server

import (
	"fmt"
	"log"
	"net"

	paxv1 "github.com/borud/paxcli/pkg/pax/v1"
	"github.com/borud/paxcli/pkg/service"
	"google.golang.org/grpc"
)

func (s *Server) startGRPC() error {
	// Fire up gRPC endpoint
	s.grpcServer = grpc.NewServer(grpc.UnaryInterceptor(s.serverInterceptor))
	paxv1.RegisterPaxServiceServer(s.grpcServer, service.New(s.config.DB))

	grpcListener, err := net.Listen("tcp", s.config.GRPCListenAddr)
	if err != nil {
		return fmt.Errorf("error creating gRPC listen socket: %w", err)
	}

	go func() {
		err = s.grpcServer.Serve(grpcListener)
		if err != nil {
			log.Printf("grpc server error [%s]: %v", s.config.GRPCListenAddr, err)
			return
		}
		log.Printf("shut down gRPC interface [%s]", s.config.GRPCListenAddr)
	}()

	return nil
}
