import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'subject-wise-marks',
  templateUrl: './subject-wise-marks.component.html',
  styleUrls: ['./subject-wise-marks.component.css']
})
export class SubjectWiseMarksComponent implements OnInit {

  loading: boolean = true

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  marks = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    total: 0
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
      const swd = data.subject_wise_data

      const physics = swd.find(s => s.subject == "Physics")
      if (physics) {
        this.marks.physics = physics.scored_marks
        this.marks.total += +physics.maximum_marks
      }

      const chemistry = swd.find(s => s.subject == "Chemistry")
      if (chemistry) {
        this.marks.chemistry = chemistry.scored_marks
        this.marks.total += +chemistry.maximum_marks
      }

      const mathematics = swd.find(s => s.subject == "Mathematics")
      if (mathematics) {
        this.marks.mathematics = mathematics.scored_marks
        this.marks.total += +mathematics.maximum_marks
      }
    })
  }


}
