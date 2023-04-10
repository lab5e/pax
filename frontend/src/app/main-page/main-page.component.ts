import { Component, OnInit } from '@angular/core';
import { V1Device } from '../api/pax';
import { SampleService } from '../sample.service';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {

    activeDevices: V1Device[] = [];
    activeDevice?: V1Device;
    autoPlayEnabled: boolean = false;
    activeStep: number = 0;
    autoPlayer?: Subscription;

    constructor(
        protected samples: SampleService,
    ) {
        let list: V1Device[] = [];
        this.samples.activeDevices().subscribe({
            next: (d: V1Device) => {
                list.push(d);
            },
            complete: () => {
                this.activeDevices = list;
            },
        })
    }

    ngOnInit(): void {
    }

    setActiveDevice(device?: V1Device): void {
        this.activeDevice = device;
    }

    autoPlay(enable: boolean) {
        if (!enable) {
            this.autoPlayEnabled = false;
            this.autoPlayer?.unsubscribe();
            return;
        }
        this.activeStep = -1;
        this.activeDevice = undefined;
        this.autoPlayEnabled = true;
        this.autoPlayer = interval(15000).subscribe((val) => this.autoStep());
    }

    autoStep(): void {
        if (!this.autoPlayEnabled) {
            return;
        }
        this.activeStep++;
        if (this.activeStep >= this.activeDevices.length) {
            this.activeStep = -1;
        }
        if (this.activeStep == -1) {
            this.activeDevice = undefined;
            return;
        }
        this.activeDevice = this.activeDevices[this.activeStep];
    }


}
