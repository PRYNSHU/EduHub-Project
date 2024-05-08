import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AllCommonModule } from '../all-common.module';
import { CandidateSidebarComponent } from './candidate-sidebar/candidate-sidebar.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { ReportsComponent } from './reports/reports.component';
import { DetailedReportComponent } from './detailed-report/detailed-report.component';
import { ScoreCardComponent } from './detailed-report/score-card/score-card.component';
import { SubjectReportComponent } from './detailed-report/subject-report/subject-report.component';
import { QuestionReportComponent } from './detailed-report/question-report/question-report.component';
import { CompareYourselfComponent } from './detailed-report/compare-yourself/compare-yourself.component';
import { ProfileComponent } from './profile/profile.component';
import { NavigationGuard } from '../guards/navigation-guard.guard';
import { TestGuard } from '../guards/test.guard';
import { SolutionReportComponent } from './detailed-report/solution-report/solution-report.component';
import { CandidateGuard } from '../guards/candidate.guard';
import { CandidateHeaderComponent } from './candidate-header/candidate-header.component';
import { CandidateDashboardComponent } from './candidate-dashboard/candidate-dashboard.component';
import { CalculatorComponent } from './calculator/calculator.component';
import { SubjectHomeComponent } from './subject-home/subject-home.component';
import { VideoPageComponent } from './video-page/video-page.component';
import { StatisticsChartComponent } from './candidate-dashboard/statistics-chart/statistics-chart.component';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';
import { IssueModalComponent } from './CommonModals/issue-modal/issue-modal.component';
import { AdvancedAnalysysComponent } from './detailed-report/advanced-analysys/advanced-analysys.component';
import { SubjectWiseMarksComponent } from './detailed-report/advanced-analysys/subject-wise-marks/subject-wise-marks.component';
import { SubjectWiseQuestionsStatisticsComponent } from './detailed-report/advanced-analysys/subject-wise-questions-statistics/subject-wise-questions-statistics.component';
import { SkillsStrengthComponent } from './detailed-report/advanced-analysys/skills-strength/skills-strength.component';
import { AccuracyDifficultyLevelComponent } from './detailed-report/advanced-analysys/accuracy-difficulty-level/accuracy-difficulty-level.component';
import { AccuracySkillsStrengthComponent } from './detailed-report/advanced-analysys/accuracy-skills-strength/accuracy-skills-strength.component';
import { AccuracyFirstLookComponent } from './detailed-report/advanced-analysys/accuracy-first-look/accuracy-first-look.component';
import { SubjectSwapsComponent } from './detailed-report/advanced-analysys/subject-swaps/subject-swaps.component';
import { LastMinutesUtilizationComponent } from './detailed-report/advanced-analysys/last-minutes-utilization/last-minutes-utilization.component';
import { TimeStatisticsComponent } from './detailed-report/advanced-analysys/time-statistics/time-statistics.component';
import { BehaviourAnalysisComponent } from './detailed-report/advanced-analysys/behaviour-analysis/behaviour-analysis.component';
import { TopStatisticsComponent } from './detailed-report/advanced-analysys/top-statistics/top-statistics.component';
import { QuestionsStatisticsComponent } from './detailed-report/advanced-analysys/questions-statistics/questions-statistics.component';
import { MarksDistributionComponent } from './detailed-report/advanced-analysys/marks-distribution/marks-distribution.component';
import { SubjectwiseAccuracyComponent } from './detailed-report/advanced-analysys/subjectwise-accuracy/subjectwise-accuracy.component';
import { MarksDistributionAllStudentsComponent } from './detailed-report/advanced-analysys/marks-distribution-all-students/marks-distribution-all-students.component';
import { PaceAnalysisComponent } from './detailed-report/advanced-analysys/pace-analysis/pace-analysis.component';
import { TimeDistributionComponent } from './detailed-report/advanced-analysys/time-distribution/time-distribution.component';
import { LoginTempComponent } from './login-temp/login-temp.component';
import { ChapterPracticeHome } from '../guards/chapter-practice-home.guard';
import { EdustoreHomeComponent } from './edustore/edustore-home/edustore-home.component';
import { CoursePageComponent } from './edustore/course-page/course-page.component';
import { CourseTopSectionComponent } from './edustore/course-page/course-top-section/course-top-section.component';
import { CourseButtonsComponent } from './edustore/course-page/course-buttons/course-buttons.component';
import { CourseIncludesComponent } from './edustore/course-page/course-includes/course-includes.component';
import { CourseHighlightsComponent } from './edustore/course-page/course-highlights/course-highlights.component';
import { OfflineReportsComponent } from './reports/offline-reports/offline-reports.component';


const routes: Routes = [
  { path: '', component: CandidateDashboardComponent },
  { path: 'edustore', component: EdustoreHomeComponent, canActivate: [CandidateGuard] },
  { path: 'edustore/courses/:courseId', component: CoursePageComponent, canActivate: [CandidateGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [CandidateGuard] },
  { path: 'reports/:id/:attempt_no', component: DetailedReportComponent, canActivate: [CandidateGuard] },
  { path: 'reports/:id/:attempt_no/:report', component: DetailedReportComponent, canActivate: [CandidateGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [CandidateGuard] },
  { path: 'subject-home/:subjectId', component: SubjectHomeComponent, canActivate: [CandidateGuard] },
  { path: 'video-page', component: VideoPageComponent, canActivate: [CandidateGuard] },
];

export function playerFactory() {
  return player;
}

@NgModule({
  declarations: [
    CandidateSidebarComponent,
    ReportsComponent,
    OfflineReportsComponent,
    DetailedReportComponent,
    ScoreCardComponent,
    SubjectReportComponent,
    QuestionReportComponent,
    CompareYourselfComponent,
    ProfileComponent,
    SolutionReportComponent,
    CandidateHeaderComponent,
    CandidateDashboardComponent,
    CalculatorComponent,
    SubjectHomeComponent,
    VideoPageComponent,
    StatisticsChartComponent,
    IssueModalComponent,
    AdvancedAnalysysComponent,
    SubjectWiseMarksComponent,
    SubjectWiseQuestionsStatisticsComponent,
    SkillsStrengthComponent,
    AccuracyDifficultyLevelComponent,
    AccuracySkillsStrengthComponent,
    AccuracyFirstLookComponent,
    SubjectSwapsComponent,
    LastMinutesUtilizationComponent,
    TimeStatisticsComponent,
    BehaviourAnalysisComponent,
    TopStatisticsComponent,
    QuestionsStatisticsComponent,
    MarksDistributionComponent,
    SubjectwiseAccuracyComponent,
    MarksDistributionAllStudentsComponent,
    PaceAnalysisComponent,
    TimeDistributionComponent,
    LoginTempComponent,
    EdustoreHomeComponent,
    CoursePageComponent,
    CourseTopSectionComponent,
    CourseButtonsComponent,
    CourseIncludesComponent,
    CourseHighlightsComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    AllCommonModule,
    CarouselModule,
    NgCircleProgressModule.forRoot({
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: "#78C000",
      innerStrokeColor: "#C7E596",
      animationDuration: 300,
    })
  ],
  providers: [
    provideLottieOptions({
      player: () => player,
    }),
  ],
})
export class StudentModule { }
