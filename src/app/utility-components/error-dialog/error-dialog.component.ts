import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommunicationService } from 'src/app/service/communication.service';

@Component({
  selector: 'error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ErrorDialogComponent implements OnInit {
  show: boolean = false;
  error: any = { status: null, statusText: null, error: null }
  constructor(private comm: CommunicationService) { }

  ngOnInit(): void {
    this.comm.errorModal.subscribe((message: any) => {
      this.error = message
      this.show = true;
      this.comm.loading.next(false);
    });
  }

}
