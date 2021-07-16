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
    domain: ['#00911B', '#692191', '#5E84FF', '#E01D3C', '#4DFF6E', '#0F7594', '#946F0A', '#4DD5FF', '#26DE48', '#A649DF', '#C6DE49', '#2DB7E0', '#3D63E0', '#910018', '#E0B43D', '#C76EFF', '#7D9113', '#E0862D', '#193694', '#944A00',]
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
      this.yScaleMin = this.scoreboard.getMinimum(this.bubbleData, 'y') - 2;
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
    this.yScaleMin = this.scoreboard.getMinimum(this.bubbleData, 'y') - 2;
  }

  onSubmit(){
    this.table.renderRows();
  }

}
