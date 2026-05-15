using System;
using UnityEngine;
using UnityEngine.UI;

public class PlayerBuyPrefab : MonoBehaviour
{
	[Header("References")]
	[SerializeField]
	private Button playerButton;

	[SerializeField]
	private Image flagImage;

	[SerializeField]
	private Image positionBackgroundImage;

	[SerializeField]
	private Text positionText;

	[SerializeField]
	private Text nameText;

	[SerializeField]
	private Text skillText;

	[SerializeField]
	private GameObject goalsHolder;

	[SerializeField]
	private Text goalsText;

	[SerializeField]
	private Text valueText;

	[SerializeField]
	private GameObject gamesHolder;

	[SerializeField]
	private Text gamesText;

	[SerializeField]
	private Text behaviourText;

	[SerializeField]
	private GameObject suspendedHolder;

	[SerializeField]
	private Text suspendedText;

	[SerializeField]
	private Image suspendedImage;

	[SerializeField]
	private GameObject injuriesHolder;

	[SerializeField]
	private Text injuriesText;

	[SerializeField]
	private Image injuriesImage;

	[SerializeField]
	private Image teamCountryImage;

	[SerializeField]
	private Text teamText;

	public void FillPrefab(Player player, bool includeTeam, Action action)
	{
		playerButton.onClick.RemoveAllListeners();
		playerButton.onClick.AddListener(delegate
		{
			action?.Invoke();
		});
		flagImage.sprite = player.country.flag;
		positionBackgroundImage.color = player.PositionColor();
		positionText.text = player.PositionCode();
		nameText.text = player.GetName();
		if (player.Injured > 0 || player.Suspended > 0)
		{
			nameText.color = Color.red;
		}
		skillText.text = player.skill.ToString();
		goalsHolder.SetActive(player.history.goalsScored > 0);
		goalsText.text = player.history.goalsScored.ToString();
		valueText.text = GetPlayerValue(player);
		gamesHolder.SetActive(player.history.matchesPlayed > 0);
		gamesText.text = player.history.matchesPlayed.ToString();
		behaviourText.text = player.Behaviour.ToString();
		if (includeTeam)
		{
			teamCountryImage.sprite = player.Team.country.flag;
			teamText.text = player.Team.ShortName;
		}
		else
		{
			teamCountryImage.gameObject.SetActive(value: false);
			teamText.gameObject.SetActive(value: false);
		}
		if (player.history.redCards > 0)
		{
			suspendedHolder.SetActive(value: true);
			suspendedImage.sprite = DataManager.instance.redCardIcon;
			suspendedText.text = player.history.redCards.ToString();
		}
		else
		{
			suspendedHolder.SetActive(value: false);
		}
		if (player.history.injuries > 0)
		{
			injuriesHolder.SetActive(value: true);
			injuriesImage.sprite = DataManager.instance.injuryIcon;
			injuriesText.text = player.history.injuries.ToString();
		}
		else
		{
			injuriesHolder.SetActive(value: false);
		}
	}

	private string GetPlayerValue(Player player)
	{
		bool num = player.Team.IsPlayerForSale(player);
		SellPlayer sellPlayer = player.Team.CanSellPlayer(player);
		if (num)
		{
			return Util.MoneyString(player.directSellPrice);
		}
		if (sellPlayer == SellPlayer.Sold)
		{
			return LanguageController.instance.Get_Translation($"CANSELLPLAYER_{sellPlayer.ToString().ToUpper()}_ABBV");
		}
		return LanguageController.instance.Get_Translation("PLAYERBUY_NOTFORSALE");
	}
}
