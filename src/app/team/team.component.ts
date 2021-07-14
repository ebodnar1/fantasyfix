import { Component, OnInit, ViewChild, AfterViewInit, OnChanges, ChangeDetectorRef} from '@angular/core';
import {ScoreboardService} from '../scoreboard.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})

export class TeamComponent implements AfterViewInit, OnChanges, OnInit {

  constructor(private scoreboard: ScoreboardService, private cdr: ChangeDetectorRef) { }

  public allTeams = this.scoreboard.listTeamNames();
  public filled: boolean = false;
  public selected;
  public chosen: boolean = false;
  public teamStats = [];
  public condensed;
  public weeks = [];
  public currentWeek;
  public selectedWeek;
  public pieChartData;
  public showPieChart: boolean = false;
  public showError: boolean = false;
  public categoryNames = [];
  public lineChartData;
  public showLineChart: boolean = false;

  //Pie chart configuration
  gradient: boolean = true;
  showLegend: boolean = false;
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: string = 'right';
  view: any[] = [500, 500];
  single: any[];
  chosenCategory: string;

  //Line chart configuration
  lineLegend: boolean = true;
  showLineLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showXAxisLabel: boolean = true;
  showYAxisLabel: boolean = true;
  xAxisLabel: string = 'Week';
  yAxisLabel: string = 'Number';
  lineLegendPosition: string = 'right';
  lineAutoscale: boolean = true;


  colorScheme = {
    domain: ['#989EE7', '#1C9C5A', '#368290', '#5D0FBC', '#8348BD', '#D2F4E2', '#333953', '#BFB5DE']
  };

  lineScheme = {
    domain: ['#5D0FBC', '#1C9C5A', '#21C6FC']
  };

  ngOnInit(): void{
    this.allTeams = this.scoreboard.listTeamNames();
  }

  ngAfterViewInit(): void {
    this.selectedWeek = this.scoreboard.currentWeek;
    this.filled = this.scoreboard.filled;
    for(let i = 0; i < this.scoreboard.allWeeks.length; i++){
      this.weeks[i] = this.scoreboard.allWeeks[i];
    }
    if(this.weeks.length && this.weeks[this.weeks.length - 1] != 'Average'){
      this.weeks.push('Average')
    }
    this.currentWeek = this.scoreboard.currentWeek;
    this.selectedWeek = this.currentWeek;
    this.scoreboard.setCurrentSelected(false);

    for(let i = 0; i < this.scoreboard.scoringCategories.length; i++){
      this.categoryNames[i] = this.scoreboard.categoryNames[this.scoreboard.scoringCategories[i].categoryNum];
    }

    if(this.allTeams != null){
      console.log("GOOD");
    }
    else{
      console.log("ERROR");
    }
    this.cdr.detectChanges();
  }

  ngOnChanges(): void{
    this.cdr.detectChanges();
    this.table.renderRows();
  }

  @ViewChild(MatTable) table: MatTable<any>;
  onSelectClick(val){
    this.teamStats.length = 0;
    for(let i = 1; i <= this.scoreboard.numTeams; i++){
      if(this.scoreboard.fullTeamNames[i] == val.value){
        this.selected = i;
      }
    }
    this.chosen = true;
    this.condensed = this.scoreboard.condensed;
    this.scoreboard.getWeekSelected(this.selectedWeek);
    this.teamStats.push(this.scoreboard.getStatsForTeam(this.selected, (this.selectedWeek)));
    let avg = this.scoreboard.getAverage(this.selectedWeek);
    avg['TeamID'] = 'AVG';
    this.teamStats.push(avg);
    //this.scoreboard.onSelectClick(val);

    this.updatePieChart(this.selectedWeek, this.selected)
    this.updateLineChart(this.chosenCategory);
    this.table.renderRows();
  }

  onWeekClick(val){
    this.teamStats.length = 0;

    if(val.value == 'Average'){
      console.log('avg selected');
    }

    
    this.selectedWeek = this.scoreboard.convertWeek(val.value);
    this.scoreboard.currentSelected = this.currentWeek == this.selectedWeek + 1;
    this.scoreboard.getWeekSelected(this.selectedWeek);
    
    if(this.selectedWeek < this.currentWeek){
      this.teamStats.push(this.scoreboard.getStatsForTeam(this.selected, this.selectedWeek));
      let avg = this.scoreboard.getAverage(this.selectedWeek);
      avg['TeamID'] = 'AVG';
      this.teamStats.push(avg);
      this.showPieChart = true;
      this.showError = false;
    }
    else{
      this.showPieChart = false;
      this.showError = true;
    }

    this.updatePieChart(this.selectedWeek, this.selected);
    if(this.showPieChart){
      this.table.renderRows();
    }
  }

  onCategoryClick(val){
    this.showLineChart = true;
    this.chosenCategory = "";
    this.chosenCategory = val.value;
    this.updateLineChart(this.chosenCategory);
  }

  updatePieChart(week, player){
    if(week < this.currentWeek){
      this.pieChartData = this.scoreboard.getPieChartData(week, player);
    }
  }

  updateLineChart(cat){
    this.lineChartData = this.scoreboard.getStatsByCategory(cat, this.selected);
    this.lineChartData.push(this.scoreboard.getAverageByCategory(cat));
  }
}
