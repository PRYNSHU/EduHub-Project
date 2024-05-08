import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';
import { permissionsObject, Permissions } from '../../user.modal';
import { UsersService } from '../../users.service';

/*Variables Related to Table Starts Here*/
export interface PeriodicElement {
  userId: number,
  name: any,
  phone: string,
  role: string
}

@Component({
  selector: 'user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './user-home.component.css'],
})
export class UserHomeComponent implements OnInit {

  loading: boolean = true

  /* Variables Related to Table Starts Here*/
  tableData: PeriodicElement[] = []
  displayedColumns: string[] = ['name', 'role', 'phone', 'action']
  dataSource = new MatTableDataSource(this.tableData)

  selection = new SelectionModel<PeriodicElement>(true, [])
  @ViewChild(MatSort, { static: true }) sort: MatSort
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  /* Variables Related to Table Ends Here*/

  userToEdit
  modals = {
    showEditModal: false,
    showEditPermissionsModal: false
  }
  
  users = []
  permissions: Permissions = permissionsObject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private timeService: DateTimeFormatService,
    private usersService: UsersService
  ) { }

  async ngOnInit() {
    this.getAllUsers()
    this.permissions = await this.usersService.getUserPermissions()

    if (this.permissions.delete_user) {
      this.displayedColumns.unshift("id")
    }
  }

  getAllUsers() {
    this.coreService.getRequest(AppConstants.API_URL + "users").subscribe((data: any) => {
      this.loading = false
      this.users = data
      this.tableData = data
      this.setDataSource()
    })
  }

  filterUsers(search) {
    this.tableData = []
    this.tableData = this.users.filter(s => {
      let condition = true

      let userName = s.name && s.name.toLowerCase().trim()
      let userCity = s.city && s.city.toLowerCase().trim()
      let userPhone = s.phone && s.phone.toLowerCase().trim()

      if (search) {
        let val = search.toLowerCase().trim()
        condition = condition &&
          ((userName && userName.includes(val)) ||
            (userCity && userCity.includes(val)) ||
            (userPhone && userPhone.includes(val)))
      }

      return condition
    })
    this.setDataSource()
  }

  showFullUser(user) {
    let image = user.image ? AppConstants.WEBSITE_URL + user.image : "assets/images/" + user.gender + ".png"
    let table = `<table class='common-table without-border' style='box-shadow:0 0 4px rgba(0,0,0,.25)'>
    <tr><td colspan=2 style='text-align:center'><img style='max-width:120px' src="${image}"></td></tr>
    <tr><th>Name</th><td>${user.name}</td></tr>
    <tr><th>Email</th><td>${user.email}</td></tr>
    <tr><th>Role</th><td>${user.roleName}</td></tr>
    <tr><th>D.O.B</th><td>${this.timeService.getFormattedDate(user.dob)}</td></tr>
    <tr><th>Employee Id.</th><td>${user.employeeId}</td></tr>
    <tr><th>Phone</th><td>${user.phone}</td></tr>
    <tr><th>Gender</th><td>${user.gender}</td></tr>
    <tr><th>Biometric Id</th><td>${user.bioid}</td></tr>
    <tr><th>City</th><td>${user.city}</td></tr>
    <tr><th>State</th><td>${user.state}</td></tr>
    <tr><th>Address</th><td>${user.address}</td></tr>
    </table>`

    this.dialog.showDialog({
      content: table,
      title: `Full detail of ${user.name} `
    })
  }

  editUser(user) {
    this.modals.showEditModal = true
    this.userToEdit = user
  }

  showDelete(user) {
    this.dialog.showDialog({
      content: `Are you sure to delete "${user.name}"`,
      title: 'Confirm Deletion',
      callBackButtonText: 'Delete',
      callBackButtonColor: 'warn',
      callBack: () => {
        this.deleteUser(user.userId)
      }
    })
  }

  deleteUser(userId) {
    this.coreService.deleteRequest(AppConstants.API_URL + "users/" + userId).subscribe((data: any) => {

      if (data.success) {
        let user = this.tableData.find(t => t.userId == userId)
        this.tableData.splice(this.tableData.indexOf(user), 1)
        this.setDataSource()
      }

    })
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    var numSelected = this.selection.selected.length;
    var numRows = this.dataSource.data.length;
    return numSelected == numRows
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => { this.selection.select(row) });
  }

  /* Set Data Source After Changes in Table Data */
  setDataSource() {
    this.dataSource = new MatTableDataSource(this.tableData);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  editPermissions(user) {
    this.userToEdit = user
    this.modals.showEditPermissionsModal = true
  }

}
