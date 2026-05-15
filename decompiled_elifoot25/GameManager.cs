using System;
using System.Collections;
using System.Diagnostics;
using UnityEngine;

public class GameManager : MonoBehaviour
{
	private readonly Stopwatch GLOBALPrepareMatches = new Stopwatch();

	private readonly Stopwatch matchTimer = new Stopwatch();

	private static float debugTimeOnTrySellPlayers;

	private static float debugTimePrePrepareMatch;

	private static float debugTimePrepareMatchByComputer;

	private static float debugTimePaySalaries;

	private static float debugTimeAnalyseCoachDismiss;

	private static float debugTimePostDay;

	private static float debugTimeTransferPlayers;

	private static float debugTimeNextRound;

	private static float debugTimeSaveGame;

	private static float debugTimePreMatch;

	private bool matchPrepared;

	private bool registeringCoach;

	private int daysUntilSuggestRegistration;

	public static GameManager instance;

	private void Awake()
	{
		instance = this;
	}

	private void Start()
	{
		ScreenController.instance.SetAlpha(1f);
		ScreenController.instance.HideLoadingView();
		StartCoroutine(ScreenController.instance.FadeBlack(0f, immediatelly: true));
		StartCoroutine(StartSeasonLoop());
	}

	private IEnumerator StartSeasonLoop()
	{
		while (!DataManager.instance.stopElifoot)
		{
			if (!DataManager.instance.isLoadedGame)
			{
				BeginSeason();
			}
			yield return StartCoroutine(LoopMatchDays());
			if (!DataManager.instance.stopElifoot)
			{
				yield return StartCoroutine(ShowEndOfSeasonStuff());
				yield return StartCoroutine(ScreenController.instance.AnnounceCoachEvents());
				if (!ElifootOptions.IsSimulationFlagActive(ElifootOptions.SimulationFlag.Other))
				{
					yield return StartCoroutine(ScreenController.instance.ShowCoachNews(DataManager.COACH_NEWS_WAIT_TIME));
				}
				continue;
			}
			break;
		}
	}

	private void BeginSeason()
	{
		DataManager.instance.properties.gameDay.currentCalendarDay = 0;
		DataManager.instance.allTeams.BeginSeason();
		DataManager.instance.allPlayers.BeginSeason();
		DataManager.instance.allCoaches.BeginSeason();
		DataManager.instance.allDivisions.BeginSeason();
		DataManager.instance.allCompetitions.BeginSeason();
		StartGlobalCalendar();
		CheckPlayerCount();
	}

	private void StartGlobalCalendar()
	{
		GlobalCalendar globalCalendar = DataManager.instance.properties.globalCalendar;
		globalCalendar.Clear();
		AddNationalLeagueCalendarEntries(globalCalendar);
		if (DataManager.instance.properties.playSuperLeague)
		{
			AddSuperLeagueCalendarEntries(globalCalendar);
		}
		AddCupCalendarEntries(globalCalendar, CompetitionType.NationalCup, CompetitionPhase.FinalPhase, startOfSeason: false);
		AddCupCalendarEntries(globalCalendar, CompetitionType.InternationalLeague, CompetitionPhase.FinalPhase, startOfSeason: false);
		AddCupCalendarEntries(globalCalendar, CompetitionType.RegionalLeague, CompetitionPhase.FinalPhase, startOfSeason: false);
		int num = 0;
		foreach (GlobalCalendarEntry item in globalCalendar)
		{
			num = (item.index = num + 100);
		}
		foreach (Team allTeam in DataManager.instance.allTeams)
		{
			allTeam.StartCalendar();
		}
	}

	private void AddNationalLeagueCalendarEntries(GlobalCalendar globalCalendar)
	{
		int num = (DataManager.instance.TeamsPerDivision(CompetitionType.NationalLeague) - 1) * 2;
		for (int i = 1; i <= num; i++)
		{
			globalCalendar.Add(new GlobalCalendarEntry(MatchType.League, CompetitionType.NationalLeague, CompetitionPhase.GroupStage, i, i == num, active: true));
		}
	}

