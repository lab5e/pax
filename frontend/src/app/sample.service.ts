import { Injectable } from '@angular/core';
import { PaxServiceService, V1Data, V1Device, V1ListDataResponse, V1ListDevicesResponse, V1Sample } from './api/pax';
import { combineLatest, interval } from 'rxjs';
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
    public allDevices: V1Device[] = [];
    public devicesWithData: V1Device[] = [];
    public allSamples: V1Data[] = [];
    public lastPoll: Date = new Date();

    dataUpdater = interval(60000).subscribe((val) => console.debug('Called update', val));

    constructor(
        protected paxService: PaxServiceService,
    ) {
        this.fetchData()
    }

    fetchData(): void {
        let chartIntervalHours = 24;
        let dayAgo: string = "" + (new Date().getTime() - (chartIntervalHours * 3600 * 1000));
        let now: string = "" + (new Date().getTime());
        combineLatest([
            this.paxService.paxServiceListDevices(),
            this.paxService.paxServiceListData(dayAgo, now)
        ]).subscribe({
            next: (value: [V1ListDevicesResponse, V1ListDataResponse]) => {
                if (value[0].devices) {
                    this.allDevices = value[0].devices;
                }
                if (value[1].data) {
                    this.allSamples = value[1].data;
                }
            },
            error: (e: HttpErrorResponse) => {
                this.errorMessage = e.message;
            },
            complete: () => {
                this.lastPoll = new Date();
                this.devicesWithData = this.allSamples.map(v => {
                    let ret: V1Device = {
                        id: v.deviceId,
                        name: v.deviceName,
                        lat: v.lat,
                        lon: v.lon,
                    };
                    return ret;
                });
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

    public allData(): DeviceSample[] {
        let ret: DeviceSample[] = [];

        this.allSamples.forEach(data => {
            ret = ret.concat(data.samples?.map(d => {
                let s: DeviceSample = {
                    id: data.deviceId || "",
                    name: data.deviceName || "",
                    time: new Date(parseInt(d.timestamp!)),
                    ble: d.bluetoothCount || 0,
                    wifi: d.wifiCount || 0,
                };
                return s;
            }) || []);
        });

        return ret;
    }
}
