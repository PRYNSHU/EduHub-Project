import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'last-minutes-utilization',
  templateUrl: './last-minutes-utilization.component.html',
  styleUrls: ['./last-minutes-utilization.component.css']
})
export class LastMinutesUtilizationComponent implements OnInit {

  @Input() data = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    physicsLastTime: null,
    chemistryLastTime: null,
    mathematicsLastTime: null
  }

  constructor() { }

  ngOnInit(): void {
   
  }

 
}
