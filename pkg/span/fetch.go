package span

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/lab5e/go-spanapi/v4"
	"github.com/lab5e/go-spanapi/v4/apitools"
	"github.com/lab5e/pax/pkg/model"
	paxv1 "github.com/lab5e/pax/pkg/pax/v1"
	"github.com/lab5e/pax/pkg/store"
	"google.golang.org/protobuf/proto"
)

// Fetch is a utility used for initial downloading of historical data or for
// catching up when the server has been down.  If the FetchUntilMessageID is
// set, we will fetch messages until we see this ID.  If not we terminate only
// when there are no more messages.
type Fetch struct {
	Token               string
	CollectionID        string
	DB                  store.Store
	FetchUntilMessageID string
	client              *spanapi.APIClient
	ctx                 context.Context
	cancel              context.CancelFunc
}

// Errors
var (
	ErrListingData = errors.New("error listing data")
)

// Execute fetch operation.
func (f *Fetch) Execute() error {
	config := spanapi.NewConfiguration()
	config.Debug = false

	f.ctx, f.cancel = context.WithCancel(apitools.ContextWithAuth(f.Token))
	defer f.cancel()

	f.client = spanapi.NewAPIClient(config)

	err := f.fetchDevices()
	if err != nil {
		return err
	}

	return f.fetchDataRows()
}

func (f *Fetch) fetchDevices() error {
	devices, _, err := f.client.DevicesApi.ListDevices(f.ctx, f.CollectionID).Execute()
	if err != nil {
		return err
	}

	for _, dev := range devices.GetDevices() {
		d := makeDBDevice(dev)

		err = f.DB.AddDevice(d)
		if err == nil {
			log.Printf("added device [%s]", *dev.DeviceId)
		}

	}
	return nil
}

func makeDBDevice(dev spanapi.Device) model.Device {
	name := dev.GetTags()["name"]

	var lat, lon float64
	var err error
	posStr := dev.GetTags()["lat"]
	if posStr != "" {
		lat, err = strconv.ParseFloat(posStr, 64)
		if err != nil {
			log.Printf("Error converting latitude (%s) for device %s: %v", posStr, dev.GetDeviceId(), err)
		}
	}
	posStr = dev.GetTags()["lon"]
	if posStr != "" {
		lon, err = strconv.ParseFloat(posStr, 64)
		if err != nil {
			log.Printf("Error converting longitude (%s) for device %s: %v", posStr, dev.GetDeviceId(), err)
		}
	}
	return model.Device{
		ID:   *dev.DeviceId,
		Name: name,
		Lat:  lat,
		Lon:  lon,
	}
}

func (f *Fetch) addSample(entry spanapi.OutputDataMessage) {
	message := paxv1.Message{}

	ts, err := strconv.ParseInt(*entry.Received, 10, 64)
	if err != nil {
		log.Printf("skipping entry with bad timestamp, messageID=[%s]", *entry.MessageId)
		return
	}

	payload, err := base64.StdEncoding.DecodeString(*entry.Payload)
	if err != nil {
		log.Printf("error decoding base64 payload, messageID=[%s]", *entry.MessageId)
		return
	}

	err = proto.Unmarshal(payload, &message)
	if err != nil {
		log.Printf("error unmarshalling protobuffer: %v", err)
		return
	}

	err = f.DB.AddSample(model.Sample{
		DeviceID:        *entry.Device.DeviceId,
		MessageID:       *entry.MessageId,
		Timestamp:       ts,
		BluetoothCount:  message.BluetoothDeviceCount,
		WIFICount:       message.WifiDeviceCount,
		Seq:             message.SequenceNumber,
		UptimeSeconds:   message.SecondsUptime,
		CoreTemperature: message.CoreTemperature,
	})
	if err != nil {
		log.Printf("error storing sample: %v", err)
	}
}

func (f *Fetch) fetchDataRows() error {

	count := 0
	batchCount := 0
	lastMessageID := ""

	req := f.client.CollectionsApi.ListCollectionData(f.ctx, f.CollectionID).End(fmt.Sprintf("%d", time.Now().UnixMilli()))

	for {
		res, _, err := req.Execute()
		if err != nil {
			return fmt.Errorf("%w: %v", ErrListingData, err)
		}

		if res.Data == nil {
			log.Printf("imported %d rows", batchCount+count)
			return nil
		}

		for _, entry := range res.GetData() {
			// Bail if we see the message ID we stop at
			if f.FetchUntilMessageID == *entry.MessageId {
				log.Printf("caught up %d messages", batchCount+count)
				return nil
			}

			f.addSample(entry)

			batchCount++
			if batchCount == 1000 {
				count += batchCount
				batchCount = 0
				log.Printf("imported %d rows", count)
			}
			lastMessageID = *entry.MessageId
		}

		req = req.Offset(lastMessageID)
	}
}
