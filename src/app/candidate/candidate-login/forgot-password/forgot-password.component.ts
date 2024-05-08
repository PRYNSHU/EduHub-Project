import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  @Input() modal: {
    forgotModal: boolean
  }

  loading: boolean
  email;

  constructor(
    private coreService: CoreService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {

  }

  // Send reset links email
  sendResetLink() {
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "login/send-reset-link", { email: this.email }).subscribe((result: any) => {
      this.loading = false
      this.modal.forgotModal = false
      this.dialog.showDialog({ content: result.message })
    })
  }

}
