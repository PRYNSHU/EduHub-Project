import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'edit-course',
  templateUrl: './edit-course.component.html',
  styleUrls: ['../courses.common.css', './edit-course.component.css']
})
export class EditCourseComponent implements OnInit {
  courseId
  course
  batches = [{ batch: null }]
  Activebatches = []
  bids = []
  disableButton = false

  loading: boolean

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {

    if (sessionStorage.getItem("course") != null) {
      let course = JSON.parse(sessionStorage.getItem("course"))
      this.Activebatches = course.batches
      this.course = course.course
      this.courseId = course.courseId
    }

  }

  addMore() {
    this.batches.push({ batch: null })
  }

  updateCourse() {
    this.loading = true
    let data = { course: this.course, courseId: this.courseId };
    this.coreService.putRequest(AppConstants.API_URL + "courses", data).subscribe((data: any) => {
      this.loading = false
      this.dialog.showDialog({ content: data.message })
    })
  }

  updateBatch(batch){
    this.loading = true
    let data = {batchId:batch.batchId,batch:batch.batch}
    this.coreService.putRequest(AppConstants.API_URL + "courses/batch",data).subscribe((data:any)=>{
      this.loading = false
      this.dialog.showDialog({content:data.message})
    })
  }

  addNewBatches() {
    this.loading = true
    let data = { courseId: this.courseId, batches: this.batches }
    this.coreService.postRequest(AppConstants.API_URL + "courses/batches", data).subscribe((data: any) => {
      this.loading = false
      this.dialog.showDialog({ content: data.message })
    })
  }

  showDelete(batch, index) {
    this.dialog.showDialog({
      content: `Are ypu sure to delete batch "${batch.batch}"?`,
      title: "Confirm",
      callBackButtonText: "Delete",
      callBackButtonColor: "warn",
      callBack: () => {
        this.deleteBatch(batch.batchId, index)
      }
    })
  }

  deleteBatch(batchId, index) {
    this.loading = true
    this.coreService.deleteRequest(AppConstants.API_URL + "courses/batch/" + batchId).subscribe((data: any) => {
      this.loading = false
      
      if (data.success) {
        this.Activebatches.splice(index, 1)
      }
      
    })
  }
}
