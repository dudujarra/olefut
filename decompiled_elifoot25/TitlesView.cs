using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class TitlesView : EliView
{
	private enum TitlesMode
	{
		LastWinners,
		CoachWins,
		TeamWins
	}

	public Text headerText;

	[Header("Last Winners")]
	public GameObject lastWinnersPanel;

	public Transform lastWinnersGroup;

	public GameObject lastWinnersPrefab;

	[Header("Coach Wins")]
	public GameObject coachWinsPanel;

	public Transform coachWinsGroup;

	[Header("Team Wins")]
	public GameObject teamWinsPanel;

	public Transform teamWinsGroup;

	public GameObject lastWinTimesPrefab;

	[Header("Extra Components")]
	public TopHScrollController topHScrollController;

	private TitlesMode titlesMode;

	private Competition selectedCompetition;

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private bool backPressed;

	public void Initialize(Competition baseCompetition)
	{
		ListOfCompetitions competitionsWithRecordedWinners = DataManager.instance.allCompetitions.GetCompetitionsWithRecordedWinners();
		topHScrollController.Initialize(competitionsWithRecordedWinners, baseCompetition, RefreshView);
	}

	private void RefreshView(Competition competition)
	{
		RefreshMode();
		selectedCompetition = competition;
		FillListLastWinners();
		FillListCoachWins();
		FillListTeamWins();
	}

	private void RefreshMode()
	{
		lastWinnersPanel.SetActive(titlesMode == TitlesMode.LastWinners);
		coachWinsPanel.SetActive(titlesMode == TitlesMode.CoachWins);
		teamWinsPanel.SetActive(titlesMode == TitlesMode.TeamWins);
		string text = ((titlesMode == TitlesMode.LastWinners) ? "GEN_LAST_WINNERS" : ((titlesMode == TitlesMode.CoachWins) ? "GEN_WINNERS_COUNT_COACH" : ((titlesMode == TitlesMode.TeamWins) ? "GEN_WINNERS_COUNT_TEAM" : "")));
		headerText.text = LanguageController.instance.Get_Translation(text);
	}

	private void FillListLastWinners()
	{
		for (int i = 0; i < lastWinnersGroup.childCount; i++)
		{
			Object.Destroy(lastWinnersGroup.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		for (int num = selectedCompetition.lastWinners.Count - 1; num >= 0; num--)
		{
			LastWinnersRecord lastWinnersRecord = (LastWinnersRecord)selectedCompetition.lastWinners[num];
			GameObject gameObject = Object.Instantiate(lastWinnersPrefab, lastWinnersGroup);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<LastWinnersPrefab>().Initialize(lastWinnersRecord.year, lastWinnersRecord.podium, BackButtonPressed);
		}
	}

	private void FillListCoachWins()
	{
		for (int i = 0; i < coachWinsGroup.childCount; i++)
		{
			Object.Destroy(coachWinsGroup.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		foreach (Coach item in DataManager.instance.allCoaches.GetAllCoachesWithThisCompetitionWonSorted(selectedCompetition))
		{
			GameObject gameObject = Object.Instantiate(lastWinTimesPrefab, coachWinsGroup);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<LastWinTimesPrefab>().Initialize(item, item.competitionsWon[selectedCompetition]);
		}
	}

	private void FillListTeamWins()
	{
		for (int i = 0; i < teamWinsGroup.childCount; i++)
		{
			Object.Destroy(teamWinsGroup.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		foreach (Team item in DataManager.instance.allTeams.GetAllTeamsWithThisCompetitionWonSorted(selectedCompetition))
		{
			GameObject gameObject = Object.Instantiate(lastWinTimesPrefab, teamWinsGroup);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<LastWinTimesPrefab>().Initialize(item, item.competitionsWon[selectedCompetition]);
		}
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
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
		BackButtonPressed();
	}

	public void BackButtonPressed()
	{
		backPressed = true;
		Close();
	}

	public void LastWinnersButtonPressed()
	{
		titlesMode = TitlesMode.LastWinners;
		RefreshMode();
	}

	public void CoachWinsButtonPressed()
	{
		titlesMode = TitlesMode.CoachWins;
		RefreshMode();
	}

	public void TeamWinsButtonPressed()
	{
		titlesMode = TitlesMode.TeamWins;
		RefreshMode();
	}
}
