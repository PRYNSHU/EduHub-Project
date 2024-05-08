import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'subject-wise-questions-statistics',
  templateUrl: './subject-wise-questions-statistics.component.html',
  styleUrls: ['./subject-wise-questions-statistics.component.css']
})
export class SubjectWiseQuestionsStatisticsComponent implements OnInit {

  loading: boolean = true

  @Input() testInfo: {
    id: null,
    attempt_no: 0,
  }

  @Input() subject

  data = {
    correctQuestions: 0,
    wrongQuestions: 0,
    skippedQuestions: 0
  }

  constructor(
    private coreService: CoreService,
  ) { }

  ngOnInit(): void {
    this.getSubjectReport(this.testInfo.id, this.testInfo.attempt_no)
  }

  getSubjectReport(testId, attempt_no) {
    const url = AppConstants.API_URL + "reports/subject-report/" + testId + "/" + attempt_no
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.loading = false
      const subject = data.subject_wise_data.find(s => s.subject == this.subject)
      if (!subject) return
      this.data.correctQuestions = subject.correct_questions
      this.data.wrongQuestions = subject.wrong_questions
      this.data.skippedQuestions = subject.skipped_questions
    })
  }

}
