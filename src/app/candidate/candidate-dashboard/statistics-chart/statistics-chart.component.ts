import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'statistics-chart',
  templateUrl: './statistics-chart.component.html',
  styleUrls: ['./statistics-chart.component.css']
})
export class StatisticsChartComponent implements OnInit {

  @Input() data

  constructor() { }

  ngOnInit(): void {
  }

}
