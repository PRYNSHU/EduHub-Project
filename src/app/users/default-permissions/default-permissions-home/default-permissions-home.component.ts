import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Component({
  selector: 'default-permissions-home',
  templateUrl: './default-permissions-home.component.html',
  styleUrls: ['./default-permissions-home.component.css']
})
export class DefaultPermissionsHomeComponent implements OnInit {

  loading: boolean = true
  roles = []
  roleId = ""
  permissions = []
  modals = {
    addRole: false
  }

  constructor(private coreService: CoreService) { }

  ngOnInit(): void {
    this.coreService.getRequest(AppConstants.API_URL + "permissions/default-role-permissions").
      subscribe((roles: any) => {
        this.roles = roles
        this.loading = false
      })
  }

  getKeys(obj) {
    return Object.keys(obj)
  }

  // turns like add_user to add user
  renameKeys(key) {
    let arr = key.split("_")
    return arr.join(" ")
  }

  // Toggle all permissions under specific permission
  toggleAll(p, e) {

    for (let key in p.permissions) {
      p.permissions[key] = +e.checked
    }

  }

  loadPermissions() {
    this.permissions = []
    let role = this.roles.find(r => r.roleId == this.roleId)

    if (role) {
      this.permissions = role.permissions
    }

    if (this.roleId == "-1") {
      this.modals.addRole = true
    }
  }

  // Update Whole Permission at Once 
  updatePermissions() {
    this.loading = true
    this.coreService.putRequest(AppConstants.API_URL + "permissions/default-permissions-all", { permissions: this.permissions, roleId: this.roleId }).subscribe((result: any) => {
      this.loading = false
    })
  }

}

