using System;

[Serializable]
public class TeamCompetitionData
{
	public int leaguePosition;

	public int points;

	public int matchesPlayed;

	public int matchesWon;

	public int matchesDrawn;

	public int matchesLost;

	public int goalsFor;

	public int goalsAgainst;

	public int goalsFirstLeg;

	public DataManager.IsInCup isInCup;

	public int cupOrder;

	public int[] leagueRoundPositions = new int[38];

	public TeamCompetitionData()
	{
		Reset();
	}

	public void Reset()
	{
		leaguePosition = 0;
		points = 0;
		matchesPlayed = 0;
		matchesWon = 0;
		matchesDrawn = 0;
		matchesLost = 0;
		goalsFor = 0;
		goalsAgainst = 0;
		goalsFirstLeg = 0;
		isInCup = DataManager.IsInCup.NotPresent;
		cupOrder = -1;
		leagueRoundPositions = new int[38];
	}
}
