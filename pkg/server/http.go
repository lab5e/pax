package server

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/lab5e/pax/doc"
	paxv1 "github.com/lab5e/pax/pkg/pax/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func (s *Server) startHTTP() error {
	restMux := runtime.NewServeMux()
	err := paxv1.RegisterPaxServiceHandlerFromEndpoint(
		context.Background(),
		restMux,
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

	swaggerFiles := http.FileServer(http.FS(doc.SwaggerFiles))

	mux := mux.NewRouter()
	mux.HandleFunc("/", s.handleIndex).Methods("GET")
	mux.PathPrefix("/doc/").Handler(http.StripPrefix("/doc/", swaggerFiles)).Methods("GET")
	mux.PathPrefix("/api/v1").Handler(restMux).Methods("GET")

	s.httpServer = &http.Server{
		Handler: mux,
	}

	go func() {
		log.Printf("starting HTTP on [%s]", s.config.HTTPListenAddr)
		err := s.httpServer.Serve(httpListener)
		if err != http.ErrServerClosed {
			log.Printf("http server error [%s]: %v", s.config.HTTPListenAddr, err)
			return
		}
		log.Printf("shut down http interface [%s]", s.config.HTTPListenAddr)
	}()

	return nil
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>PAX</title>
	</head>
	<body>
		<ul>
			<li><a href="/api/v1/data">Data endpoint</a></li>
			<li><a href="/api/v1/devices">Devices endpoint</a></li>
			<li><a href="/doc/swagger/pax/v1/">OpenAPI</a></li>		
	</body>
	</html>
	`)
}
