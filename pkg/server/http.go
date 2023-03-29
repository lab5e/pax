package server

import (
	"context"
	"log"
	"net"
	"net/http"

	paxv1 "github.com/borud/paxcli/pkg/pax/v1"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func (s *Server) startHTTP() error {
	mux := runtime.NewServeMux()
	err := paxv1.RegisterPaxServiceHandlerFromEndpoint(
		context.Background(),
		mux,
		s.config.GRPCListenAddr,
		[]grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())},
	)
	if err != nil {
		return err
	}

	httpListener, err := net.Listen("tcp", s.config.HTTPListenAddr)
	if err != nil {
		return err
	}

	s.httpServer = &http.Server{
		Handler: mux,
	}

	go func() {
		err := s.httpServer.Serve(httpListener)
		if err != http.ErrServerClosed {
			log.Printf("http server error [%s]: %v", s.config.HTTPListenAddr, err)
			return
		}
		log.Printf("shut down http interface [%s]", s.config.HTTPListenAddr)
	}()

	return nil
}
