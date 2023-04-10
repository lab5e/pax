import { Component, OnInit } from '@angular/core';
import { V1Device } from '../api/pax';
import { SampleService } from '../sample.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {

    activeDevice?: V1Device;

    constructor(
        protected samples: SampleService,
    ) {
    }

    ngOnInit(): void {
    }

    setActiveDevice(device?: V1Device): void {
        this.activeDevice = device;
    }
}
