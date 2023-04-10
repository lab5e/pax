import { Injectable } from '@angular/core';
import { PaxServiceService, V1Data, V1Device, V1ListDataResponse } from './api/pax';
import { Observable, ReplaySubject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Map, Marker } from 'maplibre-gl';

// Also a custom sample setup
export interface DeviceSample {
    id: string;
    name: string;
    time: Date;
    ble: number;
    wifi: number;
}

@Injectable({
    providedIn: 'root'
})
export class SampleService {

    public errorMessage: string = "";

    public lastDataUpdate: Date = new Date();

    // Subject for initial data load
    private dataSubject = new ReplaySubject<DeviceSample>();

    private activeDeviceSubject = new ReplaySubject<V1Device>();

    // Might not need this
    private allSamples: V1Data[] = [];

    private allActiveDevices: V1Device[] = [];
    // Return a list of active devices, ie devices with data in the selected interval. We won't care about 
    // devices that goes out of fashion, ie if the selected interval changes and the device hasn't sent any
    // data. A simple refresh of the page will fix that issue.
    public activeDevices(): Observable<V1Device> {
        return this.activeDeviceSubject;
    }

    constructor(
        protected paxService: PaxServiceService,
    ) {
        this.fetchData()
    }

    fetchData(): void {
        let chartIntervalHours = 24;
        let dayAgo: string = "" + (new Date().getTime() - (chartIntervalHours * 3600 * 1000));
        let now: string = "" + (new Date().getTime());
        this.lastDataUpdate = new Date();
        this.paxService.paxServiceListData(dayAgo, now).subscribe({
            next: (value: V1ListDataResponse) => {
                if (value.data) {
                    this.allSamples = value.data;
                }
                this.allSamples.forEach(data => {
                    data.samples?.forEach(d => {
                        this.dataSubject.next({
                            id: data.deviceId || "",
                            name: data.deviceName || "",
                            time: new Date(parseInt(d.timestamp!)),
                            ble: d.bluetoothCount || 0,
                            wifi: d.wifiCount || 0,
                        });
                    });
                });
                this.allActiveDevices = this.allSamples.map(v => {
                    let ret: V1Device = {
                        id: v.deviceId,
                        name: v.deviceName,
                        lat: v.lat,
                        lon: v.lon,
                    };
                    return ret;
                });
                this.allActiveDevices.forEach((device => {
                    this.activeDeviceSubject.next(device);
                    this.allActiveDevices.push(device);
                }));
            },
            error: (e: HttpErrorResponse) => {
                this.errorMessage = e.message;
                // Pass on errors to the subjects
                this.activeDeviceSubject.error(e);
                this.dataSubject.complete();
            },
            complete: () => {
                this.activeDeviceSubject.complete();
                this.dataSubject.complete();
            },
        });
    }

    public hasError(): boolean {
        return this.errorMessage != "";
    }

    public allData(): Observable<DeviceSample> {
        let now = new Date()
        let diff = now.getTime() - this.lastDataUpdate.getTime();
        if (diff > 60000) {
            this.dataSubject = new ReplaySubject<DeviceSample>();
            this.activeDeviceSubject = new ReplaySubject<V1Device>();
            this.fetchData();
        }
        return this.dataSubject;
    }

    // A bit hackish: Add map markers for all devices with positions. This should *strictly* be in part of the
    // presentation layer but.. this works too.
    public addMapMarkers(map: Map) {
        this.allActiveDevices.forEach((device: V1Device) => {
            if (device.lat && device.lat != 0 && device.lon && device.lon != 0) {
                let marker = new Marker({
                    color: '#ff0000',
                });

                marker.setLngLat([device.lat, device.lon]);
                marker.addTo(map);
            }
        });
    }
}
