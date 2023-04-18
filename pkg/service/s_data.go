package service

import (
	"context"
	"log"

	"github.com/lab5e/pax/pkg/model"
	paxv1 "github.com/lab5e/pax/pkg/pax/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *service) ListData(_ context.Context, req *paxv1.ListDataRequest) (*paxv1.ListDataResponse, error) {
	devices, err := s.db.ListDevices()
	if err != nil {
		log.Printf("error listing devices: %v", err)
		return nil, status.Error(codes.Internal, "internal error")
	}

	deviceMap := make(map[string]model.Device)
	for _, device := range devices {
		deviceMap[device.ID] = device
	}

	samples, err := s.db.ListSamples(req.Since, req.Until, int(req.Limit))
	if err != nil {
		log.Printf("error listing samples, since=%d until=%d limit=%d: %v", req.Since, req.Until, req.Limit, err)
		return nil, status.Error(codes.Internal, "internal error")
	}

	// order samples into buckets by deviceId
	byDeviceIDMap := make(map[string][]*paxv1.Sample)
	for _, sample := range samples {
		byDeviceIDMap[sample.DeviceID] = append(byDeviceIDMap[sample.DeviceID], sample.Proto())
	}

	// build response
	dataArray := []*paxv1.Data{}
	for k, v := range byDeviceIDMap {
		device := deviceMap[k]
		dataArray = append(dataArray, &paxv1.Data{
			DeviceId:   k,
			DeviceName: device.Name,
			Lat:        device.Lat,
			Lon:        device.Lon,
			Samples:    v,
		})
	}

	return &paxv1.ListDataResponse{Data: dataArray}, nil
}
