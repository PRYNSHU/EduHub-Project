import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'add-role',
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.css']
})
export class AddRoleComponent implements OnInit {

  @Input() modal: { addRole: boolean }
  @Input() roles: any[]

  roleName

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {

  }

  submit() {
    this.coreService.postRequest(AppConstants.API_URL + "permissions/new-role", { roleName: this.roleName }).
      subscribe((result: any) => {
        this.roles.push(result.role)
        this.modal.addRole = false
      })
  }

}
