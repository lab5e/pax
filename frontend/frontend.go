package frontend

import "embed"

// FrontendFS contains the built frontend
//
//go:embed dist/frontend/*
var FrontendFS embed.FS
