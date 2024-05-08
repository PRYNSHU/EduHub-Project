import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateHomeComponent } from './candidate-home/candidate-home.component';
import { AddCandidateComponent } from './add-candidate/add-candidate.component';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { EditCandidateComponent } from './edit-candidate/edit-candidate.component';
import { PromoteCandidateComponent } from './promote-candidate/promote-candidate.component';

const routes: Routes = [
  {
    path: "",
    component: CandidateHomeComponent
  },
  {
    path: "add-candidate",
    component: AddCandidateComponent
  }
]

@NgModule({
  declarations: [
    AddCandidateComponent,
    CandidateHomeComponent,
    EditCandidateComponent,
    PromoteCandidateComponent,
  ],
  imports: [
    AllCommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [

  ]
})
export class ManageCandidateModule { }