	private void AddSuperLeagueCalendarEntries(GlobalCalendar globalCalendar)
	{
		GlobalCalendar globalCalendar2 = new GlobalCalendar();
		int num = (DataManager.instance.TeamsPerDivision(CompetitionType.SuperLeague) - 1) * 2;
		for (int i = 1; i <= num; i++)
		{
			globalCalendar2.Add(new GlobalCalendarEntry(MatchType.League, CompetitionType.SuperLeague, CompetitionPhase.GroupStage, i, i == num, active: true));
		}
		float num2 = 1f * (float)globalCalendar2.Count / (float)globalCalendar.Count;
		float num3 = globalCalendar.Count - 1;
		for (int num4 = globalCalendar2.Count - 1; num4 >= 0; num4--)
		{
			GlobalCalendarEntry item = globalCalendar2.GlobalCalendarEntry(num4);
			globalCalendar.Insert((int)num3, item);
			num3 = Mathf.Max(0f, num3 - num2);
		}
	}

	private void AddCupCalendarEntries(GlobalCalendar globalCalendar, CompetitionType competitionType, CompetitionPhase competitionPhase, bool startOfSeason)
	{
		if (competitionPhase != CompetitionPhase.FinalPhase)
		{
			return;
		}
		int num = 0;
		foreach (Competition allCompetition in DataManager.instance.allCompetitions)
		{
			if (allCompetition.competitionType == competitionType)
			{
				num = Mathf.Max(num, allCompetition.phaseTeams[(int)competitionPhase].Count);
			}
		}
		int num2 = Mathf.CeilToInt(Mathf.Log(num, 2f));
		int num3 = 0;
		GlobalCalendar globalCalendar2 = new GlobalCalendar();
		int num4 = 1;
		while (num2 > 0)
		{
			if (num4 == 1)
			{
				globalCalendar2.Insert(0, new GlobalCalendarEntry(MatchType.CupSingleLeg, competitionType, competitionPhase, num4, isLastRound: true, active: true));
				num3++;
			}
			else
			{
				globalCalendar2.Insert(0, new GlobalCalendarEntry(MatchType.CupSecondLeg, competitionType, competitionPhase, num4, isLastRound: false, active: true));
				globalCalendar2.Insert(0, new GlobalCalendarEntry(MatchType.CupFirstLeg, competitionType, competitionPhase, num4, isLastRound: false, active: true));
				num3 += 2;
			}
			num4 *= 2;
			num2--;
		}
		float num5 = (float)globalCalendar.Count * 1f / (float)globalCalendar2.Count;
		float num6 = globalCalendar.Count;
		if (startOfSeason)
		{
			num5 = 0f;
			num6 = 0f;
		}
		else
		{
			num5 = (float)globalCalendar.Count * 1f / (float)globalCalendar2.Count;
			num6 = globalCalendar.Count;
		}
		for (int num7 = globalCalendar2.Count - 1; num7 >= 0; num7--)
		{
			globalCalendar.Insert((int)num6, globalCalendar2[num7]);
			num6 = Mathf.Max(0f, num6 - num5);
		}
	}

	private void CheckPlayerCount()
	{
		int count = DataManager.instance.allPlayers.Count;
		int num = 0;
		foreach (Team allTeam in DataManager.instance.allTeams)
		{
			num += allTeam.Players.Count;
		}
		if (num != count)
		{
			UnityEngine.Debug.LogErrorFormat("BeginSeason(). Player count in all teams: {0}. allPlayers.count: {1}", num, count);
		}
	}

