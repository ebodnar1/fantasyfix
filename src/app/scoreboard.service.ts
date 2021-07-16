import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'
import {map, filter, catchError} from 'rxjs/operators';

//Check SVHD - do I need to do any addition?
//What is SOP, SVHD, BTW, PTW, SBN

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
		"7": "Single",
		"3": "Double",
		"4": "Triple",
		"6": "XBH",
		"8": "TB",
		"22": "GWRBI",
		"10": "BB",
		"11": "IBB",
		"27": "SO",
		"12": "HBP",
		"15": "Sac",
		"19": "RC",
		"24": "CS",
		"25": "SBN",
		"26": "GDP",
		"29": "PPA",
		"9": "SLG",
		"67": "FC",
		"68": "PO",
		"69": "A",
		"70": "OAST",
		"72": "E",
		"73": "DPT",
		"71": "FPCT",
		"74": "BTW",
		"32": "G",
		"33": "GS",
		"44": "RA",
		"46": "HRA",
		"42": "HBPP",
		"63": "QS",
		"64": "SHU",
		"35": "BF",
		"36": "PC",
		"54": "L",
		"55": "WPCT",
		"56": "SOP",
		"58": "BS",
		"59": "SVPCT",
		"60": "HD",
		"38": "BAA",
		"43": "OBPA",
		"49": "KN",
		"76": "PTW",
		"82": "KW",
		"83": "SVHD",
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
		"Single": "7",
		"Double": "3",
		"Triple": "4",
		"XBH": "6",
		"TB": "8",
		"GWRBI": "22",
		"BB": "10",
		"IBB": "11",
		"SO": "27",
		"HBP": "12",
		"Sac": "15",
		"RC": "19",
		"CS": "24",
		"SBN": "25",
		"GDP": "26",
		"PPA": "29",
		"SLG": "9",
		"FC": "67",
		"PO": "68",
		"A": "69",
		"OAST": "70",
		"E": "72",
		"DPT": "73",
		"FPCT": "71",
		"BTW": "74",
		"G": "32",
		"GS": "33",
		"RA": "44",
		"HRA": "46",
		"HBPP": "42",
		"QS": "63",
		"CG": "62",
		"SHU": "64",
		"BF": "35",
		"PC": "36",
		"L": "54",
		"WPCT": "55",
		"SOP": "56",
		"BS": "58",
		"SVPCT": "59",
		"HD": "60",
		"BAA": "38",
		"OBPA": "43",
		"KN": "49",
		"PTW": "76",
		"KW": "82",
		"SVHD": "83",
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

	//
	public allTeams: any[];
	public weeksPlayed: any[] = [];
	public unorganized = [];

	fillStart(){
		this.numTeams = this.scoreboardItems['teams'].length;
		this.currentWeek = this.scoreboardItems['status']['currentMatchupPeriod'];
		this.trackedCategories = this.getCategories();
		this.getWeekIds(this.numTeams);

    	for(let i = 0; i < this.numTeams; i++){
			this.fullTeamNames[this.scoreboardItems['teams'][i]['id']] = this.scoreboardItems['teams'][i]['location'] + " " + this.scoreboardItems['teams'][i]['nickname'];
		}
    	this.scoreboardItems['teams'].map(data => this.teamIDs[data['id']] = data['abbrev']);
		this.allTeams = this.listTeamNames();
	}

	fillData(week){
		//this.disable = true;
		this.getWeekSelected(week);

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
		this.weeksPlayed.length = 0;

		let scores = [];
		//Get cumulativeScores
		this.scoreboardItems['schedule'].map(data => this.cumulativeScores.push(data["home"]['cumulativeScore'], data["away"]['cumulativeScore']));
		this.matchupItems['schedule'].map(data => scores.push(data['home']['cumulativeScore'], data['away']['cumulativeScore']));

		//Get scoresByStat
		for(let i = 0; i < (week * (this.numTeams / 2)); i++){
			this.scoresByStat.push(this.cumulativeScores[i]['scoreByStat']);
		}
		//this.cumulativeScores.map(data => console.log(data['scoreByStat']));//this.scoresByStat.push(data['scoreByStat']));
		this.scoreboardItems['schedule'].map(data => this.teamsForGames.push(data["home"]['teamId'], data["away"]['teamId']))

		let count = 0;
		for(let i = 0; i < this.currentWeek - 1; i++){
			let flag = true;
			for(let j = 0; j < (this.numTeams / 2); j++){
				if(this.scoreboardItems['schedule'][count + j]['winner'] == 'UNDECIDED'){
					flag = false;
					break;
				}
			}
			if(flag){
				this.weeksPlayed.push(i + 1);
			}
			count += (this.numTeams / 2);
		}

		if(!this.thisWeeksScores.length){
			for(let i = (this.currentWeek - 1) * this.numTeams; i < ((this.currentWeek) * this.numTeams); i++){
				this.thisWeeksScores.push({team: this.teamIDs[this.teamsForGames[i]], wins: scores[i]['wins'], 
				losses: scores[i]['losses'], ties: scores[i]['ties']});
			}
		}

		if(week + 1 == this.currentWeek){
			this.todaysStats = this.getToday();
			this.setupTodayTable();
		}

		if(week + 1 == this.currentWeek){
			this.weekStats = this.getWeekStats(this.weekIds[0], this.weekIds[this.weekIds.length - 1]);
			this.accumulatedWeekScores = this.getOverallWeekStats(this.todaysStats, this.weekStats);
		}
		else if(week < this.currentWeek){
			this.accumulatedWeekScores = this.getWeekStats(this.weekIds[0], this.weekIds[this.weekIds.length - 1]);
		}

		this.displayWeekScores = this.fullStatsToDisplay(this.accumulatedWeekScores);
		this.setupCondensedTable();

		let ranked = this.getRankingsEachCategory(this.displayWeekScores);
		this.unorganized = this.toOverallRankings(ranked);
		if(this.scoringCategories.length >= 12){
			this.rankedDisplay = this.shiftData(this.unorganized);
		}

		this.setupPointsTable();
	}

	getTeamOrder(unorg){
		let ret = ['Category'];
		unorg.sort(function(first, second){
			return first.Total - second.Total;
		});
		for(let i = 0; i < unorg.length; i++){
			ret.push(unorg[i]['TeamID']);
		}
		return ret;
	}

	listTeamNames(){
		let temp = [];
		for(let i = 1; i <= this.numTeams; i++){
		  temp.push(this.fullTeamNames[i]);
		}
		return temp;
	  }
	
	shiftData(dic){
		let week = this.getWeeksPlayed();
		let res = [];
		for(let k of this.scoringCategories){
			let temp = {};
			for(let j = 0; j < this.numTeams; j++){
				temp['Category'] = this.categoryNames[k.categoryNum];
				temp[this.teamIDs[j + 1]] = dic[j][this.categoryNames[k.categoryNum]]
			}
			res.push(temp);
		}
		let flag = false;
		let keys = Object.keys(dic[0]);
		for(let k of keys){
			if(k == 'Total'){
				flag = true;
			}
		}
		if(flag){
			let total = {};
			for(let j = 0; j < this.numTeams; j++){
				total['Category'] = 'Total'
				total[this.teamIDs[j+1]] = dic[j]['Total'];
			}
			res.push(total);
		}

		// Create items array
		var items = Object.keys(res[res.length - 1]).map(function(key) {
			return [key, res[res.length - 1][key]];
  		});
  
  		// Sort the array based on the second element
  		items.sort(function(first, second) {
			return second[1] - first[1];
  		});

		let final = {}
		for(let i = 0; i < items.length; i++){
			final[items[i][0].toString()] = items[i][1];
		}
		res[res.length - 1] = final

		res.sort(function(first, second){
			return first.Total - second.Total;
		});
		return res;
	}

	getAllRankings(){
		let temp = [];
		for(let i of this.getWeeksPlayed()){
			this.fillData(i);

			let weekScores = this.getWeekStats(this.weekIds[0], this.weekIds[this.weekIds.length - 1]);
			let displayScores = this.fullStatsToDisplay(weekScores);
			let ranked = this.getRankingsEachCategory(displayScores);
			let rankedDisplay = this.toOverallRankings(ranked);

			temp.push(rankedDisplay);
		}
		return temp;
	}

	getExpectedWins(team){
		let rankings = this.getAllRankings();
		let sum: number = 0;
		for(let i = 0; i < rankings.length; i++){
			let total: number = 0;
			let count: number = 0;
			for(let j = 0; j < this.numTeams; j++){
				if(rankings[i][j]['TeamID'] == team){
					total = rankings[i][j]['Total'];
				}
			}
			for(let j = 0; j < this.numTeams; j++){
				if(rankings[i][j]['TeamID'] != team){
					if(rankings[i][j]['Total'] < total){
						count += 1;
					}
					else if(rankings[i][j]['Total'] == total){
						count += 0.5;
					}
				}
			}
			sum += (count / (this.numTeams - 1));
		}
		return sum;
	}

	getWeeksPlayed(){
		let count = 0;
		let temp = [];
		for(let i = 0; i < this.currentWeek; i++){
			let flag = true;
			for(let j = 0; j < (this.numTeams / 2); j++){
				if(this.scoreboardItems['schedule'][count + j]['winner'] == 'UNDECIDED'){
					flag = false;
					break;
				}
			}
			if(flag){
				temp.push(i);
			}
			count += (this.numTeams / 2);
		}
		return temp;
	}

	getAllxWins(){
		let result = [];
		for(let i = 1; i < this.numTeams + 1; i++){
			let res = {};
			let team = this.teamIDs[i];
			res[team] = this.getExpectedWins(team);
			result.push(res);
		}
		return result;
	}

	getOverallRecords(){
		let res = [];
		for(let i = 0; i < this.numTeams; i++){
			let temp = {};
			temp['TeamID'] = this.teamIDs[i + 1];
			temp['Wins'] = this.scoreboardItems['teams'][i]['record']['overall']['wins'];
			temp['Losses'] = this.scoreboardItems['teams'][i]['record']['overall']['losses'];
			temp['Ties'] = this.scoreboardItems['teams'][i]['record']['overall']['ties'];
			res.push(temp);
		}
		return res;
	}

	getWinTableData(){
		let records = this.getOverallRecords();
		let xWins = this.getAllxWins();
		let res = [];
		for(let i = 0; i < xWins.length; i++){
			let temp = {};
			temp['TeamID'] = this.teamIDs[i + 1];
			temp['xWins'] = xWins[i][this.teamIDs[i+1]];
			temp['Wins'] = records[i]['Wins'];
			temp['Losses'] = records[i]['Losses'];
			temp['Ties'] = records[i]['Ties'];
			temp['Games'] = (temp['Ties'] + temp['Wins'] + temp['Losses']);
			temp['NetWins'] = temp['Wins'] + (0.5 * temp['Ties']);
			temp['WinsAboveX'] = (temp['NetWins'] - temp['xWins']);

			let id = temp['TeamID'];
			let rec = "" + temp['Wins'] + "-" + temp['Losses'] + '-' + temp['Ties'] + "";
			let pct = Number(this.getPct(temp['Wins'], temp['Losses'], temp['Ties'])).toFixed(3);
			let xRec = Number(temp['xWins'] / temp['Games']).toFixed(3);
			let WAX = Number(temp['WinsAboveX']).toFixed(3);
			let real = {TeamID: id, Record: rec, WinPct: pct, xRecord: xRec, WinsAboveExpected: WAX};
			res.push(real);
		}
		res.sort(function(first, second){
			return second.WinPct - first.WinPct;
		});
		return res;
	}

	getBubbleData(){
		let ret = [];
		let rankings = this.getAllRankings();
		let week = this.getWeeksPlayed();

		for(let i = 0; i < this.numTeams; i++){
			let temp = {};
			temp['name'] = this.teamIDs[i + 1];
			temp['series'] = [];
			let count = 0;
			for(let j of week){
				temp['series'][count] = {};
				temp['series'][count]['name'] = "Week " + (j + 1);
				temp['series'][count]['x'] = (j + 1);
				temp['series'][count]['r'] = 2;
				for(let k = 0; k < this.numTeams; k++){
					if(rankings[count][k]['TeamID'] == this.teamIDs[i + 1]){
						temp['series'][count]['y'] = rankings[count][k]['Total'];
					}
				}
				count ++;
			}
			ret.push(temp);
		}
		return ret;
	}

	getWeeklyAverages(){
		let rankings = this.getAllRankings();
		let temp = [];
		for(let i = 0; i < rankings.length; i++){
			let total = 0;
			for(let j = 0; j < this.numTeams; j++){
				total += rankings[i][j]['Total'];
			}
			temp.push(total / this.numTeams);
		}
		return temp
	}

	getBubbleDataAvg(){
		let ret = [];
		let rankings = this.getAllRankings();
		let avg = this.getWeeklyAverages();
		let week = this.getWeeksPlayed();

		for(let i = 0; i < this.numTeams; i++){
			let temp = {};
			temp['name'] = this.teamIDs[i + 1];
			temp['series'] = [];
			let count = 0;

			for(let j of week){
				temp['series'][count] = {};
				temp['series'][count]['name'] = "Week " + (j + 1);
				temp['series'][count]['x'] = (j + 1);
				temp['series'][count]['r'] = 2;
				for(let k = 0; k < this.numTeams; k++){
					if(rankings[count][k]['TeamID'] == this.teamIDs[i + 1]){
						temp['series'][count]['y'] = (rankings[count][k]['Total'] - avg[count]);
					}
				}
				count ++;
			}
			ret.push(temp);
		}
		return ret;
	}

	getMinimum(data, axis){
		let min = data[0]['series'][0][axis];
		let week = this.getWeeksPlayed();
		for(let i = 0; i < this.numTeams; i++){
			let count = 0;
			for(let j in week){
				if(data[i]['series'][count][axis] < min){
					min = data[i]['series'][count][axis];
				}
				count ++;
			}
		}
		return min;
	}

	getPct(wins, losses, ties){
		return (((2 * wins) + ties) / (2 * (wins + losses + ties)));
	}

	setCurrentSelected(truth){
		this.currentSelected = truth;
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
			else if(this.scoringCategories[i].categoryNum == 9){
				trackedCategories.indexOf(8) === -1 ? trackedCategories.push(8) : null;
				trackedCategories.indexOf(0) === -1 ? trackedCategories.push(0) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 17){
				trackedCategories.indexOf(0) === -1 ? trackedCategories.push(0) : null;
				trackedCategories.indexOf(1) === -1 ? trackedCategories.push(1) : null;
				trackedCategories.indexOf(10) === -1 ? trackedCategories.push(10) : null;
				trackedCategories.indexOf(12) === -1 ? trackedCategories.push(12) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 18){
				trackedCategories.indexOf(0) === -1 ? trackedCategories.push(0) : null;
				trackedCategories.indexOf(1) === -1 ? trackedCategories.push(1) : null;
				trackedCategories.indexOf(8) === -1 ? trackedCategories.push(8) : null;
				trackedCategories.indexOf(10) === -1 ? trackedCategories.push(10) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 71){
				trackedCategories.indexOf(68) === -1 ? trackedCategories.push(68) : null;
				trackedCategories.indexOf(69) === -1 ? trackedCategories.push(69) : null;
				trackedCategories.indexOf(72) === -1 ? trackedCategories.push(72) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 55){
				trackedCategories.indexOf(53) === -1 ? trackedCategories.push(53) : null;
				trackedCategories.indexOf(33) === -1 ? trackedCategories.push(33) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 59){
				trackedCategories.indexOf(57) === -1 ? trackedCategories.push(57) : null;
				trackedCategories.indexOf(58) === -1 ? trackedCategories.push(58) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 38){
				trackedCategories.indexOf(37) === -1 ? trackedCategories.push(37) : null;
				trackedCategories.indexOf(35) === -1 ? trackedCategories.push(35) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 43){
				trackedCategories.indexOf(37) === -1 ? trackedCategories.push(37) : null;
				trackedCategories.indexOf(35) === -1 ? trackedCategories.push(35) : null;
				trackedCategories.indexOf(39) === -1 ? trackedCategories.push(39) : null;
				trackedCategories.indexOf(42) === -1 ? trackedCategories.push(42) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 49){
				trackedCategories.indexOf(48) === -1 ? trackedCategories.push(48) : null;
				trackedCategories.indexOf(34) === -1 ? trackedCategories.push(34) : null;
			}
			else if(this.scoringCategories[i].categoryNum == 82){
				trackedCategories.indexOf(48) === -1 ? trackedCategories.push(48) : null;
				trackedCategories.indexOf(53) === -1 ? trackedCategories.push(53) : null;
			}
			else{
				trackedCategories.push(this.scoringCategories[i].categoryNum);
			}
		}
		return trackedCategories;
	}

  getWeekSelected(week){
    this.weekIds = [];
	for(let i = ((week) * (this.numTeams / 2)); i < ((week + 1) * (this.numTeams / 2)); i++){
		this.weekIds.push(i);
	}
    return this.weekIds;
  }

	onSelectClick(val){
		this.currentWeek = this.scoreboardItems['status']['currentMatchupPeriod'];
		this.chosen = true;

    	this.selectedWeek = this.convertWeek(val.value);

    	this.getWeekSelected(this.selectedWeek);
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
			this.fillData(this.selectedWeek);
		}
	}

  convertWeek(value){
    let selected;

    if(this.isNumber(value)){
      selected = value;
    }
    else{
      selected = value.substring(0,2).trim();
    }

	if(selected == this.currentWeek){
		this.currentSelected = true;
	}
	else{
		this.currentSelected = false;
	}

	selected = parseInt(selected) - 1;
	this.selectedWeek = selected;
    return selected;
  }

  isNumber(value){
    return typeof value === 'number' && isFinite(value);
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
      		let maxWeek = this.settingsItems['settings']['scheduleSettings']['matchupPeriodCount'];
			for(let i = 1; i <= maxWeek; i++){
        		if(i == this.currentWeek){
          			this.allWeeks.push((i) + " (current week)")
        		}
        		else{
					  this.allWeeks.push(i);
        		}
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

  getStatsForTeam(teamId, week){
	if(week <= this.currentWeek){
    	this.fillData(week);
    	let temp;
    	for(let i = 0; i < this.numTeams; i++){
      		if(this.displayWeekScores[i]['TeamID'] == this.teamIDs[teamId]){
        		temp = this.displayWeekScores[i];
      		}
    	}
    	return temp;
	}
  }

  getAverage(week){
	if(week <= this.currentWeek){
    	this.getWeekSelected(week);
    	this.fillData(week);
    	let temp = {};
    	for(let i of this.scoringCategories){
      		temp[this.categoryNames[i.categoryNum]] = 0;
    	}
    	for(let i of this.scoringCategories){
      		for(let j = 0; j < this.numTeams; j++){
        		temp[this.categoryNames[i.categoryNum]] += this.displayWeekScores[j][this.categoryNames[i.categoryNum]];
      		}
      		if(i.categoryNum == 41 || i.categoryNum == 47 || i.categoryNum == 2 || i.categoryNum == 17
				|| i.categoryNum == 9 || i.categoryNum == 18 || i.categoryNum == 71 || i.categoryNum == 55
				|| i.categoryNum == 59 || i.categoryNum == 38 || i.categoryNum == 43
				|| i.categoryNum == 49 || i.categoryNum == 82){
				let x = temp[this.categoryNames[i.categoryNum]] / this.numTeams
        		temp[this.categoryNames[i.categoryNum]] = +Number(x).toFixed(3);
      		}
      		else{
        		temp[this.categoryNames[i.categoryNum]] = Math.round(temp[this.categoryNames[i.categoryNum]] / this.numTeams);
      		}
    	}
    	return temp;
	}
  }

	getWeekStats(start, end){
		let weekStats = [];
		let teamScores = [];
		let tempIds = [];
		for(let i = start; i <= end; i++){
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
							let x = fullStats[j]['H'] / fullStats[j]['AB'];
							displayStats[this.categoryNames[2]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[2]] = 0;
						}
					}
					if(i.categoryNum == 17){
						//IS 'AB' Plate Appearances or At Bats?????
						if(fullStats[j]['AB'] != 0){
							let x = ((fullStats[j]['H'] + fullStats[j]['BB'] + fullStats[j]['HBP']) / fullStats[j]['AB']);
							displayStats[this.categoryNames[17]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[17]] = 0;
						}
					}
					if(i.categoryNum == 9){
						if(fullStats[j]['AB'] != 0){
							let x = (fullStats[j]['TB']) / fullStats[j]['AB'];
							displayStats[this.categoryNames[9]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[9]] = 0;
						}
					}
					if(i.categoryNum == 18){
						if(fullStats[j]['AB'] != 0){
							let x = ((fullStats[j]['H'] + fullStats[j]['BB']) / fullStats[j]['AB']) + (fullStats[j]['TB'] / fullStats[j]['AB']);
							displayStats[this.categoryNames[18]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[18]] = 0;
						}
					}
					if(i.categoryNum == 71){
						if(fullStats[j]['PO'] != 0 || fullStats[j]['A'] != 0){
							let num = (fullStats[j]['PO']) + fullStats[j]['A'];
							let dom = num + fullStats[j]['E'];
							displayStats[this.categoryNames[71]] = +Number((num / dom)).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[71]] = 0;
						}
					}
					if(i.categoryNum == 55){
						if(fullStats[j]['W'] != 0 || fullStats[j]['GS'] != 0){
							let x = fullStats[j]['W'] / fullStats[j]['GS'];
							displayStats[this.categoryNames[55]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[55]] = 0;
						}
					}
					if(i.categoryNum == 59){
						if(fullStats[j]['SV'] != 0 || fullStats[j]['BS'] != 0){
							let x = fullStats[j]['SV'] / (fullStats[j]['SV'] + fullStats[j]['BS']);
							displayStats[this.categoryNames[59]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[59]] = 0;
						}
					}
					if(i.categoryNum == 38){
						if(fullStats[j]['BF'] != 0){
							let x = fullStats[j]['HA'] / fullStats[j]['BF'];
							displayStats[this.categoryNames[38]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[38]] = 0;
						}
					}
					if(i.categoryNum == 43){
						if(fullStats[j]['BF'] != 0){
							let x = (fullStats[j]['HA'] + fullStats[j]['BBA'] + fullStats[j]['HBPP']) / fullStats[j]['BF'];
							displayStats[this.categoryNames[43]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[43]] = 0;
						}
					}
					if(i.categoryNum == 49){
						if(fullStats[j]['O'] != 0){
							let x = (fullStats[j]['K'] / fullStats[j]['O']) * 27;
							displayStats[this.categoryNames[49]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[49]] = 0;
						}
					}
					if(i.categoryNum == 82){
						if(fullStats[j]['K'] != 0 && fullStats[j]['W'] == 0){
							displayStats[this.categoryNames[82]] = 'INF';
						}
						else if(fullStats[j]['K'] != 0 && fullStats[j]['W'] != 0){
							let x = fullStats[j]['K'] / fullStats[j]['W'];
							displayStats[this.categoryNames[82]] = +Number(x).toFixed(3);
						}
						else{
							displayStats[this.categoryNames[82]] = 0;
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
							let x = ((fullStats[j]['HA'] + fullStats[j]['BBA']) / fullStats[j]['O']) * 3;
							displayStats[this.categoryNames[41]] = +Number(x).toFixed(3);
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
							let x = (fullStats[j]['ER'] / fullStats[j]['O']) * 27;
							displayStats[this.categoryNames[47]] = +Number(x).toFixed(3);
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

		/*
		changed.sort(function(first, second){
			return second.Total - first.Total;
		});
		*/

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

  getPieChartData(week, playerID){
    this.getWeekSelected(week);
	if(week < this.currentWeek){
    	this.fillData(week);
	}

    let temp = [];
    let stats;

    for(let i = 0; i < this.numTeams; i++){
      if(this.rankedDisplay[i]['TeamID'] == this.teamIDs[playerID]){
        stats = this.rankedDisplay[i];
      }
    }

    let keys = Object.keys(stats);
    for(let i = 1; i < keys.length - 1; i++){
      let s = {};
      s['name'] = keys[i];
      s['value'] = stats[keys[i]]
      temp.push(s);
    }

    return temp;
  }

	getAverageByCategory(categoryName){
		let list = [];
		let week = this.getWeeksPlayed();
		
		let rawScores = this.fullStatsToDisplay(this.getWeekStats((week[0] * (this.numTeams / 2)), ((this.numTeams / 2) * (week[week.length - 1] + 1) - 1)));
		let allScores = {};
		for(let i = 0; i < this.currentWeek - 1; i++){
			let temp = [];
			for(let j = 0; j < this.numTeams; j++){
				temp.push(rawScores[0]);
				rawScores.shift();
			}
			allScores[i] = temp;
		}
  
		let count = 0;
		for(let i of week){
			let l = {}
			l['name'] = "Week " + (i + 1);
			let sum = 0;
			for(let j = 0; j < this.numTeams; j++){
				sum += allScores[count][j][categoryName];
			}
			if(categoryName == 'ERA' || categoryName == 'WHIP' || categoryName == 'BA' || 
			categoryName == 'OBP' || categoryName == 'OPS' || categoryName == 'SLG' || categoryName == 'FPCT'
			|| categoryName == 'WPCT' || categoryName == 'SVPCT' || categoryName == 'BAA' || categoryName == 'OBPA'
			|| categoryName == 'KN' || categoryName == 'KW'){
				let x = sum / this.numTeams;
				l['value'] = +Number(x).toFixed(3);
			}
			else{
				let x = sum / this.numTeams;
				l['value'] = +Number(x).toFixed(0);
			}
			count ++;
			list.push(l);
		}
  
		let formatted = {};
		formatted['name'] = 'League Average';
		formatted['series'] = list;
  
		return formatted;
	}

  getStatsByCategory(categoryName, teamId){
	  let list = [];
	  let week = this.getWeeksPlayed();
	  let rawScores = this.fullStatsToDisplay(this.getWeekStats((week[0] * (this.numTeams / 2)), ((this.numTeams / 2) * (week[week.length - 1] + 1) - 1)));
	  let allScores = {};
	  
	  for(let i = 0; i < this.currentWeek - 1; i++){
		  let temp = [];
		  for(let j = 0; j < this.numTeams; j++){
			  temp.push(rawScores[0]);
			  rawScores.shift();
		  }
		  allScores[i] = temp;
	  }

	  let oppList: any[] = [];
	  let count = 0;
	  for(let i of week){
		  let oppId: string;
		  let l = {}
		  let o ={};

		  l['name'] = "Week " + (i + 1);
		  o['name'] = 'Week ' + (i + 1);
		  for(let j = 0; j < this.numTeams; j++){
			  if(allScores[count][j]['TeamID'] == this.teamIDs[teamId]){
				  let oppIndex = 0;
				  if(j % 2 == 0){
					oppIndex = j + 1;
				  }
				  else{
					  oppIndex = j - 1;
				  }
				  l['value'] = allScores[count][j][categoryName];
				  o['value'] = allScores[count][oppIndex][categoryName];
			  }
		  }
		  list.push(l);
		  oppList.push(o);
		  count ++;
	  }

	  let formatted = {};
	  formatted['name'] = this.fullTeamNames[teamId];
	  formatted['series'] = list;
	  
	  let res = [formatted];
	  let oppForm = {};
	  oppForm['name'] = "Opponent";
	  oppForm['series'] = oppList;
	  res.push(oppForm);

	  return res;
  }

	rank(arr, category){
		var sorted = arr.slice().sort(function(a,b){return b-a});
		//SEARCH add all other reversed categories!!!
		//Is FC reversed?
		if(category == 'ERA' || category =='WHIP' || category == 'GDP' || category == 'CS'
		|| category == 'FC' || category == 'HA' || category == 'RA' || category == 'ER'
		|| category == 'HRA' || category == 'BBA' || category == 'HBPP' || category == 'L'
		|| category == 'BS' || category == 'BAA' || category == 'OBPA'){}
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
