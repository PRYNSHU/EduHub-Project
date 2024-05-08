import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { Permissions, permissionsObject } from '../../user.modal';
import { UsersService } from '../../users.service';

@Component({
  selector: 'app-assign-batches-to-users',
  templateUrl: './assign-batches-to-users.component.html',
  styleUrls: ['./assign-batches-to-users.component.css']
})
export class AssignBatchesToUsersComponent implements OnInit {

  @ViewChild("assignForm") assignForm: NgForm

  loading: boolean
  users = []
  userId

  CourseBatches = [{ courseId: null, batchId: null, courses: [], batches: [] }]
  choosedBatchIds = []
  userChoosedBatchIds = []
  assignedBatchUsers = []

  permissions: Permissions = permissionsObject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private usersService: UsersService
  ) { }

  async ngOnInit(): Promise<void> {
    this.getAssignedBatches()
    this.getUsers()
    this.getCourses()
    this.permissions = await this.usersService.getUserPermissions()
  }

  getAssignedBatches() {
    this.loading = true
    const url = AppConstants.API_URL + "courses/batches/assigned-to-users"
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.loading = false
      this.assignedBatchUsers = data
    })
  }

  showRemoveBatchFromUser(userId, batchId, userIndex, batchIndex) {
    this.dialog.showDialog({
      title: 'Confirm Remove',
      content: 'Are you sure to remove this batch?',
      callBack: () => {
        this.removeBatchFromUser(userId, batchId, userIndex, batchIndex)
      }
    })
  }

  removeBatchFromUser(userId, batchId, userIndex, batchIndex) {
    this.loading = true
    const url = AppConstants.API_URL + "courses/batches/remove-from-users/" + userId + "/" + batchId
    this.coreService.deleteRequest(url).subscribe((data: any) => {
      this.loading = false

      if (data.success) {
        this.assignedBatchUsers[userIndex].assignedBatches.splice(batchIndex, 1)
      }

    })
  }

  getCourses() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((courses: any) => {
      this.CourseBatches[0].courses = courses
      this.loading = false
    })
  }

  setBatches(courseId, index) {
    let course = this.CourseBatches[index].courses.find(c => c.courseId == courseId)

    if (course) {
      this.CourseBatches[index].batches = course.batches
      this.CourseBatches[index].batchId = null
    }

  }

  getUsers() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "users").subscribe((users: any) => {
      this.loading = false
      this.users = users
    })
  }

  setChoosedIds() {
    let choosedIds = []
    this.CourseBatches.forEach(cb => choosedIds.push(cb.batchId))
    this.choosedBatchIds = choosedIds
  }

  setUserChoosedIds() {
    this.userChoosedBatchIds = []
    let user = this.assignedBatchUsers.find(abu => abu.userId == this.userId)

    user.assignedBatches.forEach(element => {
      this.userChoosedBatchIds.push(element.batchId)
    })

  }

  addMore() {
    this.CourseBatches.push({
      courseId: null,
      batchId: null,
      courses: [...this.CourseBatches[0].courses],
      batches: [...this.CourseBatches[0].batches]
    })
  }

  removeItem(index) {
    this.CourseBatches.splice(index, 1)
    this.choosedBatchIds.splice(index, 1)
  }

  assignBatches() {
    this.loading = true
    let reqData = { userId: this.userId, batchIds: this.choosedBatchIds }
    const url = AppConstants.API_URL + "courses/batches/assign-to-users"
    this.coreService.postRequest(url, reqData).subscribe((data: any) => {
      this.loading = false
      this.assignForm.resetForm()
      this.getAssignedBatches()
      this.dialog.showDialog({ content: data.message })
    })
  }
}