	private IEnumerator LoopMatchDays()
	{
		int calEntryCount = DataManager.instance.properties.globalCalendar.Count;
		for (int i = 0; i < calEntryCount; i++)
		{
			GlobalCalendarEntry calEntry = (GlobalCalendarEntry)DataManager.instance.properties.globalCalendar[i];
			if (calEntry == null)
			{
				UnityEngine.Debug.LogError("callEntry is null!");
			}
			if (DataManager.instance.isLoadedGame && DataManager.instance.properties.globalCalendar.IndexOf(calEntry) < DataManager.instance.properties.gameDay.currentCalendarDay)
			{
				continue;
			}
			bool skipDay = false;
			if (!DataManager.instance.isLoadedGame)
			{
				switch (calEntry.competitionPhase)
				{
				case CompetitionPhase.GroupStage:
					if (!ElifootOptions.playLeague)
					{
						skipDay = true;
					}
					else if (calEntry.round > ElifootOptions.playLeagueRoundsPerSeason)
					{
						skipDay = true;
					}
					break;
				default:
					throw new NotImplementedException($"LoopMatchDays. competitionPhase not found {calEntry.competitionPhase}.");
				case CompetitionPhase.Playoffs:
				case CompetitionPhase.FinalPhase:
					break;
				}
			}
			if (skipDay)
			{
				UnityEngine.Debug.Log("[GameManager] skipping day");
				calEntry.played = true;
			}
			else
			{
				UnityEngine.Debug.Log("[GameManager] not skipping day");
				DataManager.instance.properties.gameDay.Reset();
				switch (calEntry.competitionPhase)
				{
				case CompetitionPhase.GroupStage:
					UnityEngine.Debug.Log("[GameManager] group stage");
					if (ElifootOptions.simulationStopBeforeLastMatch && (calEntry.round == ElifootOptions.playLeagueRoundsPerSeason || calEntry.isLastRound))
					{
						ElifootOptions.simulationMode = ElifootOptions.SimulationMode.Off;
					}
					if (!ElifootOptions.playLeague || calEntry.round > ElifootOptions.playLeagueRoundsPerSeason)
					{
						break;
					}
					if (!DataManager.instance.isLoadedGame)
					{
						DataManager.instance.CreateMatches(calEntry);
						DataManager.instance.allPlayers.Shuffle();
					}
					yield return StartCoroutine(PrepareAndPlayMatches());
					if (DataManager.instance.stopElifoot)
					{
						yield break;
					}
					DataManager.instance.allDivisions.PostDay();
					UnityEngine.Debug.Log("[GameManager] has human coach -> " + DataManager.instance.allCompetitions.HasPresentCoach(ElifootOptions.SimulationFlag.Match));
					if (DataManager.instance.allCompetitions.HasPresentCoach(ElifootOptions.SimulationFlag.Match))
					{
						Competition baseCompetition = DataManager.instance.allCompetitions.Competition(0);
						foreach (Competition allCompetition in DataManager.instance.allCompetitions)
						{
							if (allCompetition.HasPresentCoach(ElifootOptions.SimulationFlag.Invitations))
							{
								baseCompetition = allCompetition;
								break;
							}
						}
						yield return StartCoroutine(ScreenController.instance.ShowStandingsView(baseCompetition, 10, null));
					}
					calEntry.played = true;
					break;
				case CompetitionPhase.Playoffs:
				case CompetitionPhase.FinalPhase:
				{
					if (!DataManager.instance.isLoadedGame)
					{
						DataManager.instance.CreateMatches(calEntry);
					}
					yield return StartCoroutine(PrepareAndPlayMatches());
					if (DataManager.instance.stopElifoot)
					{
						yield break;
					}
					MatchType matchType = calEntry.matchType;
					if (matchType != MatchType.CupFirstLeg && (uint)(matchType - 2) <= 1u)
					{
						calEntry.CupDraw();
					}
					calEntry.played = true;
					break;
				}
				}
			}
			UnityEngine.Debug.Log("[GameManager] post day");
			DataManager.instance.allTeams.PostDay();
			DataManager.instance.allCoaches.PostDay();
			DataManager.instance.allCompetitions.PostDay();
			if (!ElifootOptions.repeatSameCalendarDay)
			{
				yield return StartCoroutine(ScreenController.instance.ShowCoachNews(DataManager.COACH_NEWS_WAIT_TIME));
			}
			if (daysUntilSuggestRegistration <= 0)
			{
				yield return StartCoroutine(ShowRegisterAccountTip());
			}
			if (!ElifootOptions.repeatSameCalendarDay)
			{
				TransferPlayers();
			}
			NextRound();
			if (ElifootOptions.repeatSameCalendarDay && !skipDay)
			{
				i--;
			}
			daysUntilSuggestRegistration--;
		}
	}

