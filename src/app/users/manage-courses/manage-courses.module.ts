import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from 'src/app/all-common.module';
import { ManageCoursesHomeComponent } from './manage-courses-home/manage-courses-home.component';
import { AddCourseComponent } from './add-course/add-course.component';
import { EditCourseComponent } from './edit-course/edit-course.component';
import { AddSubjectsComponent } from './add-subjects/add-subjects.component';
import { EditSubjectComponent } from './edit-subject/edit-subject.component';
import { AddChapterComponent } from './add-chapter/add-chapter.component';
import { EditChapterComponent } from './edit-chapter/edit-chapter.component';
import { AddTopicComponent } from './add-topic/add-topic.component';
import { EditTopicComponent } from './edit-topic/edit-topic.component';
import { SortChaptersComponent } from './sort-chapters/sort-chapters.component';
import { SortTopicsComponent } from './sort-topics/sort-topics.component';
import { EditTestComponent } from './edit-test/edit-test.component';

const routes: Routes = [
  {
    path: '',
    component: ManageCoursesHomeComponent,
  },
  {
    path: 'add-course',
    component: AddCourseComponent,
  },
  {
    path: 'edit-course/:courseId',
    component: EditCourseComponent,
  },
  {
    path: 'add-subjects',
    component: AddSubjectsComponent,
  },
  {
    path: 'edit-subject/:subjectId',
    component: EditSubjectComponent,
  },
  {
    path: 'add-chapter/:subjectId',
    component: AddChapterComponent,
  },
  {
    path: 'edit-chapter/:chapterId',
    component: EditChapterComponent
  },
  {
    path: 'add-topic',
    component: AddTopicComponent
  },
  {
    path: 'edit-topic',
    component: EditTopicComponent
  },
  {
    path: 'sort-chapters',
    component: SortChaptersComponent
  },
  {
    path: 'sort-topics',
    component: SortTopicsComponent
  }
];

@NgModule({
  declarations: [
    ManageCoursesHomeComponent,
    AddCourseComponent,
    EditCourseComponent,
    AddSubjectsComponent,
    EditSubjectComponent,
    AddChapterComponent,
    EditChapterComponent,
    AddTopicComponent,
    EditTopicComponent,
    SortChaptersComponent,
    SortTopicsComponent,
    EditTestComponent,
  ],
  imports: [CommonModule, AllCommonModule, RouterModule.forChild(routes)],
  exports: [],
})
export class ManageCoursesModule { }
