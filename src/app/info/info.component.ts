import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent implements OnInit {

  public display: any[] = ['TeamID', 'Points', 'Wins', 'xRecord', 'WinsAboveExpected'];
  public dataSource: any[] = [{TeamID: 1, Points: 20, Wins: 1, xRecord: 0.67, WinsAboveExpected: 0.33},
                              {TeamID: 2, Points: 10, Wins: 0, xRecord: 0, WinsAboveExpected: 0},
                              {TeamID: 3, Points: 25, Wins: 1, xRecord: 1, WinsAboveExpected: 0},
                              {TeamID: 4, Points: 15, Wins: 0, xRecord: 0.33, WinsAboveExpected: -0.33}];

  public display2: any[] = ['TeamID', 'Points', 'Wins', 'xRecord', 'WinsAboveExpected'];
  public dataSource2: any[] = [{TeamID: 1, Points: 25, Wins: 1, xRecord: 1, WinsAboveExpected: 0},
                              {TeamID: 4, Points: 20, Wins: 0, xRecord: 0.50, WinsAboveExpected: -0.50},
                              {TeamID: 2, Points: 20, Wins: 1, xRecord: 0.50, WinsAboveExpected: 0.50},
                              {TeamID: 3, Points: 15, Wins: 0, xRecord: 0, WinsAboveExpected: 0}];

  public display3: any[] = ['TeamID', 'Wins', 'xRecord', 'WinsAboveExpected'];
  public dataSource3: any[] = [{TeamID: 1, Wins: 2, xRecord: 1.67, WinsAboveExpected: 0.33},
                              {TeamID: 2, Wins: 1, xRecord: 0.50, WinsAboveExpected: 0.50},
                              {TeamID: 3, Wins: 1, xRecord: 1, WinsAboveExpected: 0},
                              {TeamID: 4, Wins: 0, xRecord: 0.83, WinsAboveExpected: -0.83}];

  constructor() { }

  ngOnInit(): void {
  }

}
