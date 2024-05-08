import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';
import { DialogService } from 'src/app/service/dialog.service';

@Component({
  selector: 'app-main-dashboard',
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.css']
})
export class MainDashboardComponent implements OnInit {

  showFollowModal: boolean

  schedules = []
  masterSchedules = []

  followUps = []
  assignedWork = []
  masterAssignedWork = []
  loading: boolean
  activeInquiry

  filters = {
    scheduleDate: new Date(),
    toDoDate: new Date()
  }

  constructor(
    private coreService: CoreService,
    private dialog: DialogService,
    private dateTimeService: DateTimeFormatService,
  ) { }

  ngOnInit(): void {
    this.getSchedules()
    this.getFollowUps()
    this.getAssignedWork()
  }

  // These are zoom meetings classess
  getSchedules() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "users/schedule").subscribe((schedules: any) => {
      this.schedules = schedules
      this.masterSchedules = [...schedules]
      this.filterSchedules()
      this.loading = false
    })
  }

  getAssignedWork() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "users/my-assigned-work").subscribe((data: any) => {
      this.assignedWork = data
      this.masterAssignedWork = [...data]
      this.filterAssignedWork()
      this.loading = false
    })
  }

  getFollowUps() {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "users/follow-ups").subscribe((followUps: any) => {
      this.followUps = followUps
      this.loading = false
    })
  }

  getInquiryById(inquiryId) {
    this.loading = true
    this.coreService.getRequest(AppConstants.API_URL + "reception/inquiry/" + inquiryId).subscribe((data: any) => {
      this.activeInquiry = data
      this.showFollowModal = true
      this.loading = false
    })
  }

// button name for zoom class
  getButtonName(schedule) {
    schedule.date = schedule.date.replace("-"," ")
    let toTime = new Date(schedule.date + " " + schedule.toTime)
    let currentTime = new Date()
    let start_url = schedule.start_url

    if (start_url == null && toTime > currentTime) {
      return "Start Class"
    }

    if (start_url == null && toTime < currentTime) {
      return "Live Class Not Started"
    }

    if (toTime < currentTime && start_url != null) {
      return "Live Class Ended"
    }

    if (start_url && toTime > currentTime) {
      return "Join Now"
    }

  }

  // STart Zoom meeting
  startMeeting(id) {
    this.loading = true
    const url = AppConstants.API_URL + "schedule/start-meeting"
    this.coreService.postRequest(url, { id }).subscribe((data: any) => {
      this.loading = false

      if (data.success) {
        this.getSchedules()
        window.open(data.start_url, "Meeting", "scrollbars=yes,status=yes," + "width=" +
          screen.availWidth + ",height=" + screen.availHeight)
      } else {
        this.dialog.showDialog({ content: data.message })
      }

    })
  }

  changeScheduleDate(direction) {
    let seconds = 0

    if (direction == 'next') {
      seconds = this.filters.scheduleDate.getTime() + 86400 * 1000
    } else {
      seconds = this.filters.scheduleDate.getTime() - 86400 * 1000
    }

    this.filters.scheduleDate = new Date(seconds)
    this.filterSchedules()
  }

  changeToDoDate(direction) {
    let seconds = 0

    if (direction == 'next') {
      seconds = this.filters.toDoDate.getTime() + 86400 * 1000
    } else {
      seconds = this.filters.toDoDate.getTime() - 86400 * 1000
    }

    this.filters.toDoDate = new Date(seconds)
    this.filterAssignedWork()
  }

  filterSchedules() {
    this.schedules = this.masterSchedules.filter(m => {
      return this.dateTimeService.getFormattedDate(m.date) ==
        this.dateTimeService.getFormattedDate(this.filters.scheduleDate)
    })
  }

  filterAssignedWork() {
    this.assignedWork = this.masterAssignedWork.filter(m => {
      return this.dateTimeService.getFormattedDate(m.workDate) ==
        this.dateTimeService.getFormattedDate(this.filters.toDoDate)
    })
  }

}
