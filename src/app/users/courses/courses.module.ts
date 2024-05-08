import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CoursesHomeComponent } from './courses-home/courses-home.component';
import { AddCourseComponent } from './add-course/add-course.component';
import { EditCourseComponent } from './edit-course/edit-course.component';
import { AllCommonModule } from 'src/app/all-common.module';
import { SubjectsHomeComponent } from '../subjects/subjects-home/subjects-home.component';
import { AssignSubjectToBatchesComponent } from './assign-subject-to-batches/assign-subject-to-batches.component';
import { CoursesDashboardComponent } from './courses-dashboard/courses-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: CoursesHomeComponent
  },
  {
    path: 'dashboard',
    component: CoursesDashboardComponent
  },
  {
    path: 'add-course',
    component: AddCourseComponent
  },
  {
    path: 'edit-course',
    component: EditCourseComponent
  },
  {
    path: 'subjects',
    component: SubjectsHomeComponent
  },
  {
    path: 'assign-subjects-in-batches',
    component: AssignSubjectToBatchesComponent
  }
]

@NgModule({
  declarations: [CoursesHomeComponent, AddCourseComponent, EditCourseComponent, AssignSubjectToBatchesComponent, CoursesDashboardComponent],
  imports: [
    CommonModule,
    AllCommonModule,
    RouterModule.forChild(routes)
  ],
  exports: []
})
export class CoursesModule { }