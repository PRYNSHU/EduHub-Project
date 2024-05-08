import { Component, OnInit } from '@angular/core';
import { AppConstants } from 'src/app/AppConstants';
import { CoreService } from 'src/app/service/core.service';
import { StatisticsData } from '../../statistics-dashboard/statistics-data.modal';

@Component({
  selector: 'app-courses-dashboard',
  templateUrl: './courses-dashboard.component.html',
  styleUrls: ['./courses-dashboard.component.css']
})
export class CoursesDashboardComponent implements OnInit {

  statisticsData:StatisticsData[] = []

  constructor(private coreService:CoreService) { }

  ngOnInit(): void {
    this.getDashboardData()
  }

  getDashboardData(){
    const url = AppConstants.API_URL + "reports/courses-dashboard"
    this.coreService.getRequest(url).subscribe((data:any) => {
      this.statisticsData = [
        {
          title:"Total Courses",
          value:data.totalCourses,
          footerTitle:"Courses",
          link:"/users/courses/add-course"
        },
        {
          title:"Total Batches",
          value:data.totalBatches,
          footerTitle:"Batches",
          link:"/users/courses/add-course"
        },
        {
          title:"Total Subjects",
          value:data.totalSubjects,
          footerTitle:"Subjects",
          link:"/users/courses/subjects"
        }
      ]
    })
  }

}
