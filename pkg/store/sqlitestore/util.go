package sqlitestore

import (
	"database/sql"
	"errors"
)

var (
	// ErrZeroRowsAffected indicates that no rows were affected by the operation
	ErrZeroRowsAffected = errors.New("no rows affected by operation")
)

// CheckForZeroRowsAffected ensures that if zero rows are affected by operations that
// should have side-effects, an error is returned.
func CheckForZeroRowsAffected(r sql.Result, err error) error {
	if r == nil {
		return err
	}
	affected, err2 := r.RowsAffected()
	if err2 != nil {
		return err2
	}
	if affected == 0 {
		return ErrZeroRowsAffected
	}

	return err
}

// FirstError takes a variadic list of errors and returns the first one that isn't nil
func FirstError(errors ...error) error {
	for _, err := range errors {
		if err != nil {
			return err
		}
	}
	return nil
}
