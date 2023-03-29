package sqlitestore

import (
	"testing"

	"github.com/borud/paxcli/pkg/model"
	"github.com/stretchr/testify/require"
)

func TestDevice(t *testing.T) {
	db, err := New(":memory:")
	require.NoError(t, err)
	defer func() {
		require.NoError(t, db.Close())
	}()

	require.NoError(t, db.AddDevice(model.Device{
		ID:   "device1",
		Name: "The name",
	}))

	device, err := db.GetDevice("device1")
	require.NoError(t, err)
	require.Equal(t, "The name", device.Name)

	updatedDevice, err := db.UpdateDevice(model.Device{
		ID:   "device1",
		Name: "Changed name",
		Lat:  1.234,
		Lon:  2.345,
	})
	require.NoError(t, err)

	device, err = db.GetDevice("device1")
	require.NoError(t, err)

	require.Equal(t, updatedDevice, device)
	require.Equal(t, 1.234, device.Lat)
	require.Equal(t, 2.345, device.Lon)
	require.Equal(t, "Changed name", device.Name)

	// list devices is tested in t_samples_test.go
}
