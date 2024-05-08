import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllCommonModule } from '../all-common.module';
import { MainDashboardComponent } from './main-dashboard/main-dashboard.component';

const routes: Routes = [
  {
    path: "dashboard",
    component: MainDashboardComponent
  },
  {
    path: 'manage-students',
    loadChildren: () => import('./candidate/manage-candidate.module').then(m => m.ManageCandidateModule)
  },
  {
    path: 'manage-users',
    loadChildren: () => import('./users/manage-users.module').then(m => m.ManageUsersModule)
  },
  {
    path: 'default-permissions',
    loadChildren: () => import('./default-permissions/default-permissions.module').then(m => m.DefaultPermissionsModule)
  },
  {
    path: 'change-password',
    loadChildren: () => import('./change-password/change-password.module').then(m => m.ChangePasswordModule)
  },
  {
    path: 'change-session',
    loadChildren: () => import('./change-session/change-session.module').then(m => m.ChangeSessionModule)
  },
  {
    path: "contact-inquiries",
    loadChildren: () => import('./contact-inquiries/contact-inquiries.module').then(m => m.ContactInquiriesModule)
  },
  {
    path: "manage-courses",
    loadChildren: () => import('./manage-courses/manage-courses.module').then(m => m.ManageCoursesModule)
  }
]

@NgModule({
  declarations: [MainDashboardComponent],
  imports: [
    AllCommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class UsersModule { }
