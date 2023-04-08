package server

import (
	"context"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/lab5e/pax/doc"
	"github.com/lab5e/pax/frontend"
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

	frontendFS, err := fs.Sub(frontend.FrontendFS, "dist/frontend")
	if err != nil {
		return err
	}

	mux := mux.NewRouter()
	mux.PathPrefix("/doc/").Handler(http.StripPrefix("/doc/", swaggerFiles)).Methods("GET")
	mux.PathPrefix("/api/v1").Handler(restMux).Methods("GET")
	mux.PathPrefix("/").Handler(http.FileServer(http.FS(frontendFS)))

	s.httpServer = &http.Server{
		Handler: handlers.CombinedLoggingHandler(os.Stdout, addCORSHeaders(mux.ServeHTTP)),
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
