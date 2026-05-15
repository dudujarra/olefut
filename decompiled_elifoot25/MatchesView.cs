using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class MatchesView : EliView
{
	[Header("General")]
	public Text matchesTitle;

	public Text gameClockText;

	public Image gameClockSlice;

	public CanvasGroup matchesCanvasGroup;

	public RectTransform matchesViewport;

	public RectTransform matchesGroupParent;

	public GameObject matchPrefab;

	public GameObject matchDivisionPrefab;

	[Header("Extra Components")]
	public PenaltyView penaltyView;

	public TopMatchesHScrollController topMatchesHScrollController;

	private ListOfMatches matches;

	private List<GameObject> divisionPrefabsPool;

	private List<(MatchPrefab, GameObject)> matchPrefabsPool;

	public Action<int> OnMinutePassed;

	private int activeMatchSpeed = 1;

	private bool isHighSpeed;

	private int gameTime;

	private bool gamePaused;

	private bool allMatchesFinished;

	private bool matchesInPenaltyShootout;

	private float timeBetweenPenalties = 10f;

	private bool pausingAfterMatch;

	public void Initialize(ListOfMatches matches)
	{
		DataManager.instance.recordedMatches.Clear();
		foreach (Match match in matches)
		{
			DataManager.instance.recordedMatches.Add(match);
		}
		for (int i = 0; i < matchesGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(matchesGroupParent.GetChild(i).gameObject);
		}
		this.matches = matches;
		divisionPrefabsPool = new List<GameObject>();
		matchPrefabsPool = new List<(MatchPrefab, GameObject)>();
		topMatchesHScrollController.Initialize(matches, GetPreSelectedMatch(), RefreshViewCALL);
		ResetView();
		StartMatches();
		ComputeActiveSpeed();
		ScreenController.instance.HideLoadingView();
	}

	private Match GetPreSelectedMatch()
	{
		Match match = matches.GetFirstMatchWithCoachPresent(ElifootOptions.SimulationFlag.Match);
		if (match == null)
		{
			match = matches.GetFirstMatchWithCoachHuman();
			if (match == null)
			{
				match = GetMatchByFavoriteCompetition(matches);
			}
		}
		return match;
	}

	private Match GetMatchByFavoriteCompetition(ListOfMatches matches)
	{
		List<long> favorites = DataManager.instance.properties.favoriteCompetitions;
		if (favorites.Count == 0)
		{
			return null;
		}
		int i;
		for (i = favorites.Count - 1; i >= 0; i--)
		{
			Match match = (Match)matches.Find((EliObject m) => ((Match)m).competition.ID == favorites[i]);
			if (match != null)
			{
				return match;
			}
		}
		return null;
	}

	public override void ResetView()
	{
		int currentCalendarDay = DataManager.instance.properties.gameDay.currentCalendarDay;
		if (DataManager.instance.properties.globalCalendar.Count > currentCalendarDay)
		{
			GlobalCalendarEntry globalCalendarEntry = DataManager.instance.properties.globalCalendar.GlobalCalendarEntry(DataManager.instance.properties.gameDay.currentCalendarDay);
			if (globalCalendarEntry != null)
			{
				matchesTitle.text = $"{DataManager.instance.properties.currentSeasonNumber} - {globalCalendarEntry.GetTitle()}";
			}
			else
			{
				matchesTitle.text = "";
			}
		}
		else
		{
			matchesTitle.text = "";
		}
	}

	private void StartMatches()
	{
		foreach (Match match in matches)
		{
			OnMinutePassed = (Action<int>)Delegate.Combine(OnMinutePassed, new Action<int>(match.CheckForMatchEvents));
			OnMinutePassed = (Action<int>)Delegate.Combine(OnMinutePassed, new Action<int>(match.ChangePlayerDeltaSkill));
		}
		StartCoroutine(StartTimer());
	}

	private void ComputeActiveSpeed()
	{
		if (ElifootOptions.IsSimulationFlagActive(ElifootOptions.SimulationFlag.Match))
		{
			activeMatchSpeed = ElifootOptions.matchSpeedSimulation;
			isHighSpeed = activeMatchSpeed == 50;
		}
		else if (matches == null)
		{
			activeMatchSpeed = 5;
			isHighSpeed = false;
		}
		else if (matches.HasCoachPresent(ElifootOptions.SimulationFlag.Match))
		{
			activeMatchSpeed = ElifootOptions.matchSpeedHuman;
			isHighSpeed = activeMatchSpeed == 30;
		}
		else
		{
			activeMatchSpeed = ElifootOptions.matchSpeedNoHuman;
			isHighSpeed = activeMatchSpeed == 30;
		}
	}

	private void RefreshViewCALL(ListOfMatches pageMatches, bool recordAction)
	{
		StartCoroutine(RefreshView(pageMatches, recordAction));
	}

	private IEnumerator RefreshView(ListOfMatches pageMatches, bool recordAction)
	{
		yield return new WaitForEndOfFrame();
		Competition competition = null;
		Division division = null;
		int firstHumanCoach = 0;
		int lastHumanCoach = 0;
		int heightcount = 0;
		bool presentCoachFlag = false;
		bool darkenNext = false;
		int tabIndex = 0;
		bool flag = false;
		for (int i = 0; i < pageMatches.Count; i++)
		{
			Match match = pageMatches.Match(i);
			if (match.competition != competition)
			{
				FillCompetition(match.competition, ref tabIndex, i);
				competition = match.competition;
				heightcount++;
			}
			if (match.calEntry.competitionPhase == CompetitionPhase.GroupStage)
			{
				if (flag && match.division != division)
				{
					RecordCoachPosition(match, isGroupState: true);
					flag = false;
				}
				if (match.division != division)
				{
					FillDivision(match.division, ref tabIndex, i);
					division = match.division;
					heightcount++;
				}
			}
			else
			{
				RecordCoachPosition(match);
			}
			bool darkenThis = darkenNext;
			darkenNext = !darkenNext;
			CreateMatch(match, ref darkenThis, ref darkenNext, i);
			heightcount++;
			if (match.HasHumanCoach())
			{
				flag = true;
			}
			if (i == pageMatches.Count - 1 && flag)
			{
				RecordCoachPosition(match, isGroupState: true);
				flag = false;
			}
		}
		for (int num = matchPrefabsPool.Count; num > pageMatches.Count; num--)
		{
			matchPrefabsPool[num - 1].Item2.SetActive(value: false);
		}
		for (int num2 = divisionPrefabsPool.Count; num2 > tabIndex; num2--)
		{
			divisionPrefabsPool[num2 - 1].SetActive(value: false);
		}
		yield return StartCoroutine(GoToPositionInScroll(firstHumanCoach, lastHumanCoach, matchesCanvasGroup, matchesViewport, matchesGroupParent, matchPrefab, 5));
		if (recordAction)
		{
			RecordFavoriteCompetitions(pageMatches);
		}
		void RecordCoachPosition(Match match2, bool isGroupState = false)
		{
			if (!isGroupState)
			{
				if (match2.HasPresentCoach())
				{
					presentCoachFlag = true;
				}
				else if (presentCoachFlag || !match2.HasHumanCoach())
				{
					return;
				}
			}
			float y = matchPrefab.GetComponent<RectTransform>().sizeDelta.y;
			int num3 = Mathf.CeilToInt(matchesViewport.rect.height / y);
			if (firstHumanCoach == 0)
			{
				firstHumanCoach = heightcount;
			}
			else if (heightcount - firstHumanCoach < num3)
			{
				lastHumanCoach = heightcount;
			}
		}
	}

	private void FillCompetition(Competition competition, ref int tabIndex, int index)
	{
		if (divisionPrefabsPool.Count < tabIndex + 1)
		{
			GameObject gameObject = UnityEngine.Object.Instantiate(matchDivisionPrefab, matchesGroupParent, worldPositionStays: false);
			gameObject.GetComponentInChildren<Text>().text = competition.GetName();
			divisionPrefabsPool.Add(gameObject);
		}
		else
		{
			divisionPrefabsPool[tabIndex].GetComponentInChildren<Text>().text = competition.GetName();
			divisionPrefabsPool[tabIndex].SetActive(value: true);
		}
		if (firstTimeRefreshView)
		{
			divisionPrefabsPool[tabIndex].transform.SetSiblingIndex(tabIndex + 1 + index);
		}
		else
		{
			divisionPrefabsPool[tabIndex].transform.SetSiblingIndex(tabIndex + index);
		}
		tabIndex++;
	}

	private void FillDivision(Division division, ref int tabIndex, int index)
	{
		if (divisionPrefabsPool.Count < tabIndex + 1)
		{
			GameObject gameObject = UnityEngine.Object.Instantiate(matchDivisionPrefab, matchesGroupParent, worldPositionStays: false);
			gameObject.GetComponentInChildren<Text>().text = division.GetShortName();
			divisionPrefabsPool.Add(gameObject);
		}
		else
		{
			divisionPrefabsPool[tabIndex].GetComponentInChildren<Text>().text = division.GetShortName();
			divisionPrefabsPool[tabIndex].SetActive(value: true);
		}
		if (firstTimeRefreshView)
		{
			divisionPrefabsPool[tabIndex].transform.SetSiblingIndex(tabIndex + 1 + index);
		}
		else
		{
			divisionPrefabsPool[tabIndex].transform.SetSiblingIndex(tabIndex + index);
		}
		tabIndex++;
	}

	private void CreateMatch(Match match, ref bool darkenThis, ref bool darkenNext, int index)
	{
		if (matchPrefabsPool.Count < index + 1)
		{
			GameObject gameObject = UnityEngine.Object.Instantiate(matchPrefab, matchesGroupParent, worldPositionStays: false);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			MatchPrefab component = gameObject.GetComponent<MatchPrefab>();
			component.Initialize(match, OnTeamClick);
			matchPrefabsPool.Add((component, gameObject));
		}
		else
		{
			matchPrefabsPool[index].Item1.Initialize(match, OnTeamClick);
			matchPrefabsPool[index].Item2.SetActive(value: true);
		}
	}

	private void RecordFavoriteCompetitions(ListOfMatches pageMatches)
	{
		long num = -1L;
		foreach (Match pageMatch in pageMatches)
		{
			if (pageMatch.competition.ID != num)
			{
				DataManager.instance.properties.AddFavoriteCompetition(pageMatch.competition);
				num = pageMatch.competition.ID;
			}
		}
	}

	private IEnumerator StartTimer()
	{
		VerticalLayoutGroup[] componentsInChildren = matchesGroupParent.GetComponentsInChildren<VerticalLayoutGroup>();
		foreach (VerticalLayoutGroup obj in componentsInChildren)
		{
			obj.childControlHeight = false;
			obj.childForceExpandHeight = false;
		}
		pausingAfterMatch = false;
		gameClockText.text = "0";
		bool processing = false;
		float auxTimer = 0f;
		int maxGameTime = Mathf.Min(45, ElifootOptions.matchDuration);
		bool penaltiesTime = false;
		gameTime = 0;
		while (gameTime < maxGameTime)
		{
			if (gamePaused)
			{
				yield return 0;
				continue;
			}
			if (!processing)
			{
				float deltaTime = Time.deltaTime;
				auxTimer += deltaTime * (float)activeMatchSpeed;
			}
			if (isHighSpeed || auxTimer >= 1f)
			{
				gameTime++;
				auxTimer = 0f;
				UpdateClock();
				if (OnMinutePassed != null)
				{
					OnMinutePassed(Mathf.FloorToInt(gameTime));
					yield return StartCoroutine(penaltyView.ProcessInMatchPenalties(matches, gameTime));
					UpdateMatchesInfo();
				}
				if (gameTime == maxGameTime)
				{
					bool isHalfTime = false;
					switch (gameTime)
					{
					case 45:
						yield return StartCoroutine(CheckPause());
						maxGameTime = Mathf.Min(90, ElifootOptions.matchDuration);
						isHalfTime = true;
						break;
					case 90:
						yield return StartCoroutine(CheckPause());
						RefreshMatches(mustTerminate: false);
						if (matches.Count > 0)
						{
							maxGameTime = 105;
							isHalfTime = true;
							ComputeActiveSpeed();
							ResetToTopScroll();
							topMatchesHScrollController.Initialize(matches, GetPreSelectedMatch(), RefreshViewCALL);
						}
						break;
					case 105:
						maxGameTime = 120;
						isHalfTime = true;
						break;
					case 120:
					{
						yield return StartCoroutine(CheckPause());
						bool mustTerminate = !matches.HasCoachPresent(ElifootOptions.SimulationFlag.Match) && !ElifootOptions.penaltiesShootoutAlwaysView;
						RefreshMatches(mustTerminate);
						if (matches.Count > 0)
						{
							ComputeActiveSpeed();
							penaltiesTime = ElifootOptions.penaltiesShootoutEnabled;
							ResetToTopScroll();
							topMatchesHScrollController.Initialize(matches, GetPreSelectedMatch(), RefreshViewCALL);
						}
						break;
					}
					}
					if (isHalfTime)
					{
						yield return StartCoroutine(ShowSubstitutions(gameTime, isHalfTime: true));
					}
				}
				else
				{
					yield return StartCoroutine(ShowSubstitutions(gameTime, isHalfTime: false));
				}
				processing = false;
			}
			yield return 0;
		}
		if (penaltiesTime)
		{
			yield return StartCoroutine(StartPenalties());
			yield break;
		}
		RefreshMatches(mustTerminate: true);
		allMatchesFinished = true;
	}

	private void UpdateClock()
	{
		gameClockText.text = gameTime.ToString();
		Color cOLOR_CLOCK_BEFORE_MATCH = ConfigManager.instance.COLOR_CLOCK_BEFORE_MATCH;
		cOLOR_CLOCK_BEFORE_MATCH = ((gameTime != 45 && gameTime != 90 && gameTime != 120) ? ((!Util.IsBetween(gameTime, 0, 40) && !Util.IsBetween(gameTime, 46, 85) && !Util.IsBetween(gameTime, 91, 115)) ? ConfigManager.instance.COLOR_CLOCK_ENDING : ConfigManager.instance.COLOR_CLOCK_NORMAL) : ConfigManager.instance.COLOR_CLOCK_FINISHED);
		gameClockSlice.color = cOLOR_CLOCK_BEFORE_MATCH;
		float fillAmount = ((gameTime != 45 && gameTime != 90) ? ((float)gameTime % 45f / 60f) : 0.75f);
		gameClockSlice.fillAmount = fillAmount;
	}

	private IEnumerator CheckPause()
	{
		if (matches.HasCoachPresent(ElifootOptions.SimulationFlag.Match))
		{
			pausingAfterMatch = true;
			yield return new WaitForSeconds(DataManager.MATCH_BREAK_WAIT_TIME / (float)activeMatchSpeed);
			pausingAfterMatch = false;
		}
	}

	private void ResetToTopScroll()
	{
		base.gameObject.GetComponentInChildren<ScrollRect>().verticalNormalizedPosition = 1f;
	}

	private void OnTeamClick(Team team, Match match)
	{
		if (!pausingAfterMatch)
		{
			SubstitutionsView.RunMode mode = (team.Coach.Present(ElifootOptions.SimulationFlag.Match) ? SubstitutionsView.RunMode.Substitutions : SubstitutionsView.RunMode.ReadOnly);
			gamePaused = true;
			StartCoroutine(ScreenController.instance.ShowSubstitutionView(match, team, mode, GamePermissions.Permissions.substitutionsAnytime, delegate
			{
				gamePaused = false;
			}, waitForInput: false, gameTime));
		}
	}

	private void UpdateMatchesInfo()
	{
		foreach (var item in matchPrefabsPool)
		{
			if (item.Item2.activeSelf)
			{
				item.Item1.UpdatePrefab();
			}
		}
	}

	private void RefreshMatches(bool mustTerminate)
	{
		for (int num = matches.Count - 1; num >= 0; num--)
		{
			Match match = matches.Match(num);
			if (match.CanTerminate(mustTerminate))
			{
				RemoveMatch(match);
			}
		}
	}

	private void RemoveMatch(Match match)
	{
		OnMinutePassed = (Action<int>)Delegate.Remove(OnMinutePassed, new Action<int>(match.CheckForMatchEvents));
		OnMinutePassed = (Action<int>)Delegate.Remove(OnMinutePassed, new Action<int>(match.ChangePlayerDeltaSkill));
		matches.Remove(match);
	}

	private IEnumerator StartPenalties()
	{
		foreach (Match m in matches)
		{
			if (m.HasPresentCoach())
			{
				if (m.homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					m.homeTeam.teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Shooting;
					if (m.homeTeam.teamMatch.HasSubstitutionsAvailable())
					{
						yield return StartCoroutine(ScreenController.instance.ShowSubstitutionView(m, m.homeTeam, SubstitutionsView.RunMode.Substitutions, PermissionLevel.L0_None, null, waitForInput: true, gameTime));
					}
					yield return StartCoroutine(ScreenController.instance.ShowPenaltyPlayersView(m.homeTeam));
				}
				else
				{
					m.PreparePenaltyShootoutForHomeTeam();
				}
				if (m.awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					m.awayTeam.teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Shooting;
					if (m.awayTeam.teamMatch.HasSubstitutionsAvailable())
					{
						yield return StartCoroutine(ScreenController.instance.ShowSubstitutionView(m, m.awayTeam, SubstitutionsView.RunMode.Substitutions, PermissionLevel.L0_None, null, waitForInput: true, gameTime));
					}
					yield return StartCoroutine(ScreenController.instance.ShowPenaltyPlayersView(m.awayTeam));
				}
				else
				{
					m.PreparePenaltyShootoutForAwayTeam();
				}
			}
			else
			{
				m.PreparePenaltyShootout();
			}
		}
		foreach (var item in matchPrefabsPool)
		{
			if (item.Item2.activeSelf)
			{
				item.Item1.PreparePenaltyMode();
			}
		}
		matchesInPenaltyShootout = true;
		ComputeTimeBetweenPenalties();
		while (matchesInPenaltyShootout)
		{
			if (gamePaused)
			{
				yield return 0;
				continue;
			}
			yield return StartCoroutine(OnePenaltyShootout(isHomeTeam: true, gameTime));
			if (matchesInPenaltyShootout)
			{
				yield return StartCoroutine(OnePenaltyShootout(isHomeTeam: false, gameTime));
			}
		}
		yield return new WaitForSeconds(timeBetweenPenalties);
		for (int num = matches.Count - 1; num >= 0; num--)
		{
			Match match = matches.Match(num);
			RemoveMatch(match);
		}
		allMatchesFinished = true;
	}

	private IEnumerator OnePenaltyShootout(bool isHomeTeam, int gameTime)
	{
		ComputeTimeBetweenPenalties();
		matchesInPenaltyShootout = false;
		bool someMatchEnded = false;
		foreach (Match match3 in matches)
		{
			Team team = (isHomeTeam ? match3.homeTeam : match3.awayTeam);
			if (team.teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Shooting)
			{
				Player player = team.teamMatch.penaltyPlayers.Player(0);
				Match.MatchEvent item = new Match.MatchEvent(MatchEventType.PenaltyPlayer, gameTime, team, player, -1, -1, isHomeTeam);
				match3.eventList.Add(item);
			}
		}
		foreach (var item2 in matchPrefabsPool)
		{
			if (item2.Item2.activeSelf)
			{
				item2.Item1.UpdatePenaltyEvent();
			}
		}
		yield return new WaitForSeconds(timeBetweenPenalties / 2f);
		foreach (Match match4 in matches)
		{
			Team team2 = (isHomeTeam ? match4.homeTeam : match4.awayTeam);
			if (team2.teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Shooting)
			{
				match4.ShootPenaltyForComputer(isHomeTeam, gameTime);
				matchesInPenaltyShootout |= match4.CheckFinishedPenalties();
				if (team2.teamMatch.penaltyShootoutStatus != PenaltyShootoutStatus.Shooting)
				{
					someMatchEnded = true;
				}
			}
		}
		yield return new WaitForSeconds(timeBetweenPenalties);
		UpdateMatchesInfo();
		yield return new WaitForSeconds(timeBetweenPenalties / 2f);
		if (someMatchEnded)
		{
			Match firstMatchWithCoachPresent = matches.GetFirstMatchWithCoachPresent(ElifootOptions.SimulationFlag.Match);
			topMatchesHScrollController.Initialize(matches, firstMatchWithCoachPresent, RefreshViewCALL, inPenalties: true);
		}
	}

	private void ComputeTimeBetweenPenalties()
	{
		int num;
		if (ElifootOptions.IsSimulationFlagActive(ElifootOptions.SimulationFlag.Match))
		{
			num = ElifootOptions.penaltiesShootoutSpeedSimulation;
		}
		else
		{
			bool flag = false;
			foreach (Match match in matches)
			{
				if (!match.CanTerminate(mustTerminate: false) && match.HasPresentCoach())
				{
					flag = true;
					break;
				}
			}
			num = ((!flag) ? ElifootOptions.penaltiesShootoutSpeedNotPresent : ElifootOptions.penaltiesShootoutSpeedPresent);
		}
		timeBetweenPenalties = -0.3f * (float)num + 3.3f;
	}

	private IEnumerator ShowSubstitutions(int _gameTime, bool isHalfTime)
	{
		for (int i = 0; i < matches.Count; i++)
		{
			Match currentMatch = matches.Match(i);
			if (isHalfTime && ElifootOptions.substitutionsAtHalfTime)
			{
				if (currentMatch.homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match) && currentMatch.homeTeam.teamMatch.HasSubstitutionsAvailable())
				{
					yield return StartCoroutine(SubstitutionByHuman(currentMatch.homeTeam, currentMatch, GamePermissions.Permissions.substitutionsAtHalfTime));
				}
				if (currentMatch.awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match) && currentMatch.awayTeam.teamMatch.HasSubstitutionsAvailable())
				{
					yield return StartCoroutine(SubstitutionByHuman(currentMatch.awayTeam, currentMatch, GamePermissions.Permissions.substitutionsAtHalfTime));
				}
				continue;
			}
			if (currentMatch.homeTeam.teamMatch.forcedSubstitution)
			{
				if (currentMatch.homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					yield return StartCoroutine(SubstitutionByHuman(currentMatch.homeTeam, currentMatch, GamePermissions.Permissions.substitutionsAnytime));
				}
				else
				{
					currentMatch.homeTeam.ForcedSubstitutionByComputer(currentMatch, _gameTime);
				}
			}
			if (currentMatch.awayTeam.teamMatch.forcedSubstitution)
			{
				if (currentMatch.awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					yield return StartCoroutine(SubstitutionByHuman(currentMatch.awayTeam, currentMatch, GamePermissions.Permissions.substitutionsAnytime));
				}
				else
				{
					currentMatch.awayTeam.ForcedSubstitutionByComputer(currentMatch, _gameTime);
				}
			}
		}
		yield return 0;
	}

	private IEnumerator SubstitutionByHuman(Team team, Match match, PermissionLevel substitutionPermissionRequired)
	{
		yield return StartCoroutine(ScreenController.instance.ShowSubstitutionView(match, team, SubstitutionsView.RunMode.Substitutions, substitutionPermissionRequired, null, waitForInput: true, gameTime));
		team.teamMatch.forcedSubstitution = false;
	}

	public void PausePressed()
	{
		gamePaused = true;
		StartCoroutine(WaitForUnpause());
	}

	private IEnumerator WaitForUnpause()
	{
		yield return StartCoroutine(ScreenController.instance.ShowPauseView());
		ComputeActiveSpeed();
		gamePaused = false;
	}

	public IEnumerator WaitForMatchesFinished()
	{
		while (!allMatchesFinished)
		{
			yield return 0;
		}
	}
}