	private void SetDaysUntilSuggestRegistration(int daysForNextTry)
	{
		daysUntilSuggestRegistration = daysForNextTry;
	}

	private IEnumerator ShowRegisterAccountTip()
	{
		if (Application.internetReachability == NetworkReachability.NotReachable)
		{
			SetDaysUntilSuggestRegistration(1);
			yield break;
		}
		ListOfTeams allPresentCoach = DataManager.instance.allTeams.GetAllPresentCoach(ElifootOptions.SimulationFlag.TeamManagement);
		foreach (Team item in allPresentCoach)
		{
			Coach coach = item.Coach;
			if (coach.Account.email == "")
			{
				registeringCoach = true;
				Action yesAction = delegate
				{
					ScreenController.instance.ShowAccountView(AccountView.ViewMode.PlayerWantsToCreateAccount, coach.Account, FinishedRegisterProcess, CanceledRegisterProcess);
				};
				yield return ScreenController.instance.ShowDialogPopUp("ACCOUNT_REGISTRATION", LanguageController.instance.Get_Translation("ACCOUNT_REGISTRATION_LONG") + " " + coach.Name + "?", yesAction, CanceledRegisterProcess);
				yield return WaitForRegisterProcessIsComplete();
			}
		}
	}

	private void CanceledRegisterProcess()
	{
		SetDaysUntilSuggestRegistration(500);
		registeringCoach = false;
	}

	private void FinishedRegisterProcess(Account acc)
	{
		foreach (Coach allHumanCoach in DataManager.instance.allCoaches.GetAllHumanCoaches())
		{
			if (allHumanCoach.Account.guid == acc.guid)
			{
				allHumanCoach.Account = acc;
				break;
			}
		}
		registeringCoach = false;
	}

	private IEnumerator WaitForRegisterProcessIsComplete()
	{
		while (registeringCoach)
		{
			yield return 0;
		}
	}

	private IEnumerator PrepareAndPlayMatches()
	{
		if (ElifootOptions.autoSave && DataManager.instance.matchesWithoutSaving >= ElifootOptions.autoSaveMatchesFrequency)
		{
			ScreenController.instance.ShowLoadingView("GAME_AUTO_SAVING");
			yield return 0;
			DataManager.instance.SaveGame(isAutoSave: true, forcedSave: false);
			ScreenController.instance.HideLoadingView();
		}
		else
		{
			DataManager.instance.matchesWithoutSaving++;
		}
		DataManager.instance.matchesPlayed++;
		yield return StartCoroutine(PrepareMatches());
		if (DataManager.instance.stopElifoot)
		{
			yield break;
		}
		PaySalaries();
		if (DataManager.instance.allMatches.Count > 0)
		{
			yield return StartCoroutine(PlayMatches());
			if (ElifootOptions.showMatchResume)
			{
				yield return StartCoroutine(ScreenController.instance.ShowMatchesResumeView());
			}
			yield return StartCoroutine(CoachFireAndHire.instance.AnalyseCoachDismiss());
		}
	}

