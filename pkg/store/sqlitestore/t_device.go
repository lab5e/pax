package sqlitestore

import (
	"github.com/jmoiron/sqlx"
	"github.com/lab5e/pax/pkg/model"
)

type deviceStatements struct {
	addDeviceStmt    *sqlx.NamedStmt
	getDeviceStmt    *sqlx.Stmt
	updateDeviceStmt *sqlx.NamedStmt
	listDevicesStmt  *sqlx.Stmt
}

func (s *sqliteStore) initDeviceStatements() error {
	var err error

	s.device.addDeviceStmt, err = s.db.PrepareNamed("INSERT INTO devices (id,name,lat,lon) VALUES (:id,:name,:lat,:lon)")
	if err != nil {
		return err
	}

	s.device.getDeviceStmt, err = s.db.Preparex("SELECT * FROM devices WHERE id = ?")
	if err != nil {
		return err
	}

	s.device.updateDeviceStmt, err = s.db.PrepareNamed(`
		UPDATE devices SET
			name = :name,
			lat = :lat,
			lon = :lon
		WHERE
			id = :id
		RETURNING *
	`)
	if err != nil {
		return err
	}

	s.device.listDevicesStmt, err = s.db.Preparex("SELECT * FROM devices ORDER BY id")
	if err != nil {
		return err
	}

	return nil
}

func (s *sqliteStore) AddDevice(device model.Device) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return CheckForZeroRowsAffected(s.device.addDeviceStmt.Exec(device))
}

func (s *sqliteStore) GetDevice(deviceID string) (model.Device, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var device model.Device
	return device, s.device.getDeviceStmt.QueryRowx(deviceID).StructScan(&device)
}

func (s *sqliteStore) UpdateDevice(device model.Device) (model.Device, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	return device, s.device.updateDeviceStmt.QueryRowx(device).StructScan(&device)
}

func (s *sqliteStore) ListDevices() ([]model.Device, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	devices := []model.Device{}
	return devices, s.device.listDevicesStmt.Select(&devices)
}
