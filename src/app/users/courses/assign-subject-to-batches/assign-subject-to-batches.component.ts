import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { permissionsObject, Permissions } from '../../user.modal';
import { UsersService } from '../../users.service';

@Component({
  selector: 'app-assign-subject-to-batches',
  templateUrl: './assign-subject-to-batches.component.html',
  styleUrls: ['./assign-subject-to-batches.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AssignSubjectToBatchesComponent implements OnInit {

  loading: boolean = false

  courses = []
  batches = []

  courseId
  batchId

  masterSubjects = []
  subjects = []

  choosedSubjects = [{ subjectId: null, subjects: [] }]

  batches_subjects = []

  assignedSubjectsInClientSide = []
  assignedSubjectsInDatabase = []

  batch_subjects = []
  permissions: Permissions = permissionsObject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private usersService: UsersService
  ) { }

  async ngOnInit() {
    this.getCourses()
    this.getSubjects()
    this.getAssignedSubjects()
    this.getAssignedSubjectsForPrint()
    this.permissions = await this.usersService.getUserPermissions()
  }

  getAssignedSubjects() {
    this.coreService.getRequest(AppConstants.API_URL + "subjects/assigned-to-batches").subscribe((data: any) => {
      this.batches_subjects = data
    })
  }

  getAssignedSubjectsForPrint() {
    this.coreService.getRequest(AppConstants.API_URL + "courses/batches/assigned-subjects").subscribe((data: any) => {
      this.batch_subjects = data
    })
  }

  filterSubjects() {
    let batch = this.batches_subjects.find(bs => bs.batchId == this.batchId)
    // let assignedSubjects = batch?batch.subjectIds:[]
    //this.subjects = this.masterSubjects.filter(ms=>!assignedSubjects.includes(ms.id))
    this.assignedSubjectsInDatabase = batch ? batch.subjectIds : []
  }

  getSubjects() {
    this.coreService.getRequest(AppConstants.API_URL + "subjects").subscribe((subjects: any) => {
      this.masterSubjects = [...subjects]
      //this.subjects = subjects
      this.choosedSubjects[0].subjects = subjects
    })
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((courses: any) => {
      this.courses = courses
    })
  }

  setBatches(courseId) {
    let batches = this.courses.find(c => c.courseId == courseId).batches
    this.batches = batches
  }

  assign() {
    let choosedIds = []
    this.choosedSubjects.forEach(a => choosedIds.push(a.subjectId))
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "subjects/assign-to-batches", { batchId: this.batchId, subjectIds: choosedIds }).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.getAssignedSubjectsForPrint()
      this.loading = false
    })
  }

  onSelectionChange() {
    let choosedIds = []
    this.choosedSubjects.forEach(a => choosedIds.push(a.subjectId))
    this.assignedSubjectsInClientSide = choosedIds
  }

  addMore() {
    // let choosedIds = []
    // this.choosedSubjects.forEach(a=>choosedIds.push(a.id))
    // this.assignedSubjectsInClientSide = choosedIds
    let subjects = [...this.masterSubjects] //this.masterSubjects.filter(ms=>!choosedIds.includes(ms.id))
    this.choosedSubjects.push({ subjectId: null, subjects: subjects })
  }

  showDeleteAssignedSubject(batchId, subjectId, batchIndex, subjectIndex) {
    this.dialog.showDialog({
      title: 'Confirm Deletion',
      content: 'Are you sure to remove this subject from batch?',
      callBack: () => {
        this.removeAssignedSubject(batchId, subjectId, batchIndex, subjectIndex)
      }
    })
  }

  removeAssignedSubject(batchId, subjectId, batchIndex, subjectIndex) {
    this.loading = true
    this.coreService.deleteRequest(AppConstants.API_URL + "subjects/remove-assigned-subject/" +
      batchId + "/" + subjectId).subscribe((data: any) => {
        this.loading = false

        if (data.success) {
          this.batch_subjects[batchIndex].subjects.splice(subjectIndex, 1)
        }

      })
  }

}
