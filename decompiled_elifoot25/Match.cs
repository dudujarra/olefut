using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Analytics;

[Serializable]
public class Match : EliObject
{
	[Serializable]
	public class MatchEvent
	{
		public MatchEventType eventType;

		public int gameTime;

		public Team team;

		public Player player;

		public int goalsHome;

		public int goalsAway;

		public bool isHome;

		public MatchEvent(MatchEventType eventType, int gameTime, Team team, Player player, int goalsHome, int goalsAway, bool isHome)
		{
			this.eventType = eventType;
			this.gameTime = gameTime;
			this.team = team;
			this.player = player;
			this.goalsHome = goalsHome;
			this.goalsAway = goalsAway;
			this.isHome = isHome;
		}

		public bool ShowGoals()
		{
			if (eventType != MatchEventType.Goal && eventType != MatchEventType.PenaltyDefended && eventType != MatchEventType.PenaltyOver && eventType != MatchEventType.PenaltyPost && eventType != MatchEventType.PenaltySide && eventType != MatchEventType.PenaltyGoalInMatch)
			{
				return eventType == MatchEventType.PenaltyGoalShootout;
			}
			return true;
		}

		public bool Printable()
		{
			MatchEventType matchEventType = eventType;
			if ((uint)(matchEventType - 13) <= 1u)
			{
				return false;
			}
			return true;
		}

		public string GetGoalsDescription(bool useEventColorCodes)
		{
			string text = LanguageController.instance.Get_Translation("MATCH_RESULT", goalsHome.ToString(), goalsAway.ToString());
			if (useEventColorCodes)
			{
				Color color = (isHome ? ConfigManager.instance.MatchEvent_Home_Color : ConfigManager.instance.MatchEvent_Away_Color);
				string arg = $"#{Util.ColorToHex(color)}ff";
				text = $"<color={arg}>{text}</color>";
			}
			return text;
		}

		public string GetTextDescription(bool useEventColorCodes, bool includeGameTime)
		{
			string text;
			switch (eventType)
			{
			case MatchEventType.PenaltyGoalShootout:
			case MatchEventType.PenaltyDefended:
			case MatchEventType.PenaltySide:
			case MatchEventType.PenaltyOver:
			case MatchEventType.PenaltyPost:
				text = LanguageController.instance.Get_Translation("MATCHEVENT_" + eventType.ToString().ToUpper());
				break;
			case MatchEventType.PenaltyPlayer:
				text = $"{player.GetName()}...";
				break;
			case MatchEventType.DisallowedGoal:
			case MatchEventType.Goal:
			case MatchEventType.RedCard:
			case MatchEventType.YellowCard:
			case MatchEventType.SecondYellowCard:
			case MatchEventType.Injury:
			case MatchEventType.PenaltyGoalInMatch:
			case MatchEventType.PlayerOut:
			case MatchEventType.PlayerIn:
				text = ((!includeGameTime) ? player.GetName() : $"{player.GetName()} {gameTime}'");
				break;
			default:
				text = eventType.ToString();
				break;
			}
			if (useEventColorCodes)
			{
				Color color = (isHome ? ConfigManager.instance.MatchEvent_Home_Color : ConfigManager.instance.MatchEvent_Away_Color);
				string arg = $"#{Util.ColorToHex(color)}ff";
				text = $"<color={arg}>{text}</color>";
			}
			return text;
		}

		public Sprite GetSprite()
		{
			Sprite sprite = null;
			switch (eventType)
			{
			case MatchEventType.Goal:
				return ScreenController.instance.goalEventIcon;
			case MatchEventType.PenaltyGoalInMatch:
			case MatchEventType.PenaltyGoalShootout:
				return ScreenController.instance.penaltyGoalEventIcon;
			case MatchEventType.RedCard:
				return ScreenController.instance.redCardEventIcon;
			case MatchEventType.YellowCard:
				return ScreenController.instance.yellowCardEventIcon;
			case MatchEventType.Injury:
				return ScreenController.instance.injuredEventIcon;
			case MatchEventType.SecondYellowCard:
				return ScreenController.instance.secondYellowCardEventIcon;
			case MatchEventType.PlayerIn:
				return ScreenController.instance.playerInEventIcon;
			case MatchEventType.PlayerOut:
				return ScreenController.instance.playerOutEventIcon;
			case MatchEventType.DisallowedGoal:
			case MatchEventType.PenaltyDefended:
			case MatchEventType.PenaltySide:
			case MatchEventType.PenaltyOver:
			case MatchEventType.PenaltyPost:
				return ScreenController.instance.disallowedEventIcon;
			default:
				return null;
			}
		}
	}

