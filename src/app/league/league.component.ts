import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, OnChanges} from '@angular/core';
import {ScoreboardService} from '../scoreboard.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-league',
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.css']
})
export class LeagueComponent implements AfterViewInit, OnChanges {

  bubbleData: any[];
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  gradient: boolean = false;
  yAxisLabel: string = 'Points';
  showYAxisLabel: boolean = true;
  xAxisLabel: string = 'Week';
  xScaleMin: number = 1;
  yScaleMin: number;
  filled: boolean = false;
  default: string = 'Total';

  colorScheme = {
    domain: ['#989EE7', '#1C9C5A', '#368290', '#5D0FBC', '#8348BD', '#D2F4E2', '#333953', '#BFB5DE']
  };

  public data: any[];
  public display = ['TeamID', 'Record', 'WinPct', 'xRecord', 'WinsAboveExpected'];
  public views = ['Total', 'Average'];
  public selected: boolean = false;

  constructor(private scoreboard: ScoreboardService, private cdr: ChangeDetectorRef) { 
    this.filled = this.scoreboard.filled;
    if(this.filled){
      let d = this.scoreboard.getWinTableData();
      this.data = d;
      this.bubbleData = this.scoreboard.getBubbleDataAvg();
      this.yScaleMin = this.scoreboard.getMinimum(this.bubbleData) - 2;
    }
  }

  ngOnChanges(): void {
    this.scoreboard.getBubbleData();
    this.cdr.detectChanges();
    this.table.renderRows();
  }

  @ViewChild(MatTable) table: MatTable<any>;
  ngAfterViewInit(): void {
    this.filled = this.scoreboard.filled;
    console.log(this.filled);
    console.log(this.data);
    console.log(this.display);
    this.scoreboard.getBubbleData();
    this.cdr.detectChanges();
    //this.xWins = this.scoreboard.getAllxWins();
  }

  onViewClick(val){
    this.selected = true;
    if(val.value == 'Average'){
      this.bubbleData = this.scoreboard.getBubbleDataAvg();
      this.yAxisLabel = 'Points Above Average';
    }
    else if (val.value == 'Total'){
      this.bubbleData = this.scoreboard.getBubbleData();
      this.yAxisLabel = 'Points';
    }
    this.yScaleMin = this.scoreboard.getMinimum(this.bubbleData) - 2;
  }

  onSubmit(){
    this.table.renderRows();
  }

}
