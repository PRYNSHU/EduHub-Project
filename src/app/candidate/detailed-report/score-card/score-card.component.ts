import { Component, OnInit, Input } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';

@Component({
  selector: 'score-card',
  templateUrl: './score-card.component.html',
  styleUrls: ['../../candidate-common.css', '../detailed-report.component.css', './score-card.component.css']
})
export class ScoreCardComponent implements OnInit {

  loading = true

  chartData = [
    ['Correct Questions', 0],
    ['Skipped Questions', 0],
    ['Incorrect Questions', 0],
  ]

  options = {
    pieHole: 0.4,
    legend: {
      position: 'left'
    },
    //        Green       Blue        Red
    colors: ['#28a745', '#1a73cc', '#f44336'],
    sliceVisibilityThreshold: 0
  }

  myMarks
  rightMarks
  wrongMarks
  leftQuestionsMarks
  myRank
  myPercentile
  questions_attempted
  time_on_questions
  correctQuestions
  wrongQuestions
  skippedQuestions
  accuracy = ""
  subject_marks_data

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  constructor(private coreService: CoreService, private timeService: DateTimeFormatService) { }

  ngOnInit(): void {
    this.getScoreCardDetails(this.testInfo.id, this.testInfo.attempt_no)
  }

  getScoreCardDetails(testId, attempt_no) {
    this.coreService.getRequest(AppConstants.API_URL + "reports/score-card/" + testId + "/" + attempt_no).
      subscribe((data: any) => {
        this.loading = false
    
        this.myMarks = data.marks
        this.rightMarks = data.rightMarks
        this.wrongMarks = data.wrongMarks
        this.leftQuestionsMarks = data.leftQuestionsMarks
    
        this.myRank = data.myRank
        this.myPercentile = data.percentile
    
        this.questions_attempted = data.questions_attempted
        this.time_on_questions = this.timeService.getFormattedTime(data.time_spend)
        this.subject_marks_data = data.subject_wise_data
    
        this.correctQuestions = data.correctQuestions
        this.wrongQuestions = data.wrongQuestions
        this.skippedQuestions = data.skippedQuestions
    
        this.chartData[0][1] = this.correctQuestions
        this.chartData[2][1] = this.wrongQuestions
        this.chartData[1][1] = this.skippedQuestions
    
        this.accuracy = parseFloat("" + ((this.correctQuestions) / ((this.correctQuestions) +
          (this.wrongQuestions))) * 100).toFixed(2)
      })
  }

  fixedDecimal(number) {
    return parseFloat(number).toFixed(2);
  }

}
