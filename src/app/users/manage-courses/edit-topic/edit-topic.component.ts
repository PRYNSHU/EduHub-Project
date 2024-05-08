import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ManageCoursesService } from '../manage-courses.service';

@Component({
  selector: 'app-edit-topic',
  templateUrl: './edit-topic.component.html',
  styleUrls: ['./edit-topic.component.css']
})
export class EditTopicComponent implements OnInit {

  loading: boolean = false
  topic
  topicImage
  courses = []
  subject

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private routes: ActivatedRoute,
    private mc:ManageCoursesService
  ) { }

  ngOnInit(): void {
    this.topic = this.mc.getTopic()
  }


  setTopicImage(event) {
    this.topicImage = event.target.files[0]
  }

  // Update Topic
  update(data) {
    let fd = new FormData();
    fd.append("topicId", this.topic.topicId)
    fd.append("topic", this.topic.topic)
    fd.append("testCode",this.topic.testCode)
    fd.append("videoId",this.topic.videoId)
    fd.append("platform",this.topic.platform)
    fd.append("topicImage", this.topicImage)

    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "full-courses/topic/update", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading = false
    })
  }
}
