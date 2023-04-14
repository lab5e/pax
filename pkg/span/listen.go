package span

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	pax "github.com/lab5e/pax/pkg/pax/v1"

	"github.com/lab5e/go-spanapi/v4"
	"github.com/lab5e/go-spanapi/v4/apitools"
	"github.com/lab5e/pax/pkg/model"
	"google.golang.org/protobuf/proto"
)

// Listener listens to a given collection on Span
type Listener struct {
	Token            string
	CollectionID     string
	measurementCh    chan model.Sample
	deviceCh         chan model.Device
	cancel           context.CancelFunc
	ctx              context.Context
	shutdownComplete sync.WaitGroup
}

// NewListener creates a new SpanListener instance
func NewListener(token string, collectionID string) *Listener {
	return &Listener{
		Token:         token,
		CollectionID:  collectionID,
		measurementCh: make(chan model.Sample),
		deviceCh:      make(chan model.Device),
	}
}

// Start fires up the Spanlistener
func (s *Listener) Start() error {
	config := spanapi.NewConfiguration()
	config.Debug = true

	s.ctx, s.cancel = context.WithCancel(apitools.ContextWithAuth(s.Token))

	clientID := fmt.Sprintf("pax-%d", time.Now().UnixMicro())

	// ds, err := apitools.NewCollectionDataStream(s.ctx, config, s.CollectionID)
	ds, err := apitools.NewMQTTStream(
		apitools.WithAPIToken(s.Token),
		apitools.WithCollectionID(s.CollectionID),
		apitools.WithClientID(clientID),
	)
	if err != nil {
		return fmt.Errorf("unable to open CollectionDataStream: %v", err)
	}

	// Start goroutine running readDataStream() function
	go s.readDataStream(ds)

	return nil
}

// Stop listener
func (s *Listener) Stop() {
	if s.cancel != nil {
		s.cancel()
		s.shutdownComplete.Wait()
	}
}

// Measurements returns a channel that streams apipb.PAXMessage
func (s *Listener) Measurements() <-chan model.Sample {
	return s.measurementCh
}

func (s *Listener) Devices() <-chan model.Device {
	return s.deviceCh
}

func (s *Listener) readDataStream(ds apitools.DataStream) {
	defer ds.Close()

	// Signal that we have started
	s.shutdownComplete.Add(1)

	log.Printf("connected to Span")
	for {
		msg, err := ds.Recv()
		if err != nil {
			log.Fatalf("error reading message: %v", err)
		}

		// We only care about messages containing data
		if *msg.Type != "data" {
			continue
		}

		// base64 decode the payload to a string
		bytePayload, err := base64.StdEncoding.DecodeString(*msg.Payload)
		if err != nil {
			log.Fatalf("unable to decode payload: %v", err)
		}

		// decode bytePayload as protobuffer
		var pb pax.Message
		err = proto.Unmarshal(bytePayload, &pb)
		if err != nil {
			log.Fatalf("unable to unmarshal protobuffer: %v", err)
		}

		timeMS, err := strconv.ParseInt(*msg.Received, 10, 64)
		if err != nil {
			log.Printf("error parsing '%s' as timestamp: %v", *msg.Received, err)
			continue
		}

		s.measurementCh <- model.Sample{
			DeviceID:        *msg.Device.DeviceId,
			MessageID:       *msg.MessageId,
			Timestamp:       timeMS,
			BluetoothCount:  pb.BluetoothDeviceCount,
			WIFICount:       pb.WifiDeviceCount,
			CoreTemperature: pb.CoreTemperature,
			Seq:             pb.SequenceNumber,
			UptimeSeconds:   pb.SecondsUptime,
		}

		s.deviceCh <- makeDBDevice(msg.GetDevice())

		if s.ctx.Err() == context.Canceled {
			log.Printf("shutting down spanlistener")
			close(s.measurementCh)
			close(s.deviceCh)
			s.shutdownComplete.Done()
			return
		}
	}
}
