package store

import (
	"github.com/lab5e/pax/pkg/model"
)

// Store defines the persistence API for PAX.
type Store interface {
	Close() error

	// Add sample
	AddSample(model.Sample) error

	// List samples in the semiclosed interval [since,until>
	ListSamples(since int64, until int64, limit int) ([]model.Sample, error)

	// Get the last sample.  Used for synchronizing with Span.
	GetLastSample() (model.Sample, error)

	// AddDevice adds a new device
	AddDevice(model.Device) error

	// GetDevice fetches device by deviceID
	GetDevice(deviceID string) (model.Device, error)

	// UpdateDevice updates name, lat and long fields for device.
	UpdateDevice(model.Device) (model.Device, error)

	// ListDevices lists all known devices.
	ListDevices() ([]model.Device, error)
}
