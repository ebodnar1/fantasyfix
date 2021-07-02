import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'
import {map, filter, catchError} from 'rxjs/operators';


export interface Category{
  categoryNum: number;
}

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

  public filled: boolean = false;
	public chosen: boolean = false;
	//Stores json/Observable of all scoreboard items
	public schedule;
	public scoreboardItems;

	//Stores json/Observable of settings
	public settingsItems;
	public settings;

	public matchupItems;
	public disable: boolean = false;

	//Tracks the number of teams in the league
	public numTeams: number = 0;
	//Tracks this matchup period's current week ids
	public weekIds = [];
	public currentWeekIds = [];
	public currentSelected: boolean = false;
	public weekPlayed: boolean = false;
	//Tracks all week ids up to and including this week's
	public allWeeks = [];
	//Holds the current week of the schedule
	public currentWeek: number = 0;
	public selectedWeek: number = 0;
	//Stores team abbreviations and IDs in a dictionary of the form {key (abbreviation): value (team ID)}
	public teamIDs = {};
	public fullTeamNames = {};

	public accumulatedWeekScores = [];
	public displayWeekScores = [];
	public rankedDisplay = [];

	//
	//
	//Tracks all cumulative scores in the form {losses: x, scoreByStat: OBJECT, statsBySlot: null, ties: x, wins: x}
	public cumulativeScores = [];

	//Tracks all scores by stat in the form {catNum1: {ineligble: false, rank: 0, result: res, score: x}, catNum2: ...}
	//Access a category score with this.scoresByStat[index][categoryNumber]['score']
	public scoresByStat = [];

	public thisWeeksScores = [];
	public teamsForGames = [];
	//

	public todaysStats = [];
	public weekStats = [];
	public trackedCategories = [];

	fillStart(){
		this.numTeams = this.scoreboardItems['teams'].length;
		this.currentWeek = this.scoreboardItems['status']['currentMatchupPeriod'];
		this.trackedCategories = this.getCategories();
		this.getWeekIds(this.numTeams);
    console.log(this.filled);
	}

	fillData(){
		//this.disable = true;

		//Clearing arrays
		this.accumulatedWeekScores.length = 0;
		this.displayWeekScores.length = 0;
		this.rankedDisplay.length = 0;
		this.cumulativeScores.length = 0;
		this.scoresByStat.length = 0;
		this.thisWeeksScores.length = 0;
		this.teamsForGames.length = 0;
		this.todaysStats.length = 0;
		this.weekStats.length = 0;
		this.thisWeeksScores.length = 0;

		let scores = [];
		//Get cumulativeScores
		this.scoreboardItems['schedule'].map(data => this.cumulativeScores.push(data["home"]['cumulativeScore'], data["away"]['cumulativeScore']));
		this.matchupItems['schedule'].map(data => scores.push(data['home']['cumulativeScore'], data['away']['cumulativeScore']));

		//Get scoresByStat
		for(let i = 0; i < (this.currentWeek * (this.numTeams / 2)); i++){
			this.scoresByStat.push(this.cumulativeScores[i]['scoreByStat']);
		}
		//this.cumulativeScores.map(data => console.log(data['scoreByStat']));//this.scoresByStat.push(data['scoreByStat']));
		this.scoreboardItems['schedule'].map(data => this.teamsForGames.push(data["home"]['teamId'], data["away"]['teamId']))

		this.scoreboardItems['teams'].map(data => this.teamIDs[data['id']] = data['abbrev']);
		if(!this.thisWeeksScores.length){
			for(let i = (this.selectedWeek) * this.numTeams; i < ((this.selectedWeek + 1) * this.numTeams); i++){
				this.thisWeeksScores.push({team: this.teamIDs[this.teamsForGames[i]], wins: scores[i]['wins'], 
				losses: scores[i]['losses'], ties: scores[i]['ties']});
			}
		}

		for(let i = 0; i < this.numTeams; i++){
			this.fullTeamNames[this.scoreboardItems['teams'][i]['id']] = this.scoreboardItems['teams'][i]['location'] + " " + this.scoreboardItems['teams'][i]['nickname'];
		}

		if(this.currentSelected){
			this.todaysStats = this.getToday();
			this.setupTodayTable();
		}

		this.weekStats = this.getWeekStats();
		if(this.currentSelected){
			this.accumulatedWeekScores = this.getOverallWeekStats(this.todaysStats, this.weekStats);
		}
		else{
			this.accumulatedWeekScores = this.getWeekStats();
		}

		this.displayWeekScores = this.fullStatsToDisplay(this.accumulatedWeekScores);
		this.setupCondensedTable();

		let ranked = this.getRankingsEachCategory(this.displayWeekScores);
		this.rankedDisplay = this.toOverallRankings(ranked);
		this.setupPointsTable();
	}

	getPct(wins, losses, ties){
		return ((2 * wins + ties) / (2 * losses));
	}

	scoringCategories: Category[] = [];
	reversedCategories: Category[] = [];
	getCategories(){
	  if(this.scoreboardItems != null && this.scoringCategories.length == 0){
		for(let n = 0; n < (this.settingsItems['settings']['scoringSettings']['scoringItems']).length; n++){
		  this.scoringCategories.push({categoryNum: this.settingsItems['settings']['scoringSettings']['scoringItems'][n]['statId']});
		  this.reversedCategories.push({categoryNum: this.settingsItems['settings']['scoringSettings']['scoringItems'][n]['isReversedItem']});
		}
	  }
	  this.scoringCategories.sort(function(a,b){
		  return a.categoryNum - b.categoryNum;
	  })
	  //console.log(this.categoryNames[this.scoringCategories[0].categoryNum]);
	  let tc = this.getTrackedCategories();
	  return tc;
	}

	getTrackedCategories(){
		let trackedCategories = [];
		trackedCategories.push(100);
		for(let i = 0; i < this.scoringCategories.length; i++){
			if(this.scoringCategories[i].categoryNum == 2){
				trackedCategories.indexOf(1) === -1 ? trackedCategories.push(1) : null;
				trackedCategories.indexOf(0) === -1 ? trackedCategories.push(0) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 41){
				trackedCategories.indexOf(34) === -1 ? trackedCategories.push(34) : null;
				trackedCategories.indexOf(37) === -1 ? trackedCategories.push(37) : null;
				trackedCategories.indexOf(39) === -1 ? trackedCategories.push(39) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 47){
				trackedCategories.indexOf(45) === -1 ? trackedCategories.push(45) : null;
				trackedCategories.indexOf(34) === -1 ? trackedCategories.push(34) : null;
			}
			else{
				trackedCategories.push(this.scoringCategories[i].categoryNum);
			}
		}
		return trackedCategories;
	}

	onSelectClick(val){
		this.currentWeek = this.scoreboardItems['status']['currentMatchupPeriod'];
		this.chosen = true;
		this.selectedWeek = val.value;

		this.weekIds = [];
		for(let i = ((this.selectedWeek) * (this.numTeams / 2)); i < ((this.selectedWeek + 1) * (this.numTeams / 2)); i++){
			this.weekIds.push(i);
		}
		this.currentSelected = this.compareArrays(this.weekIds, this.currentWeekIds);
		
		for(let i of this.weekIds){
			if(this.scoreboardItems['schedule'][i]['winner'] == 'UNDECIDED'){
				this.weekPlayed = false;
			}
			else{
				this.weekPlayed = true;
			}
		}
		this.weekPlayed = this.weekPlayed || this.currentSelected;

		if(this.weekPlayed){
			this.fillData();
		}
	}

	compareArrays(a, b){
		if(a === b) return true;
		if(a == null || b == null) return false;
		if(a.length !== b.length) return false;

		for(var i = 0; i < a.length; ++i){
			if(a[i] !== b[i]) return false;
		}
		return true;
	}

	getWeekIds(teamNum){
		if(!this.currentWeekIds.length){
			for(let i = ((this.currentWeek - 1) * (teamNum / 2)); i < ((this.currentWeek) * (teamNum / 2)); i++){
				this.currentWeekIds.push(i);
			}
		}
		if(!this.allWeeks.length){
			for(let i = 0; i < (teamNum * this.currentWeek / 2); i++){
				this.allWeeks.push(i);
			}
		}
	}

	getKeyForValue(object, value){
		return Object.keys(object).find(key => object[key] === value);
	}

	getToday(){
		let todaysStats = [];
		let matchupSchedule = [];
		let tempIds = [];
		for(let i = this.weekIds[0]; i <= this.weekIds[this.weekIds.length - 1]; i++){
			matchupSchedule.push(this.matchupItems['schedule'][i]['home']['rosterForCurrentScoringPeriod']['entries'], this.matchupItems['schedule'][i]['away']['rosterForCurrentScoringPeriod']['entries']);
			tempIds.push(this.matchupItems['schedule'][i]['home']['teamId'], this.matchupItems['schedule'][i]['away']['teamId']);
		}

		//this.matchupItems['schedule'].map(data => matchupSchedule.push(data["home"]['rosterForCurrentScoringPeriod']['entries'], data["away"]['rosterForCurrentScoringPeriod']['entries']));
		for(let i = 0; i < matchupSchedule.length; i++){
			let boxScore = [];
			let bench = [];
			let checkPlaying = [];

			//Check if games have begun
			matchupSchedule[i].map(x => {
				if(x["playerPoolEntry"]['player']['stats'][0] == null){
					return;
				}
				else{
					checkPlaying.push(x["playerPoolEntry"]['player']['stats'][0]);
				}
			});

			//If games have begun, push each player's stats and lineupSlotId into the boxScore array
			matchupSchedule[i].map(data => {
				if(data["playerPoolEntry"]['player']['stats'][0] != null){
					boxScore.push(data["playerPoolEntry"]['player']['stats'][0]['stats']);
					bench.push(data['lineupSlotId']);
				}
			});

			//Define teamTracker dictionary list and fill all categories with 0's
			let teamTracker = [{}];
			for(let i = 0; i < this.trackedCategories.length; i++){
				teamTracker[this.trackedCategories[i]] = 0;
			}
			//Set the team ID
			teamTracker[100] = this.teamIDs[tempIds[i]];

			//If the boxScore index is a non-bench player with statistics, add these stats to the teamTracker dictionary list
			for(let k = 0; k < boxScore.length; k++){
				if(boxScore[k] != '{}' && bench[k] != 16 && bench[k] != 17){
					for(let j = 0; j < this.trackedCategories.length; j++){
						if(boxScore[k][this.trackedCategories[j]] != null){
							teamTracker[this.trackedCategories[j]] += boxScore[k][this.trackedCategories[j]];
						}
					}
				}
			}

			//Add properties to the return list (for displaying in table)
			let temp = {};
			for(let i = 0; i < this.trackedCategories.length; i++){
				temp[this.addProperty(i)] = teamTracker[this.trackedCategories[i]];
			}

			todaysStats.push(temp);
		}
		return todaysStats;
	}

	getWeekStats(){
		let weekStats = [];
		let teamScores = [];
		let tempIds = [];
		for(let i = this.weekIds[0]; i <= this.weekIds[this.weekIds.length - 1]; i++){
			teamScores.push(this.scoreboardItems['schedule'][i]['home']['cumulativeScore']['scoreByStat'], this.scoreboardItems['schedule'][i]['away']['cumulativeScore']['scoreByStat']);
			tempIds.push(this.matchupItems['schedule'][i]['home']['teamId'], this.matchupItems['schedule'][i]['away']['teamId']);
		}

		//Loop x times (once per team)
		for(let i = 0; i < teamScores.length; i++){
			//Define teamTracker dictionary list and fill all categories with 0's
			let teamTrack = {};
			for(let i = 0; i < this.trackedCategories.length; i++){
				teamTrack[this.trackedCategories[i]] = 0;
			}
			//Set the team ID
			teamTrack[100] = this.teamIDs[tempIds[i]];

			for(let j = 1; j < this.trackedCategories.length; j++){
				if(teamScores[i][this.trackedCategories[j]]['score'] != 0.0){
					teamTrack[this.trackedCategories[j]] += teamScores[i][this.trackedCategories[j]]['score'];
				}
			}

			//Add properties to the return list (for displaying in table)
			let temp = {};
			for(let i = 0; i < this.trackedCategories.length; i++){
				temp[this.addProperty(i)] = teamTrack[this.trackedCategories[i]];
			}

			weekStats.push(temp);
		}
		return weekStats;
	}

	getOverallWeekStats(today, week){
		let overall = [];
		for(let i = 0; i < today.length; i++){
			let temp = {}
			temp[this.categoryNames[this.trackedCategories[0]]] = today[i][this.categoryNames[this.trackedCategories[0]]];
			for(let j = 1; j < this.trackedCategories.length; j++){
				temp[this.categoryNames[this.trackedCategories[j]]] = (today[i][this.categoryNames[this.trackedCategories[j]]] + 
					week[i][this.categoryNames[this.trackedCategories[j]]]);
			}
			overall.push(temp);
		}
		return overall;
	}

	fullStatsToDisplay(fullStats){
		let temp = [];
		for(let j = 0; j < fullStats.length; j++){
			let displayStats = {};
			for(let i of this.scoringCategories){
				displayStats['TeamID'] = fullStats[j]['TeamID'];
				if(fullStats[j][this.categoryNames[i.categoryNum]] != null){
					displayStats[this.categoryNames[i.categoryNum]] = fullStats[j][this.categoryNames[i.categoryNum]];
				}
				else{
					if(i.categoryNum == 2){
						if(fullStats[j]['AB'] != 0){
							displayStats[this.categoryNames[2]] = +((fullStats[j]['H'] / fullStats[j]['AB']).toFixed(3));
						}
						else{
							displayStats[this.categoryNames[2]] = 0;
						}
					}
					if(i.categoryNum == 41){
						if(fullStats[j]['O'] == 0 && fullStats[j]['HA'] != 0 || fullStats[j]['O'] == 0 && fullStats[j]['BBA'] != 0){
							displayStats[this.categoryNames[41]] = 'INF';
						}
						else if(fullStats[j]['O'] == 0){
							displayStats[this.categoryNames[41]] = 0;
						}
						else{
							displayStats[this.categoryNames[41]] = +((((fullStats[j]['HA'] + fullStats[j]['BBA']) / fullStats[j]['O']) * 3).toFixed(3));
						}
					}
					if(i.categoryNum == 47){
						if(fullStats[j]['O'] == 0 && fullStats[j]['ER'] != 0){
							displayStats[this.categoryNames[47]] = 'INF'
						}
						else if(fullStats[j]['O'] == 0){
							displayStats[this.categoryNames[47]] = 0;
						}
						else{
							displayStats[this.categoryNames[47]] = +(((fullStats[j]['ER'] / fullStats[j]['O']) * 27).toFixed(3));
						}
					}
				}
			}
			temp.push(displayStats);
		}
		return temp;
	}

	getRankingsEachCategory(condensedStats){
		var rankings = []
		for(let i = 0; i < this.scoringCategories.length; i++){
			let temp = {};
			temp['category'] = this.categoryNames[this.scoringCategories[i].categoryNum];
			for(let j = 0; j < condensedStats.length; j++){
				//Each category of each team
				//console.log(condensedStats[j][this.categoryNames[this.scoringCategories[i].categoryNum]]);
				temp[condensedStats[j]['TeamID']] = condensedStats[j][this.categoryNames[this.scoringCategories[i].categoryNum]];
			}

			let category = this.categoryNames[this.scoringCategories[i].categoryNum];
			let teamTracker = [];
			let scoreTracker = [];
			for(let t = 1; t <= this.numTeams; t++){
				teamTracker.push(this.teamIDs[t]);
				scoreTracker.push(temp[this.teamIDs[t]]);
			}
			let ranks = this.rank(scoreTracker, category);

			let ranked = {};
			ranked['category'] = category;
			for(let i = 1; i <= this.numTeams; i++){
				ranked[this.teamIDs[i]] = ranks[i - 1];
			}
			rankings.push(ranked);
		}
		return rankings;
	}

	toOverallRankings(rankings){
		var changed = [];
		for(let i = 1; i <= this.numTeams; i++){
			var sum: number = 0;
			var temp = {};
			temp['TeamID'] = this.teamIDs[i]
			for(let j = 0; j < rankings.length; j++){
				temp[rankings[j]['category']] = rankings[j][this.teamIDs[i]];
				sum += rankings[j][this.teamIDs[i]];
			}
			temp['Total'] = sum;
			changed.push(temp);
		}
		changed.sort(function(first, second){
			return second.Total - first.Total;
		});

		//Display the stats table in the same order as the ranks table
		let t = [];
		for(let i = 0; i < this.displayWeekScores.length; i++){
			let displayID = changed[i]['TeamID']
			for(let j = 0; j < this.displayWeekScores.length; j++){
				if(this.displayWeekScores[j]['TeamID'] == displayID){
					t.push(this.displayWeekScores[j]);
				}
			}
		}
		this.displayWeekScores = t;

		return changed;
	}

	rank(arr, category){
		var sorted = arr.slice().sort(function(a,b){return b-a});
		if(category == 'ERA' || category =='WHIP'){}
		else{
			sorted = sorted.reverse();
		}
		var ranks = arr.slice().map(function(v){return sorted.indexOf(v) + 1});
		return ranks
	}

	addProperty(index: number){
		var newProp = this.categoryNames[this.trackedCategories[index]];
		return newProp
	}
  
	ngOnInit(): void {
	}
  
	async search(url){
		this.loading = true;

		let a = await this.searchMatchupScore(url);
		let b = await this.searchScore(url);
		let c = await this.searchSettings(url);
		console.log('finished large')
		this.filled = true;
		this.fillStart();
		/*
	  this.scoreboard.search(url).subscribe(
		data => {
		  this.items = data
		},
		err => console.log(err),
		() => console.log("done loading")
	  );
	  */
	}

	searchScore(url){
		let scoreboardURL = url + "?view=mScoreboard";

		let promise = new Promise((resolve, reject) =>{
			this.searchScoreboard(scoreboardURL).toPromise().then(
				res => {
					this.scoreboardItems = res;
					resolve(res);
				},
				msg => {
					reject();
				}
			)
		});
		//this.loading = false;
		console.log('finished scoreboard');
		return promise;
	}

	searchSettings(url){
		let settingsURL = url + "?view=mSettings";
		let promise = new Promise((resolve, reject) =>{
			this.searchScoreboard(settingsURL).toPromise().then(
				res => {
					this.settingsItems = res;
					resolve(res);
				},
				msg => {
					reject();
				}
			)
		});
		//this.settings = this.settingsItems['settings'];
		//this.loading = false;
		console.log('finished settings');
		return promise;
	}

	/*
			this.scoreboard.searchScoreboard(matchupURL).pipe(
				tap(res => {
					this.matchupItems = res;
				}),
				first()
			).toPromise().then(
				res => {console.log(res);}
			);
	*/

	searchMatchupScore(url){
		let matchupURL = url + "?view=mMatchupScore";
		let promise = new Promise((resolve, reject) =>{
			this.searchScoreboard(matchupURL).toPromise().then(
				res => {
					this.matchupItems = res;
					resolve(res);
				},
				msg => {
					reject();
				}
			)
		});
		//this.loading = false;
		console.log('finished matchup');
		return promise;
	}

	displayedToday = [];
	setupTodayTable(){
		this.displayedToday.length = 0;
		for(let i = 0; i < this.trackedCategories.length; i++){
			this.displayedToday.push(this.categoryNames[this.trackedCategories[i]]);
		}
		return this.displayedToday;
	}

	condensed = [];
	setupCondensedTable(){
		this.condensed.length = 0;
		this.condensed.push('TeamID')
		for(let i = 0; i < this.scoringCategories.length; i++){
			this.condensed.push(this.categoryNames[this.scoringCategories[i].categoryNum]);
		}
		return this.condensed;
	}

	pointsColumns = [];
	setupPointsTable(){
		this.pointsColumns.length = 0;
		for(let i = 0; i < this.condensed.length; i++){
			this.pointsColumns[i] = this.condensed[i];
		}
		this.pointsColumns.push('Total');
	}

	displayedColumns = ['team', "wins", "losses", "ties"]
	dataSource = this.thisWeeksScores;

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
