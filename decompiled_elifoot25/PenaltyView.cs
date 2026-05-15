using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class PenaltyView : EliView
{
	[Header("Penalty Panel")]
	public GameObject penaltyPanel;

	public Text penaltyPanelTitle;

	public Text homeTeamName;

	public Text homeTeamGoals;

	public Image homeTeamShirt;

	public Text awayTeamName;

	public Text awayTeamGoals;

	public Image awayTeamShirt;

	public GameObject statusObj;

	public Text statusText;

	[Header("Players Panel")]
	public GameObject penaltyPlayersPanel;

	public Text teamName;

	public Image teamShirt;

	public Transform penaltyPlayersGroupParent;

	public GameObject playerPenaltyPrefab;

	private ListOfMatches matches;

	private int gameTime;

	private Player humanTeamPenaltyPlayer;

	public IEnumerator ProcessInMatchPenalties(ListOfMatches matches, int gameTime)
	{
		this.matches = matches;
		this.gameTime = gameTime;
		foreach (Match match in matches)
		{
			if (match.homeTeam.teamMatch.waitingForInMatchPenalty)
			{
				if (match.homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match) || match.awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					yield return StartCoroutine(StartInMatchPenaltyPresent(match, isHome: true, gameTime));
				}
				else
				{
					StartInMatchPenaltyNonHuman(match, isHome: true, gameTime);
				}
			}
			else if (match.awayTeam.teamMatch.waitingForInMatchPenalty)
			{
				if (match.homeTeam.Coach.Present(ElifootOptions.SimulationFlag.Match) || match.awayTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					yield return StartCoroutine(StartInMatchPenaltyPresent(match, isHome: false, gameTime));
				}
				else
				{
					StartInMatchPenaltyNonHuman(match, isHome: false, gameTime);
				}
			}
		}
	}

	private IEnumerator StartInMatchPenaltyPresent(Match match, bool isHome, int matchMinutes)
	{
		penaltyPanel.SetActive(value: true);
		FillPenaltyPanel(match, isHome);
		yield return new WaitForSeconds(0f);
		Team penaltyShootingTeam = (isHome ? match.homeTeam : match.awayTeam);
		Player player = null;
		if (penaltyShootingTeam.Coach.Present(ElifootOptions.SimulationFlag.Match))
		{
			humanTeamPenaltyPlayer = null;
			penaltyPlayersPanel.gameObject.SetActive(value: true);
			FillPenaltyPlayersPanel(penaltyShootingTeam);
			while (humanTeamPenaltyPlayer == null)
			{
				yield return 0;
			}
			player = humanTeamPenaltyPlayer;
		}
		if (player == null)
		{
			player = penaltyShootingTeam.teamMatch.GetRandomSelectedPlayer(1);
		}
		statusObj.SetActive(value: true);
		statusText.text = LanguageController.instance.Get_Translation("MATCHES_PENALTYSHOOTER", player.Name);
		MatchEventType penaltyResult = match.ShootPenalty(isHome, player, inMatchPenalty: true, gameTime);
		yield return new WaitForSeconds(DataManager.PENALTIES_IN_MATCH_WAIT_TIME);
		if ((penaltyResult == MatchEventType.PenaltyGoalInMatch || penaltyResult == MatchEventType.PenaltyGoalShootout) && match.HasPresentCoach())
		{
			SoundManager.instance.PlaySound(DataManager.instance.GetMatchEventAudioSource(penaltyResult), vibration: true, overrideOthers: true);
		}
		statusObj.SetActive(value: true);
		statusText.text = LanguageController.instance.Get_Translation("MATCHEVENT_" + penaltyResult.ToString().ToUpperInvariant());
		UpdatePenaltyPanelGoals(match);
		yield return new WaitForSeconds(DataManager.PENALTIES_IN_MATCH_WAIT_TIME);
		penaltyPanel.SetActive(value: false);
		penaltyShootingTeam.teamMatch.waitingForInMatchPenalty = false;
		humanTeamPenaltyPlayer = null;
	}

	private void FillPenaltyPanel(Match match, bool isHome)
	{
		homeTeamName.text = match.homeTeam.Name;
		match.homeTeam.DrawShirtOnImage(homeTeamShirt);
		awayTeamName.text = match.awayTeam.Name;
		match.awayTeam.DrawShirtOnImage(awayTeamShirt);
		UpdatePenaltyPanelGoals(match);
	}

	private void UpdatePenaltyPanelGoals(Match match)
	{
		homeTeamGoals.text = match.homeTeam.teamMatch.goals.ToString();
		awayTeamGoals.text = match.awayTeam.teamMatch.goals.ToString();
	}

	private void StartInMatchPenaltyNonHuman(Match match, bool isHome, int matchMinutes)
	{
		Team obj = (isHome ? match.homeTeam : match.awayTeam);
		Player randomSelectedPlayer = obj.teamMatch.GetRandomSelectedPlayer(1);
		match.ShootPenalty(isHome, randomSelectedPlayer, inMatchPenalty: true, matchMinutes);
		obj.teamMatch.waitingForInMatchPenalty = false;
	}

	private void FillPenaltyPlayersPanel(Team penaltyShootingTeam)
	{
		teamName.text = penaltyShootingTeam.Name;
		penaltyShootingTeam.DrawShirtOnImage(teamShirt);
		for (int i = 0; i < penaltyPlayersGroupParent.childCount; i++)
		{
			Object.Destroy(penaltyPlayersGroupParent.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		for (int j = 0; j < penaltyShootingTeam.teamMatch.selectedPlayersSpots.Length; j++)
		{
			Player player = penaltyShootingTeam.teamMatch.selectedPlayersSpots[j].player;
			if (player != null)
			{
				GameObject gameObject = Object.Instantiate(playerPenaltyPrefab, penaltyPlayersGroupParent);
				DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
				gameObject.transform.Find("Position/Position").GetComponent<Text>().text = player.PositionCode();
				gameObject.transform.Find("Position/PositionBackground").GetComponent<Image>().color = player.PositionColor();
				gameObject.transform.Find("Name").GetComponent<Text>().text = player.GetName();
				gameObject.transform.Find("Skill").GetComponent<Text>().text = player.skill.ToString();
				gameObject.GetComponentInChildren<Button>().onClick.AddListener(delegate
				{
					PenaltyPlayerSelected(player);
				});
			}
		}
	}

	private void PenaltyPlayerSelected(Player player)
	{
		humanTeamPenaltyPlayer = player;
		penaltyPlayersPanel.gameObject.SetActive(value: false);
	}
}
