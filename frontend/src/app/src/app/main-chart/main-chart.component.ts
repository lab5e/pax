import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SampleService } from 'src/app/sample.service';

@Component({
    selector: 'app-main-chart',
    templateUrl: './main-chart.component.html',
    styleUrls: ['./main-chart.component.css']
})
export class MainChartComponent implements OnInit, AfterViewInit {
    @ViewChild("chart") chartRef?: ElementRef;

    chart?: (SVGElement | HTMLElement);

    hasError(): boolean {
        return this.samples.errorMessage != "";
    }

    constructor(
        protected samples: SampleService,
    ) {
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.showChart();
    }


    showChart(): void {

    }
}
