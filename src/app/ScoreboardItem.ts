export interface ScoreboardItem{
	away: Match,
	home: Match,
	id: number
}

export interface Match{
    teamId: number,
    cumulativeScore: Score[]
}

export interface Score{
    scoresByStat: Category
}

export interface Category{
	
}