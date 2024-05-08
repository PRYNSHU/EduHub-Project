import { NgModule } from '@angular/core';
import { Routes, RouterModule} from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NavigationGuard } from './guards/navigation-guard.guard';
import { LogoutComponent } from './logout/logout.component';
import { AdminGuard } from './guards/admin.guard';
import { CandidateGuard } from './guards/candidate.guard';
import { CandidateSignupComponent } from './candidate/candidate-signup/candidate-signup.component';
import { ResetPasswordComponent } from './candidate/candidate-login/reset-password/reset-password.component';
import { LoginTempComponent } from './candidate/login-temp/login-temp.component';

const routes: Routes = [
  { path: '', component: LoginTempComponent, canDeactivate: [NavigationGuard] },
  { path: 'users-login', component: LoginComponent, canDeactivate: [NavigationGuard] },
  { path: 'logout/:role', component: LogoutComponent },
  { path: 'users', loadChildren: () => import('./users/user.module').then(m => m.UsersModule), canActivate: [AdminGuard] },
  { path: 'candidate', loadChildren: () => import('./candidate/candidate.module').then(m => m.StudentModule), canActivate: [CandidateGuard] },
  { path: 'sign-up', component: CandidateSignupComponent },
  { path: 'reset-password', component: ResetPasswordComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }