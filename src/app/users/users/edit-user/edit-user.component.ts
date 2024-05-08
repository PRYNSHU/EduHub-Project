import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: [
    '../../users-common-css/admin-common.css',
    '../add-user/add-user.component.css',
    './edit-user.component.css'
  ]
})
export class EditUserComponent implements OnInit {

  loading: boolean = false

  @Input() user
  @Input() modals:{
    showEditModal:boolean
  }

  @ViewChild("imageSRC") imageSRC: ElementRef;
  @ViewChild("imageTarget") imageTarget: ElementRef;
  @ViewChild("signatureSRC") signatureSRC: ElementRef;
  @ViewChild("signatureTarget") signatureTarget: ElementRef;

  courses = []
  batches = []

  selectedImage: File
  selectedSignature: File
  roles = []

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.user.dob = new Date(this.user.dob)
    this.user.regDate = new Date(this.user.regDate)

    setTimeout(() => {
      this.showSelectedImage(this.imageSRC.nativeElement, this.imageTarget.nativeElement)
      this.showSelectedImage(this.signatureSRC.nativeElement, this.signatureTarget.nativeElement)
    }, 10)

    this.coreService.getRequest(AppConstants.API_URL + "users/roles").subscribe((roles: any) => this.roles = roles)
  }

  updateData(form: NgForm) {
    let fd = new FormData()
    fd.append("image", this.selectedImage)
    fd.append("signature", this.selectedSignature)

    Object.keys(form.value).forEach(key => {

      if (key == "dob") {
        form.value[key] = new Date(form.value[key] + " UTC").toISOString().slice(0, 19).replace("T", ' ')
        this.user.dob = form.value[key].split(" ")[0]
      }

      fd.append(key, form.value[key])
    })

    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "users/update", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.user.roleName = this.roles.find(r => r.roleId == form.value.roleId).roleName
      this.loading = false
      this.modals.showEditModal = false
    })
  }

  showSelectedImage(src, target) {
    let fr = new FileReader()
    
    fr.onload = function (e) { 
      target.src = this.result;
    }

    src.addEventListener("change", function () {
      fr.readAsDataURL(src.files[0]);
    })
  }

  setSelectedImage(event) {
    this.selectedImage = event.target.files[0];
  }

  setSelectedSignature(event) {
    this.selectedSignature = event.target.files[0];
  }

}
