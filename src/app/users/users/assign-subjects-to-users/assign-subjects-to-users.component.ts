import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { permissionsObject, Permissions } from '../../user.modal';
import { UsersService } from '../../users.service';

@Component({
  selector: 'app-assign-subjects-to-users',
  templateUrl: './assign-subjects-to-users.component.html',
  styleUrls: ['./assign-subjects-to-users.component.css']
})
export class AssignSubjectsToUsersComponent implements OnInit {

  @ViewChild("assignForm") assignForm: NgForm

  loading: boolean
  users = []
  userId
  CourseBatchesSubjects = [
    {
      courseId: null,
      batchId: null,
      subjectId: null,
      subjects: [],
      courses: [],
      batches: []
    }
  ]
  choosedIds = []
  userChoosedIds = []
  assignedSubjectUsers = []
  batches_subjects = []
  permissions: Permissions = permissionsObject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private usersService: UsersService
  ) { }

  async ngOnInit(): Promise<void> {
    this.getAssignedSubjects()
    this.getUsers()
    this.getCourses()
    this.getBatchesSubjects()
    this.permissions = await this.usersService.getUserPermissions()
  }

  getBatchesSubjects() {
    const url = AppConstants.API_URL + "courses/batches/subjects"
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.batches_subjects = data
    })
  }

  setSubjects(batchId, index) {
    let batch = this.batches_subjects.find(bs => bs.batchId == batchId)

    if (batch) {
      this.CourseBatchesSubjects[index].subjects = batch.subjects
      this.CourseBatchesSubjects[index].subjectId = null
    }

  }

  getAssignedSubjects() {
    this.loading = true
    const url = AppConstants.API_URL + "subjects/assigned-to-users"
    this.coreService.getRequest(url).subscribe((data: any) => {
      this.loading = false
      this.assignedSubjectUsers = data
    })
  }

  showRemoveSubjectFromUser(userId, batchId, subjectId, userIndex, subjectIndex) {
    this.dialog.showDialog({
      title: 'Confirm Remove',
      content: 'Are you sure to remove this subject?',
      callBack: () => {
        this.removeSubjectFromUser(userId, batchId, subjectId, userIndex, subjectIndex)
      }
    })
  }

  removeSubjectFromUser(userId, batchId, subjectId, userIndex, subjectIndex) {
    this.loading = true
    const url = AppConstants.API_URL + "subjects/remove-from-users/" + userId + "/" + batchId + "/" + subjectId
    this.coreService.deleteRequest(url).subscribe((data: any) => {
      this.loading = false

      if (data.success) {
        this.assignedSubjectUsers[userIndex].assignedSubjects.splice(subjectIndex, 1)
      }

    })
  }

  getCourses() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((courses: any) => {
      this.CourseBatchesSubjects[0].courses = courses
      this.loading = false
    })
  }

  setBatches(courseId, index) {
    let course = this.CourseBatchesSubjects[index].courses.find(c => c.courseId == courseId)

    if (course) {
      this.CourseBatchesSubjects[index].batches = course.batches
      this.CourseBatchesSubjects[index].batchId = null
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
    let choosedSubjectIds = []

    this.CourseBatchesSubjects.forEach(cbs => {
      choosedSubjectIds.push(cbs.subjectId + "-" + cbs.batchId)
    })

    this.choosedIds = choosedSubjectIds
    console.log("choosedIds", this.choosedIds)
  }

  setUserChoosedIds() {
    this.userChoosedIds = []
    let user = this.assignedSubjectUsers.find(abu => abu.userId == this.userId)

    user.assignedSubjects.forEach(element => {
      this.userChoosedIds.push(element.subjectId + "-" + element.batchId)
    })
  }

  addMore() {
    this.CourseBatchesSubjects.push({
      courseId: null,
      batchId: null,
      subjectId: null,
      subjects: [
        ...this.CourseBatchesSubjects[0].subjects
      ],
      courses: [...this.CourseBatchesSubjects[0].courses],
      batches: [...this.CourseBatchesSubjects[0].batches]
    })
  }

  removeItem(index) {
    this.CourseBatchesSubjects.splice(index, 1)
    this.choosedIds.splice(index, 1)
  }

  assignSubjects() {
    this.loading = true
    let reqData = { userId: this.userId, subjectIds: [], batchIds: [], courseIds:[] }

    this.CourseBatchesSubjects.forEach(cbs => {
      reqData.batchIds.push(cbs.batchId)
      reqData.subjectIds.push(cbs.subjectId)
      reqData.courseIds.push(cbs.courseId)
    })

    const url = AppConstants.API_URL + "subjects/assign-to-users"
    this.coreService.postRequest(url, reqData).subscribe((data: any) => {
      this.loading = false
      this.assignForm.resetForm()
      this.getAssignedSubjects()
      this.dialog.showDialog({ content: data.message })
    })
  }

}