	public bool skipDisplayEvents;

	public GlobalCalendarEntry calEntry;

	public Team homeTeam;

	public Team awayTeam;

	public MatchCupRoundWinner matchCupRoundWinner;

	public readonly Competition competition;

	public readonly Division division;

	public long attendance;

	public long ticketPrice;

	public readonly ListOfPlayers strikers;

	public List<MatchEvent> eventList = new List<MatchEvent>();

	public Match(Division division, Team homeTeam, Team awayTeam, GlobalCalendarEntry calEntry)
		: base(generateID: false)
	{
		this.division = division;
		this.calEntry = calEntry;
		this.homeTeam = homeTeam;
		this.awayTeam = awayTeam;
		matchCupRoundWinner = MatchCupRoundWinner.None;
		if (calEntry.competition == null)
		{
			competition = homeTeam.FindCompetition(calEntry.competitionType);
		}
		else
		{
			competition = calEntry.competition;
		}
		ComputeAttendance();
		ComputeTicketPrice();
	}

	private void ComputeTicketPrice()
	{
		ticketPrice = 0L;
		float num = 0f;
		switch (calEntry.matchType)
		{
		case MatchType.League:
			num = (4f * homeTeam.myTicketPrice + 1f * awayTeam.myTicketPrice) / 5f;
			break;
		case MatchType.CupFirstLeg:
		case MatchType.CupSecondLeg:
			num = (1f * homeTeam.myTicketPrice + 1f * awayTeam.myTicketPrice) / 2f;
			break;
		case MatchType.CupSingleLeg:
			num = 1f * homeTeam.myTicketPrice + 1f * awayTeam.myTicketPrice;
			break;
		default:
			throw new Exception("Match.ComputeTicketPrice(), matchType=" + calEntry.matchType.ToString() + " unknown.");
		}
		ticketPrice = (long)(num * competition.configuration.ticketPriceFactor);
		ticketPrice = (long)Mathf.Max(1f, ticketPrice);
	}

	private void ComputeAttendance()
	{
		attendance = 0L;
		float num = 0f;
		float num2 = homeTeam.averageSkill;
		float num3 = awayTeam.averageSkill;
		double num4 = homeTeam.morale;
		double num5 = awayTeam.morale;
		float num6 = 25f * Mathf.Pow(2f * num2 + num3, 1.2f);
		float num7 = (float)(2.0 * (num4 + num5) / (double)((float)DataManager.TEAM_MORALE_MAX * 1f));
		float num8 = (float)(1.2 - (double)(float)Util.GetRandomDouble() * 0.4);
		float attendanceFactor = competition.configuration.attendanceFactor;
		float num9 = Util.GetRandomInt(5000);
		num = num6 * num7 * num8 * attendanceFactor;
		num += num9;
		Stadium stadium = homeTeam.stadium;
		num = Mathf.Clamp(num, 0f, stadium.NumberSeats);
		attendance = (long)num;
	}

