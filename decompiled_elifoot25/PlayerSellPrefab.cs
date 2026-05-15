using System;
using UnityEngine;
using UnityEngine.UI;

public class PlayerSellPrefab : MonoBehaviour
{
	public Button button;

	public Image icon;

	[Header("Player Info")]
	public Image countryFlag;

	public Text position;

	public Text playerName;

	public Text skill;

	public Text goals;

	public Image goalIcon;

	public Text behaviour;

	public Text suspendedDays;

	public Image suspendedIcon;

	[Header("Best offer")]
	public Text bestOfferValue;

	public Image bestOfferTeamFlag;

	public Text bestOfferTeam;

	public Image positionBackground;

	public void Initialize(Player player, Action onClick)
	{
		Sprite lockedIcon = player.GetLockedIcon(player.Team);
		icon.sprite = lockedIcon;
		icon.enabled = lockedIcon != null;
		if (player.BestOfferTeam != null && player.BestOfferValue != 0L)
		{
			bestOfferTeam.text = player.BestOfferTeam.ShortName;
			bestOfferValue.text = Util.MoneyString(player.BestOfferValue);
			SetBestOfferTeamFlag(player.BestOfferTeam);
		}
		else
		{
			bestOfferTeam.text = "";
			bestOfferValue.text = "-----";
			bestOfferTeamFlag.enabled = false;
		}
		positionBackground.color = player.PositionColor();
		position.text = player.PositionCode();
		playerName.text = player.GetName();
		countryFlag.sprite = player.country.flag;
		skill.text = player.skill.ToString();
		behaviour.text = player.BehaviourDesc();
		goalIcon.enabled = player.playerSeason.TotalGoalsInSeason() > 0;
		goals.text = ((player.playerSeason.TotalGoalsInSeason() > 0) ? player.playerSeason.TotalGoalsInSeason().ToString() : "");
		if (player.Suspended > 0)
		{
			suspendedIcon.enabled = true;
			suspendedIcon.sprite = DataManager.instance.redCardIcon;
			suspendedDays.text = player.Suspended.ToString();
		}
		else if (player.Injured > 0)
		{
			suspendedIcon.enabled = true;
			suspendedIcon.sprite = DataManager.instance.injuryIcon;
			suspendedDays.text = player.Injured.ToString();
		}
		else
		{
			suspendedDays.text = "";
			suspendedIcon.enabled = false;
		}
		button.onClick.RemoveAllListeners();
		button.onClick.AddListener(onClick.Invoke);
	}

	private void SetBestOfferTeamFlag(Team team)
	{
		if (team.country == null || team.country.flag == null)
		{
			bestOfferTeamFlag.enabled = false;
			return;
		}
		bestOfferTeamFlag.enabled = true;
		bestOfferTeamFlag.sprite = team.country.flag;
	}

	public void IconButton()
	{
		Player.ShowLockedLegend();
	}
}
