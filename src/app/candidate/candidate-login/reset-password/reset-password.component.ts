import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  loading:boolean 
  token
  newPassword
  rePassword

  constructor(
    private activatedRoute: ActivatedRoute,
    private coreService: CoreService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.token = params["token"]
    })
  }

  //Reset your new password   
  resetPassword() {

    let data = {
      token: this.token,
      newPassword: this.newPassword,
      rePassword: this.rePassword
    }
    this.loading = true
    this.coreService.putRequest(AppConstants.API_URL + "login/reset-password", data).subscribe((result: any) => {
      this.loading = false
      this.dialog.showDialog({ content: result.message })
    })
  }

}