	private bool CheckPlayerInjured(Team myTeam, int matchMinutes)
	{
		try
		{
			if (myTeam.teamMatch.selectedPlayersSpots != null && myTeam.teamMatch.selectedPlayersSpots.Count((Team.TeamMatch.PlayerSpot p) => p.player != null) <= 7)
			{
				return false;
			}
			if (!myTeam.Coach.human && ElifootOptions.injuryOnlyIfCoachHuman)
			{
				return false;
			}
			if (UnityEngine.Random.Range(0, 800) < matchMinutes && UnityEngine.Random.Range(0, 400) < ElifootOptions.injuryFrequency)
			{
				Player randomSelectedPlayer = myTeam.teamMatch.GetRandomSelectedPlayer(3);
				if (randomSelectedPlayer != null)
				{
					if (myTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
					{
						SoundManager.instance.PlaySound(DataManager.instance.GetMatchEventAudioSource(MatchEventType.Injury));
					}
					bool isHome = myTeam == homeTeam;
					randomSelectedPlayer.Injured = UnityEngine.Random.Range(1, 10);
					randomSelectedPlayer.playerMatch.injured = true;
					MatchEvent item = new MatchEvent(MatchEventType.Injury, matchMinutes, myTeam, randomSelectedPlayer, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, isHome);
					eventList.Add(item);
					myTeam.teamMatch.forcedSubstitution = true;
					return true;
				}
			}
		}
		catch (Exception)
		{
		}
		return false;
	}

	private bool CheckRedCard(Team myTeam, int matchMinutes)
	{
		try
		{
			if (myTeam.teamMatch.selectedPlayersSpots != null && myTeam.teamMatch.selectedPlayersSpots.Count((Team.TeamMatch.PlayerSpot p) => p.player != null) <= 7)
			{
				return false;
			}
			if (!myTeam.Coach.human && ElifootOptions.redCardOnlyIfCoachHuman)
			{
				return false;
			}
			if (UnityEngine.Random.Range(0, 800) < matchMinutes && (double)UnityEngine.Random.Range(0, 300) < Math.Pow(ElifootOptions.redCardFrequency, 2.0))
			{
				if (myTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					SoundManager.instance.PlaySound(DataManager.instance.GetMatchEventAudioSource(MatchEventType.RedCard));
				}
				bool isHome = myTeam == homeTeam;
				Player randomSelectedPlayer = myTeam.teamMatch.GetRandomSelectedPlayer(2);
				PlayerBehaviour[] obj = (PlayerBehaviour[])Enum.GetValues(typeof(PlayerBehaviour));
				int minInclusive = (int)obj[0];
				int num = (int)obj[^1];
				if (UnityEngine.Random.Range(minInclusive, num + 1) <= (int)randomSelectedPlayer.Behaviour)
				{
					randomSelectedPlayer.Suspended = UnityEngine.Random.Range(1, 3);
					randomSelectedPlayer.playerMatch.RedCard = true;
					MatchEvent item = new MatchEvent(MatchEventType.RedCard, matchMinutes, myTeam, randomSelectedPlayer, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, isHome);
					eventList.Add(item);
					myTeam.teamMatch.forcedSubstitution = true;
					myTeam.teamMatch.hasRedCard = true;
					return true;
				}
			}
		}
		catch (Exception)
		{
		}
		return false;
	}

	private bool CheckYellowCard(Team myTeam, int matchMinutes)
	{
		try
		{
			if (myTeam.teamMatch.selectedPlayersSpots.Count((Team.TeamMatch.PlayerSpot p) => p.player != null) <= 7)
			{
				return false;
			}
			if (!myTeam.Coach.human && ElifootOptions.yellowCardOnlyIfCoachHuman)
			{
				return false;
			}
			if (UnityEngine.Random.Range(0, 400) < matchMinutes && UnityEngine.Random.Range(0, 40) < ElifootOptions.yellowCardFrequency)
			{
				if (myTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					SoundManager.instance.PlaySound(DataManager.instance.GetMatchEventAudioSource(MatchEventType.YellowCard));
				}
				bool isHome = myTeam == homeTeam;
				Player randomSelectedPlayer = myTeam.teamMatch.GetRandomSelectedPlayer(2);
				randomSelectedPlayer.playerMatch.YellowCards++;
				if (randomSelectedPlayer.playerMatch.YellowCards == 1)
				{
					MatchEvent item = new MatchEvent(MatchEventType.YellowCard, matchMinutes, myTeam, randomSelectedPlayer, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, isHome);
					eventList.Add(item);
				}
				else
				{
					randomSelectedPlayer.Suspended = 1;
					MatchEvent item2 = new MatchEvent(MatchEventType.SecondYellowCard, matchMinutes, myTeam, randomSelectedPlayer, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, isHome);
					eventList.Add(item2);
					myTeam.teamMatch.forcedSubstitution = true;
					myTeam.teamMatch.hasRedCard = true;
				}
				return true;
			}
		}
		catch (Exception)
		{
		}
		return false;
	}

	private bool ScoresGoal(Team myTeam, Team otherTeam, int matchMinutes)
	{
		try
		{
			if (myTeam.ScoresGoal(this, matchMinutes, otherTeam))
			{
				Player randomSelectedPlayer = myTeam.teamMatch.GetRandomSelectedPlayer(1);
				if (randomSelectedPlayer == null)
				{
					return false;
				}
				randomSelectedPlayer.playerMatch.goalsScored++;
				bool isHome = myTeam == homeTeam;
				MatchEvent item = new MatchEvent(MatchEventType.Goal, matchMinutes, myTeam, randomSelectedPlayer, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, isHome);
				eventList.Add(item);
				return true;
			}
		}
		catch (Exception)
		{
		}
		return false;
	}

	private bool CheckDisallowedGoal(int matchMinutes)
	{
		try
		{
			if (matchMinutes != 46 && matchMinutes != 91 && matchMinutes > 0 && eventList.Count > 0 && UnityEngine.Random.Range(0, 1000) < 10)
			{
				MatchEvent matchEvent = eventList[eventList.Count - 1];
				if (matchEvent.eventType == MatchEventType.Goal && matchEvent.gameTime == matchMinutes - 1)
				{
					Team obj = (matchEvent.isHome ? homeTeam : awayTeam);
					matchEvent.eventType = MatchEventType.DisallowedGoal;
					obj.teamMatch.goals--;
					matchEvent.player.playerMatch.goalsScored--;
					return true;
				}
			}
		}
		catch (Exception)
		{
		}
		return false;
	}

	public void CheckForMatchEvents(int matchMinutes)
	{
		if (!ScoresGoal(homeTeam, awayTeam, matchMinutes) && !ScoresGoal(awayTeam, homeTeam, matchMinutes) && !CheckDisallowedGoal(matchMinutes) && !CheckPlayerInjured(homeTeam, matchMinutes) && !CheckPlayerInjured(awayTeam, matchMinutes) && !CheckRedCard(homeTeam, matchMinutes) && !CheckRedCard(awayTeam, matchMinutes) && !CheckYellowCard(homeTeam, matchMinutes) && !CheckYellowCard(awayTeam, matchMinutes) && !CheckPenalty(homeTeam, awayTeam, matchMinutes))
		{
			CheckPenalty(awayTeam, homeTeam, matchMinutes);
		}
	}

	private bool CheckPenalty(Team myTeam, Team otherTeam, int matchMinutes)
	{
		try
		{
			if (UnityEngine.Random.Range(0, 800) < matchMinutes && (float)UnityEngine.Random.Range(0, 600) < Mathf.Pow(ElifootOptions.penaltyFrequency, 2f))
			{
				myTeam.teamMatch.waitingForInMatchPenalty = true;
				return true;
			}
		}
		catch (Exception)
		{
		}
		return false;
	}

	public void ChangePlayerDeltaSkill(int matchMinutes)
	{
		homeTeam.ComputePlayerDeltaSkill();
		awayTeam.ComputePlayerDeltaSkill();
	}

	private int DeltaValueByMax(float average)
	{
		return (int)(UnityEngine.Random.value * Mathf.Abs(average) * Mathf.Sign(average));
	}

	private void UpdateLeagueStats()
	{
		int goals = homeTeam.teamMatch.goals;
		int goals2 = awayTeam.teamMatch.goals;
		TeamCompetitionData teamCompetitionData = homeTeam.CompetitionData(competition);
		TeamCompetitionData teamCompetitionData2 = awayTeam.CompetitionData(competition);
		teamCompetitionData.goalsFor += homeTeam.teamMatch.goals;
		teamCompetitionData.goalsAgainst += awayTeam.teamMatch.goals;
		teamCompetitionData2.goalsFor += awayTeam.teamMatch.goals;
		teamCompetitionData2.goalsAgainst += homeTeam.teamMatch.goals;
		if (goals > goals2)
		{
			teamCompetitionData.points += 3;
			homeTeam.Coach.AddEvent(Coach.CoachEvent.CoachEventType.HomeWin, null);
			teamCompetitionData.matchesWon++;
			awayTeam.Coach.AddEvent(Coach.CoachEvent.CoachEventType.AwayLost, null);
			teamCompetitionData2.matchesLost++;
		}
		else if (goals == goals2)
		{
			teamCompetitionData.points++;
			homeTeam.Coach.AddEvent(Coach.CoachEvent.CoachEventType.HomeDraw, null);
			teamCompetitionData.matchesDrawn++;
			teamCompetitionData2.points++;
			awayTeam.Coach.AddEvent(Coach.CoachEvent.CoachEventType.AwayDraw, null);
			teamCompetitionData2.matchesDrawn++;
		}
		else
		{
			homeTeam.Coach.AddEvent(Coach.CoachEvent.CoachEventType.HomeLost, null);
			teamCompetitionData.matchesLost++;
			teamCompetitionData2.points += 3;
			awayTeam.Coach.AddEvent(Coach.CoachEvent.CoachEventType.AwayWin, null);
			teamCompetitionData2.matchesWon++;
		}
	}

	private void UpdateCupStats()
	{
		switch (matchCupRoundWinner)
		{
		case MatchCupRoundWinner.Home:
			awayTeam.RemoveFromCup(competition);
			break;
		case MatchCupRoundWinner.Away:
			homeTeam.RemoveFromCup(competition);
			break;
		}
	}

	private void UpdateTeamMorale()
	{
		int goals = homeTeam.teamMatch.goals;
		int goals2 = awayTeam.teamMatch.goals;
		if (goals > goals2)
		{
			homeTeam.ChangeMorale(DeltaValueByMax(DataManager.moraleBonusHome[0]));
			awayTeam.ChangeMorale(DeltaValueByMax(DataManager.moraleBonusAway[2]));
		}
		else if (goals == goals2)
		{
			homeTeam.ChangeMorale(DeltaValueByMax(DataManager.moraleBonusHome[1]));
			awayTeam.ChangeMorale(DeltaValueByMax(DataManager.moraleBonusAway[1]));
		}
		else
		{
			homeTeam.ChangeMorale(DeltaValueByMax(DataManager.moraleBonusHome[2]));
			awayTeam.ChangeMorale(DeltaValueByMax(DataManager.moraleBonusAway[0]));
		}
	}

	private void CheckCupRoundWinner(bool mustTerminate)
	{
		if (matchCupRoundWinner != MatchCupRoundWinner.None)
		{
			return;
		}
		switch (calEntry.competitionPhase)
		{
		case CompetitionPhase.GroupStage:
			break;
		case CompetitionPhase.Playoffs:
		case CompetitionPhase.FinalPhase:
		{
			int goals = homeTeam.teamMatch.goals;
			int goals2 = awayTeam.teamMatch.goals;
			switch (calEntry.matchType)
			{
			case MatchType.CupFirstLeg:
				break;
			case MatchType.CupSingleLeg:
				if (goals > goals2)
				{
					matchCupRoundWinner = MatchCupRoundWinner.Home;
				}
				else if (goals < goals2)
				{
					matchCupRoundWinner = MatchCupRoundWinner.Away;
				}
				else if (ElifootOptions.penaltiesShootoutEnabled && !mustTerminate)
				{
					matchCupRoundWinner = MatchCupRoundWinner.None;
				}
				else
				{
					matchCupRoundWinner = ChooseRandomCupMatchWinner();
				}
				break;
			case MatchType.CupSecondLeg:
			{
				int goalsFirstLeg = homeTeam.CompetitionData(competition).goalsFirstLeg;
				int goalsFirstLeg2 = awayTeam.CompetitionData(competition).goalsFirstLeg;
				int num = goals + goalsFirstLeg;
				int num2 = goals2 + goalsFirstLeg2;
				if (num > num2)
				{
					matchCupRoundWinner = MatchCupRoundWinner.Home;
				}
				else if (num < num2)
				{
					matchCupRoundWinner = MatchCupRoundWinner.Away;
				}
				else if (goalsFirstLeg > goals2)
				{
					matchCupRoundWinner = MatchCupRoundWinner.Home;
				}
				else if (goalsFirstLeg < goals2)
				{
					matchCupRoundWinner = MatchCupRoundWinner.Away;
				}
				else if (ElifootOptions.penaltiesShootoutEnabled && !mustTerminate)
				{
					matchCupRoundWinner = MatchCupRoundWinner.None;
				}
				else
				{
					matchCupRoundWinner = ChooseRandomCupMatchWinner();
				}
				break;
			}
			}
			break;
		}
		}
	}

	private MatchCupRoundWinner ChooseRandomCupMatchWinner()
	{
		if (new ListOfTeams { homeTeam, awayTeam }.GetRandomItem(TeamWeightCriteria.AverageSkill) != homeTeam)
		{
			return MatchCupRoundWinner.Away;
		}
		return MatchCupRoundWinner.Home;
	}

	public bool CanTerminate(bool mustTerminate)
	{
		switch (calEntry.competitionPhase)
		{
		case CompetitionPhase.GroupStage:
			return true;
		case CompetitionPhase.Playoffs:
		case CompetitionPhase.FinalPhase:
			if (calEntry.matchType == MatchType.CupFirstLeg)
			{
				return true;
			}
			CheckCupRoundWinner(mustTerminate);
			return matchCupRoundWinner != MatchCupRoundWinner.None;
		default:
			return false;
		}
	}

	public bool HasPresentCoach()
	{
		if (!homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
		{
			return awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match);
		}
		return true;
	}

	public bool HasHumanCoach()
	{
		if (!homeTeam.Coach.human)
		{
			return awayTeam.Coach.human;
		}
		return true;
	}

	public bool CheckFinishedPenalties()
	{
		bool flag = false;
		if (homeTeam.teamMatch.penaltiesShot > DataManager.PENALTIES_COUNT_UNTIL_SUDDEN_DEATH)
		{
			if (homeTeam.teamMatch.penaltiesShot == awayTeam.teamMatch.penaltiesShot && homeTeam.teamMatch.penaltyShootoutGoals != awayTeam.teamMatch.penaltyShootoutGoals)
			{
				flag = true;
			}
		}
		else
		{
			int num = DataManager.PENALTIES_COUNT_UNTIL_SUDDEN_DEATH - homeTeam.teamMatch.penaltiesShot;
			int num2 = DataManager.PENALTIES_COUNT_UNTIL_SUDDEN_DEATH - awayTeam.teamMatch.penaltiesShot;
			if (homeTeam.teamMatch.penaltyShootoutGoals > awayTeam.teamMatch.penaltyShootoutGoals + num2)
			{
				flag = true;
			}
			else if (awayTeam.teamMatch.penaltyShootoutGoals > homeTeam.teamMatch.penaltyShootoutGoals + num)
			{
				flag = true;
			}
		}
		if (flag)
		{
			if (homeTeam.teamMatch.penaltyShootoutGoals > awayTeam.teamMatch.penaltyShootoutGoals)
			{
				homeTeam.teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Won;
				awayTeam.teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Lost;
				matchCupRoundWinner = MatchCupRoundWinner.Home;
			}
			else
			{
				homeTeam.teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Lost;
				awayTeam.teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Won;
				matchCupRoundWinner = MatchCupRoundWinner.Away;
			}
		}
		return !flag;
	}

	public MatchEventType ShootPenalty(bool isHomeTeam, Player penaltyPlayer, bool inMatchPenalty, int gameTime)
	{
		Team team = (isHomeTeam ? homeTeam : awayTeam);
		Team opponent = (isHomeTeam ? awayTeam : homeTeam);
		MatchEventType matchEventType = team.ShootPenalty(opponent, penaltyPlayer, inMatchPenalty, gameTime);
		if (inMatchPenalty)
		{
			if (matchEventType == MatchEventType.PenaltyGoalInMatch)
			{
				MatchEvent item = new MatchEvent(matchEventType, gameTime, team, penaltyPlayer, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, isHomeTeam);
				eventList.Add(item);
			}
		}
		else
		{
			MatchEvent matchEvent = eventList[eventList.Count - 1];
			matchEvent.eventType = matchEventType;
			matchEvent.goalsHome = homeTeam.teamMatch.goals;
			matchEvent.goalsAway = awayTeam.teamMatch.goals;
		}
		return matchEventType;
	}

	public void ShootPenaltyForComputer(bool isHomeTeam, int gameTime)
	{
		Team obj = (isHomeTeam ? homeTeam : awayTeam);
		Player player = obj.teamMatch.penaltyPlayers.Player(0);
		ShootPenalty(isHomeTeam, player, inMatchPenalty: false, gameTime);
		obj.teamMatch.penaltyPlayers.RemoveAt(0);
		obj.teamMatch.penaltyPlayers.Add(player);
	}

	public void PreMatch()
	{
		homeTeam.PreMatch();
		awayTeam.PreMatch();
	}

	public void PreparePenaltyShootout()
	{
		PreparePenaltyShootoutForHomeTeam();
		PreparePenaltyShootoutForAwayTeam();
	}

	public void PreparePenaltyShootoutForHomeTeam()
	{
		homeTeam.PreparePenaltyShootout();
	}

	public void PreparePenaltyShootoutForAwayTeam()
	{
		awayTeam.PreparePenaltyShootout();
	}

	public long TicketSales()
	{
		return attendance * ticketPrice;
	}

	public bool CanShowTicketSales()
	{
		if (homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
		{
			return true;
		}
		if (awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match) && calEntry.matchType == MatchType.CupSingleLeg)
		{
			return true;
		}
		return false;
	}

	public void PayTicketsToTeams(bool VideoAdsSeen)
	{
		long ticketSales = TicketSales();
		switch (calEntry.competitionPhase)
		{
		case CompetitionPhase.GroupStage:
			PayToHomeTeam(ticketSales, TransactionType.TicketsLeague, VideoAdsSeen);
			break;
		case CompetitionPhase.Playoffs:
			if (calEntry.matchType == MatchType.CupSingleLeg)
			{
				PayToBothTeams(ticketSales, TransactionType.TicketsPlayoffs, VideoAdsSeen);
			}
			else
			{
				PayToHomeTeam(ticketSales, TransactionType.TicketsPlayoffs, VideoAdsSeen);
			}
			break;
		case CompetitionPhase.FinalPhase:
			if (calEntry.matchType == MatchType.CupSingleLeg)
			{
				PayToBothTeams(ticketSales, TransactionType.TicketsFinalPhase, VideoAdsSeen);
			}
			else
			{
				PayToHomeTeam(ticketSales, TransactionType.TicketsFinalPhase, VideoAdsSeen);
			}
			break;
		}
	}

	private void PayToHomeTeam(long ticketSales, TransactionType transactionType, bool VideoAdsSeen)
	{
		PayToTeam(homeTeam, awayTeam, ticketSales, transactionType, VideoAdsSeen);
	}

	private void PayToAwayTeam(long ticketSales, TransactionType transactionType, bool VideoAdsSeen)
	{
		PayToTeam(awayTeam, homeTeam, ticketSales, transactionType, VideoAdsSeen);
	}

	private void PayToBothTeams(long ticketSales, TransactionType transactionType, bool VideoAdsSeen)
	{
		PayToHomeTeam(ticketSales / 2, transactionType, VideoAdsSeen);
		PayToAwayTeam(ticketSales / 2, transactionType, VideoAdsSeen);
	}

	private void PayToTeam(Team teamPayed, Team teamNotPayed, long ticketSales, TransactionType transactionType, bool VideoAdsSeen)
	{
		if (VideoAdsSeen)
		{
			if (teamPayed.Coach.Present(ElifootOptions.SimulationFlag.Match))
			{
				teamPayed.MoneyTransaction(ticketSales, transactionType, false, teamNotPayed.Name);
			}
		}
		else
		{
			teamPayed.MoneyTransaction(ticketSales, transactionType, false, teamNotPayed.ShortName);
			teamPayed.AddTicketIncome(teamNotPayed, competition, ticketPrice, attendance, ticketSales);
		}
	}

	public void PostMatch()
	{
		switch (calEntry.competitionPhase)
		{
		case CompetitionPhase.GroupStage:
			UpdateLeagueStats();
			break;
		case CompetitionPhase.Playoffs:
		case CompetitionPhase.FinalPhase:
			UpdateCupStats();
			break;
		}
		if (HasHumanCoach())
		{
			Dictionary<string, object> eventData = new Dictionary<string, object>
			{
				{
					"Version",
					DataManager.instance.GetGameVersion()
				},
				{
					"RegLevel",
					GamePermissions.GetCurRegLevel()
				},
				{
					"HomeCoachHuman",
					homeTeam.Coach.human.ToString()
				},
				{ "HomeTeamSkill", homeTeam.averageSkill },
				{
					"HomeTeamFormation",
					homeTeam.teamMatch.Formation.FullName
				},
				{
					"AwayCoachHuman",
					awayTeam.Coach.human.ToString()
				},
				{ "AwayTeamSkill", awayTeam.averageSkill },
				{
					"AwayTeamFormation",
					awayTeam.teamMatch.Formation.FullName
				},
				{
					"Score",
					$"{homeTeam.teamMatch.goals}-{awayTeam.teamMatch.goals}"
				}
			};
			Analytics.CustomEvent("MatchEnded", eventData);
		}
		UpdateTeamMorale();
		PayTicketsToTeams(VideoAdsSeen: false);
		homeTeam.PostMatch(this);
		awayTeam.PostMatch(this);
		if (IsCupFinalDecided())
		{
			(Team, Team) cupFinalTeamsByWinner = GetCupFinalTeamsByWinner();
			competition.DeclareFinalPhaseWinner(cupFinalTeamsByWinner.Item1, cupFinalTeamsByWinner.Item2);
		}
	}

	private bool IsCupFinalDecided()
	{
		return (calEntry.round == 1) & (competition.activePhase == CompetitionPhase.FinalPhase) & (competition.configuration.winnerCriteria == CompetionWinnerCriteria.Cup) & (matchCupRoundWinner != MatchCupRoundWinner.None);
	}

	private (Team, Team) GetCupFinalTeamsByWinner()
	{
		if (matchCupRoundWinner == MatchCupRoundWinner.Home)
		{
			return (homeTeam, awayTeam);
		}
		if (matchCupRoundWinner == MatchCupRoundWinner.Away)
		{
			return (awayTeam, homeTeam);
		}
		return (null, null);
	}

	public MatchEvent GetLastPrintableEvent()
	{
		for (int num = eventList.Count - 1; num >= 0; num--)
		{
			if (eventList[num].Printable())
			{
				return eventList[num];
			}
		}
		return null;
	}

	public bool CheckTeamPlaysHome(Team team)
	{
		return homeTeam == team;
	}

	protected override string GetDumpHeader()
	{
		return "Match type;Division;Home team;Away team;Home avg skill;Away avg skill;Home target goals;Away target goals;Home goals;Away goals;Goal diff;Winner;Ticket price;Attendance;Income;Cup round winner;Home pen. shootout;Home pen. shot;Home pen. goals;Away pen. shootout;Away pen. shot;Away pen. goals";
	}

	protected override string GetDumpRow()
	{
		string text = ((homeTeam.MyDivision(competition) == null) ? "" : homeTeam.MyDivision(competition).GetName());
		return Util.MakeCSV(';', calEntry.matchType, text, homeTeam.Name, awayTeam.Name, homeTeam.averageSkill, awayTeam.averageSkill, homeTeam.teamMatch.targetGoals, awayTeam.teamMatch.targetGoals, homeTeam.teamMatch.goals, awayTeam.teamMatch.goals, homeTeam.teamMatch.goals - awayTeam.teamMatch.goals, (homeTeam.teamMatch.goals > awayTeam.teamMatch.goals) ? "H" : ((homeTeam.teamMatch.goals == awayTeam.teamMatch.goals) ? "D" : "A"), ticketPrice, attendance, ticketPrice * attendance, matchCupRoundWinner, homeTeam.teamMatch.penaltyShootoutStatus, homeTeam.teamMatch.penaltiesShot, homeTeam.teamMatch.penaltyShootoutGoals, awayTeam.teamMatch.penaltyShootoutStatus, awayTeam.teamMatch.penaltiesShot, awayTeam.teamMatch.penaltyShootoutGoals);
	}
}
