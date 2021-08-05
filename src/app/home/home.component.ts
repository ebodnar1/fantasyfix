import { HttpClient } from '@angular/common/http';
import { Component, Injectable, OnInit, NgModule, ViewChild, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import * as _ from 'lodash';
import {Observable} from 'rxjs';
import {map, timeout, tap, first} from 'rxjs/operators';
import {ScoreboardService} from '../scoreboard.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';

/*
//Tracks historical data
export class ScoreboardItem{
	constructor(
		public away: Match,
		public home: Match,
		public id: number
	){}
}

export class Match{
	constructor(
		public teamId: number,
		public scoresByStat: Score[]
	){}
}

export class Score{
	constructor(
		public scoreId: number,
		public result: String,
		public score: number
	){}
}
*/

export interface Scoring{
	categories: number[];
}

export interface Category{
	categoryNum: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

	categoryNames = {
		"2": "BA",
		"5": "HR",
		"20": "R",
		"21": "RBI",
		"23": "SB",
		"41": "WHIP",
		"47": "ERA",
		"48": "K",
		"53": "W",
		"57": "SV",
		"0": "AB",
		"1": "H",
		"34": "O",
		"37": "HA",
		"39": "BBA",
		"45": "ER",
		"17": "OBP",
		"18": "OPS",
		"100": "TeamID"
	}

	categoryValues = {
		"BA": "2",
		"HR": "5",
		"R": "20",
		"RBI": "21",
		"SB": "23",
		"WHIP": "41",
		"ERA": "47",
		"K": "48",
		"W": "53",
		"SV": "57",
		"AB": "0",
		"H": '1',
		"O": "34",
		"HA": "37",
		"BBA": "39",
		"ER": "45",
		"OBP": "17",
		"OPS": "18",
		"TeamID": "100"
	}

	loading: boolean=false;
  	url: string;
  	form: FormGroup;
	id: FormControl = new FormControl("", [Validators.required]);
  	year: FormControl = new FormControl("", [Validators.required]);
	swid: FormControl = new FormControl("");
	espn_s2: FormControl = new FormControl("");
	submitted: boolean = false; // show and hide the success message
	isLoading: boolean = false; // disable the submit button if we're loading
	responseMessage: string; // the response message to show to the user
  	constructor(private formBuilder: FormBuilder, private http: HttpClient, private scoreboard: ScoreboardService) {
	this.form = this.formBuilder.group({
		swid: this.swid,
		espn_s2: this.espn_s2,
      	id: this.id,
      	year: this.year
	});
   }

   public weekPlayed;
   public filled;
   public allWeeks;
   public displayWeekScores;
   public rankedDisplay;
   public condensed;
   public pointsColumns;
   public allTeams = [];
   public dat = [];
   public cols = [];
   public otherData =[];
   public otherCols = [];
   public overflow: boolean = false;
   public selected: boolean = false;
   public dwOverflow = [];
   public dwCntrl = [];
   public displayOver;
   public rd = [];

  async onSubmit() {
	if (this.form.status == "VALID") {
		this.filled = false;
		this.selected = false;
		this.form.disable(); // disable the form if it's valid to disable multiple submissions
		var formData: any = new FormData();
		formData.append("id", this.form.get("id").value);
		formData.append("year", this.form.get("year").value);
      	this.year = this.form.get("year").value;
      	this.id = this.form.get("id").value;
		this.isLoading = true; // sending the post request async so it's in progress
		this.submitted = false; // hide the response message on multiple submits
		let url = "https://fantasy.espn.com/apis/v3/games/flb/seasons/" + this.year + "/segments/0/leagues/" + this.id
		let x = await this.scoreboard.search(url);

		this.weekPlayed = this.scoreboard.weekPlayed;
		this.filled = this.scoreboard.filled;
		this.allWeeks = this.scoreboard.allWeeks;
		this.filled = true;

      //this.url = "https://fantasy.espn.com/apis/v3/games/flb/seasons/" + this.year + "/segments/0/leagues/" + this.id;

      //this.http.get(this.url, {params: {"view": "mScoreboard"}}).pipe(map(data => _.values(data))).subscribe(res => console.log(res));
      
      // Something something blah blah blah
      /*
			this.http.post("https://script.google.com/macros/s/AKfycbwnlE8Im_JZ7Lth6OvxL5kOrie0LgORMOMhaDzKk_dVElBj29o/exec", formData).subscribe(
				(response) => {
					// choose the response message
					if (response["result"] == "success") {
						this.responseMessage = "Thanks for the message! I'll get back to you soon!";
					} else {
						this.responseMessage = "Oops! Something went wrong... Reload the page and try again.";
					}
					this.form.enable(); // re enable the form after a success
					this.submitted = true; // show the response message
					this.isLoading = false; // re enable the submit button
					console.log(response);
				},
				(error) => {
					this.responseMessage = "Oops! An error occurred... Reload the page and try again.";
					this.form.enable(); // re enable the form after a success
					this.submitted = true; // show the response message
					this.isLoading = false; // re enable the submit button
					console.log(error);
				}
			);
      */
		}
	}

	isSticky(buttonToggleGroup: MatButtonToggleGroup, id: string){
		return (buttonToggleGroup.value || []).indexOf(id) !== -1;
	}

	@ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
	@ViewChild(MatTable) table: MatTable<any>;
	onSelectClick(val){
		this.overflow = this.scoreboard.scoringCategories.length >= 12 ? true : false;

		//this.allTeams = this.scoreboard.teamIDs;
		this.scoreboard.onSelectClick(val);
		this.weekPlayed = this.scoreboard.weekPlayed;
		this.displayWeekScores = this.scoreboard.displayWeekScores;
		this.condensed = this.scoreboard.condensed;

		for(let i = 0; i < this.scoreboard.numTeams; i++){
			for(let j = 0; j < this.scoreboard.numTeams; j++){
				if(this.weekPlayed && this.displayWeekScores[i]['TeamID'] == this.scoreboard.rankedDisplay[j]['TeamID']){
					this.displayWeekScores[i]['Total'] = this.scoreboard.rankedDisplay[j]['Total'];
				}
			}
		}
		this.displayWeekScores.sort(function(first, second){
			return second.Total - first.Total;
		});

		if(this.overflow){
			this.rd = this.scoreboard.unorganized
			this.rankedDisplay = new MatTableDataSource<any>(this.rd);
			this.allTeams = this.scoreboard.getTeamOrder(this.scoreboard.rankedDisplay);
			this.dwOverflow = this.scoreboard.dwOverflow;

			this.displayOver = new MatTableDataSource<any>(this.dwOverflow);
			setTimeout(() => this.displayOver.paginator = this.paginator.toArray()[0]);

			this.dwCntrl = this.scoreboard.getTeamOrder(this.scoreboard.rankedDisplay);
			setTimeout(() => this.rankedDisplay.paginator = this.paginator.toArray()[1]);
		}

		if(!this.overflow){
			this.pointsColumns = this.scoreboard.pointsColumns;
			this.otherData = this.scoreboard.rankedDisplay;
			this.otherData.sort(function(first, second){
				return second.Total - first.Total;
			});
		}

		this.selected = true;
		this.table.renderRows();
	}

	
	ngOnInit(): void {
		this.cols = ['category', 'BOD', 'TONY'];
		this.dat = [
			{category: 'H', BOD: '2', TONY: '3'},
			{category: 'R', BOD: '5', TONY: '1'},
			{category: 'HR', BOD: '21', TONY: '0'},
		]
	}
}
