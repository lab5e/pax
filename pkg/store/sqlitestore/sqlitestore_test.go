package sqlitestore

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSqliteStoreSmokeTest(t *testing.T) {
	db, err := New(":memory:")
	require.NoError(t, err)
	require.NotNil(t, db)
	require.NoError(t, db.Close())
}
