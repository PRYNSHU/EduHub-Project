import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/service/dialog.service';

/*Variables Related to Table Starts Here*/
export interface PeriodicElement {
  courseId: number,
  course: string,
  batches: any,
  index: number
}
/*Variables Related to Table Ends Here*/

@Component({
  selector: 'app-courses-home',
  templateUrl: './courses-home.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', '../courses.common.css', './courses-home.component.css']
})
export class CoursesHomeComponent implements OnInit {

  /* Variables Related to Table Starts Here*/
  tableData: PeriodicElement[] = [];
  displayedColumns: string[] = ['id', 'srno', 'course', 'batches', 'action'];
  dataSource = new MatTableDataSource(this.tableData)

  selection = new SelectionModel<PeriodicElement>(true, []);
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  /* Variables Related to Table Ends Here*/

  loading: boolean = true

  courses = [];
  constructor(private coreService: CoreService, private router: Router, private dialog: DialogService) { }
  ngOnInit(): void {
    this.coreService.getRequest(AppConstants.API_URL + "courses").subscribe((data: any) => {
      this.loading = false
      this.courses = data

      this.courses.forEach((c, index) => {
        let batches = [];

        c.batches.forEach(element => {
          batches.push(element.batch);
        })

        this.tableData.push({
          courseId: c.courseId,
          course: c.course,
          batches: batches,
          index: index + 1
        })

        this.setDataSource();
      })

    });
  }

  /* Set Data Source After Changes in Table Data */
  setDataSource() {
    this.dataSource = new MatTableDataSource(this.tableData);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    var numSelected = this.selection.selected.length;
    var numRows = this.dataSource.data.length;
    let disabledCount = this.dataSource.data.filter(d => d.batches.length > 0).length
    return numSelected == numRows - disabledCount;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => { if (row.batches.length == 0) this.selection.select(row) });
  }

  courseForEdit = { courseId: 0, course: null, batches: [] }
  editCourse(courseId) {
    let course = this.courses.find((c) => c.courseId == courseId);
    this.courseForEdit = { courseId: course.courseId, course: course.course, batches: course.batches }
    sessionStorage.setItem("course", JSON.stringify(course));
    this.router.navigate(["/users/courses/edit-course"]);
  }

  showDeleteMultiple() {
    this.dialog.showDialog({
      content: `Are you sure to delete these courses?`,
      title: "Confirm",
      callBackButtonColor: "warn",
      callBackButtonText: "Delete",
      callBack: () => {
        this.deleteMultipleCourses()
      }
    })
  }

  showDelete(course) {
    this.dialog.showDialog({
      content: `Are you sure to delete course "${course.course}"?`,
      title: "Confirm",
      callBackButtonColor: "warn",
      callBackButtonText: "Delete",
      callBack: () => {
        this.deleteCourse(course)
      }
    })
  }

  deleteCourse(course) {
    this.coreService.deleteRequest(AppConstants.API_URL + "courses/" + course.courseId).subscribe((data: any) => {
      let td = this.tableData.find(t => t == course)
      this.selection.clear()
      this.tableData.splice(this.tableData.indexOf(td), 1)
      this.setDataSource()
    })
  }

  deleteMultipleCourses() {
    let courseIds = []
    this.selection.selected.forEach(s => courseIds.push(s.courseId))
    this.coreService.deleteRequest(AppConstants.API_URL + "courses/multiple/" + courseIds).subscribe((data: any) => {
      this.tableData = this.tableData.filter(td => !courseIds.includes(td.courseId))
      this.setDataSource()
      this.selection.clear();
    })
  }

}
