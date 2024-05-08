import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';
import { DialogService } from 'src/app/service/dialog.service';
import { permissionsObject, Permissions } from '../../user.modal';
import { UsersService } from '../../users.service';

/*Variables Related to Table Starts Here*/
export interface Students {
  studentId: number,
  name: any,
  course: string,
  batch: string,
  phone: string,
  status: string
}

@Component({
  selector: 'candidate-home',
  templateUrl: './candidate-home.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './candidate-home.component.css']
})
export class CandidateHomeComponent implements OnInit {

  loading: boolean

  /* Variables Related to Table Starts Here*/
  tableData: Students[] = []
  displayedColumns: string[] = ['name','course_batch', 'phone', 'action', 'status']
  dataSource = new MatTableDataSource(this.tableData)

  selection = new SelectionModel<Students>(true, [])
  @ViewChild(MatSort, { static: true }) sort: MatSort
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  /* Variables Related to Table Ends Here*/

  studentToEdit
  studentIdsToPromote = []
  modals = {
    showEditModal: false,
    promoteModal: false
  }

  batches: { batch: string, batchId: number, course: string }[] = []

  permissions: Permissions = permissionsObject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private dateTimeService: DateTimeFormatService,
    private usersServcie: UsersService
  ) { }

  async ngOnInit() {
    this.getAllBatches()
    this.permissions = await this.usersServcie.getUserPermissions()

    if (this.permissions.delete_student) {
      this.displayedColumns.unshift("id")
    }

    if (!this.permissions.see_student_mobile) {
      this.displayedColumns.splice(this.displayedColumns.indexOf("phone"), 1)
    }

    if (!this.permissions.approve_disapprove_students) {
      this.displayedColumns.splice(this.displayedColumns.indexOf("status"))
    }

  }

  getAllBatches() {
    this.coreService.getRequest(AppConstants.API_URL + "courses/batches").subscribe((data: any) => {
      this.batches = data
    })
  }

  // Open Student account in popup BY changing tokens with admin token
  openStudentAccount(student) {
    this.coreService.getRequest(AppConstants.API_URL + "get-token-for-user-by-admin/" + student.studentId).
      subscribe((data: any) => {
        localStorage.setItem("admin-token", localStorage.getItem("token"))
        localStorage.setItem("id", student.studentId)
        localStorage.setItem("token", data.token)

        this.dialog.showDialog({
          title: student.name + "'s Account",
          content: `<iframe src="https://www.pinnacloeducare.com/test/candidate?token=${data.token}" 
        style="width:100%;height:calc(80vh - 30px);border:none"></iframe>`,
          width: '100%',
          closeCallBack: () => {
            this.setUserIdAgain()
          }
        })

      })
  }

  // after closing Student popup set token to admin taken 
  setUserIdAgain() {
    localStorage.setItem("token", localStorage.getItem("admin-token"))
  }

  filterStudents(batchId, filterItem) {
    this.tableData = []
    filterItem = filterItem ? filterItem.toLowerCase().trim() : "empty"
    this.loading = true

    this.coreService.getRequest(AppConstants.API_URL + `candidate/filtered/${+batchId}/${filterItem}`).
      subscribe((result: any) => {
        this.tableData = result
        this.setDataSource()
        this.loading = false
      })
  }

  // Show Full Student in Popup
  showFullStudent(student) {
    let image = student.image ? AppConstants.WEBSITE_URL + student.image : "assets/images/" + student.gender + ".png"
    let table = `<table class='common-table without-border' style='box-shadow:0 0 4px rgba(0,0,0,.25)'>
    <tr><td colspan=2 style='text-align:center'><img style='max-width:120px' src="${image}"></td></tr>
    <tr><th>Name</th><td>${student.name}</td></tr>
    <tr><th>Email</th><td>${student.email}</td></tr>
    <tr><th>D.O.B</th><td>${this.dateTimeService.getFormattedDate(student.dob)}</td></tr>`;

    if (this.permissions.see_student_mobile) {
      table += `<tr><th>Phone</th><td>${student.phone}</td></tr>`;
    }

    table += `<tr><th>Gender</th><td>${student.gender}</td></tr>
    <tr><th>Course</th><td>${student.course}</td></tr>
    <tr><th>Batch</th><td>${student.batch}</td></tr>
    <tr><th>Session</th><td>${student.session}</td></tr>
    <tr><th>City</th><td>${student.city}</td></tr>
    <tr><th>State</th><td>${student.state}</td></tr>
    <tr><th>Address</th><td>${student.address}</td></tr>
    </table>`

    this.dialog.showDialog({
      content: table,
      title: `Full detail of ${student.name} `
    })
  }

  // Show Student Edit Popup
  editStudent(student) {
    this.modals.showEditModal = true
    this.studentToEdit = student
  }

  showDelete(student) {
    this.dialog.showDialog({
      content: `Are you sure to delete "${student.name}"`,
      title: 'Confirm Deletion',
      callBack: () => {
        this.deleteStudent(student.studentId)
      }
    })
  }

  deleteStudent(studentId) {
    this.coreService.deleteRequest(AppConstants.API_URL + "candidate/" + studentId).subscribe((data: any) => {
      let student = this.tableData.find(t => t.studentId == studentId)
      this.tableData.splice(this.tableData.indexOf(student), 1)
      this.setDataSource()
    })
  }

  deleteMultipleStudents() {
    this.dialog.showDialog({
      content: 'Are you sure to delete these students?',
      title: 'Confirm Deletion',
      callBack: () => {
        let studentIds = []
        this.selection.selected.forEach(s => studentIds.push(s.studentId))
        this.coreService.deleteRequest(AppConstants.API_URL + "candidate/multiple/" + studentIds).subscribe((result: any) => {

          if (result.success) {
            this.tableData = this.tableData.filter(td => !studentIds.includes(td.studentId))
            this.setDataSource();
            this.selection.clear();
          }
        })
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

  //Change Student Status Like Active,Deactive etc
  changeStatus(student, statusId) {
    this.loading = true
    const data = { studentId: student.studentId, statusId }
    this.coreService.putRequest(AppConstants.API_URL + "candidate/status", data).subscribe((result: any) => {
      this.loading = false

      if (result.success) {
        student.active = statusId
      }

    })
  }

  // Promote student to next batch
  promoteMultipleStudents() {
    this.selection.selected.forEach(s => this.studentIdsToPromote.push(s.studentId))
    this.modals.promoteModal = true
  }

}
