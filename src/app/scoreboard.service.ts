import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'
import {map, filter, catchError} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ScoreboardService {

  results: Object[];
  loading: boolean;

  constructor(private http: HttpClient){
    this.results = [];
    this.loading = false;
  }

  searchScoreboard(apiURL){
    //let apiURL = this.apiRoot + year + "/segments/0/leagues/" + id + "?view=mScoreboard";
		//return this.http.get(apiURL).subscribe(x => JSON.stringify(x));
    //this.http.get(apiURL).pipe(map(res => {
      //this.results = JSON.parse(res.toString())
    //}));
    //return this.results
    return this.http.get(apiURL);
    /*
    let promise = new Promise((resolve, reject) => {
      this.http.get(apiURL).toPromise().then(res => {
        console.log(res)
      })
    });
    return promise;
    */
  }

  handleError(err: HttpErrorResponse){
    let errorMessage = '';
    if(err.error instanceof ErrorEvent){
      errorMessage = "An error occured: " + err.error.message;
    }
    else{
      errorMessage = "Server returned code: " + err.status;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
