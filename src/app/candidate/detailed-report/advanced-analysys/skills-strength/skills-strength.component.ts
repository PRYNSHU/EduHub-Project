import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'skills-strength',
  templateUrl: './skills-strength.component.html',
  styleUrls: ['../../../candidate-dashboard/candidate-dashboard.component.css', './skills-strength.component.css']
})
export class SkillsStrengthComponent implements OnInit {

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  skillsStrength = {
    memory: 0,
    conceptual: 0,
    application: 0
  }

  constructor(
    private coreService: CoreService
  ) { }

  ngOnInit(): void {
    this.getSkillsStrength(this.testInfo.id, this.testInfo.attempt_no)
  }

  getSkillsStrength(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/skills-strength/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
      this.skillsStrength.memory = result.memoryPercentage
      this.skillsStrength.application = result.applicationPercentage
      this.skillsStrength.conceptual = result.conceptualPercentage
    })
  }

}
