package sqlitestore

import (
	"bufio"
	_ "embed"
	"fmt"
	"log"
	"regexp"
	"strings"

	"github.com/jmoiron/sqlx"
)

var (
	//go:embed schema.sql
	schema string

	// regexp for matching comments and empty lines
	commentsAndEmptyLinesRegex = regexp.MustCompile("--.*?\n$|^\\s+$")
)

// createSchema populates a schema into an sqlx database handle
func createSchema(db *sqlx.DB) error {

	// Create the schema first
	for n, statement := range strings.Split(schema, ";") {
		statement = trimCommentsAndWhitespace(statement)

		if statement == "" {
			continue
		}

		_, err := db.Exec(statement)
		if err != nil {
			return fmt.Errorf("statement %d failed: \"%s\" : %w", n+1, statement, err)
		}
	}

	return nil
}

// trimCommentsAndWhitespace removes comments and superfluous whitespace
func trimCommentsAndWhitespace(s string) string {
	sb := strings.Builder{}

	scanner := bufio.NewScanner(strings.NewReader(s))
	for scanner.Scan() {
		line := scanner.Text() + "\n"
		b := commentsAndEmptyLinesRegex.ReplaceAll([]byte(line), nil)
		_, err := sb.Write(b)
		if err != nil {
			log.Fatalf("error removing comments: %v", err)
		}
	}
	return sb.String()
}
