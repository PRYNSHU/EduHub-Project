import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from '../AppConstants';
import { CoreService } from '../service/core.service';
import { DialogService } from '../service/dialog.service';

@Component({
  selector: 'verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {

  @Input() email;
  @Input() message;
  otp
  loading: boolean

  constructor(
    private dialog: DialogService,
    private coreService: CoreService,
    private router: Router
  ) { }

  ngOnInit(): void {
    
  }

  sendOTP() {
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "new-registration/send-email-verification-otp", { email: this.email }).subscribe((data: any) => {
      this.loading = false
      this.dialog.showDialog({ content: data.message })
    })
  }

  verifyEmail() {
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "new-registration/verify-email", { otp: this.otp }).subscribe((data: any) => {
      this.loading = false

      if (data.success) {
        localStorage.setItem("token",data.token)
        localStorage.setItem("id",data.userId)
        return this.router.navigate(["/candidate"])
      }

      this.dialog.showDialog({ content: data.message })
    })
  }

}