	private IEnumerator PrepareMatches()
	{
		ScreenController.instance.ShowLoadingView("WAIT_PREPARE_MATCHES");
		yield return 0;
		ListOfMatches allMatches = DataManager.instance.allMatches;
		foreach (Match currentMatch in allMatches)
		{
			matchPrepared = false;
			bool flag;
			try
			{
				flag = currentMatch.homeTeam.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement) && !currentMatch.awayTeam.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement);
			}
			catch (Exception arg)
			{
				UnityEngine.Debug.LogError($"PrepareMatches: skipping match '{currentMatch?.homeTeam?.Name} vs {currentMatch?.awayTeam?.Name}' due to exception: {arg}");
				continue;
			}
			if (flag)
			{
				StartCoroutine(PrepareTeam(currentMatch, currentMatch.awayTeam));
				while (!matchPrepared)
				{
					yield return 0;
				}
				if (DataManager.instance.stopElifoot)
				{
					break;
				}
				matchPrepared = false;
				StartCoroutine(PrepareTeam(currentMatch, currentMatch.homeTeam));
				while (!matchPrepared)
				{
					yield return 0;
				}
			}
			else
			{
				StartCoroutine(PrepareTeam(currentMatch, currentMatch.homeTeam));
				while (!matchPrepared)
				{
					yield return 0;
				}
				if (DataManager.instance.stopElifoot)
				{
					break;
				}
				matchPrepared = false;
				StartCoroutine(PrepareTeam(currentMatch, currentMatch.awayTeam));
				while (!matchPrepared)
				{
					yield return 0;
				}
			}
			if (DataManager.instance.stopElifoot)
			{
				break;
			}
		}
		DataManager.instance.isLoadedGame = false;
		if (!DataManager.instance.stopElifoot && DataManager.instance.allMatches.Count > 0)
		{
			DataManager.instance.allMatches.PreMatch();
			if (DataManager.instance.allMatches.Count == 0)
			{
				yield break;
			}
			_ = DataManager.instance.allMatches.Match(0).calEntry.competitionPhase;
		}
		ScreenController.instance.HideLoadingView();
	}

	private IEnumerator PrepareTeam(Match currentMatch, Team team)
	{
		Exception captured = null;
		try
		{
			team.PrePrepareMatch(currentMatch);
		}
		catch (Exception ex)
		{
			captured = ex;
		}
		if (captured == null && team.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement))
		{
			try
			{
				if (!team.teamMatch.Prepared && !DataManager.instance.stopElifoot)
				{
					ScreenController.instance.ShowTeamView(team, currentMatch);
				}
			}
			catch (Exception ex2)
			{
				captured = ex2;
			}
			while (captured == null && !team.teamMatch.Prepared && !DataManager.instance.stopElifoot)
			{
				yield return 0;
			}
			if (captured == null)
			{
				DataManager.instance.isLoadedGame = false;
				DataManager.instance.isNewGame = false;
			}
		}
		else if (captured == null)
		{
			long baseValue = 0L;
			if (!DataManager.instance.isLoadedGame)
			{
				Player player;
				try
				{
					(player, baseValue) = team.TrySellPlayers();
				}
				catch (Exception ex3)
				{
					captured = ex3;
					player = null;
				}
				if (captured == null && player != null)
				{
					UnityEngine.Debug.Log($"Trying to sell {player.Name} with skill level {player.skill}");
					yield return StartCoroutine(ScreenController.instance.ShowAuctionView(player, baseValue));
					yield return 0;
				}
			}
			if (captured == null)
			{
				try
				{
					team.PrepareMatchByComputer();
				}
				catch (Exception ex4)
				{
					captured = ex4;
				}
			}
		}
		if (captured != null)
		{
			UnityEngine.Debug.LogError($"PrepareTeam failed for team='{team?.Name}' match='{currentMatch?.homeTeam?.Name} vs {currentMatch?.awayTeam?.Name}': {captured}");
		}
		matchPrepared = true;
	}

	private void PaySalaries()
	{
		foreach (Match allMatch in DataManager.instance.allMatches)
		{
			allMatch.homeTeam.PaySalaries();
			allMatch.awayTeam.PaySalaries();
		}
	}

	private IEnumerator PlayMatches()
	{
		yield return StartCoroutine(ScreenController.instance.ShowMatchesView());
	}

	private void TransferPlayers()
	{
		foreach (Player tradedPlayer in DataManager.instance.tradedPlayers)
		{
			if (tradedPlayer.SoldToTeam != null)
			{
				Team team = tradedPlayer.Team;
				Team soldToTeam = tradedPlayer.SoldToTeam;
				team.Players.Remove(tradedPlayer);
				tradedPlayer.Salary = tradedPlayer.nextSalary;
				tradedPlayer.nextSalary = 0L;
				soldToTeam.Players.Add(tradedPlayer);
				tradedPlayer.SoldToTeam = null;
			}
		}
		DataManager.instance.tradedPlayers.Clear();
	}

	private void NextRound()
	{
		ResetMatches();
		if (!ElifootOptions.repeatSameCalendarDay)
		{
			DataManager.instance.properties.gameDay.currentCalendarDay++;
		}
	}

	private void ResetMatches()
	{
		DataManager.instance.allMatches.Clear();
	}

	private IEnumerator ShowEndOfSeasonStuff()
	{
		float secondsToClose = 3f;
		foreach (Coach allHumanCoach in DataManager.instance.allCoaches.GetAllHumanCoaches())
		{
			if (allHumanCoach.Present(ElifootOptions.SimulationFlag.Other) && allHumanCoach.MyTeam != null)
			{
				secondsToClose = 0f;
			}
		}
		DataManager.instance.allCompetitions.CheckWinners();
		foreach (Competition allCompetition in DataManager.instance.allCompetitions)
		{
			if (allCompetition.HasPresentCoach(ElifootOptions.SimulationFlag.Match))
			{
				yield return StartCoroutine(ScreenController.instance.ShowEndSeasonView(allCompetition, GetBestAttackTeam(), secondsToClose));
			}
		}
		if (!ElifootOptions.IsSimulationFlagActive(ElifootOptions.SimulationFlag.Other))
		{
			yield return StartCoroutine(ShowBestStrikers(secondsToClose));
		}
		yield return StartCoroutine(EndOfSeason());
	}

	private Team GetBestAttackTeam()
	{
		Team team = null;
		int num = 0;
		foreach (Team allTeam in DataManager.instance.allTeams)
		{
			int num2 = allTeam.TotalSeasonGoals();
			if (team == null || num < num2)
			{
				team = allTeam;
				num = num2;
			}
		}
		return team;
	}

	private IEnumerator ShowBestStrikers(float secondsToClose)
	{
		DataManager.UpdateStrikers(forceUpdate: true, onlyTopGoals: true, setPrizes: true);
		yield return StartCoroutine(ScreenController.instance.ShowBestStrikersView(null, secondsToClose));
	}

	private IEnumerator EndOfSeason()
	{
		DataManager.instance.allTeams.EndOfSeason();
		DataManager.instance.allPlayers.EndOfSeason();
		DataManager.instance.allCoaches.EndOfSeason();
		DataManager.instance.allCompetitions.EndOfSeason();
		yield return StartCoroutine(CheckForceFireHumanCoaches());
		DataManager.instance.properties.currentSeasonNumber++;
		DataManager.instance.UpdateCoachPointsInServer(newSeason: true, showInfoAndWarnings: false, forceSend: false);
	}

	private IEnumerator CheckForceFireHumanCoaches()
	{
		ListOfCoaches allHumanCoaches = DataManager.instance.allCoaches.GetAllHumanCoaches();
		foreach (Coach item in allHumanCoaches)
		{
			if (item.MyTeam != null && item.MyTeam.GetLeagueDivision(CompetitionType.NationalLeague) == null)
			{
				yield return StartCoroutine(CoachFireAndHire.instance.ForceFireCoach(item.MyTeam));
			}
		}
	}

	public static ListOfParameters GetStrikersEverListOfParameters()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		ListOfPlayers listOfPlayers = new ListOfPlayers(DataManager.instance.allPlayers);
		listOfPlayers.SortByHistoryGoalsDesc();
		int num = 50;
		foreach (Player item in listOfPlayers)
		{
			if (num <= 0 || item.history.goalsScored == 0)
			{
				break;
			}
			string displayName = $"{item.GetName()} ({item.Team.ShortName})";
			listOfParameters.RegisterReadOnlyParameter(displayName, item.history.goalsScored, TextAnchor.MiddleRight);
			num--;
		}
		if (listOfParameters.Count == 0)
		{
			listOfParameters.RegisterReadOnlyParameter(LanguageController.instance.Get_Translation("BESTSTRIKERS_EMPTY"), null);
		}
		return listOfParameters;
	}
}
