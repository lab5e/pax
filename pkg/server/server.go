package server

import (
	"log"
	"net/http"

	"github.com/borud/paxcli/pkg/model"
	"github.com/borud/paxcli/pkg/span"
	"github.com/borud/paxcli/pkg/store"
	"google.golang.org/grpc"
)

// Server is the main entry point for the server daemon.
type Server struct {
	config       Config
	httpServer   *http.Server
	grpcServer   *grpc.Server
	spanListener *span.Listener
}

// Config is the configuration for the server.
type Config struct {
	DB               store.Store
	HTTPListenAddr   string
	GRPCListenAddr   string
	SpanToken        string
	SpanCollectionID string
}

// Create and start server instance.
func Create(c Config) (*Server, error) {

	server := &Server{
		config: c,
	}
	server.startGRPC()
	server.startHTTP()

	server.spanListener = span.NewListener(c.SpanToken, c.SpanCollectionID)

	err := server.spanListener.Start()
	if err != nil {
		log.Fatalf("error starting span listener: %v", err)
	}
	go server.spanDataLoop(server.spanListener.Measurements())

	return server, nil
}

func (s *Server) spanDataLoop(input <-chan model.Sample) {
	for sample := range input {
		log.Printf("sample: %+v", sample)

		// inefficient, but it doesn't matter for now
		_, err := s.config.DB.GetDevice(sample.DeviceID)
		if err != nil {
			s.config.DB.AddDevice(model.Device{
				ID:   sample.DeviceID,
				Name: "",
				Lat:  0,
				Lon:  0,
			})
		}

		s.config.DB.AddSample(sample)
	}
}
