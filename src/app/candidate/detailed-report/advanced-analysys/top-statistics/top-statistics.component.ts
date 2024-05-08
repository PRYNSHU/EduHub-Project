import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'top-statistics',
  templateUrl: './top-statistics.component.html',
  styleUrls: ['./top-statistics.component.css']
})
export class TopStatisticsComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  statistics = {
    questionsAttempted: 0,
    timeOnQuestions: 0,
    marks: 0,
    percentile: 0,
    avgSpeed: 0
  }

  constructor(
    private coreService: CoreService
  ) { }

  ngOnInit(): void {
    this.getScoreCardDetails(this.testInfo.id, this.testInfo.attempt_no)
  }

  getScoreCardDetails(testId, attempt_no) {
    const url = AppConstants.API_URL + "reports/score-card/" + testId + "/" + attempt_no
    this.coreService.getRequest(url).subscribe((data: any) => {

      const attemptedQuestions = data.correctQuestions + data.wrongQuestions
      const totalQuestions = data.correctQuestions + data.wrongQuestions + data.skippedQuestions

      this.statistics.questionsAttempted = (attemptedQuestions/totalQuestions) * 100
      this.statistics.timeOnQuestions = (data.time_spend / data.totalTime) * 100
      this.statistics.marks = (data.marks/data.totalMarks) * 100
    })
  }

}
