import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { V1Device } from '../api/pax';
import { environment } from 'src/environments/environment';
import { AttributionControl, FullscreenControl, Map, NavigationControl, Marker, MarkerOptions } from 'maplibre-gl';

@Component({
    selector: 'app-device-map-view',
    templateUrl: './device-map-view.component.html',
    styleUrls: ['./device-map-view.component.css']
})
export class DeviceMapViewComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input("device") device: V1Device = {};

    @ViewChild("map") mapContainer?: ElementRef<HTMLElement>;
    map?: Map;

    constructor() { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.map = new Map({
            container: this.mapContainer!.nativeElement,
            style: environment.apiHost + "/map/styles/basic.json",
            center: [10.14, 63.42], // starting position [lng, lat]
            zoom: 3, // starting zoom
            maxBounds: [[9.78, 63.17], [10.97, 63.56]]
        });
        this.map.addControl(new NavigationControl());
        this.map.addControl(new AttributionControl({
            compact: false, customAttribution:
                "Style © <a href='http://openmaptiles.org/'>MapTiler</a> | " +
                "Data © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
        }));
        this.map.addControl(new FullscreenControl());

        let marker = new Marker({
            color: '#ff0000',
        });
        marker.setLngLat([10.394947, 63.430489]);
        marker.addTo(this.map);
    }

    ngOnDestroy(): void {
        this.map?.remove();
    }
}
