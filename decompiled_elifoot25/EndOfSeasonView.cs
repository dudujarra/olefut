using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class EndOfSeasonView : EliView
{
	public Text competitionTitle;

	[Header("Teams 3 Places Podium ")]
	public GameObject threePlacesPodium;

	public Image team1stShirt;

	public Text team1stText;

	public Text team1stCoach;

	public Image team2ndShirt;

	public Text team2ndText;

	public Text team2ndCoach;

	public Image team3rdShirt;

	public Text team3rdText;

	public Text team3rdCoach;

	[Header("Teams 2 Places Podium ")]
	public GameObject twoPlacesPodium;

	public Image team1stShirt2;

	public Text team1stText2;

	public Text team1stCoach2;

	public Image team2ndShirt2;

	public Text team2ndText2;

	public Text team2ndCoach2;

	[Header("Best Striker")]
	public Text bestStrikerText;

	public Text bestStrikerValueText;

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private bool backPressed;

	public void Initialize(Competition competition, Team bestAttack)
	{
		competitionTitle.text = competition.GetName();
		FillPodium(competition);
		FillBestStriker(competition);
	}

	private void FillPodium(Competition competition)
	{
		TeamCoach winner = competition.podium.GetWinner();
		TeamCoach second = competition.podium.GetSecond();
		if (winner.Team == null || second.Team == null)
		{
			Debug.LogWarning("ERROR: podium not filled!");
		}
		else if (competition.podium.HasPlace(3))
		{
			TeamCoach third = competition.podium.GetThird();
			Fill3PlacesPodium(winner, second, third);
		}
		else
		{
			Fill2PlacesPodium(winner, second);
		}
	}

	private void Fill3PlacesPodium(TeamCoach firstPlace, TeamCoach secondPlace, TeamCoach thirdPlace)
	{
		threePlacesPodium.SetActive(value: true);
		twoPlacesPodium.SetActive(value: false);
		firstPlace.Team.DrawLogoOnImage(team1stShirt);
		team1stText.text = firstPlace.Team.Name;
		team1stCoach.text = firstPlace.Coach.Name;
		team1stCoach.color = firstPlace.Coach.GetCoachTextColor();
		secondPlace.Team.DrawLogoOnImage(team2ndShirt);
		team2ndText.text = secondPlace.Team.Name;
		team2ndCoach.text = secondPlace.Coach.Name;
		team2ndCoach.color = secondPlace.Coach.GetCoachTextColor();
		thirdPlace.Team.DrawLogoOnImage(team3rdShirt);
		team3rdText.text = thirdPlace.Team.Name;
		team3rdCoach.text = thirdPlace.Coach.Name;
		team3rdCoach.color = thirdPlace.Coach.GetCoachTextColor();
	}

	private void Fill2PlacesPodium(TeamCoach firstPlace, TeamCoach secondPlace)
	{
		threePlacesPodium.SetActive(value: false);
		twoPlacesPodium.SetActive(value: true);
		firstPlace.Team.DrawLogoOnImage(team1stShirt2);
		team1stText2.text = firstPlace.Team.Name;
		team1stCoach2.text = firstPlace.Coach.Name;
		team1stCoach2.color = firstPlace.Coach.GetCoachTextColor();
		secondPlace.Team.DrawLogoOnImage(team2ndShirt2);
		team2ndText2.text = secondPlace.Team.Name;
		team2ndCoach2.text = secondPlace.Coach.Name;
		team2ndCoach2.color = secondPlace.Coach.GetCoachTextColor();
	}

	private void FillBestStriker(Competition competition)
	{
		DataManager.UpdateStrikers(forceUpdate: false, onlyTopGoals: false, setPrizes: false);
		switch (competition.configuration.strikersCriteria)
		{
		case CompetitionStrikersCriteria.Global:
			if (competition.strikers.Count > 0)
			{
				Player player2 = competition.strikers.Player(0);
				bestStrikerText.text = player2.Name;
				bestStrikerValueText.text = player2.playerSeason.GetGoals(competition).ToString();
			}
			else
			{
				bestStrikerText.text = "-";
				bestStrikerValueText.text = "-";
			}
			break;
		case CompetitionStrikersCriteria.PerDivision:
			if (competition.divisions.Division(0).strikers.Count > 0)
			{
				Player player = competition.divisions.Division(0).strikers.Player(0);
				bestStrikerText.text = player.Name;
				bestStrikerValueText.text = player.playerSeason.GetGoals(competition).ToString();
			}
			else
			{
				bestStrikerText.text = "-";
				bestStrikerValueText.text = "-";
			}
			break;
		default:
			throw new NotImplementedException($"EndOfSeason.FillBestStriker, CompetitionStrikersCriteria={competition.configuration.strikersCriteria} not implemented.");
		case CompetitionStrikersCriteria.None:
			break;
		}
	}

	public void BackButtonPressed()
	{
		backPressed = true;
		Close();
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

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}

	public override void Update()
	{
		if (Input.GetMouseButtonDown(0))
		{
			secondsTimer = secondsToClose;
		}
		base.Update();
	}
}
