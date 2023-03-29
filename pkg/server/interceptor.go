package server

import (
	"context"

	"google.golang.org/grpc"
)

func (s *Server) serverInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {

	// do nothing for now
	return handler(ctx, req)
}
