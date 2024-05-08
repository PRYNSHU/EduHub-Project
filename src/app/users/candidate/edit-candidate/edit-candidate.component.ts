import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'edit-candidate',
  templateUrl: './edit-candidate.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', '../add-candidate/add-candidate.component.css', './edit-candidate.component.css']
})
export class EditCandidateComponent implements OnInit {

  @Input() student
  @Input() modals:{showEditModal:boolean}

  modal = {
    promoteModal:false
  }

  @ViewChild("imageSRC") imageSRC: ElementRef;
  @ViewChild("imageTarget") imageTarget: ElementRef;
  @ViewChild("signatureSRC") signatureSRC: ElementRef;
  @ViewChild("signatureTarget") signatureTarget: ElementRef;

  courses = []
  batches = []
  sessionYears = []
  selectedImage: File
  selectedSignature: File

  loading: boolean = false
  isInitiallySettingBatches: boolean = true
  constructor(private coreService: CoreService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.getCourses()
    this.getSessionYears()
    this.student.dob = new Date(this.student.dob)
    this.student.regDate = new Date(this.student.regDate)
    setTimeout(() => {
      this.showSelectedImage(this.imageSRC.nativeElement, this.imageTarget.nativeElement)
      this.showSelectedImage(this.signatureSRC.nativeElement, this.signatureTarget.nativeElement)
    }, 10);
  }

  getSessionYears() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "utilities/session-years").subscribe((data: any) => {
      this.sessionYears = data
      this.loading = false
    })
  }

  updateData(form: NgForm) {
    let fd = new FormData();
    fd.append("image", this.selectedImage)
    fd.append("signature", this.selectedSignature)

    Object.keys(form.value).forEach((key, index) => {
      
      if (key == "dob" || key == "regDate") {
        form.value[key] = new Date(form.value[key] + " UTC").toISOString().slice(0, 19).replace("T", ' ')
        this.student[key] = form.value[key].split(" ")[0]
      }

      fd.append(key, form.value[key])
    })
    this.loading = true
    this.coreService.uploadRequest(AppConstants.API_URL + "candidate/update", fd).subscribe((data: any) => {
      this.loading = false
      this.modals.showEditModal = false
      this.dialog.showDialog({ content: data.message })
    });
  }

  getCourses() {
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((data: any) => {
      this.courses = data
      this.setBatches()
    })
  }


  // On choosing course set its batches in batches dropdown  
  setBatches() {
    let course = this.courses.find(c => c.courseId == this.student.courseId)
    if (course)
      this.batches = course.batches
    else
      this.batches = []
    if (!this.isInitiallySettingBatches)
      this.student.batchId = null
    this.isInitiallySettingBatches = false
  }

  //Show selected Image on choosing image file
  showSelectedImage(src, target) {
    var fr = new FileReader();
    fr.onload = function (e) { target.src = this.result; };
    src.addEventListener("change", function () {
      fr.readAsDataURL(src.files[0]);
    });
  }

  // On choosng file
  setSelectedImage(event) {
    this.selectedImage = event.target.files[0];
  }

  // On choosing file
  setSelectedSignature(event) {
    this.selectedSignature = event.target.files[0];
  }

}
