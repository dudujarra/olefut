using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class TeamStandingsPrefab : MonoBehaviour
{
	public Button button;

	public Text leaguePosition;

	public Image teamLogoOrShirt;

	public Text teamName;

	public Text points;

	public Text goalsFor;

	public Text goalsAgainst;

	public Text matchesWon;

	public Text matchesDrawn;

	public Text matchesLost;

	[SerializeField]
	private Image positionBackground;

	[SerializeField]
	private Image semiCirclePositionBackground;

	private Button leaguePositionButton;

	public void Initialize(List<StandingsPositionType> standindsPositionTypes, List<Competition> qualifyingTeams, Team team, TeamCompetitionData teamCompetitionData, Action<Team> OnPrefabPressed)
	{
		int num = ((teamCompetitionData.leaguePosition > 0) ? teamCompetitionData.leaguePosition : 0);
		leaguePosition.text = num.ToString();
		leaguePositionButton = positionBackground.GetComponent<Button>();
		leaguePositionButton.onClick.RemoveAllListeners();
		positionBackground.gameObject.SetActive(value: true);
		switch (standindsPositionTypes[0])
		{
		case StandingsPositionType.Promotion:
			positionBackground.color = ConfigManager.instance.COLOR_OBSCURE_LIST_PROMOTION;
			leaguePositionButton.onClick.AddListener(LeaguePositionClicked(standindsPositionTypes, qualifyingTeams, num));
			break;
		case StandingsPositionType.Relegation:
			positionBackground.color = ConfigManager.instance.COLOR_OBSCURE_LIST_RELEGATION;
			leaguePositionButton.onClick.AddListener(LeaguePositionClicked(standindsPositionTypes, qualifyingTeams, num));
			break;
		case StandingsPositionType.Qualification:
			positionBackground.color = qualifyingTeams[num - 1].GetColor();
			leaguePositionButton.onClick.AddListener(LeaguePositionClicked(standindsPositionTypes, qualifyingTeams, num));
			break;
		case StandingsPositionType.NoChange:
			positionBackground.color = new Color(0f, 0f, 0f, 0f);
			break;
		}
		if (standindsPositionTypes.Count > 1)
		{
			semiCirclePositionBackground.gameObject.SetActive(value: true);
			switch (standindsPositionTypes[1])
			{
			case StandingsPositionType.Promotion:
				semiCirclePositionBackground.color = ConfigManager.instance.COLOR_OBSCURE_LIST_PROMOTION;
				break;
			case StandingsPositionType.Relegation:
				semiCirclePositionBackground.color = ConfigManager.instance.COLOR_OBSCURE_LIST_RELEGATION;
				break;
			case StandingsPositionType.Qualification:
				semiCirclePositionBackground.color = qualifyingTeams[num - 1].GetColor();
				break;
			case StandingsPositionType.NoChange:
				semiCirclePositionBackground.color = Color.white;
				break;
			}
		}
		else
		{
			semiCirclePositionBackground.gameObject.SetActive(value: false);
		}
		team.DrawLogoOnImage(teamLogoOrShirt);
		teamName.text = team.ShortName;
		teamName.color = team.GetCoachTextColor();
		points.text = teamCompetitionData.points.ToString();
		goalsFor.text = teamCompetitionData.goalsFor.ToString();
		goalsAgainst.text = teamCompetitionData.goalsAgainst.ToString();
		matchesWon.text = teamCompetitionData.matchesWon.ToString();
		matchesDrawn.text = teamCompetitionData.matchesDrawn.ToString();
		matchesLost.text = teamCompetitionData.matchesLost.ToString();
		button.onClick.RemoveAllListeners();
		button.onClick.AddListener(delegate
		{
			OnPrefabPressed(team);
		});
	}

	private UnityAction LeaguePositionClicked(List<StandingsPositionType> standindsPositionTypes, List<Competition> qualifyingTeams, int leaguePosition)
	{
		string toastMessage = "";
		for (int i = 0; i < standindsPositionTypes.Count; i++)
		{
			toastMessage += GetToastMessageByStandingsPositionType(standindsPositionTypes[i], qualifyingTeams, leaguePosition);
			toastMessage += ((i < standindsPositionTypes.Count - 1) ? "\n" : "");
		}
		return delegate
		{
			ScreenController.instance.ShowToastMessage(toastMessage, 240f, 4f);
		};
	}

	private string GetToastMessageByStandingsPositionType(StandingsPositionType standingsPositionType, List<Competition> qualifyingTeams, int leaguePosition)
	{
		switch (standingsPositionType)
		{
		case StandingsPositionType.Promotion:
			return LanguageController.instance.Get_Translation("STANDINGS_PROMOTION");
		case StandingsPositionType.Relegation:
			return LanguageController.instance.Get_Translation("STANDINGS_RELEGATION");
		case StandingsPositionType.Qualification:
			return LanguageController.instance.Get_Translation("STANDINGS_QUALIFICATION") + " " + qualifyingTeams[leaguePosition - 1].GetShortName();
		default:
			Debug.LogError("Invalid StandingsColors value");
			return null;
		}
	}
}
