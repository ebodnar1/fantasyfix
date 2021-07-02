import { Component, OnInit, ViewChild } from '@angular/core';
import {ScoreboardService} from '../scoreboard.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})

export class TeamComponent implements OnInit {

  constructor(private scoreboard: ScoreboardService) { }

  public allTeams = [];
  public filled: boolean = false;
  public selected;
  public chosen: boolean = false;
  public teamStats = [];
  public condensed;

  ngOnInit(): void {
    this.allTeams = this.listTeamNames();
    this.filled = this.scoreboard.filled;
    console.log(this.allTeams);
    console.log(this.scoreboard.fullTeamNames);
    if(this.scoreboard.rankedDisplay.length){
      console.log("GOOD");
    }
    else{
      console.log("ERROR");
    }
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
    this.teamStats.push(this.scoreboard.getStatsForTeam(this.selected, 12));
    let avg = this.scoreboard.getAverage(12);
    avg['TeamID'] = 'AVG'
    this.teamStats.push(avg);
    this.table.renderRows();
  }

  listTeamNames(){
    let temp = [];
    for(let i = 1; i <= this.scoreboard.numTeams; i++){
      temp.push(this.scoreboard.fullTeamNames[i]);
    }
    return temp;
  }

}
