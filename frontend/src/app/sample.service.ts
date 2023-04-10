import { Injectable } from '@angular/core';
import { PaxServiceService, V1Data, V1Device, V1ListDataResponse, V1ListDevicesResponse, V1Sample } from './api/pax';
import { Observable, ReplaySubject, combineLatest, interval } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

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

    public lastPoll: Date = new Date();

    // Subject for initial data load
    private dataSubject = new ReplaySubject<DeviceSample>();

    // Subjects for individual device load
    private deviceSubjects: Map<string, ReplaySubject<DeviceSample[]>> = new Map<string, ReplaySubject<DeviceSample[]>>();

    // Subject for updates
    private updateSubject = new ReplaySubject<DeviceSample>();

    private activeDeviceSubject = new ReplaySubject<V1Device>();

    private allSamples: V1Data[] = [];

    // Return a list of active devices, ie devices with data in the selected interval. We won't care about 
    // devices that goes out of fashion, ie if the selected interval changes and the device hasn't sent any
    // data. A simple refresh of the page will fix that issue.
    public activeDevices(): Observable<V1Device> {
        return this.activeDeviceSubject;
    }

    //dataUpdater = interval(60000).subscribe((val) => console.debug('Called update', val));

    constructor(
        protected paxService: PaxServiceService,
    ) {
        this.fetchData()
    }

    fetchData(): void {
        let chartIntervalHours = 24;
        let dayAgo: string = "" + (new Date().getTime() - (chartIntervalHours * 3600 * 1000));
        let now: string = "" + (new Date().getTime());
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
                this.allSamples.map(v => {
                    let ret: V1Device = {
                        id: v.deviceId,
                        name: v.deviceName,
                        lat: v.lat,
                        lon: v.lon,
                    };
                    return ret;
                }).forEach((device => {
                    this.activeDeviceSubject.next(device);
                }));
            },
            error: (e: HttpErrorResponse) => {
                this.errorMessage = e.message;
                // Pass on errors to the subjects
                this.activeDeviceSubject.error(e);
                this.dataSubject.complete();
            },
            complete: () => {
                this.lastPoll = new Date();

                // FIXME: Postpone the complete call when we start polling?
                this.activeDeviceSubject.complete();
                this.dataSubject.complete();
            },
        });
    }

    public hasError(): boolean {
        return this.errorMessage != "";
    }

    public dataForDevice(id: string): DeviceSample[] {
        let ret = this.allSamples.find((v: V1Data) => v.deviceId == id);
        if (ret && ret.samples) {
            return ret.samples.map(d => {
                return {
                    id: "",
                    name: "",
                    time: new Date(parseInt(d.timestamp!)),
                    ble: d.bluetoothCount || 0,
                    wifi: d.wifiCount || 0,
                };
            });
        }
        return [];
    }

    public allData(): Observable<DeviceSample> {
        return this.dataSubject;
    }
}
