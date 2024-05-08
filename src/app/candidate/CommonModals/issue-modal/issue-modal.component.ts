import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'issue-modal',
  templateUrl: './issue-modal.component.html',
  styleUrls: ['./issue-modal.component.css']
})
export class IssueModalComponent implements OnInit {

  loading: boolean = false

  @Input() modals = {
    issue: false,
    reportIssue: false,
  }

  @Input() question

  content
  issueTypeId
  constructor(
    private coreService: CoreService,
    private dialog: DialogService
  ) { }

  ngOnInit(): void {
  }

  reportIssue() {
    this.loading = true

    const data = {
      questionId: this.question.questionId,
      content: this.content,
      issueTypeId:this.issueTypeId
    }

    const url = AppConstants.API_URL + "full-courses/report-issue"
    this.coreService.postRequest(url, data).subscribe((data: any) => {
      this.loading = false
      this.modals.reportIssue = false
    })
  }

}
