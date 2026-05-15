using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class CupDrawView : EliView
{
	private enum CupDrawViewMode
	{
		normal,
		sale
	}

	public Text titleText;

	public CanvasGroup cupDrawCanvasGroup;

	public RectTransform cupDrawViewport;

	public RectTransform cupDrawGroupParent;

	public GameObject sectionTitlePrefab;

	public GameObject cupMatchPrefab;

	public GameObject teamPrefab;

	[Header("Extra Components")]
	public TopHScrollController topHScrollController;

	private CupDrawViewMode viewMode;

	private string cupMatchesTitle = "#>Cup matches";

	private string skipCupTitle = "#>Skipping next round";

	public void Initialize(Competition baseCompetition, Team baseTeam)
	{
		viewMode = ((baseCompetition != null) ? CupDrawViewMode.sale : CupDrawViewMode.normal);
		ResetView();
		ListOfCompetitions activeCompetitionsByPhase = DataManager.instance.allCompetitions.GetActiveCompetitionsByPhase(CompetitionPhase.FinalPhase);
		topHScrollController.Initialize(activeCompetitionsByPhase, baseCompetition, RefreshView);
	}

	public override void ResetView()
	{
		cupMatchesTitle = LanguageController.instance.Get_Translation("CUP_MATCHES");
		skipCupTitle = LanguageController.instance.Get_Translation("CUP_SKIPTITLE");
	}

	private void RefreshView(Competition selectedCompetition)
	{
		titleText.text = selectedCompetition.GetName();
		for (int i = 0; i < cupDrawGroupParent.childCount; i++)
		{
			Object.Destroy(cupDrawGroupParent.GetChild(i).gameObject);
		}
		StartCoroutine(FillCupMatchesList(selectedCompetition));
	}

	private IEnumerator FillCupMatchesList(Competition selectedCompetition)
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		ListOfTeams listOfTeams2 = new ListOfTeams();
		foreach (Team allCompetitionTeam in selectedCompetition.allCompetitionTeams)
		{
			if (allCompetitionTeam.CompetitionData(selectedCompetition) != null && allCompetitionTeam.CompetitionData(selectedCompetition).isInCup == DataManager.IsInCup.Playing)
			{
				listOfTeams.Add(allCompetitionTeam);
			}
		}
		foreach (Team allTeam in DataManager.instance.allTeams)
		{
			if (allTeam.CompetitionData(selectedCompetition) != null && allTeam.CompetitionData(selectedCompetition).isInCup == DataManager.IsInCup.SkipNext)
			{
				listOfTeams2.Add(allTeam);
			}
		}
		AddTitleSection(cupMatchesTitle);
		int firstHumanCoach = 0;
		int lastHumanCoach = 0;
		int heightcount = 1;
		bool presentCoachFlag = false;
		listOfTeams.SortByCupOrder(selectedCompetition);
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < listOfTeams.Count; i++)
		{
			Team team3 = listOfTeams.Team(i);
			if (team3.CompetitionData(selectedCompetition) != null && team3.CompetitionData(selectedCompetition).isInCup == DataManager.IsInCup.SkipNext)
			{
				listOfTeams2.Add(team3);
				continue;
			}
			Team team4 = listOfTeams.Team(++i);
			GameObject gameObject = Object.Instantiate(cupMatchPrefab, cupDrawGroupParent);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			GameObject teamObj = gameObject.transform.Find("Team1Prefab").gameObject;
			GameObject teamObj2 = gameObject.transform.Find("Team2Prefab").gameObject;
			SetTeam(team3, teamObj);
			SetTeam(team4, teamObj2);
			RecordCoachPosition(team3, team4);
			heightcount++;
		}
		if (listOfTeams2.Count > 0)
		{
			AddTitleSection(skipCupTitle);
			listOfTeams2.SortByName();
			darkenNext = false;
			darkenThis = false;
			foreach (Team item in listOfTeams2)
			{
				GameObject gameObject2 = Object.Instantiate(teamPrefab, cupDrawGroupParent);
				DarkenListBackgroundObj(gameObject2, ref darkenThis, ref darkenNext);
				SetSkipTeam(item, gameObject2);
				RecordCoachPositionSkipTeam(item);
				heightcount++;
			}
		}
		yield return StartCoroutine(GoToPositionInScroll(firstHumanCoach, lastHumanCoach, cupDrawCanvasGroup, cupDrawViewport, cupDrawGroupParent, cupMatchPrefab));
		void RecordCoachPosition(Team team6, Team team7)
		{
			if (team6.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement) || team7.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement))
			{
				presentCoachFlag = true;
			}
			else if (presentCoachFlag || (!team6.Coach.human && !team7.Coach.human))
			{
				return;
			}
			float y = cupMatchPrefab.GetComponent<RectTransform>().sizeDelta.y;
			int num = Mathf.CeilToInt(cupDrawViewport.rect.height / y);
			if (firstHumanCoach == 0)
			{
				firstHumanCoach = heightcount;
			}
			else if (heightcount - firstHumanCoach < num)
			{
				lastHumanCoach = heightcount;
			}
		}
		void RecordCoachPositionSkipTeam(Team team6)
		{
			RecordCoachPosition(team6, team6);
		}
	}

	private void AddTitleSection(string title)
	{
		Text componentInChildren = Object.Instantiate(sectionTitlePrefab, cupDrawGroupParent).GetComponentInChildren<Text>();
		if (componentInChildren != null)
		{
			componentInChildren.text = title;
		}
	}

	private void SetTeam(Team team, GameObject teamObj)
	{
		Util.GetGameObjectText(teamObj, "Name").text = team.ShortName;
		Util.GetGameObjectText(teamObj, "Name").color = team.GetCoachTextColor();
		Image gameObjectImage = Util.GetGameObjectImage(teamObj, "Shirt");
		team.DrawLogoOnImage(gameObjectImage);
		if (viewMode != CupDrawViewMode.sale)
		{
			return;
		}
		Button componentInChildren = teamObj.GetComponentInChildren<Button>();
		if (componentInChildren != null)
		{
			Button.ButtonClickedEvent onClick = componentInChildren.onClick;
			onClick.RemoveAllListeners();
			onClick.AddListener(delegate
			{
				TeamSelected(team);
			});
		}
	}

	private void SetSkipTeam(Team team, GameObject teamObj)
	{
		Text text = teamObj.transform.Find("Name")?.GetComponent<Text>();
		if (text != null)
		{
			text.text = team.ShortName;
			text.color = team.GetCoachTextColor();
		}
		if (team.MyShirt != null)
		{
			Image image = teamObj.transform.Find("Shirt")?.GetComponent<Image>();
			if (image != null)
			{
				team.DrawLogoOnImage(image);
			}
		}
		if (viewMode != CupDrawViewMode.sale)
		{
			return;
		}
		Button componentInChildren = teamObj.GetComponentInChildren<Button>();
		if (componentInChildren != null)
		{
			Button.ButtonClickedEvent onClick = componentInChildren.onClick;
			onClick.RemoveAllListeners();
			onClick.AddListener(delegate
			{
				TeamSelected(team);
			});
		}
	}

	private void TeamSelected(Team team)
	{
		ScreenController.instance.ShowPlayerListView(team, team);
	}

	public void BackPressed()
	{
		Close();
	}
}
