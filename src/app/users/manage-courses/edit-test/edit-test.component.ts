import { Component, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';
import { ManageCoursesService } from '../manage-courses.service';

@Component({
  selector: 'edit-test',
  templateUrl: './edit-test.component.html',
  styleUrls: ['./edit-test.component.css']
})
export class EditTestComponent implements OnInit {

  @Input() test
  @Input() modal:{
    showEditTestModal:boolean
  }
  loading: boolean
  testTypes = []

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private mc: ManageCoursesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getTestTypes()
  }

  getTestTypes() {
    this.coreService.getRequest(AppConstants.API_URL + "full-courses/test-types").subscribe((types: any) => {
      this.testTypes = types
    })
  }

  updateTest() {
    this.loading = true
    this.coreService.putRequest(AppConstants.API_URL + "full-courses/test", this.test).subscribe((data: any) => {
      this.dialog.showDialog({
        content: data.message
      })
      
      if(data.success){
        this.modal.showEditTestModal = false
      }
    })
  }

}
