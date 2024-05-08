import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'accuracy-first-look',
  templateUrl: './accuracy-first-look.component.html',
  styleUrls: ['./accuracy-first-look.component.css']
})
export class AccuracyFirstLookComponent implements OnInit {

  CELL_TOP = "assets/images/detailed-report/accuracy-skills-strength-cell-top.svg"
  CELL_BOTTOM = "assets/images/detailed-report/accuracy-skills-strength-cell-bottom.svg"
  CELL_SHADOW = "assets/images/detailed-report/accuracy-difficulty-level-cell-shadow.svg"

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  firstLookAccuracy = {
    physics: 0,
    chemistry: 0,
    mathematics: 0
  }

  reAttemptAccuracy = {
    physics: 0,
    chemistry: 0,
    mathematics: 0
  }

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.getAttemptAccuracy(this.testInfo.id, this.testInfo.attempt_no)
  }

  getAttemptAccuracy(testId, attemptNo) {
    const url = AppConstants.API_URL + "reports/attempt-accuracy/" + testId + "/" + attemptNo
    this.coreService.getRequest(url).subscribe((result: any) => {
      const firstLookAccuracy = result.firstAttemptAccuracy
      const reAttemptAccuracy = result.reAttemptAccuracy

      // First Attemp Accuracy Data Subject Wise 
      const physics = firstLookAccuracy.find(f => f.subject == "Physics")
      if (physics) {
        this.firstLookAccuracy.physics = physics.accuracy
      }

      const chemistry = firstLookAccuracy.find(f => f.subject == "Chemistry")
      if (chemistry) {
        this.firstLookAccuracy.chemistry = chemistry.accuracy
      }

      const mathematics = firstLookAccuracy.find(f => f.subject == "Mathematics")
      if (mathematics) {
        this.firstLookAccuracy.mathematics = mathematics.accuracy
      }

      // Re Attempt Data Subject Wise
      const rePhysics = reAttemptAccuracy.find(r=>r.subject=="Physics")
      if(rePhysics){
        this.reAttemptAccuracy.physics = rePhysics.accuracy
      }
      const reChemistry = reAttemptAccuracy.find(r=>r.subject=="Chemistry")
      if(reChemistry){
        this.reAttemptAccuracy.chemistry = reChemistry.accuracy
      }
      const reMathematics = reAttemptAccuracy.find(r=>r.subject=="Mathematics")
      if(reMathematics){
        this.reAttemptAccuracy.mathematics = reMathematics.accuracy
      }

    })
  }

}
