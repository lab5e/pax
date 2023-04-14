import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { V1Device } from '../api/pax';
import { environment } from 'src/environments/environment';
import { AttributionControl, FullscreenControl, Map, NavigationControl, Marker, MarkerOptions } from 'maplibre-gl';
import { SampleService } from '../sample.service';

interface MapMetadata {
    bounds: number[];
}
@Component({
    selector: 'app-device-map-view',
    templateUrl: './device-map-view.component.html',
    styleUrls: ['./device-map-view.component.css']
})
export class DeviceMapViewComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @Input("device") device: V1Device = {};

    @ViewChild("map") mapContainer?: ElementRef<HTMLElement>;
    map?: Map;

    constructor(
        private samples: SampleService,
    ) {
    }

    ngOnInit(): void {
    }

    ngOnChanges() {
        this.flyToMarker(this.device, this.map);
    }
    ngAfterViewInit(): void {
        if (this.map) {
            return
        }
        let response = fetch(environment.apiHost + "/map/tiles/metadata.json").then((res: Response) => {
            res.json().then((data) => {
                let resp = data as unknown;
                let metadata: MapMetadata = resp as MapMetadata;
                let bounds = metadata.bounds;

                let latCenter = (bounds[1] + bounds[3]) / 2;
                let lonCenter = (bounds[0] + bounds[2]) / 2;
                this.map = new Map({
                    container: this.mapContainer!.nativeElement,
                    style: environment.apiHost + "/map/styles/basic.json",
                    center: [lonCenter, latCenter], // starting position [lng, lat]
                    zoom: 3, // starting zoom
                    maxBounds: [[bounds[0], bounds[1]], [bounds[2], bounds[3]]]
                });
                this.map.addControl(new NavigationControl());
                this.map.addControl(new AttributionControl({
                    compact: false, customAttribution:
                        "Style © <a href='http://openmaptiles.org/'>MapTiler</a> | " +
                        "Data © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
                }));
                this.samples.activeDevices().subscribe({
                    complete: () => {
                        this.samples.addMapMarkers(this.map!);
                    }
                });
                this.flyToMarker(this.device, this.map);
            });
        });

    }

    ngOnDestroy(): void {
        this.enableRotation = false;
        this.map?.remove();
    }

    cameraBearing: number = 0;
    enableRotation: boolean = false;

    flyToMarker(device?: V1Device, map?: Map): void {
        if (!device || !map) {
            return;
        }
        if (!device.lat || device.lat == 0 || !device.lon || device.lon == 0) {
            this.enableRotation = false;
            this.cameraBearing = 0;
            // Move out to ovewview
            this.map?.flyTo({
                center: [10.14, 63.42], // starting position [lng, lat]
                zoom: 3, // starting zoom
                pitch: 0,
                bearing: 0,
                speed: 2, // make the flying slow
                curve: 2, // change the speed at which it zooms out

                // This can be any easing function: it takes a number between
                // 0 and 1 and returns another number between 0 and 1.
                easing: (t) => t,

                // this animation is considered essential with respect to prefers-reduced-motion
                essential: true
            });
            return
        }

        if (this.enableRotation) {
            // Already animating something
            this.enableRotation = false;
            this.cameraBearing = 0;
        }

        // Fly to the marker
        this.map?.flyTo({
            // These options control the ending camera position: centered at
            // the target, at zoom level 9, and north up.
            center: [device.lat, device.lon],
            zoom: 16,
            pitch: 45,
            bearing: 0,

            // These options control the flight curve, making it move
            // slowly and zoom out almost completely before starting
            // to pan.
            speed: 1, // make the flying slow
            curve: 1, // change the speed at which it zooms out

            // This can be any easing function: it takes a number between
            // 0 and 1 and returns another number between 0 and 1.
            easing: (t) => t,

            // this animation is considered essential with respect to prefers-reduced-motion
            essential: true
        });


        let rotateCamera = (ts: number) => {
            if (!this.enableRotation) {
                return;
            }
            // clamp the rotation between 0 -360 degrees
            // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
            map.rotateTo(this.cameraBearing, { duration: 0 });
            // Request the next frame of the animation.
            this.cameraBearing += 0.25;
            if (this.cameraBearing >= 360) {
                this.cameraBearing = 0;
            }
            requestAnimationFrame(rotateCamera);
        }

        // Stop rotation when there's a click
        this.map?.on('click', () => {
            this.enableRotation = false;
        });

        this.map?.once('moveend', () => {
            this.enableRotation = true;
            rotateCamera(0);
            //            map.rotateTo(180.0, { duration: 6000 });
        });
    }
}
