package model

import (
	paxv1 "github.com/lab5e/pax/pkg/pax/v1"
)

// Device represents the PAX device.
type Device struct {
	ID   string  `json:"id" db:"id"`
	Name string  `json:"name" db:"name"`
	Lat  float64 `json:"lat" db:"lat"`
	Lon  float64 `json:"lon" db:"lon"`
}

// DeviceFromProto does what it says.
func DeviceFromProto(d *paxv1.Device) Device {
	return Device{
		ID:   d.Id,
		Name: d.Name,
		Lat:  d.Lat,
		Lon:  d.Lon,
	}
}

// Proto representation of Device.
func (d Device) Proto() *paxv1.Device {
	return &paxv1.Device{
		Id:   d.ID,
		Name: d.Name,
		Lat:  d.Lat,
		Lon:  d.Lon,
	}
}
