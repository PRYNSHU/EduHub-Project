import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-edit-subject',
  templateUrl: './edit-subject.component.html',
  styleUrls: ['./edit-subject.component.css']
})
export class EditSubjectComponent implements OnInit {

  loading: boolean = false
  subjectImage
  courses = []
  subject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private routes: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.routes.params.subscribe((data: any) => {
      this.getSubjectDetails(data.subjectId)
    })
  }

  getSubjectDetails(subjectId) {
    this.coreService.getRequest(AppConstants.API_URL + 'full-courses/subjects/' + subjectId).subscribe((data: any) => {
      this.subject = data
    })
  }

  setSubjectImage(event) {
    this.subjectImage = event.target.files[0]
  }

  // Update Subject
  update() {
    let fd = new FormData();
    fd.append("courseId", this.subject.courseId)
    fd.append("subjectId", this.subject.subjectId)
    fd.append("subject", this.subject.subject)
    fd.append("subjectImage", this.subjectImage)

    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "full-courses/subject/update", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading = false
    })
  }
}
