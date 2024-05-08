import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ManageCoursesService } from '../manage-courses.service';

@Component({
  selector: 'app-add-subjects',
  templateUrl: './add-subjects.component.html',
  styleUrls: ['./add-subjects.component.css']
})
export class AddSubjectsComponent implements OnInit {

  loading1: boolean = true
  loading2: boolean = true
  subjectImage
  courses = []
  subjects = []
  WEBSITE_URL = AppConstants.WEBSITE_URL

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private mc:ManageCoursesService,
    private router:Router
  ) { }

  ngOnInit(): void {
    this.getCourses()
    this.getSubjects()
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((data: any) => {
      this.courses = data
      this.loading1 = false;
    })
  }

  getSubjects() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/subjects").subscribe((result: any) => {
      this.subjects = result
      this.loading2 = false
    })
  }

  goToAddChapter(subject){
    this.mc.setSubject(subject)
    this.router.navigate(["/users/manage-courses/add-chapter/"+subject.subjectId])
  }

  setSubjectImage(event) {
    this.subjectImage = event.target.files[0]
  }

  deleteSubject(subject, index) {
    this.dialog.showDialog({
      content: `Are you sure to delete Subject "${subject.subject}"?`,
      callBack: () => {
        this.loading1 = true
        this.coreService.deleteRequest(AppConstants.API_URL + "full-courses/subject/" + subject.subjectId).subscribe((result: any) => {
          this.loading1 = false
          if (result.success) {
            this.subjects.splice(this.subjects.indexOf(subject), 1)
          }
        })
      }
    })
  }

  submit(form: NgForm) {
    let fd = new FormData();

    Object.keys(form.value).forEach((key, index) => {
      fd.append(key, form.value[key])
    })

    fd.append("subjectImage", this.subjectImage)

    this.loading1 = true
    this.coreService.uploadRequest(AppConstants.API_URL + "full-courses/subject/", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading1 = false
      this.getSubjects()
    })

  }

}
