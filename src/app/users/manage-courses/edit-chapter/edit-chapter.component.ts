import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ManageCoursesService } from '../manage-courses.service';

@Component({
  selector: 'app-edit-chapter',
  templateUrl: './edit-chapter.component.html',
  styleUrls: ['./edit-chapter.component.css']
})
export class EditChapterComponent implements OnInit {
  loading:boolean
  chapter

  constructor(
    private mc: ManageCoursesService,
    private coreService: CoreService,
    private dialog: DialogService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.chapter = this.mc.getChapter()
    if (!this.chapter) {
      this.router.navigate(["/users/manage-courses/add-subjects"])
      return
    }
  }

  // Update Chapter
  update(data) {
    this.loading = true
    this.coreService.postRequest(AppConstants.API_URL + "full-courses/chapter",data).subscribe((result:any)=>{
      this.loading = false
      this.dialog.showDialog({content:result.message})
    })
  }

}
