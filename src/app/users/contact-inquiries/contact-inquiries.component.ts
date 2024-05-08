import { Component, OnInit } from '@angular/core';
import { DialogService } from 'src/app/service/dialog.service';
import { ContactInquiriesService } from './contact-inquiries.service';

@Component({
  selector: 'app-contact-inquiries',
  templateUrl: './contact-inquiries.component.html',
  styleUrls: ['./contact-inquiries.component.css']
})
export class ContactInquiriesComponent implements OnInit {

  contactInquiries = []
  loading:boolean = true

  constructor(
    private contactInquiriesService:ContactInquiriesService,
    private dialog:DialogService
  ) { }

  ngOnInit(): void {
    this.getContactInquiries()
  }

  getContactInquiries(){
    this.contactInquiriesService.getContactInquiries().subscribe((contactInquiries:any)=>{
      this.contactInquiries = contactInquiries
      this.loading = false
    })
  }

  showContent(message,id){
    this.dialog.showDialog({
      content:message
    })
    
    this.contactInquiriesService.setInquiryAsSeen(id).subscribe((result:any)=>{

    });
  }

}
