import { Component, Input, OnInit } from '@angular/core';
import { V1Device } from '../api/pax';

@Component({
    selector: 'app-device-view',
    templateUrl: './device-view.component.html',
    styleUrls: ['./device-view.component.css']
})
export class DeviceViewComponent implements OnInit {
    @Input("device") device: V1Device = {};

    constructor() { }

    ngOnInit(): void {
    }

}
