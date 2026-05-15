using System;

[Serializable]
public class TeamCalendarEntry : EliObject
{
	public Team opponent;

	public MatchType matchType;

	public CompetitionType competitionType;

	public Competition competition;

	public int index;

	public int round;

	public int goalsFor;

	public int goalsAgainst;

	public bool played;

	public bool skipRound;

	public bool isHome;

	public bool afterExtraTime;

	public bool penaltyShootout;

	public TeamCalendarEntry(GlobalCalendarEntry fromGlobalEntry, Team opponent, bool isHome)
		: base(generateID: false)
	{
		index = fromGlobalEntry.index;
		this.opponent = opponent;
		this.isHome = isHome;
		matchType = fromGlobalEntry.matchType;
		competition = fromGlobalEntry.competition;
		competitionType = fromGlobalEntry.competitionType;
		round = fromGlobalEntry.round;
		goalsFor = (goalsAgainst = 0);
		played = (skipRound = (afterExtraTime = (penaltyShootout = false)));
	}

	protected override string GetDumpHeader()
	{
		return "Round;Opponent;H/A;Score";
	}

	protected override string GetDumpRow()
	{
		return Util.MakeCSV(';', round.ToString(), (opponent == null) ? "NULL" : opponent.Name, isHome ? "H" : "A", played ? $"{goalsFor}-{goalsAgainst}" : "");
	}
}
