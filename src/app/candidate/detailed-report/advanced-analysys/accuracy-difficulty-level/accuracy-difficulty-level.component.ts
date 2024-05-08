import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'accuracy-difficulty-level',
  templateUrl: './accuracy-difficulty-level.component.html',
  styleUrls: ['./accuracy-difficulty-level.component.css']
})
export class AccuracyDifficultyLevelComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  accuracy = {
    overallEasyAccuracy:0,
    overallHardAccuracy:0,
    overallMediumAccuracy:0,
    myEasyAccuracy:0,
    myHardAccuracy:0,
    myMediumAccuracy:0
  }

  CELL_TOP = "assets/images/detailed-report/accuracy-difficulty-level-cell-top.svg"
  CELL_BOTTOM = "assets/images/detailed-report/accuracy-difficulty-level-cell-bottom.svg"
  CELL_SHADOW = "assets/images/detailed-report/accuracy-difficulty-level-cell-shadow.svg"
  CELL_YOUR_BAR = "assets/images/detailed-report/accuracy-difficulty-level-your-cell-bar-top.svg"
  CELL_OVERALL_BAR = "assets/images/detailed-report/accuracy-difficulty-level-overall-cell-bar-top.svg"


  constructor(
    private coreService: CoreService
  ) { }

  ngOnInit(): void {
    this.getAccuracyData(this.testInfo.id, this.testInfo.attempt_no)
  }

  getAccuracyData(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/accuracy-based-on-difficulty-levels/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
      this.accuracy = result
    })
  }

}
