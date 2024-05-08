import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { CommunicationService } from './communication.service';

@Injectable({
  providedIn: 'root'
})

export class CoreService {
  private headers: HttpHeaders = new HttpHeaders();

  constructor(
    private http: HttpClient,
    private router: Router,
    private comm: CommunicationService
  ) {
    this.headers = this.headers.append("Content-Type", "application/json");
  }

  postRequest(url: string, data) {
    let token = localStorage.getItem("token")
    token = "?token=" + (token ? token : "")
    url += (url.slice(-1) == "/" ? "" : "/") + token

    let hp = this.http.post(url, JSON.stringify(data), { headers: this.headers });
    return hp.pipe(catchError(err => this.handleError(err)));
  }

  uploadRequest(url: string, data) {
    let token = localStorage.getItem("token")
    token = "?token=" + (token ? token : "")
    url += (url.slice(-1) == "/" ? "" : "/") + token

    let hp = this.http.post(url, data);
    return hp.pipe(catchError(err => this.handleError(err)));
  }

  putRequest(url: string, data) {
    let token = localStorage.getItem("token")
    token = "?token=" + (token ? token : "")
    url += (url.slice(-1) == "/" ? "" : "/") + token

    let hp = this.http.put(url, JSON.stringify(data), { headers: this.headers });
    return hp.pipe(catchError(err => this.handleError(err)))
  }

  getRequest(url: string) {
    let token = localStorage.getItem("token")
    token = "?token=" + (token ? token : "")
    url += (url.slice(-1) == "/" ? "" : "/") + token

    let hp = this.http.get(url);
    return hp.pipe(catchError(err => this.handleError(err)))
  }

  urlEncodedRequest(url: string, data) {
    let token = localStorage.getItem("token")
    token = "?token=" + (token ? token : "")
    url += (url.slice(-1) == "/" ? "" : "/") + token

    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append("Content-Type", "application/x-www-form-urlencoded");
    let hp = this.http.post(url, data, { headers: headers });
    return hp.pipe(catchError(err => this.handleError(err)));
  }

  deleteRequest(url: string) {
    let token = localStorage.getItem("token")
    token = "?token=" + (token ? token : "")
    url += (url.slice(-1) == "/" ? "" : "/") + token
    return this.http.delete(url).pipe(catchError(err => this.handleError(err)));
  }

  private handleError(error: HttpErrorResponse) {

    if (error.error instanceof ErrorEvent) {
      console.log("Here ", error)
    } else {
      console.log(JSON.stringify(error));

      if (error.error == "Invalid Token") {
        localStorage.clear()
        this.router.navigate(["/"])
      } else {
        this.comm.errorModal.next(error)
      }
    }

    return throwError('Error Occured');
  }
}
