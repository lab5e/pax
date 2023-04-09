// Package main is the main entry point for pax.
package main

import (
	"github.com/lab5e/pax/pkg/util"
)

var opt struct {
	DB             string    `long:"db" default:"pax.db" description:"pax database" required:"yes"`
	HTTPListenAddr string    `long:"http" default:":4500" description:"HTTP listen address" required:"yes"`
	GRPCListenAddr string    `long:"grpc" default:":4501" description:"gRPC listen address" required:"yes"`
	Token          string    `long:"token" env:"SPAN_API_TOKEN" description:"Span API Token" required:"yes"`
	CollectionID   string    `long:"collection" description:"Span Collection ID for PAX counters" default:"17dlb1hl0l800a"`
	HTTPHost       string    `long:"host" default:"http://localhost:4500" description:"HTTP (external) URL" required:"yes"`
	Server         serverCmd `command:"server" description:"start server"`
	Fetch          fetchCmd  `command:"fetch" description:"fetch historical data"`
}

func main() {
	util.FlagParse(&opt)
}
