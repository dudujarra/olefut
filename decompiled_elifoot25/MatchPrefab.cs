using System;
using UnityEngine;
using UnityEngine.UI;

public class MatchPrefab : MonoBehaviour
{
	[Header("Spectators")]
	public Image spectatorsBackground;

	public Text spectators;

	[Header("Home Team")]
	public Button homeTeamButton;

	public Image homeTeamBackground;

	public Text homeTeamName;

	public Text homeTeamGoals;

	public Image homeTeamGoalsBackground;

	public GameObject homeTeamRedCardInGameIcon;

	[Header("Away Team")]
	public Button awayTeamButton;

	public Image awayTeamBackground;

	public Text awayTeamName;

	public Text awayTeamGoals;

	public Image awayTeamGoalsBackground;

	public GameObject awayTeamRedCardInGameIcon;

	[Header("Event")]
	public Image eventIcon;

	public Text eventDescription;

	private Match match;

	public void Initialize(Match match, Action<Team, Match> OnTeamClick)
	{
		this.match = match;
		FillSpectators();
		FillHomeTeam(OnTeamClick);
		FillAwayTeam(OnTeamClick);
		FillEvent(clearForFinishedCupMatches: false);
	}

	private void FillSpectators()
	{
		spectatorsBackground.color = ((match.homeTeam.stadium.NumberSeats == match.attendance) ? ConfigManager.instance.COLOR_STADIUM_FULL : ConfigManager.instance.COLOR_STADIUM_EMPTY);
		spectators.text = (match.attendance / 1000).ToString();
	}

	private void FillHomeTeam(Action<Team, Match> OnTeamClick)
	{
		homeTeamBackground.color = Util.ParseColor(match.homeTeam.backgroundColor);
		homeTeamName.text = match.homeTeam.ShortName;
		homeTeamName.color = Util.ParseColor(match.homeTeam.textColor);
		homeTeamButton.onClick.RemoveAllListeners();
		homeTeamButton.onClick.AddListener(delegate
		{
			OnTeamClick(match.homeTeam, match);
		});
		UpdateHomeTeamStuff();
	}

	private void UpdateHomeTeamStuff()
	{
		homeTeamGoals.text = match.homeTeam.GetGoalsString(match, isHome: true, homeTeamGoals.fontSize);
		homeTeamGoals.color = match.homeTeam.GetGoalTextColor();
		homeTeamGoalsBackground.color = match.homeTeam.GetGoalBackgroundColor();
		homeTeamRedCardInGameIcon.SetActive(match.homeTeam.teamMatch.hasRedCard);
	}

	private void FillAwayTeam(Action<Team, Match> OnTeamClick)
	{
		awayTeamBackground.color = Util.ParseColor(match.awayTeam.backgroundColor);
		awayTeamName.text = match.awayTeam.ShortName;
		awayTeamName.color = Util.ParseColor(match.awayTeam.textColor);
		awayTeamButton.onClick.RemoveAllListeners();
		awayTeamButton.onClick.AddListener(delegate
		{
			OnTeamClick(match.awayTeam, match);
		});
		UpdateAwayTeamStuff();
	}

	private void UpdateAwayTeamStuff()
	{
		awayTeamGoals.text = match.awayTeam.GetGoalsString(match, isHome: false, awayTeamGoals.fontSize);
		awayTeamGoals.color = match.awayTeam.GetGoalTextColor();
		awayTeamGoalsBackground.color = match.awayTeam.GetGoalBackgroundColor();
		awayTeamRedCardInGameIcon.SetActive(match.awayTeam.teamMatch.hasRedCard);
	}

	private void FillEvent(bool clearForFinishedCupMatches)
	{
		Match.MatchEvent lastPrintableEvent = match.GetLastPrintableEvent();
		if ((lastPrintableEvent == null) | match.skipDisplayEvents | (clearForFinishedCupMatches && match.matchCupRoundWinner != MatchCupRoundWinner.None))
		{
			eventDescription.text = "";
			eventIcon.enabled = false;
		}
		else
		{
			eventDescription.text = lastPrintableEvent.GetTextDescription(useEventColorCodes: true, includeGameTime: true);
			eventIcon.sprite = lastPrintableEvent.GetSprite();
			eventIcon.enabled = eventIcon.sprite != null;
		}
	}

	public void UpdatePrefab()
	{
		UpdateHomeTeamStuff();
		UpdateAwayTeamStuff();
		FillEvent(clearForFinishedCupMatches: false);
	}

	public void PreparePenaltyMode()
	{
		UnityEngine.Object.Destroy(homeTeamButton);
		homeTeamButton = null;
		UnityEngine.Object.Destroy(awayTeamButton);
		awayTeamButton = null;
		UpdateHomeTeamStuff();
		UpdateAwayTeamStuff();
		eventIcon.enabled = false;
		eventDescription.text = "";
		match.skipDisplayEvents = match.matchCupRoundWinner != MatchCupRoundWinner.None;
	}

	public void UpdatePenaltyEvent()
	{
		match.skipDisplayEvents = match.matchCupRoundWinner != MatchCupRoundWinner.None;
		FillEvent(clearForFinishedCupMatches: true);
	}
}
