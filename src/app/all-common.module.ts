import { NgModule } from '@angular/core';
import { LoadingComponent } from './utility-components/loading/loading.component';
import { MaterialModule } from './material.module';
import { CommonModule } from '@angular/common';
import { SafePipe } from './pipes/safe';
import { ModalDirective } from './directives/modal.directive';
import { FormsModule } from '@angular/forms';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FullCalendarModule } from '@fullcalendar/angular';
import { GoogleChartsModule } from 'angular-google-charts';
import { MathTexPipe } from './pipes/math-tex.pipe';
import { RouterModule } from '@angular/router';
import { AdminSidebarComponent } from './users/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './users/admin-header/admin-header.component';
import { AddSubjectComponent } from './users/subjects/add-subject/add-subject.component';
import { EditSubjectComponent } from './users/subjects/edit-subject/edit-subject.component';
import { SubjectsHomeComponent } from './users/subjects/subjects-home/subjects-home.component';
import { URLSafePipe } from './pipes/urlSafe';
import { StatisticsDashboardComponent } from './users/statistics-dashboard/statistics-dashboard.component';

@NgModule({
  declarations: [
    LoadingComponent,
    SafePipe,
    URLSafePipe,
    ModalDirective,
    MathTexPipe,
    AdminHeaderComponent,
    AdminSidebarComponent,
    SubjectsHomeComponent,
    AddSubjectComponent,
    EditSubjectComponent,
    StatisticsDashboardComponent
  ],
  imports: [
    CommonModule,
    FullCalendarModule,
    MaterialModule,
    FormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatTableModule,
    MatIconModule,
    DragDropModule,
    GoogleChartsModule,
    RouterModule.forChild([])
  ],
  exports: [
    CommonModule,
    FullCalendarModule,
    MaterialModule,
    FormsModule,
    LoadingComponent,
    SafePipe,
    URLSafePipe,
    MathTexPipe,
    ModalDirective,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatTableModule,
    MatIconModule,
    DragDropModule,
    GoogleChartsModule,
    RouterModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
    SubjectsHomeComponent,
    AddSubjectComponent,
    EditSubjectComponent,
    StatisticsDashboardComponent
  ]
})
export class AllCommonModule { }
