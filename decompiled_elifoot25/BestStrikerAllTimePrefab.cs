using System;
using UnityEngine;
using UnityEngine.UI;

public class BestStrikerAllTimePrefab : MonoBehaviour
{
	public Text playerName;

	public Text teamName;

	public Image teamCountryFlag;

	public Text goals;

	public Button playerButton;

	public Button teamButton;

	private Player player;

	private Action<Player> onPlayerClicked;

	private Action<Team, Player> onTeamClicked;

	public void Initialize(Player player, Action<Player> onPlayerClicked, Action<Team, Player> onTeamClicked)
	{
		this.player = player;
		this.onPlayerClicked = onPlayerClicked;
		this.onTeamClicked = onTeamClicked;
		FillPrefab();
	}

	private void FillPrefab()
	{
		if (player.Team == null)
		{
			playerButton.enabled = false;
			teamName.text = "";
			teamCountryFlag.enabled = false;
			teamButton.enabled = false;
		}
		else
		{
			teamName.text = player.Team.ShortName;
			teamButton.onClick.RemoveAllListeners();
			teamButton.onClick.AddListener(delegate
			{
				onTeamClicked(player.Team, player);
			});
			if (player.Team.country == null)
			{
				teamCountryFlag.enabled = false;
			}
			else
			{
				teamCountryFlag.sprite = player.Team.country.flag;
			}
		}
		playerName.text = player.GetName();
		goals.text = player.history.goalsScored.ToString();
		playerButton.onClick.RemoveAllListeners();
		playerButton.onClick.AddListener(delegate
		{
			onPlayerClicked(player);
		});
	}
}
