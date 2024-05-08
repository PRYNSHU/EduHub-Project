import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'edit-user-permissions',
  templateUrl: './edit-user-permissions.component.html',
  styleUrls: ['./edit-user-permissions.component.css']
})
export class EditUserPermissionsComponent implements OnInit {

  @Input() user
  @Input() modals:{
    showEditPermissionsModal:boolean
  }

  loading: boolean
  permissions = []

  constructor(
    private coreService: CoreService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
    this.permissions = JSON.parse(this.user.permissions)
  }

  getKeys(obj) {
    return Object.keys(obj)
  }

  renameKeys(key) {
    let arr = key.split("_")
    return arr.join(" ")
  }


  toggleAll(p, e) {

    for (let key in p.permissions) {
      p.permissions[key] = +e.checked
    }

  }

  updatePermissions() {
    const url = AppConstants.API_URL + "users/permissions/"
    const data = { userId: this.user.userId, permissions: this.permissions }
    this.coreService.putRequest(url, data).subscribe((result: any) => {
      this.user.permissions = JSON.stringify(this.permissions)
      this.dialog.showDialog({ content: result.message })
      this.modals.showEditPermissionsModal = false
    })
  }

}
