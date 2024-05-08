import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'time-distribution',
  templateUrl: './time-distribution.component.html',
  styleUrls: ['./time-distribution.component.css']
})
export class TimeDistributionComponent implements OnInit {

  @Input() timeDistribution = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    unUsed: 0,
    total:0
  }

  physicsPX
  chemistryPX
  mathematicsPX
  unUsedPX
  constructor() { }

  ngOnInit(): void {

    // Caluclate Maximum Time From subjects 
    let maxTime = Math.max(
      this.timeDistribution.physics,
      this.timeDistribution.chemistry,
      this.timeDistribution.mathematics,
      this.timeDistribution.unUsed
    )
    
    this.physicsPX = this.timeDistribution.physics / maxTime * 160
    this.chemistryPX = this.timeDistribution.chemistry / maxTime * 160
    this.mathematicsPX = this.timeDistribution.mathematics / maxTime * 160
    this.unUsedPX = this.timeDistribution.unUsed / maxTime * 160
  }

  getMinutes(seconds){
    return +(seconds/60).toFixed(2)
  }

}
