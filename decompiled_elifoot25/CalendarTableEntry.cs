using System;

[Serializable]
public class CalendarTableEntry : EliObject
{
	public MatchType matchType;

	public CompetitionType competitionType;

	public Competition competition;

	public int round = -1;

	public bool played;

	public Team team1;

	public Team team2;

	public bool home1;

	public bool home2;

	public int goalsFor1 = -1;

	public int goalsFor2 = -1;

	public int goalsAgainst1 = -1;

	public int goalsAgainst2 = -1;

	public CalendarTableEntry(TeamCalendarEntry calEntry1, TeamCalendarEntry calEntry2)
		: base(generateID: false)
	{
		if (calEntry1 != null)
		{
			round = calEntry1.round;
			played = calEntry1.played;
			team1 = calEntry1.opponent;
			home1 = calEntry1.isHome;
			goalsFor1 = calEntry1.goalsFor;
			goalsAgainst1 = calEntry1.goalsAgainst;
		}
		if (calEntry2 != null)
		{
			round = calEntry2.round;
			played = calEntry2.played;
			team2 = calEntry2.opponent;
			home2 = calEntry2.isHome;
			goalsFor2 = calEntry2.goalsFor;
			goalsAgainst2 = calEntry2.goalsAgainst;
		}
	}

	protected override string GetDumpHeader()
	{
		return "Round;Team1;H/A;Score1;Team2;H/A;Score2";
	}

	protected override string GetDumpRow()
	{
		return Util.MakeCSV(';', round, (team1 == null) ? "NULL" : team1.Name, home1 ? "H" : "A", played ? $"{goalsFor1}-{goalsAgainst1}" : "", (team2 == null) ? "NULL" : team2.Name, home2 ? "H" : "A", played ? $"{goalsFor2}-{goalsAgainst2}" : "");
	}
}
