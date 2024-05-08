import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { NgForm } from '@angular/forms';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './add-user.component.css']
})
export class AddUserComponent implements OnInit {

  @ViewChild("imageSRC") imageSRC: ElementRef;
  @ViewChild("imageTarget") imageTarget: ElementRef;
  @ViewChild("signatureSRC") signatureSRC: ElementRef;
  @ViewChild("signatureTarget") signatureTarget: ElementRef;
  @ViewChild("candidateForm") candidateForm: NgForm

  selectedImage: File;
  selectedSignature: File;

  form = {
    username: null,
    password: null,
    name: null,
    email: null,
    gender: null,
    dob: null,
    employeeId: null,
    phone: null,
    qualification: null,
    biometricId: null,
    regDate: null,
    address: null,
    city: null,
    state: null,
    roleId: null
  }

  roles = []

  loading: boolean = false

  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.showSelectedImage(this.imageSRC.nativeElement, this.imageTarget.nativeElement)
      this.showSelectedImage(this.signatureSRC.nativeElement, this.signatureTarget.nativeElement)
    }, 10);

    this.coreService.getRequest(AppConstants.API_URL + "users/roles").subscribe((roles: any) => this.roles = roles)

  }

  showSelectedImage(src, target) {
    var fr = new FileReader();
    
    fr.onload = function (e) {
      target.src = this.result
    }

    src.addEventListener("change", function () {
      fr.readAsDataURL(src.files[0]);
    });
  }

  setSelectedImage(event) {
    this.selectedImage = event.target.files[0];
  }

  setSelectedSignature(event) {
    this.selectedSignature = event.target.files[0];
  }

  saveData(form: NgForm) {
    let fd = new FormData();
    fd.append("image", this.selectedImage);
    fd.append("signature", this.selectedSignature);

    Object.keys(form.value).forEach(key => {

      // Convert date object to mysql Format date like 2022-03-10 12:33:20
      if (key == "dob" || key == "regDate") {
        form.value[key] = new Date(form.value[key] + " UTC").toISOString().slice(0, 19).replace("T", ' ')
      }

      fd.append(key, form.value[key]);
    })
    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "users/", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading = false
    });
  }
}

