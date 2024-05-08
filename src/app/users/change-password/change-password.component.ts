import { Component, OnInit } from '@angular/core';
import { DialogService } from 'src/app/service/dialog.service';
import { ChangePasswordService } from './change-password.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  loading: boolean

  constructor(private passwordService: ChangePasswordService, private dialog: DialogService) { }

  ngOnInit(): void {
    
  }

  changePassword(data) {
    this.loading = true
    this.passwordService.changePassword(data.value).subscribe((result: any) => {
      this.loading = false
      this.dialog.showDialog({ content: result.message })
    })
  }

}
