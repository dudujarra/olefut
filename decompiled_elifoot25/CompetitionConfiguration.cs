using System;

[Serializable]
public struct CompetitionConfiguration
{
	public readonly CompetitionConverage competitionConverage;

	public bool[] competitionPhasesPlayed;

	public readonly DivisionStructure divisionStructure;

	public readonly DivisionNamesRule divisionNamesRule;

	public CompetitionPrizeRule prizeRule;

	public CompetitionStrikersCriteria strikersCriteria;

	public readonly int rankPointsFactor;

	public readonly int teamsPerDivision;

	public readonly float prizeMoneyFactor;

	public readonly float attendanceFactor;

	public readonly float ticketPriceFactor;

	public CompetionWinnerCriteria winnerCriteria;

	public CompetitionNamesRule competitionNamesRule;

	private string namesRuleParameter;

	public int sortOrder;

	public EndOfSeasonActions endOfSeasonActions;

	public CompetitionConfiguration(CompetitionConverage competitionConverage, bool[] competitionPhasesPlayed, DivisionStructure divisionStructure, DivisionNamesRule divisionNamesRule, CompetitionPrizeRule prizeRule, CompetitionStrikersCriteria strikersCriteria, int teamsPerDivision, int sortOrder, int rankPointsFactor, float prizeMoneyFactor, float attendanceFactor, float ticketPriceFactor, EndOfSeasonActions endOfSeasonActions)
	{
		this.competitionConverage = competitionConverage;
		this.competitionPhasesPlayed = competitionPhasesPlayed;
		this.divisionStructure = divisionStructure;
		this.divisionNamesRule = divisionNamesRule;
		this.prizeRule = prizeRule;
		this.strikersCriteria = strikersCriteria;
		this.teamsPerDivision = teamsPerDivision;
		this.sortOrder = sortOrder;
		this.rankPointsFactor = rankPointsFactor;
		this.prizeMoneyFactor = prizeMoneyFactor;
		this.attendanceFactor = attendanceFactor;
		this.ticketPriceFactor = ticketPriceFactor;
		this.endOfSeasonActions = endOfSeasonActions;
		winnerCriteria = ((!this.competitionPhasesPlayed[2]) ? CompetionWinnerCriteria.League : CompetionWinnerCriteria.Cup);
		competitionNamesRule = CompetitionNamesRule.Standard;
		namesRuleParameter = null;
		if (!this.competitionPhasesPlayed[1] && !this.competitionPhasesPlayed[2])
		{
			throw new Exception("Invalid competition configuration");
		}
	}

	public void SetRules(CompetitionNamesRule competitionNamesRule, string namesRuleParameter, CompetitionPrizeRule competitionPrizeRule)
	{
		this.competitionNamesRule = competitionNamesRule;
		this.namesRuleParameter = namesRuleParameter;
		prizeRule = competitionPrizeRule;
	}

	public bool IsPhasePlayed(CompetitionPhase competitionPhase)
	{
		return competitionPhasesPlayed[(int)competitionPhase];
	}
}
