using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class Competition : EliObject
{
	private int[] competitionSubtypeRankPointsFactors = new int[9] { 1, 5, 4, 5, 4, 4, 3, 3, 2 };

	private int[] competitionSubtypePrizeFactors = new int[9] { 1, 5, 4, 5, 4, 4, 3, 3, 2 };

	public CompetitionConfiguration configuration;

	public ListOfDivisions divisions = new ListOfDivisions();

	public ListOfTeams allCompetitionTeams = new ListOfTeams();

	public ListOfTeams supernumeraryTeams = new ListOfTeams();

	public ListOfTeams[] phaseTeams;

	public int[] firstRoundPlayed;

	public readonly Confederation confederation;

	public readonly RegionalFederation regionalFederation;

	public readonly Country country;

	public readonly Region region;

	public readonly CompetitionType competitionType;

	public readonly CompetitionSubtype competitionSubtype;

	public int podiumLength = 1;

	public List<CompetitionQualification> competitionQualifications = new List<CompetitionQualification>();

	private string nameWithLineBreaks;

	private string nameNoLineBreaks;

	private string shortName;

	public ListOfPlayers strikers = new ListOfPlayers();

	private int teamPreselectedReduceTo;

	public CompetitionPhase activePhase;

	public Podium podium;

	public bool terminated;

	private double moneyRatio = 1.0;

	private int averageSkill = DataManager.PLAYER_SKILL_MAX / 2;

	private long ticketPrice = 1L;

	public EliLimitedList lastWinners = new EliLimitedList(DataManager.LAST_WINNERS_LENGTH_MAX);

	public static Dictionary<CompetitionType, CompetitionConfiguration> competitionConfigurations = new Dictionary<CompetitionType, CompetitionConfiguration>
	{
		{
			CompetitionType.NationalLeague,
			new CompetitionConfiguration(CompetitionConverage.Country, new bool[3] { false, true, false }, DivisionStructure.Hierarchic, DivisionNamesRule.Division, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.PerDivision, 0, 2, 10, 1f, 1f, 1f, new EndOfSeasonActions(removeAllTeams: false, clearTeamsInPhases: false))
		},
		{
			CompetitionType.SuperLeague,
			new CompetitionConfiguration(CompetitionConverage.WorldWide, new bool[3] { false, true, false }, DivisionStructure.Hierarchic, DivisionNamesRule.Division, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.PerDivision, 0, 2, 30, 3f, 2f, 2f, new EndOfSeasonActions(removeAllTeams: false, clearTeamsInPhases: false))
		},
		{
			CompetitionType.RegionalLeague,
			new CompetitionConfiguration(CompetitionConverage.Region, new bool[3] { false, false, true }, DivisionStructure.Groups, DivisionNamesRule.Group, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.Global, 4, 6, 1, 0.3f, 0.8f, 0.6f, new EndOfSeasonActions(removeAllTeams: false, clearTeamsInPhases: true))
		},
		{
			CompetitionType.NationalCup,
			new CompetitionConfiguration(CompetitionConverage.Country, new bool[3] { false, false, true }, DivisionStructure.None, DivisionNamesRule.None, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.Global, 0, 3, 4, 0.5f, 1.2f, 1.2f, new EndOfSeasonActions(removeAllTeams: false, clearTeamsInPhases: true))
		},
		{
			CompetitionType.LeagueCup,
			new CompetitionConfiguration(CompetitionConverage.Country, new bool[3] { false, false, true }, DivisionStructure.Groups, DivisionNamesRule.Group, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.Global, 0, 5, 2, 0.2f, 0.6f, 0.7f, new EndOfSeasonActions(removeAllTeams: true, clearTeamsInPhases: true))
		},
		{
			CompetitionType.InternationalLeague,
			new CompetitionConfiguration(CompetitionConverage.Confederation, new bool[3] { false, false, true }, DivisionStructure.Groups, DivisionNamesRule.Group, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.Global, 0, 1, 40, 1f, 1.4f, 2f, new EndOfSeasonActions(removeAllTeams: true, clearTeamsInPhases: true))
		},
		{
			CompetitionType.NationalSuperCup,
			new CompetitionConfiguration(CompetitionConverage.Country, new bool[3] { false, false, true }, DivisionStructure.None, DivisionNamesRule.None, CompetitionPrizeRule.BySubtype, CompetitionStrikersCriteria.None, 0, 3, 1, 0.5f, 0.8f, 0.7f, new EndOfSeasonActions(removeAllTeams: true, clearTeamsInPhases: true))
		},
		{
			CompetitionType.InternationalSuperCup,
			new CompetitionConfiguration(CompetitionConverage.Confederation, new bool[3] { false, false, true }, DivisionStructure.None, DivisionNamesRule.None, CompetitionPrizeRule.Standard, CompetitionStrikersCriteria.None, 0, 2, 15, 1f, 1f, 1.4f, new EndOfSeasonActions(removeAllTeams: true, clearTeamsInPhases: true))
		}
	};

	public long TicketPrice => ticketPrice;

	public Competition(CompetitionType competitionType, CompetitionSubtype competitionSubtype, string namesRuleParameter, Confederation confederation = null, RegionalFederation regionalFederation = null, Country country = null, Region region = null)
		: base(generateID: true)
	{
		this.competitionType = competitionType;
		this.competitionSubtype = competitionSubtype;
		configuration = competitionConfigurations[competitionType];
		configuration.SetRules(configuration.competitionNamesRule, namesRuleParameter, configuration.prizeRule);
		this.confederation = confederation;
		this.regionalFederation = regionalFederation;
		this.country = country;
		this.region = region;
		switch (configuration.winnerCriteria)
		{
		case CompetionWinnerCriteria.Cup:
			podiumLength = 2;
			break;
		case CompetionWinnerCriteria.League:
			podiumLength = 3;
			break;
		default:
			throw new Exception("CompetionWinnerCriteria not defined - Competition()");
		}
		podium = new Podium(podiumLength);
		phaseTeams = new ListOfTeams[Enum.GetValues(typeof(CompetitionPhase)).Length];
		firstRoundPlayed = new int[Enum.GetValues(typeof(CompetitionPhase)).Length];
		for (int i = 0; i < phaseTeams.Length; i++)
		{
			phaseTeams[i] = new ListOfTeams();
		}
		for (int j = 0; j < firstRoundPlayed.Length; j++)
		{
			firstRoundPlayed[j] = 0;
		}
	}

	public void Initialize()
	{
		if (allCompetitionTeams.Count == 1)
		{
			DeleteCompetition();
			return;
		}
		Division division = null;
		switch (competitionType)
		{
		case CompetitionType.NationalLeague:
		case CompetitionType.SuperLeague:
		{
			int num = DataManager.instance.TeamsPerDivision(competitionType);
			int num2 = Mathf.Min(allCompetitionTeams.Count / num, ElifootOptions.numDivisionsLeagueMax[(int)competitionType]);
			int num3 = 0;
			bool flag = true;
			bool flag2 = allCompetitionTeams.Count < num;
			if (flag2)
			{
				DeleteCompetition();
				return;
			}
			switch (competitionType)
			{
			case CompetitionType.NationalLeague:
				allCompetitionTeams.SortByInitOrder(includeRegionCode: false);
				break;
			case CompetitionType.SuperLeague:
				allCompetitionTeams.SortByInitLevelDesc();
				break;
			default:
				throw new NotImplementedException($"Competition type not implemented: {competitionType}. Competition.Initialize(), @Teams sort");
			}
			foreach (Team allCompetitionTeam in allCompetitionTeams)
			{
				if (flag2)
				{
					supernumeraryTeams.Add(allCompetitionTeam);
					continue;
				}
				if (flag)
				{
					num3++;
					division = new Division(this, num3, 1);
					AddDivision(division);
				}
				division.AddTeam(allCompetitionTeam);
				phaseTeams[1].Add(allCompetitionTeam);
				flag2 = divisions.Count == num2 && division.teams.Count == num;
				flag = !flag2 && division.teams.Count == num;
			}
			if (competitionType == CompetitionType.NationalLeague)
			{
				SetDivisionsTargetSkill();
			}
			break;
		}
		default:
			throw new NotImplementedException($"Competition type not implemented: {competitionType}. Competition.Initialize().");
		case CompetitionType.RegionalLeague:
		case CompetitionType.NationalCup:
		case CompetitionType.InternationalLeague:
			break;
		}
		activePhase = CompetitionPhase.Playoffs;
		foreach (CompetitionPhase value in Enum.GetValues(typeof(CompetitionPhase)))
		{
			if (configuration.competitionPhasesPlayed[(int)value])
			{
				activePhase = value;
				break;
			}
		}
	}

	public override void LanguageChanged()
	{
		base.LanguageChanged();
		SetName(lineBreaks: true);
		SetName(lineBreaks: false);
		SetShortName();
	}

	public void AddDivision(Division division)
	{
		divisions.Add(division);
		division.Competition = this;
		DataManager.instance.allDivisions.Add(division);
	}

	public void AddTeam(Team team)
	{
		if (!allCompetitionTeams.Contains(team))
		{
			allCompetitionTeams.Add(team);
			team.AddCompetition(this);
		}
	}

	public void RemoveTeam(Team team)
	{
		allCompetitionTeams.Remove(team);
		team.RemoveCompetition(this);
	}

	public void RemoveAllTeams()
	{
		foreach (Team item in new ListOfTeams(allCompetitionTeams))
		{
			RemoveTeam(item);
		}
	}

	private void DeleteCompetition()
	{
		DataManager.instance.allCompetitions.Remove(this);
		foreach (Team allCompetitionTeam in allCompetitionTeams)
		{
			allCompetitionTeam.RemoveCompetition(this);
		}
	}

	public void SetDivisionsTargetSkill()
	{
		if (competitionType == CompetitionType.NationalLeague)
		{
			divisions.SetTargetSkill();
		}
	}

	public void PostLoad(string saveGameVersion)
	{
		base.PostLoad();
		if (saveGameVersion.CompareTo("20200801") <= 0)
		{
			SetDivisionsTargetSkill();
		}
		foreach (CompetitionQualification competitionQualification in competitionQualifications)
		{
			competitionQualification.PostLoad();
		}
		podium.PostLoad();
		foreach (LastWinnersRecord lastWinner in lastWinners)
		{
			lastWinner.PostLoad();
		}
	}

	public void BeginSeason()
	{
		terminated = false;
		CompetitionType competitionType = this.competitionType;
		if ((uint)(competitionType - 1) <= 1u || competitionType == CompetitionType.InternationalLeague)
		{
			phaseTeams[2].AddTeams(allCompetitionTeams);
			allCompetitionTeams.ForEach(delegate(EliObject team)
			{
				((Team)team).CompetitionData(this).isInCup = DataManager.IsInCup.Playing;
			});
			firstRoundPlayed[2] = (int)Mathf.Pow(2f, Mathf.CeilToInt(Mathf.Log(phaseTeams[2].Count, 2f)) - 1);
			CupDraw(CompetitionPhase.FinalPhase);
		}
	}

	public void CupDraw(CompetitionPhase phase)
	{
		ListOfTeams listOfTeams = new ListOfTeams(phaseTeams[(int)phase].FindAll(delegate(EliObject x)
		{
			TeamCompetitionData teamCompetitionData2 = ((Team)x).CompetitionData(this);
			return teamCompetitionData2.isInCup == DataManager.IsInCup.Playing || teamCompetitionData2.isInCup == DataManager.IsInCup.SkipNext;
		}));
		listOfTeams.Shuffle();
		int num = listOfTeams.Count - (int)Mathf.Pow(2f, Mathf.FloorToInt(Mathf.Log(listOfTeams.Count - 1, 2f)));
		for (int num2 = 0; num2 < listOfTeams.Count; num2++)
		{
			TeamCompetitionData teamCompetitionData = listOfTeams.Team(num2).CompetitionData(this);
			teamCompetitionData.goalsFirstLeg = 0;
			if (num2 < num * 2)
			{
				teamCompetitionData.cupOrder = num2;
				teamCompetitionData.isInCup = DataManager.IsInCup.Playing;
			}
			else
			{
				teamCompetitionData.cupOrder = -1;
				teamCompetitionData.isInCup = DataManager.IsInCup.SkipNext;
			}
		}
	}

	public void EndOfSeason()
	{
		supernumeraryTeams.Shuffle();
		switch (configuration.winnerCriteria)
		{
		case CompetionWinnerCriteria.League:
			divisions.EndOfSeason(this);
			break;
		default:
			throw new NotImplementedException("Unrecognized winner criteria " + configuration.winnerCriteria.ToString() + " in Competition.EndOfSeason().");
		case CompetionWinnerCriteria.Cup:
			break;
		}
		if (configuration.endOfSeasonActions.clearTeamsInPhases)
		{
			ListOfTeams[] array = phaseTeams;
			for (int i = 0; i < array.Length; i++)
			{
				array[i].Clear();
			}
			divisions.RemoveAllTeams();
		}
		if (configuration.endOfSeasonActions.removeAllTeams)
		{
			RemoveAllTeams();
		}
	}

	public void CheckNextYearTeams()
	{
		int num = 0;
		foreach (CompetitionQualification competitionQualification in competitionQualifications)
		{
			CompetionWinnerCriteria winnerCriteria = configuration.winnerCriteria;
			if (winnerCriteria == CompetionWinnerCriteria.Cup || winnerCriteria != CompetionWinnerCriteria.League)
			{
				continue;
			}
			ListOfTeams listOfTeams = new ListOfTeams();
			try
			{
				int value = (int)Mathf.Floor((float)divisions.Division(0).teams.Count * competitionQualification.divisionRangeMax);
				value = Mathf.Clamp(value, competitionQualification.numTeamsMin, competitionQualification.numTeamsMax);
				listOfTeams.AddRange(divisions.Division(0).teams.GetRange(num, value));
			}
			catch (Exception)
			{
				continue;
			}
			listOfTeams.SortByLeaguePosition(this);
			try
			{
				foreach (Team item in listOfTeams)
				{
					if (competitionQualification.ExceptInCompetition == null || !competitionQualification.ExceptInCompetition.allCompetitionTeams.Contains(item))
					{
						competitionQualification.ForCompetition.AddTeam(item);
						num++;
					}
				}
			}
			catch (Exception arg)
			{
				Competition competition = DataManager.instance.allCompetitions.FindCompetitionByID(competitionQualification.forCompetitionID);
				Debug.LogError($"Competition.CheckNextYearTeams forCompetitionId: {competitionQualification.forCompetitionID}; competition exists: {competition != null} -> ex: {arg}");
			}
		}
	}

	internal List<Competition> GetQualifyingTeams()
	{
		List<Competition> list = new List<Competition>();
		foreach (CompetitionQualification competitionQualification in competitionQualifications)
		{
			CompetionWinnerCriteria winnerCriteria = configuration.winnerCriteria;
			if (winnerCriteria != CompetionWinnerCriteria.Cup && winnerCriteria == CompetionWinnerCriteria.League)
			{
				int value = (int)Mathf.Floor((float)divisions.Division(0).teams.Count * competitionQualification.divisionRangeMax);
				value = Mathf.Clamp(value, competitionQualification.numTeamsMin, competitionQualification.numTeamsMax);
				value = Mathf.Min(value, divisions.Division(0).teams.Count - 1);
				for (int i = 0; i < value; i++)
				{
					list.Add(competitionQualification.ForCompetition);
				}
			}
		}
		return list;
	}

	private void SetPodiumPlace(int place, Team team, Coach.CoachEvent.CoachEventType coachEventType)
	{
		podium.SetPlace(place, team, team.Coach);
		team.Coach.AddEvent(coachEventType, this);
	}

	public void CheckWinner()
	{
		switch (configuration.winnerCriteria)
		{
		case CompetionWinnerCriteria.League:
			divisions.Division(0).teams.SortBySeasonPoints(this);
			SetPodiumPlace(1, divisions.Division(0).teams.Team(0), Coach.CoachEvent.CoachEventType.CompetitionWon);
			SetPodiumPlace(2, divisions.Division(0).teams.Team(1), Coach.CoachEvent.CoachEventType.CompetitionSecond);
			if (divisions.Division(0).teams.Count > 2)
			{
				SetPodiumPlace(3, divisions.Division(0).teams.Team(2), Coach.CoachEvent.CoachEventType.CompetitionThird);
			}
			AddLastWinnersRecord();
			break;
		default:
			throw new Exception("CompetionWinnerCriteria not defined - Competition.CheckWinner()");
		case CompetionWinnerCriteria.Cup:
			break;
		}
	}

	public void DeclareFinalPhaseWinner(Team firstPlaceTeam, Team secondPlaceTeam)
	{
		terminated = true;
		SetPodiumPlace(1, firstPlaceTeam, Coach.CoachEvent.CoachEventType.CompetitionWon);
		SetPodiumPlace(2, secondPlaceTeam, Coach.CoachEvent.CoachEventType.CompetitionSecond);
		AddLastWinnersRecord();
	}

	private void AddLastWinnersRecord()
	{
		lastWinners.Add(new LastWinnersRecord(DataManager.instance.properties.currentSeasonNumber, podium));
		TeamCoach winner = podium.GetWinner();
		if (winner.Team != null)
		{
			winner.Team.AddCompetitionWon(this);
		}
		if (winner.Coach != null)
		{
			winner.Coach.AddCompetitionWon(this);
		}
	}

	public Sprite CoachEventImage(Coach.CoachEvent.CoachEventType eventType)
	{
		return configuration.winnerCriteria switch
		{
			CompetionWinnerCriteria.Cup => ScreenController.instance.coachCupWinnerImage, 
			CompetionWinnerCriteria.League => eventType switch
			{
				Coach.CoachEvent.CoachEventType.CompetitionWon => ScreenController.instance.coachLeagueWinnerImage, 
				Coach.CoachEvent.CoachEventType.CompetitionSecond => ScreenController.instance.coachLeagueSecondImage, 
				Coach.CoachEvent.CoachEventType.CompetitionThird => ScreenController.instance.coachLeagueThirdImage, 
				_ => throw new NotFiniteNumberException($"Competition.CoachEventImage, League, eventType={eventType}"), 
			}, 
			_ => throw new NotFiniteNumberException($"Competition.CoachEventImage, winnerCriteria={configuration.winnerCriteria}"), 
		};
	}

	public int RankPointsFactor()
	{
		return configuration.rankPointsFactor * competitionSubtypeRankPointsFactors[(int)competitionSubtype];
	}

	public float PrizeMultiplier()
	{
		float num = ((configuration.prizeRule == CompetitionPrizeRule.Standard) ? 1f : ((float)competitionSubtypePrizeFactors[(int)competitionSubtype]));
		return (int)(1f * configuration.prizeMoneyFactor * num);
	}

	public long PrizeMoneyValue(Coach.CoachEvent.CoachEventType eventType, params object[] args)
	{
		long num = 0L;
		switch (eventType)
		{
		case Coach.CoachEvent.CoachEventType.CompetitionWon:
			num = DataManager.PRIZE_MONEY_COMPETITION_WINNER;
			break;
		case Coach.CoachEvent.CoachEventType.CompetitionSecond:
			num = DataManager.PRIZE_MONEY_COMPETITION_SECOND;
			break;
		case Coach.CoachEvent.CoachEventType.CompetitionThird:
			num = DataManager.PRIZE_MONEY_COMPETITION_THIRD;
			break;
		case Coach.CoachEvent.CoachEventType.BestScorer:
			num = DataManager.PRIZE_MONEY_BEST_STRIKER;
			break;
		}
		return (int)((float)num * PrizeMultiplier());
	}

	public override string GetName()
	{
		if (nameNoLineBreaks == null)
		{
			SetName(lineBreaks: false);
		}
		return nameNoLineBreaks;
	}

	public string GetName(bool lineBreaks)
	{
		if (lineBreaks)
		{
			if (nameWithLineBreaks == null)
			{
				SetName(lineBreaks: true);
			}
			return nameWithLineBreaks;
		}
		if (nameNoLineBreaks == null)
		{
			SetName(lineBreaks: false);
		}
		return nameNoLineBreaks;
	}

	private void SetName(bool lineBreaks)
	{
		string text = LanguageController.instance.Get_Translation("COMPETITION_TYPE_" + competitionType);
		string text2;
		switch (competitionType)
		{
		case CompetitionType.NationalLeague:
		case CompetitionType.NationalCup:
		{
			string text3 = (lineBreaks ? "\n" : " ");
			text2 = country?.GetName() + text3 + text;
			break;
		}
		case CompetitionType.RegionalLeague:
			text2 = region?.championshipName;
			break;
		case CompetitionType.InternationalLeague:
		case CompetitionType.SuperLeague:
			text2 = LanguageController.instance.Get_Translation("COMPETITION_NAME_" + competitionSubtype.ToString().ToUpper());
			break;
		default:
			throw new Exception($"CompetitionType {competitionType} not implemented. Competition.GetName().");
		}
		if (lineBreaks)
		{
			nameWithLineBreaks = text2;
		}
		else
		{
			nameNoLineBreaks = text2;
		}
	}

	public string GetShortName()
	{
		if (shortName == null)
		{
			SetShortName();
		}
		return shortName;
	}

	private void SetShortName()
	{
		string text;
		switch (competitionType)
		{
		case CompetitionType.NationalLeague:
		case CompetitionType.NationalCup:
			text = country?.GetName() ?? "";
			break;
		case CompetitionType.RegionalLeague:
			text = region?.championshipName;
			break;
		case CompetitionType.InternationalLeague:
		case CompetitionType.SuperLeague:
			text = LanguageController.instance.Get_Translation("COMPETITION_NAME_" + competitionSubtype.ToString().ToUpper());
			break;
		default:
			throw new Exception($"CompetitionType {competitionType} not implemented. Competition.GetName().");
		}
		shortName = text;
	}

	public Sprite GetIcon()
	{
		Sprite result = null;
		switch (configuration.competitionConverage)
		{
		case CompetitionConverage.Country:
			result = country.flag;
			break;
		case CompetitionConverage.Region:
			result = region.flag;
			break;
		case CompetitionConverage.Confederation:
		case CompetitionConverage.WorldWide:
			result = confederation.flag;
			break;
		case CompetitionConverage.RegionalFederation:
			result = regionalFederation.flag;
			break;
		default:
			Debug.LogError($"Competition.cs -> GetIcon() --- CompetitionConverage {configuration.competitionConverage} is not on the switch!");
			break;
		}
		return result;
	}

	public bool HasHumanCoach()
	{
		return allCompetitionTeams.HasHumanCoach();
	}

	public bool HasPresentCoach(ElifootOptions.SimulationFlag simulationFlag)
	{
		return allCompetitionTeams.HasPresentCoach(simulationFlag);
	}

	public override void PostDay()
	{
		ComputeTicketPrices();
	}

	public void ComputeTicketPrices()
	{
		int num = 0;
		float num2 = 0f;
		foreach (Team allCompetitionTeam in allCompetitionTeams)
		{
			num += allCompetitionTeam.averageSkill;
			num2 += allCompetitionTeam.moneyRatio;
		}
		if (num > 0)
		{
			int count = allCompetitionTeams.Count;
			averageSkill = num / count;
			moneyRatio = num2 / (float)count;
			long num3 = DataManager.GetTicketPrice(averageSkill, moneyRatio, configuration.ticketPriceFactor);
			ticketPrice = (long)Mathf.Max(1f, 0.8f * (float)ticketPrice + 0.2f * (float)num3);
		}
	}

	internal Color GetColor()
	{
		string text = ((!string.IsNullOrEmpty(shortName) && shortName.Length >= 3) ? shortName : GetName());
		string text2 = text.ToLower().Substring(text.Length - 3, 3);
		float r = (float)(text2[0] - 97) / 25f;
		float g = (float)(text2[1] - 97) / 25f;
		float b = (float)(text2[2] - 97) / 25f;
		return new Color(r, g, b);
	}

	public void AddCompetitionQualification(int numTeamsMin, int numTeamsMax, float divisionRangeMax, Competition forCompetition, Competition exceptInCompetition)
	{
		CompetitionQualification item = new CompetitionQualification(numTeamsMin, numTeamsMax, divisionRangeMax, forCompetition, exceptInCompetition);
		competitionQualifications.Add(item);
	}

	protected override string GetDumpHeader()
	{
		return "Competition;Teams;Teams with debt;Ticket price;Average skill;Money ratio";
	}

	protected override string GetDumpRow()
	{
		int num = 0;
		foreach (Team allCompetitionTeam in allCompetitionTeams)
		{
			if (allCompetitionTeam.TeamBank.Money < 0)
			{
				num++;
			}
		}
		return Util.MakeCSV(';', GetName(), allCompetitionTeams.Count, num, ticketPrice, averageSkill, moneyRatio.ToString("0.00"));
	}
}
