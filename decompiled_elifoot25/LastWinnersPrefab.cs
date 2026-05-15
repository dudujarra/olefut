using System;
using UnityEngine;
using UnityEngine.UI;

public class LastWinnersPrefab : MonoBehaviour
{
	public Button yearOrCompetitionButton;

	public Text yearOrCompetition;

	[Header("Team 1st place")]
	public Image team1stLogo;

	public Button team1stButton;

	public Text team1stName;

	public Button coach1stButton;

	public Text coach1stName;

	[Header("Team 2nd place")]
	public Image team2ndLogo;

	public Button team2ndButton;

	public Text team2ndName;

	public Button coach2ndButton;

	public Text coach2ndName;

	[Header("Team 3rd place")]
	public Image team3rdLogo;

	public Button team3rdButton;

	public Text team3rdName;

	public Button coach3rdButton;

	public Text coach3rdName;

	public void Initialize(Competition competition, Podium myPodium, Action onCloseView)
	{
		Initialize(competition.GetShortName(), myPodium, onCloseView, competition);
	}

	public void Initialize(int year, Podium myPodium, Action onCloseView)
	{
		Initialize(year.ToString(), myPodium, onCloseView, null, year);
	}

	private void Initialize(string yearOrCompetition, Podium myPodium, Action onCloseView, Competition competition = null, int year = 0)
	{
		this.yearOrCompetition.text = yearOrCompetition;
		if (competition != null)
		{
			yearOrCompetitionButton.onClick.AddListener(onCloseView.Invoke);
			yearOrCompetitionButton.onClick.AddListener(delegate
			{
				ScreenController.instance.ShowTitlesView(competition);
			});
		}
		else
		{
			yearOrCompetitionButton.onClick.AddListener(onCloseView.Invoke);
			yearOrCompetitionButton.onClick.AddListener(delegate
			{
				ScreenController.instance.ShowLastYearWinnersView(year);
			});
		}
		FillPlace(myPodium, 1, team1stLogo, team1stName, team1stButton, coach1stName, coach1stButton);
		FillPlace(myPodium, 2, team2ndLogo, team2ndName, team2ndButton, coach2ndName, coach2ndButton);
		FillPlace(myPodium, 3, team3rdLogo, team3rdName, team3rdButton, coach3rdName, coach3rdButton);
	}

	private void FillPlace(Podium myPodium, int place, Image teamLogo, Text teamName, Button teamButton, Text coachName, Button coachButton)
	{
		if (myPodium.HasPlace(place))
		{
			TeamCoach winnerRecord = myPodium.GetPlace(place);
			winnerRecord.Team.DrawLogoOnImage(teamLogo);
			teamName.text = winnerRecord.Team.ShortName;
			teamButton.onClick.AddListener(delegate
			{
				ScreenController.instance.ShowTitlesPopUp(winnerRecord.Team);
			});
			coachName.text = winnerRecord.Coach.Name;
			coachName.color = winnerRecord.Coach.GetCoachTextColor();
			coachButton.onClick.AddListener(delegate
			{
				ScreenController.instance.ShowTitlesPopUp(winnerRecord.Coach);
			});
		}
		else
		{
			teamLogo.enabled = false;
			teamName.text = "";
			teamButton.enabled = false;
			coachName.text = "";
			coachButton.enabled = false;
		}
	}
}
