import { Component, Input, OnInit } from '@angular/core';
import { V1Device } from '../api/pax';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-device-map-view',
    templateUrl: './device-map-view.component.html',
    styleUrls: ['./device-map-view.component.css']
})
export class DeviceMapViewComponent implements OnInit {
    @Input("device") device: V1Device = {};

    constructor() { }

    ngOnInit(): void {
    }

    apiHost(): string {
        return environment.apiHost
    }
}
