import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'advanced-analysys',
  templateUrl: './advanced-analysys.component.html',
  styleUrls: ['./advanced-analysys.component.css'],
})
export class AdvancedAnalysysComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  isSubjectDataLoaded:boolean = false
  isScoreCardLoaded:boolean = false

  columnNames = ['Percentage', 'Correct', 'Incorrect', 'UnAnswered'];
  showChart: boolean = false

  // Performace Data With Initial Dummy Values
  performanceData = [
    ["Easy", 80, 12, 8],
    ["Medium", 70, 15, 15],
    ["Hard", 50, 30, 20],
  ]

  utilizationData = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    physicsLastTime: "00:00",
    chemistryLastTime: "00:00",
    mathematicsLastTime: "00:00"
  }

  questionStatistics = {
    correctQuestions: 0,
    incorrectQuestions: 0,
    skippedQuestions: 0
  }

  marksDistribution = {
    rightMarks: 0,
    wrongMarks: 0,
    leftQuestionsMarks: 0
  }

  subjectWiseAccuracy = {
    physics: 0,
    chemistry: 0,
    mathematics: 0
  }

  timeDistribution = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    unUsed:0,
    total:0
  }

  subjectSwaps = 0

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.getScoreCardDetails(this.testInfo.id, this.testInfo.attempt_no)
    this.getSubjectReport(this.testInfo.id, this.testInfo.attempt_no)
    this.getPerformanceAnalysis(this.testInfo.id, this.testInfo.attempt_no)
  }

  getScoreCardDetails(testId, attempt_no) {
    const url = AppConstants.API_URL + "reports/score-card/" + testId + "/" + attempt_no
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.questionStatistics.correctQuestions = data.correctQuestions
      this.questionStatistics.incorrectQuestions = data.wrongQuestions
      this.questionStatistics.skippedQuestions = data.skippedQuestions

      this.marksDistribution.rightMarks = data.rightMarks
      this.marksDistribution.wrongMarks = data.wrongMarks
      this.marksDistribution.leftQuestionsMarks = data.leftQuestionsMarks

      this.subjectSwaps = data.subjectSwaps

      this.timeDistribution.unUsed = data.totalTime - data.time_spend
      this.timeDistribution.total = data.totalTime
      this.isScoreCardLoaded = true
    })
  }

  getSubjectReport(testId, attempt_no) {
    const url = AppConstants.API_URL + "reports/subject-report/" + testId + "/" + attempt_no
    this.coreService.getRequest(url).subscribe((data: any) => {
      const swd = data.subject_wise_data

      //Subject wise Accuracy
      const physics = swd.find(s => s.subject == "Physics")
      if (physics) {
        this.subjectWiseAccuracy.physics = +parseFloat("" + ((physics.correct_questions) / ((physics.correct_questions) +
          (physics.wrong_questions))) * 100).toFixed(2)
      }

      const chemistry = swd.find(s => s.subject == "Chemistry")
      if (chemistry) {
        this.subjectWiseAccuracy.chemistry = +parseFloat("" + ((chemistry.correct_questions) / ((chemistry.correct_questions) +
          (chemistry.wrong_questions))) * 100).toFixed(2)
      }

      const mathematics = swd.find(s => s.subject == "Mathematics")
      if (mathematics) {
        this.subjectWiseAccuracy.mathematics = +parseFloat("" + ((mathematics.correct_questions) / ((mathematics.correct_questions) +
          (mathematics.wrong_questions))) * 100).toFixed(2)
      }

      // SubjectWiseDataLast
      const swdl = data.subject_wise_data_last

      const physicsLast = swdl.find(s => s.subject == "Physics")
      if (physicsLast) {
        this.utilizationData.physics = physicsLast.scored_marks
      }

      const chemistryLast = swdl.find(s => s.subject == "Chemistry")
      if (chemistryLast) {
        this.utilizationData.chemistry = chemistryLast.scored_marks
      }

      const mathematicsLast = swdl.find(s => s.subject == "Mathematics")
      if (mathematicsLast) {
        this.utilizationData.mathematics = mathematicsLast.scored_marks
      }

      //Subject Last Time
      const slt = data.subject_last_time

      const physicsLastTime = slt.find(s => s.subject == "Physics")
      if (physicsLastTime) {
        this.utilizationData.physicsLastTime = this.getTimeFormatted(physicsLastTime.time)
      }

      const chemistryLastTime = slt.find(s => s.subject == "Chemistry")
      if (chemistryLastTime) {
        this.utilizationData.chemistryLastTime = this.getTimeFormatted(chemistryLastTime.time)
      }

      const mathematicsLastTime = slt.find(s => s.subject == "Mathematics")
      if (mathematicsLastTime) {
        this.utilizationData.mathematicsLastTime = this.getTimeFormatted(mathematicsLastTime.time)
      }

      //Time Distribution
      if (physics) {
        this.timeDistribution.physics = physics.time_spend
      }
      if (chemistry) {
        this.timeDistribution.chemistry = chemistry.time_spend
      }
      if (mathematics) {
        this.timeDistribution.mathematics = mathematics.time_spend
      }

      this.isSubjectDataLoaded = true

    })
  }

  getTimeFormatted(totalSeconds) {
    let minutes = Math.floor((totalSeconds % (60 * 60)) / (60))
    let seconds = Math.floor((totalSeconds % (60)))
    return `${minutes}:${seconds}`
  }


  getPerformanceAnalysis(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/performance-analysis/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
    
      this.performanceData[0][1] = result.easyCorrectPercentage
      this.performanceData[0][2] = result.easyWrongPercentage
      this.performanceData[0][3] = result.easyUnAnsweredPercentage

      this.performanceData[1][1] = result.mediumCorrectPercentage
      this.performanceData[1][2] = result.mediumWrongPercentage
      this.performanceData[1][3] = result.mediumUnAnsweredPercentage

      this.performanceData[2][1] = result.hardCorrectPercentage
      this.performanceData[2][2] = result.hardWrongPercentage
      this.performanceData[2][3] = result.hardUnAnsweredPercentage
      this.showChart = true
    })
  }

}
