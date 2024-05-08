import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { NgForm } from '@angular/forms';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'add-candidate',
  templateUrl: './add-candidate.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './add-candidate.component.css']
})
export class AddCandidateComponent implements OnInit {

  @ViewChild("imageSRC") imageSRC: ElementRef;
  @ViewChild("imageTarget") imageTarget: ElementRef;
  @ViewChild("signatureSRC") signatureSRC: ElementRef;
  @ViewChild("signatureTarget") signatureTarget: ElementRef;

  @ViewChild("candidateForm") candidateForm: NgForm

  selectedImage: File;
  selectedSignature: File;

  loading: boolean = false

  form = {
    username: null,
    password: null,
    name: null,
    email: null,
    gender: null,
    dob: null,
    rollno: null,
    mobile: null,
    courseId: null,
    batchId: null,
    fname: null,
    fmobile: null,
    regDate: null,
    address: null,
    city: null,
    state: null,
    session: null
  }

  courses = []
  batches = []
  sessionYears = []
  constructor(private coreService: CoreService, private dialog: DialogService) { }

  getSessionYears() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "utilities/session-years").subscribe((data: any) => {
      this.sessionYears = data
      this.loading = false
    })
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((data: any) => {
      this.courses = data
    })
  }

  // On choosing course set its batches in batches dropdown
  setBatches() {
    let course = this.courses.find(c => c.courseId == this.form.courseId)

    if (course) {
      this.batches = course.batches
    } else {
      this.batches = []
    }

    this.form.batchId = null
  }

  ngOnInit(): void {
    this.getCourses()
    this.getSessionYears()
    setTimeout(() => {
      this.showSelectedImage(this.imageSRC.nativeElement, this.imageTarget.nativeElement)
      this.showSelectedImage(this.signatureSRC.nativeElement, this.signatureTarget.nativeElement)
    }, 10);
  }

  // Show image on chooing image file
  showSelectedImage(src, target) {
    var fr = new FileReader()
    fr.onload = function (e) { target.src = this.result; }
    src.addEventListener("change", function () {
      fr.readAsDataURL(src.files[0])
    })
  }

  // on choosing file
  setSelectedImage(event) {
    this.selectedImage = event.target.files[0];
  }
  
  // on choosing file
  setSelectedSignature(event) {
    this.selectedSignature = event.target.files[0];
  }

  saveData(form: NgForm) {
    let fd = new FormData();
    fd.append("image", this.selectedImage);
    fd.append("signature", this.selectedSignature);

    Object.keys(form.value).forEach((key, index) => {

      if (key == "dob" || key == "regDate") {
        form.value[key] = new Date(form.value[key] + " UTC").toISOString().slice(0, 19).replace("T", ' ')
      }

      fd.append(key, form.value[key]);
    })

    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "candidate/", fd).subscribe((data: any) => {
      this.dialog.showDialog({ content: data.message })
      this.loading = false
    })

  }
}

