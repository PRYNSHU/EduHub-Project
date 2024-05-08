import { Injectable } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';

@Injectable({
  providedIn: 'root'
})
export class ContactInquiriesService {

  constructor(private coreService:CoreService) {

  }

  getContactInquiries(){
    return this.coreService.getRequest(AppConstants.API_URL + "contact-inquiries/")
  }

  getUnSeenContactInquiriesCount(){
    return this.coreService.getRequest(AppConstants.API_URL + "contact-inquiries/unseen-count")
  }

  setInquiryAsSeen(id){
    return this.coreService.putRequest(AppConstants.API_URL + "contact-inquiries/",{id})
  }

}
