package sqlitestore

import (
	"fmt"
	"math/rand"
	"testing"

	"github.com/lab5e/pax/pkg/model"
	"github.com/stretchr/testify/require"
)

func TestSample(t *testing.T) {
	db, err := New(":memory:")
	require.NoError(t, err)
	defer func() {
		require.NoError(t, db.Close())
	}()

	// add some devices
	for i := 1; i <= 5; i++ {
		db.AddDevice(model.Device{
			ID:   fmt.Sprintf("device-%d", i),
			Name: fmt.Sprintf("The name of device-%d", i),
			Lat:  float64(i),
			Lon:  float64(10 + i),
		})
	}

	// list them
	devices, err := db.ListDevices()
	require.NoError(t, err)
	require.Len(t, devices, 5)

	for i := 0; i < 100; i++ {

		deviceID := fmt.Sprintf("device-%d", (i%5)+1)
		messageID := fmt.Sprintf("msgid-%d", i+100000)

		require.NoError(t, db.AddSample(model.Sample{
			DeviceID:        deviceID,
			MessageID:       messageID,
			Timestamp:       int64(i),
			BluetoothCount:  rand.Uint32() % 500,
			WIFICount:       rand.Uint32() % 500,
			Seq:             uint32(i),
			UptimeSeconds:   134,
			CoreTemperature: 20 + rand.Float32()*10,
		}))
	}

	samples, err := db.ListSamples(50, 100, 500)
	require.NoError(t, err)
	require.Len(t, samples, 50)

	lastSample, err := db.GetLastSample()
	require.NoError(t, err)
	require.Equal(t, samples[len(samples)-1], lastSample)
}
