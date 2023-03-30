// Package doc embeds the documentation.
package doc

import (
	"embed"
)

// SwaggerFiles contains the generated swagger files.
//
//go:embed swagger/pax/v1/*.json
var SwaggerFiles embed.FS
