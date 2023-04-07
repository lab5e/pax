import { Component, OnInit } from '@angular/core';
import { PaxServiceService, V1Device, V1ListDevicesResponse } from '../api/pax';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {

    devices: V1Device[] = [];
    activeDevice?: V1Device;

    constructor(
        protected paxService: PaxServiceService,
    ) {
        paxService.paxServiceListDevices().subscribe({
            next: (res: V1ListDevicesResponse) => {
                if (res.devices) {
                    this.devices = res.devices;
                }
            },
            error: (e) => {
                console.error(e);
            },
            complete: () => { },
        });
    }

    ngOnInit(): void {
    }

    setActiveDevice(device?: V1Device): void {
        this.activeDevice = device;
    }
}
