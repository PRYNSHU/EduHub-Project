import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { Batch, Course } from '../../user.modal';

@Component({
  selector: 'promote-candidate',
  templateUrl: './promote-candidate.component.html',
  styleUrls: ['./promote-candidate.component.css']
})
export class PromoteCandidateComponent implements OnInit {

  loading: boolean = true

  @Input() student
  @Input() studentIds
  @Input() modal: { promoteModal: boolean }

  courses: Course[]
  batches: Batch[]
  sessionYears = []

  courseId
  batchId
  sessionId

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.getSessionYears()
    console.log("student",this.student);
    console.log("studentIds",this.studentIds);
  }

  getCourses(sessionId) {

    this.courseId = null
    this.batchId = null

    this.coreService.getRequest(AppConstants.API_URL + "courses/by-session-id/"+sessionId).subscribe((data: any) => {
      this.courses = data
      this.loading = false
    })
  }

  // On choosing course set its batches in batches dropdown
  setBatches() {
    let course = this.courses.find(c => c.courseId == this.courseId)

    if (course) {
      this.batches = course.batches
    } else {
      this.batches = []
    }
  }

  getSessionYears() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "utilities/session-years").subscribe((data: any) => {
      this.sessionYears = data
      this.loading = false
    })
  }

  promoteStudent() {
    const promoteData = {
      courseId: this.courseId,
      batchId: this.batchId,
      sessionId: this.sessionId,
      studentId: this.student.studentId
    }
    
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "candidate/promote", promoteData).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading = false

      if (data.success) {
        this.modal.promoteModal = false
      }

    })
  }

  promoteStudents() {
    const promoteData = {
      courseId: this.courseId,
      batchId: this.batchId,
      sessionId: this.sessionId,
      studentIds: this.studentIds
    }
    
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "candidate/promote-multiple", promoteData).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading = false

      if (data.success) {
        this.modal.promoteModal = false
      }
    })
  }

}
