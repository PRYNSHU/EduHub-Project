import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { CommunicationService } from 'src/app/service/communication.service';
@Component({
  selector: 'add-subject',
  templateUrl: './add-subject.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './add-subject.component.css']
})
export class AddSubjectComponent implements OnInit {
  subject: string
  status: string

  constructor(private coreService: CoreService, private comm: CommunicationService) { }

  ngOnInit(): void { }

  onSubmit() {
    const url = AppConstants.API_URL + "subjects"
    const data = { 
      subject: this.subject 
    }
    
    this.coreService.postRequest(url, data).subscribe((res: any) => {
      
      if (res.status) {
        this.comm.saveSubject.next(res.data);
      } else {
        this.status = res.message;
      }

    })
  }
}
