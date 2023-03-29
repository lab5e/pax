package model

import paxv1 "github.com/lab5e/pax/pkg/pax/v1"

// Sample represents a pax measurement
type Sample struct {
	DeviceID        string  `json:"deviceId" db:"device_id"`
	MessageID       string  `json:"messageId" db:"message_id"`
	Timestamp       int64   `json:"timestamp" db:"timestamp"`
	BluetoothCount  uint32  `json:"bluetoothCount" db:"bluetooth_count"`
	WIFICount       uint32  `json:"wifiCount" db:"wifi_count"`
	Seq             uint32  `json:"seq" db:"seq"`
	UptimeSeconds   uint32  `json:"secondsUptime" db:"uptime_seconds"`
	CoreTemperature float32 `json:"coreTemperature" db:"core_temperature"`
}

// Proto representation of Sample.
func (s Sample) Proto() *paxv1.Sample {
	return &paxv1.Sample{
		DeviceId:        s.DeviceID,
		MessageId:       s.MessageID,
		Timestamp:       s.Timestamp,
		BluetoothCount:  s.BluetoothCount,
		WifiCount:       s.WIFICount,
		Seq:             s.Seq,
		UptimeSeconds:   s.UptimeSeconds,
		CoreTemperature: s.CoreTemperature,
	}
}
