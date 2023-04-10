import { Injectable } from '@angular/core';
import { PaxServiceService, V1Data, V1Device, V1ListDataResponse, V1ListDevicesResponse, V1Sample } from './api/pax';
import { Observable, ReplaySubject, interval } from 'rxjs';
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

    public lastDataUpdate: Date = new Date();
    private lastPoll: Date = new Date();

    // Subject for initial data load
    private dataSubject = new ReplaySubject<DeviceSample>();

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

    dataUpdater = interval(60000).subscribe((val) => this.pollForChanges());

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
        this.lastPoll = new Date();
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
                this.activeDeviceSubject.complete();
                this.dataSubject.complete();
            },
        });
    }

    private pollForChanges(): void {
        let lastCheck: string = "" + this.lastPoll.getTime();
        this.lastPoll = new Date();
        this.paxService.paxServiceListData(lastCheck).subscribe({
            next: (value: V1ListDataResponse) => {
                if (value.data) {
                    value.data.forEach((data) => this.addDataToSamples(data));
                }
            },
            error: (e: HttpErrorResponse) => {
                this.errorMessage = e.message;
                this.updateSubject.error(e);
            },
            complete: () => {
            },
        });
    }

    // Add samples to the existing data set
    private addDataToSamples(data: V1Data): void {
        var exists: boolean = false;
        this.allSamples.forEach((set, index) => {
            if (set.deviceId == data.deviceId) {
                exists = true;
                set.samples?.forEach((sample) => {
                    this.allSamples[index].samples?.push(sample);
                });
                console.debug("Added " + (set.samples?.length || 0) + " samples to data for " + set.deviceId)
            }
        });
        if (!exists) {
            console.debug("New device; adding new sample set: ", data);
            this.allSamples.push(data);
        }
    }

    public hasError(): boolean {
        return this.errorMessage != "";
    }

    public allData(): Observable<DeviceSample> {
        // TODO: If the data is more than N minutes old return a new sample set
        return this.dataSubject;
    }

}
