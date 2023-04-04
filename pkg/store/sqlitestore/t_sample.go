package sqlitestore

import (
	"math"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lab5e/pax/pkg/model"
)

type sampleStatements struct {
	addSampleStmt *sqlx.NamedStmt
	listSamples   *sqlx.Stmt
	getLastSample *sqlx.Stmt
}

const (
	hardRowLimit = 200000
	defaultLimit = 150000
)

func (s *sqliteStore) initSampleStatements() error {
	var err error

	s.sample.addSampleStmt, err = s.db.PrepareNamed(`
		INSERT INTO samples (device_id,message_id,timestamp,bluetooth_count,wifi_count,seq,uptime_seconds,core_temperature)
		VALUES (:device_id,:message_id,:timestamp,:bluetooth_count,:wifi_count,:seq,:uptime_seconds,:core_temperature)
	`)
	if err != nil {
		return err
	}

	s.sample.listSamples, err = s.db.Preparex("SELECT * FROM samples WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp ASC LIMIT ?")
	if err != nil {
		return err
	}

	s.sample.getLastSample, err = s.db.Preparex("SELECT * FROM samples ORDER BY timestamp DESC limit 1")
	if err != nil {
		return err
	}

	return nil
}

func (s *sqliteStore) AddSample(sample model.Sample) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, err := s.sample.addSampleStmt.Exec(sample)
	return err
}

func (s *sqliteStore) ListSamples(since int64, until int64, limit int) ([]model.Sample, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if since == 0 {
		since = time.Now().Add(-24 * time.Hour).UnixMilli()
	}

	if until == 0 {
		until = math.MaxInt64
	}

	if limit > hardRowLimit {
		limit = hardRowLimit
	} else if limit <= 0 {
		limit = defaultLimit
	}

	samples := []model.Sample{}
	return samples, s.sample.listSamples.Select(&samples, since, until, limit)
}

func (s *sqliteStore) GetLastSample() (model.Sample, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var sample model.Sample
	return sample, s.sample.getLastSample.QueryRowx().StructScan(&sample)
}
