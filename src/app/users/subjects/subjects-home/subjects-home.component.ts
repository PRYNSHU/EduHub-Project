import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommunicationService } from 'src/app/service/communication.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { DialogService } from 'src/app/service/dialog.service';
import { Router } from '@angular/router';
import { UsersService } from '../../users.service';
import { permissionsObject, Permissions } from '../../user.modal';

/*Variables Related to Table Starts Here*/
export interface PeriodicElement {
  subjectId: number,
  subject: any,
  course:string
}
/*Variables Related to Table Ends Here*/

@Component({
  selector: 'app-subjects-home',
  templateUrl: './subjects-home.component.html',
  styleUrls: ['../../users-common-css/admin-common.css', './subjects-home.component.css']
})
export class SubjectsHomeComponent implements OnInit, OnDestroy {
  loading = false
  showAddModal = false
  showEditModal = false
  treeClass = []
  openedClass = []

  //Subjects Data like [{id:1,subject:'Physics'},{id:2,subjects:'Bio'}]
  subjectsData
  //search subjects field variable
  subjectname = ""

  /* Variables Related to Table Starts Here*/
  tableData: PeriodicElement[] = []
  displayedColumns: string[] = ['srno', 'subject']
  dataSource = new MatTableDataSource(this.tableData)

  selection = new SelectionModel<PeriodicElement>(true, [])
  @ViewChild(MatSort, { static: true }) sort: MatSort
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  /* Variables Related to Table Ends Here*/

  headerToLoad
  permissions: Permissions = permissionsObject
  constructor(
    private comm: CommunicationService,
    private coreService: CoreService,
    private dialog: DialogService,
    private router: Router,
    private usersService: UsersService
  ) {
    this.headerToLoad = this.router.url
  }

  saveSubjectSubscribe: Subscription
  saveChapterSubscribe: Subscription
  subject_chapters = {}
  chapter_topics = {}

  async ngOnInit() {
    /* Component Interaction to add subject in table when added USING RXJS Subject */
    this.saveSubjectSubscribe = this.comm.saveSubject.subscribe((data: any) => {
      this.showAddModal = false
      this.subjectsData.push({ subjectId: data.subjectId, subject: data.subject, chapters: [] });
      this.tableData = [];

      this.subjectsData.forEach((r) => {
        this.subject_chapters[r.subjectId] = r.chapters;
        this.tableData.push({ subjectId: r.subjectId, subject: r.subject,course:r.course });
      })

      this.setDataSource();
      this.dataSource.filter = this.subjectname.trim().toLowerCase()
    });

    this.saveChapterSubscribe = this.comm.saveChapter.subscribe((data: any) => {
      this.chapter_topics[data.chapterId] = data.topics;
    });

    this.permissions = await this.usersService.getUserPermissions()

    if (this.permissions.edit_subject || this.permissions.delete_subject) {
      this.displayedColumns.push("action")
    }

    if (this.permissions.delete_subject) {
      this.displayedColumns.unshift("id")
    }

    /*Get All Subjects Data */
    this.getAllSubjects();
  }

  /*Get All Subjects Data */
  getAllSubjects() {
    this.loading = true;
    this.coreService.getRequest(AppConstants.API_URL + "subjects").subscribe((result: any) => {
      this.loading = false;
      this.treeClass = new Array(result.length);
      this.openedClass = new Array(result.length);
      this.parseSubjectsData(result);
    });
  }

  /* Parse Subjects Data After get from database */
  parseSubjectsData(result: any) {
    this.subjectsData = result
    this.tableData = []

    result.forEach(r => {
      this.subject_chapters[r.subjectId] = r.chapters;

      r.chapters.forEach(ch => {
        this.chapter_topics[ch.chapterId] = ch.topics;
      })

      this.tableData.push({
        subjectId: r.subjectId,
        subject: r.subject,
        course:r.course
      });
    })

    this.setDataSource();
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
    var disabled = 0

    this.subjectsData.forEach(d => {

      if (d.chapters.length > 0) {
        disabled++;
      }

    })

    return numSelected == numRows - disabled
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :

      this.dataSource.data.forEach(row => {

        if (this.subject_chapters[row.subjectId].length == 0) {
          this.selection.select(row)
        }

      })
  }

  /* While Opening Edit Subject Modal set chapters array and subject object and pass in Child Component */
  selectedChaptersForEdit = [];
  subjectDataForEdit = { subjectId: 0, subject: null }

  showEdit(id) {
    this.selectedChaptersForEdit = this.subject_chapters[this.tableData.find(d => d.subjectId == id).subjectId];
    this.showEditModal = true;
    this.subjectDataForEdit = this.tableData.find(e => e.subjectId == id);
  }

  /*While showing delete single subject modal set active id and and index */
  showDelete(id, subject, index) {
    this.dialog.showDialog({
      title: 'Confirm',
      content: `Are you sure to delete &ldquo;${subject}&rdquo;?`,
      width: '340px',
      callBackButtonColor: 'warn',
      callBackButtonText: 'Delete',
      callBack: () => {
        this.deleteSubject(id, index)
      }
    })
  }
  /* Delete Single Subject after Confirming in modal */
  deleteSubject(id, index) {
    const url = AppConstants.API_URL + "subjects/" + id
    this.coreService.deleteRequest(url).subscribe(res => {
      this.subjectsData.splice(index, 1);
      this.tableData.splice(index, 1);
      this.dataSource = new MatTableDataSource(this.tableData);
    });
  }

  /*While showing delete single subject modal set active id and and index */
  showMultipleDelete() {
    this.dialog.showDialog({
      title: 'Confirm',
      content: `Are you sure to delete these subjects?`,
      width: '340px',
      callBackButtonColor: 'warn',
      callBackButtonText: 'Delete',
      callBack: () => {
        this.deleteMultipleSubjects()
      }
    })
  }

  /* Delete Multiple Subjects after confirming on modal */
  deleteMultipleSubjects() {
    let ids = [];

    this.selection.selected.forEach(d => {
      ids.push(d.subjectId);
    })

    const url = AppConstants.API_URL + "subjects/multiple/" + ids
    this.coreService.deleteRequest(url).subscribe(() => {
      this.subjectsData = this.subjectsData.filter(sd => !ids.includes(sd.subjectId))
      this.tableData = this.tableData.filter(td => !ids.includes(td.subjectId))
      this.selection.clear();
      this.setDataSource();
    });
  }

  ngOnDestroy(): void {
    this.saveSubjectSubscribe.unsubscribe();
    this.saveChapterSubscribe.unsubscribe();
    this.tableData = [];
    this.setDataSource();
  }

  openTree($e) {
    $e.target.parentElement.querySelector('.nested').classList.toggle('active');
    $e.target.classList.toggle("caret-down");
  }
}
