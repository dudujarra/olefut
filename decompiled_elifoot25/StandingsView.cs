using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class StandingsView : EliView
{
	public Text headerText;

	public Text standingsTitle;

	public GameObject standingsObj;

	public GameObject loadingObj;

	public CanvasGroup standingsCanvasGroup;

	public RectTransform standingsViewport;

	public RectTransform standingsGroup;

	public GameObject sectionTitlePrefab;

	public GameObject teamStandingsPrefab;

	public Transform titlePrefabPool;

	public Transform teamPrefabPool;

	[Header("Extra Components")]
	public TopHScrollController topHScrollController;

	private bool backPressed;

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private Team baseTeam;

	public void Initialize(Competition baseCompetition, Team baseTeam)
	{
		this.baseTeam = baseTeam;
		ListOfCompetitions competitionsByPhase = DataManager.instance.allCompetitions.GetCompetitionsByPhase(CompetitionPhase.GroupStage);
		topHScrollController.Initialize(competitionsByPhase, baseCompetition, RefreshView);
	}

	public void RefreshView(Competition selectedCompetition)
	{
		headerText.text = selectedCompetition.GetName();
		string text = LanguageController.instance.Get_Translation("SEASON_COUNTER_TITLE", DataManager.instance.properties.currentSeasonNumber.ToString());
		standingsTitle.text = text ?? "";
		StartCoroutine(FillStandings(selectedCompetition));
	}

	private IEnumerator FillStandings(Competition selectedCompetition)
	{
		standingsObj.SetActive(value: false);
		loadingObj.SetActive(value: true);
		yield return new WaitForSeconds(0.5f);
		for (int num = standingsGroup.childCount - 1; num >= 0; num--)
		{
			Transform child = standingsGroup.GetChild(num);
			child.SetParent(child.name.StartsWith("Team") ? teamPrefabPool : titlePrefabPool);
			child.gameObject.SetActive(value: false);
		}
		ListOfDivisions divisions = selectedCompetition.divisions;
		int firstHumanCoach = 0;
		int lastHumanCoach = 0;
		float heightcount = 0f;
		bool presentCoachFlag = false;
		foreach (Division item in divisions)
		{
			AddDivisionTitle(item.GetShortName());
			heightcount += 1.5f;
			item.teams.SortByLeaguePosition(selectedCompetition);
			bool darkenThis = false;
			bool darkenNext = false;
			foreach (Team team in item.teams)
			{
				AddTeamPrefab(selectedCompetition, team, ref darkenThis, ref darkenNext);
				heightcount += 1f;
			}
			RecordCoachPosition(item);
		}
		standingsObj.SetActive(value: true);
		loadingObj.SetActive(value: false);
		yield return StartCoroutine(GoToPositionInScroll(firstHumanCoach, lastHumanCoach, standingsCanvasGroup, standingsViewport, standingsGroup, teamStandingsPrefab));
		void RecordCoachPosition(Division division2)
		{
			if (division2.HasPresentCoach(ElifootOptions.SimulationFlag.TeamManagement))
			{
				presentCoachFlag = true;
			}
			else if (presentCoachFlag || !division2.HasHumanCoach())
			{
				return;
			}
			float y = teamStandingsPrefab.GetComponent<RectTransform>().sizeDelta.y;
			int num2 = Mathf.CeilToInt(standingsViewport.rect.height / y);
			if (firstHumanCoach == 0)
			{
				firstHumanCoach = Mathf.RoundToInt(heightcount);
			}
			else if (heightcount - (float)firstHumanCoach < (float)num2)
			{
				lastHumanCoach = Mathf.RoundToInt(heightcount);
			}
		}
	}

	private void AddDivisionTitle(string title)
	{
		GameObject titleObjectFromPool = GetTitleObjectFromPool();
		titleObjectFromPool.GetComponentInChildren<Text>().text = title;
		titleObjectFromPool.transform.SetParent(standingsGroup);
		titleObjectFromPool.SetActive(value: true);
	}

	private GameObject GetTitleObjectFromPool()
	{
		if (titlePrefabPool.childCount > 0)
		{
			return titlePrefabPool.transform.GetChild(0).gameObject;
		}
		return Object.Instantiate(sectionTitlePrefab, standingsGroup);
	}

	private void AddTeamPrefab(Competition selectedCompetition, Team team, ref bool darkenThis, ref bool darkenNext)
	{
		TeamCompetitionData teamCompetitionData = team.CompetitionData(selectedCompetition);
		GameObject teamObjectFromPool = GetTeamObjectFromPool();
		DarkenListBackgroundObj(teamObjectFromPool, ref darkenThis, ref darkenNext);
		int leaguePos = ((teamCompetitionData.leaguePosition > 0) ? teamCompetitionData.leaguePosition : 0);
		List<Competition> qualifyingTeams = selectedCompetition.GetQualifyingTeams();
		List<StandingsPositionType> standingsPositionTypes = GetStandingsPositionTypes(selectedCompetition, team, leaguePos, qualifyingTeams);
		teamObjectFromPool.GetComponent<TeamStandingsPrefab>().Initialize(standingsPositionTypes, qualifyingTeams, team, teamCompetitionData, TeamPressed);
		teamObjectFromPool.transform.SetParent(standingsGroup);
		teamObjectFromPool.SetActive(value: true);
	}

	private List<StandingsPositionType> GetStandingsPositionTypes(Competition competition, Team team, int leaguePos, List<Competition> qualifyingTeams)
	{
		List<StandingsPositionType> list = new List<StandingsPositionType>();
		if (leaguePos == 0)
		{
			list.Add(StandingsPositionType.NoChange);
			return list;
		}
		int num = Calendars.numberTeamsSwapping[DataManager.instance.properties.divConfigIndex[(int)competition.competitionType]];
		for (int i = 0; i < competition.divisions.Count; i++)
		{
			Division division = (Division)competition.divisions[i];
			if (!division.ContainsTeam(team))
			{
				continue;
			}
			if (i == 0)
			{
				if (division.teams.Count - num < leaguePos)
				{
					list.Add(StandingsPositionType.Relegation);
				}
				if (leaguePos <= qualifyingTeams.Count)
				{
					list.Add(StandingsPositionType.Qualification);
				}
				if (list.Count == 0)
				{
					list.Add(StandingsPositionType.NoChange);
				}
			}
			else if (i == competition.divisions.Count - 1)
			{
				int num2 = Mathf.Min(competition.supernumeraryTeams.Count, num);
				if (division.teams.Count - num2 < leaguePos)
				{
					list.Add(StandingsPositionType.Relegation);
				}
				else if (leaguePos <= num)
				{
					list.Add(StandingsPositionType.Promotion);
				}
				else
				{
					list.Add(StandingsPositionType.NoChange);
				}
			}
			else if (division.teams.Count - num < leaguePos)
			{
				list.Add(StandingsPositionType.Relegation);
			}
			else if (leaguePos <= num)
			{
				list.Add(StandingsPositionType.Promotion);
			}
			else
			{
				list.Add(StandingsPositionType.NoChange);
			}
		}
		return list;
	}

	private GameObject GetTeamObjectFromPool()
	{
		if (teamPrefabPool.childCount > 0)
		{
			return teamPrefabPool.transform.GetChild(0).gameObject;
		}
		return Object.Instantiate(teamStandingsPrefab, standingsGroup);
	}

	private void TeamPressed(Team team)
	{
		pauseTimer = true;
		ScreenController.instance.ShowPlayerListView(team, baseTeam, null, showMoreInfoButton: false, RestartTimer);
	}

	public void RestartTimer()
	{
		secondsTimer = secondsToClose;
		pauseTimer = false;
	}

	public void StartTimeToClose(float seconds)
	{
		secondsToClose = seconds;
		secondsTimer = secondsToClose;
		if (secondsToClose > 0f)
		{
			StartCoroutine(TimeToClose());
		}
	}

	private IEnumerator TimeToClose()
	{
		while (secondsTimer > 0f)
		{
			if (!pauseTimer)
			{
				secondsTimer -= Time.deltaTime;
			}
			yield return 0;
		}
		backPressed = true;
	}

	public void BackButtonPressed()
	{
		backPressed = true;
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}

	public override void Update()
	{
		base.Update();
		if (Input.GetMouseButtonDown(0))
		{
			secondsTimer = secondsToClose;
		}
	}
}
