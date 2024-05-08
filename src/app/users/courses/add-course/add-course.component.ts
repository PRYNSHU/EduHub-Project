import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { NgForm } from '@angular/forms';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['../courses.common.css', './add-course.component.css']
})
export class AddCourseComponent implements OnInit {

  @ViewChild('form') form: NgForm;

  batches = [{ batch: null }]
  course = null;
  disableButton = false;
  loading: boolean = false
  sessionId
  sessionYears = []

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.getSessionYears()
  }

  getSessionYears() {
    this.coreService.getRequest(AppConstants.API_URL + "utilities/session-years").subscribe((data: any) => {
      this.sessionYears = data
    })
  }

  saveCourse() {
    let batches = []

    Object.keys(this.batches).forEach((key, index) => batches.push(this.batches[key].batch));

    let data = {
      course: this.course,
      batches: batches,
      sessionId: this.sessionId
    }

    this.disableButton = true;
    this.loading = true

    this.coreService.postRequest(AppConstants.API_URL + "courses", data).subscribe((data: any) => {
      this.loading = false
      this.form.resetForm()
      this.disableButton = false
      this.dialog.showDialog({ content: data.message })
    })
  }


}
