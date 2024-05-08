import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'accuracy-skills-strength',
  templateUrl: './accuracy-skills-strength.component.html',
  styleUrls: ['./accuracy-skills-strength.component.css']
})
export class AccuracySkillsStrengthComponent implements OnInit {

  CELL_TOP = "assets/images/detailed-report/accuracy-skills-strength-cell-top.svg"
  CELL_BOTTOM = "assets/images/detailed-report/accuracy-skills-strength-cell-bottom.svg"
  CELL_SHADOW = "assets/images/detailed-report/accuracy-difficulty-level-cell-shadow.svg"

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  accuracy = {
    overallApplicationAccuracy: 0,
    overallMemoryAccuracy: 0,
    overallConceptualAccuracy: 0,
    myMemoryAccuracy: 0,
    myApplicationAccuracy: 0,
    myConceptualAccuracy: 0
  }

  constructor(
    private coreService: CoreService
  ) { }

  ngOnInit(): void {
    this.getSkillsAccuracy(this.testInfo.id,this.testInfo.attempt_no)
  }

  getSkillsAccuracy(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/accuracy-based-on-skills-strength/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
      this.accuracy = result
    })
  }

}
