import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CoreService } from 'src/app/service/core.service';
import { AppConstants } from 'src/app/AppConstants';
import { DateTimeFormatService } from 'src/app/service/DateTimeFormatService';

@Component({
  selector: 'question-report',
  templateUrl: './question-report.component.html',
  styleUrls: ['../../candidate-common.css', '../detailed-report.component.css', './question-report.component.css']
})
export class QuestionReportComponent implements OnInit {
  loading = true
  questionData = []
  masterData = []
  filter = 'All'

  @Input() testInfo: {
    id: null,
    attempt_no: 0
  }

  constructor(private coreService: CoreService, public timeService: DateTimeFormatService) {

  }

  ngOnInit(): void {
    this.getQuestionsDetails(this.testInfo.id, this.testInfo.attempt_no)
  }

  getQuestionsDetails(testId, attempt_no) {
    this.coreService.getRequest(AppConstants.API_URL + "reports/questions-report/" + testId + "/" + attempt_no).
      subscribe((data: any) => {
        this.questionData = data
        this.masterData = JSON.parse(JSON.stringify(data))
        this.loading = false
      })
  }

  // Filter Questions based on bonus or all 
  filterData(s) {
    this.filter = s

    if (s != "All" && s != "bonus") {
      this.questionData = this.masterData.filter(f => f.status == s)
    } else if ((s == "bonus")) {
      this.questionData = this.masterData.filter(f => f.bonus == 1)
    } else {
      this.questionData = this.masterData.filter(f => true)
    }

  }

  ///Display your answerer based on question Type
  getYourAnswer(data, typeId) {

    // If multi response
    if (typeId == 2) {
      return data
    }
    // mostly single or Integer type 
    if (typeof data == "string") {
      return data
    } else if (typeof data == "object") {// For match matrix

      const ordered = {}

      Object.keys(data).sort().forEach(function (key) {
        ordered[key] = data[key];
      })

      let string = "";

      Object.keys(ordered).forEach(d => {
        string += d + " = " + ordered[d] + "<br>"
      })

      return string;
    }
  }

  // Show Correct answer based on its data type
  getCorrectAnswer(data) {

    if (this.isJSON(data) && typeof JSON.parse(data) == "object") {
      let string = "";
      data = JSON.parse(data);

      Object.keys(data).forEach(d => {
        if (data[d] != "")
          string += d + " = " + data[d] + "<br>"
      })

      return string;
    }

    return data
  }

  // check if JSON is valid JSON
  isJSON(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
