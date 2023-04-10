import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DeviceSample, SampleService } from '../sample.service';
import * as d3 from 'd3';
import * as Plot from '@observablehq/plot';

@Component({
    selector: 'app-device-overview',
    templateUrl: './device-overview.component.html',
    styleUrls: ['./device-overview.component.css']
})
export class DeviceOverviewComponent implements OnInit, AfterViewInit {
    @ViewChild("chart") chartRef?: ElementRef;
    chart?: (SVGElement | HTMLElement);
    @ViewChild("legend") legendRef?: ElementRef;
    legend?: (SVGElement | HTMLElement);

    constructor(
        protected samples: SampleService,
        private renderer: Renderer2,
    ) { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.showChart();
    }

    showChart(): void {
        if (this.chart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.chartRef?.nativeElement, this.chart, false);
        }
        let data = this.samples.allData();

        let width = this.chartRef?.nativeElement.offsetWidth;
        let max = (d3.max(data, (d: DeviceSample) => (d.ble + d.wifi)) || 1);
        const hhmmFormat = d3.timeFormat("%m-%d %H:00")

        this.chart = Plot.plot({
            width: width,
            marginLeft: 250,
            marginBottom: 100,
            x: {
                label: "Tid",
                tickRotate: -90,
            },
            y: {
                label: "Enhet",
            },
            marks: [
                Plot.cell(data, {
                    x: d => hhmmFormat(d.time),
                    y: "name",
                    fill: (d: DeviceSample) => {
                        let f = (d.ble + d.wifi);
                        return f;
                    },
                }),
                Plot.frame()
            ],
            color: {
                legend: false,
                scheme: "gnbu",
                reverse: false,
                type: "linear"
            },
            style: {
                fontFamily: 'sans-serif',
                fontSize: '10pt',
                background: '#eeeeee',
                fill: '#808080',
            }
        });

        this.renderer.appendChild(this.chartRef?.nativeElement, this.chart)

        if (!this.legend) {
            this.legend = Plot.legend({
                color: {
                    domain: [0, max],
                    ticks: 3,
                    scheme: "gnbu",
                    reverse: false,
                    type: "linear"
                },
                width: 350,
                ticks: 5,
                label: "Antall enheter",
                style: { background: "#eeeeee" }
            },)
            this.renderer.appendChild(this.legendRef?.nativeElement, this.legend)
        }
    }
}
