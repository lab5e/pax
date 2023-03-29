package service

import (
	"context"
	"log"

	"github.com/lab5e/pax/pkg/model"
	paxv1 "github.com/lab5e/pax/pkg/pax/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *service) GetDevice(ctx context.Context, req *paxv1.GetDeviceRequest) (*paxv1.GetDeviceResponse, error) {
	device, err := s.db.GetDevice(req.Id)
	if err != nil {
		log.Printf("error getting device [%s]: %v", req.Id, err)
		return nil, status.Error(codes.NotFound, "device not found")
	}

	return &paxv1.GetDeviceResponse{Device: device.Proto()}, nil
}

func (s *service) UpdateDevice(ctx context.Context, req *paxv1.UpdateDeviceRequest) (*paxv1.UpdateDeviceResponse, error) {
	device, err := s.db.UpdateDevice(model.DeviceFromProto(req.Device))
	if err != nil {
		log.Printf("error updating device [%s]: %v", req.Device.Id, err)
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &paxv1.UpdateDeviceResponse{Device: device.Proto()}, nil
}

func (s *service) ListDevices(ctx context.Context, req *paxv1.ListDevicesRequest) (*paxv1.ListDevicesResponse, error) {
	devices, err := s.db.ListDevices()
	if err != nil {
		log.Printf("error listing devices: %v", err)
		return nil, status.Error(codes.Internal, "internal error")
	}

	protoDevices := make([]*paxv1.Device, len(devices))
	for i, device := range devices {
		protoDevices[i] = device.Proto()
	}

	return &paxv1.ListDevicesResponse{Devices: protoDevices}, nil
}
