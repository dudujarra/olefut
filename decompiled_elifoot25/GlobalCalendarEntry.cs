using System;

[Serializable]
public class GlobalCalendarEntry : EliObject
{
	public MatchType matchType;

	public CompetitionType competitionType;

	public Competition competition;

	public CompetitionPhase competitionPhase;

	public int index;

	public int round;

	public bool isLastRound;

	public bool played;

	public GlobalCalendarEntry(MatchType gameType, CompetitionType competitionType, CompetitionPhase competitionPhase, int round, bool isLastRound, bool active)
		: this(gameType, competitionType, competitionPhase, null, round, isLastRound, active)
	{
	}

	public GlobalCalendarEntry(MatchType gameType, CompetitionType competitionType, CompetitionPhase competitionPhase, Competition competition, int round, bool isLastRound, bool active)
		: base(generateID: false)
	{
		matchType = gameType;
		this.competitionType = competitionType;
		this.competition = competition;
		this.competitionPhase = competitionPhase;
		this.round = round;
		this.isLastRound = isLastRound;
		index = 0;
	}

	public override string ToString()
	{
		return string.Format($"[matchType={matchType}, competitionType={competitionType}, competitionPhase={competitionPhase}, round={round}]");
	}

	public string GetTitle()
	{
		string text = competitionType.ToString().ToUpper();
		string text2 = ((competition == null) ? LanguageController.instance.Get_Translation("COMPETITION_TYPE_" + text) : competition.GetName());
		_ = $"CALENDAR_ENTRY";
		string text3 = null;
		switch (competitionPhase)
		{
		case CompetitionPhase.GroupStage:
			return LanguageController.instance.Get_Translation("CALENDAR_ENTRY_DESC_" + text, text2, round.ToString());
		case CompetitionPhase.Playoffs:
			return LanguageController.instance.Get_Translation("COMPETITION_PLAYOFFS", round);
		case CompetitionPhase.FinalPhase:
		{
			string text4 = $"COMPETITION_FINALPHASE_{round}";
			if (LanguageController.instance.Get_Translation(text4).CompareTo(text4) == 0)
			{
				text4 = "COMPETITION_FINALPHASE_ALL";
			}
			string text5 = LanguageController.instance.Get_Translation(text4, round, round * 2);
			return text2 + " " + text5;
		}
		default:
			throw new Exception("Not implemented. At GlobalCalendarEntry.GetTitle().");
		}
	}

	public void CupDraw()
	{
		foreach (Competition allCompetition in DataManager.instance.allCompetitions)
		{
			if (allCompetition.competitionType == competitionType)
			{
				allCompetition.CupDraw(competitionPhase);
			}
		}
	}
}
