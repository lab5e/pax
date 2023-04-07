// Package frontend is a package that contains the embedded frontend files
package frontend

import "embed"

// FrontendFS contains the built frontend
//
//go:embed dist/frontend/*
var FrontendFS embed.FS
