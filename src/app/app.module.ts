import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { ErrorDialogComponent } from './utility-components/error-dialog/error-dialog.component';
import { AllCommonModule } from './all-common.module';
import { DialogComponent } from './utility-components/dialog/dialog.component';
import { LogoutComponent } from './logout/logout.component';
import { CandidateLoginComponent } from './candidate/candidate-login/candidate-login.component';
import { NoopInterceptor } from './interceptor';
import { CandidateSignupComponent } from './candidate/candidate-signup/candidate-signup.component';
import { ForgotPasswordComponent } from './candidate/candidate-login/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './candidate/candidate-login/reset-password/reset-password.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

@NgModule({
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA,
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    ErrorDialogComponent,
    DialogComponent,
    CandidateLoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    LogoutComponent,
    CandidateSignupComponent,
    VerifyEmailComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AllCommonModule,
    BrowserAnimationsModule,
    BrowserModule,
    MaterialModule,
  ],
  bootstrap: [AppComponent],
  providers:[{ provide: HTTP_INTERCEPTORS, useClass: NoopInterceptor, multi: true }]
})
export class AppModule { }
