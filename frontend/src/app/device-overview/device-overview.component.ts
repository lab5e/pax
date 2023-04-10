import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DeviceSample, SampleService } from '../sample.service';
import * as d3 from 'd3';
import * as Plot from '@observablehq/plot';

// Flattened samples with a single entry for each sample
interface FlatSample {
    time: Date;
    type: string;
    count: number;
    id: string;
    name: string;
}

@Component({
    selector: 'app-device-overview',
    templateUrl: './device-overview.component.html',
    styleUrls: ['./device-overview.component.css']
})
export class DeviceOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("chart") chartRef?: ElementRef;
    chart?: (SVGElement | HTMLElement);

    @ViewChild("legend") legendRef?: ElementRef;
    legend?: (SVGElement | HTMLElement);

    @ViewChild("allchart") allChartRef?: ElementRef;
    allChart?: (SVGElement | HTMLElement);

    data: DeviceSample[] = [];
    constructor(
        protected samples: SampleService,
        private renderer: Renderer2,
    ) {

    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.samples.allData().subscribe({
            next: (s: DeviceSample) => {
                this.data.push(s);
            },
            complete: () => {
                this.showChart();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.chart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.chartRef?.nativeElement, this.chart, false);
        }
        if (this.allChart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.allChartRef?.nativeElement, this.allChart, false);
        }
        if (this.legend) {
            this.renderer.removeChild(this.legendRef?.nativeElement, this.legend, false);
        }
    }
    showChart(): void {
        if (this.chart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.chartRef?.nativeElement, this.chart, false);
        }
        if (this.allChart) {
            // Remove the old one if it already exists
            this.renderer.removeChild(this.allChartRef?.nativeElement, this.allChart, false);
        }

        let width = this.chartRef?.nativeElement.offsetWidth;
        let max = (d3.max(this.data, (d: DeviceSample) => (d.ble + d.wifi)) || 1);
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
                Plot.cell(this.data, {
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

        // Add chart for ALL THE THINGS. Rearrange the samples to make charting easier. Add a separate sample for 
        // each value.

        const mmFormat = d3.timeFormat("%d %H:00")

        let sortedSamples = this.getFlattenedSamples();
        let startDate = d3.min(this.data, (d: DeviceSample) => d.time);
        let endDate = d3.max(this.data, (d: DeviceSample) => d.time)

        let allWidth = this.allChartRef?.nativeElement.offsetWidth;
        this.allChart = Plot.plot({
            width: allWidth,
            margin: 50,
            inset: 5,
            y: {
                grid: true,
                label: "Antall"
            },
            x: {
                label: "Klokkeslett",
                grid: true,
                tickFormat: d3.timeFormat("%H:%M"),
                domain: [startDate, endDate]
            },
            marks: [
                Plot.line(
                    sortedSamples,
                    Plot.windowY(
                        { reduce: "sum", k: 180, anchor: "middle" },
                        {
                            x: "time",
                            y: "count",
                            stroke: "type",
                            strokeWidth: 2,
                            opacity: 0.8,
                        }
                    )
                ),
                Plot.frame(),
            ],
            color: {
                legend: false,
                domain: ["wifi", "ble"],
                range: ["red", "blue"]
            },
            style: {
                fontFamily: 'sans-serif',
                fontSize: '10pt',
                background: '#eeeeee',
                fill: '#808080',
            }
        });
        this.renderer.appendChild(this.allChartRef?.nativeElement, this.allChart)
    }

    // Return a sorted list with flat samples for all the data
    getFlattenedSamples(): FlatSample[] {
        let ret: FlatSample[] = this.data.map((d: DeviceSample) => {
            let r: FlatSample = {
                id: d.id,
                name: d.name,
                time: d.time,
                count: d.ble,
                type: "ble",
            };
            return r;
        }).concat(
            this.data.map((d: DeviceSample) => {
                let r: FlatSample = {
                    id: d.id,
                    name: d.name,
                    time: d.time,
                    count: d.wifi,
                    type: "wifi",
                };
                return r;
            }
            ));
        return d3.sort(ret, (a: FlatSample, b: FlatSample) => a.time.getTime() - b.time.getTime());
    }
}
