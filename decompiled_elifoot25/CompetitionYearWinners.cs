using System;

[Serializable]
public class CompetitionYearWinners
{
	public Competition competition;

	public Podium podium;

	public CompetitionYearWinners(Competition competition, Podium podium)
	{
		this.competition = competition;
		this.podium = podium;
	}
}
