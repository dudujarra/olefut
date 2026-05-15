using System;
using UnityEngine;
using UnityEngine.UI;

public class TeamCoachPrefab3 : MonoBehaviour
{
	[Header("ItemToBuy")]
	public ItemToBuy unlockTeamBuyItem;

	[Header("Icons")]
	public GameObject humanIcon;

	public GameObject vipIcon;

	public GameObject premiumIcon;

	public GameObject buyIcon;

	[Header("UI")]
	public Button myButton;

	public Image country;

	public Image logoOrShirt;

	public Text teamName;

	public Text initLevel;

	[Header("Prefabs")]
	public GameObject countryPrefab;

	public GameObject initLevelPrefab;

	private Team myTeam;

	private Action onTeamClicked;

	public void Initialize(Team team, Action onTeamClicked, bool showCountry, bool showInitLevel)
	{
		myTeam = team;
		this.onTeamClicked = onTeamClicked ?? throw new Exception("TeamCoachPrefab: Initialize => onTeamClicked cant be null");
		FillPrefab(showCountry, showInitLevel);
	}

	private void FillPrefab(bool showCountry, bool showInitLevel)
	{
		if (showCountry)
		{
			myTeam.DrawCountryFlagOnImage(country);
		}
		countryPrefab.SetActive(showCountry);
		initLevel.text = myTeam.initLevel.ToString();
		initLevelPrefab.SetActive(showInitLevel);
		myTeam.DrawLogoOnImage(logoOrShirt);
		teamName.text = myTeam.ShortName;
		teamName.color = myTeam.GetCoachTextColor();
		FillIconLogic();
	}

	private void FillIconLogic()
	{
		var (humanCoachStart, permissionLevel) = myTeam.IsAvailableForHumanCoach();
		switch (humanCoachStart)
		{
		case HumanCoachStart.Available:
		case HumanCoachStart.NotInAnyDivision:
			UnlockTeam();
			break;
		case HumanCoachStart.HumanCoach:
			LockTeamHuman();
			break;
		default:
			LockTeamPermission(permissionLevel);
			break;
		}
	}

	public void UnlockTeam()
	{
		humanIcon.SetActive(value: false);
		vipIcon.SetActive(value: false);
		premiumIcon.SetActive(value: false);
		buyIcon.SetActive(value: false);
		myButton.onClick.RemoveAllListeners();
		myButton.onClick.AddListener(onTeamClicked.Invoke);
		myButton.onClick.AddListener(delegate
		{
			SoundManager.instance.PlaySound(DataManager.instance.soundDefaultClick);
		});
	}

	public void LockTeamHuman()
	{
		humanIcon.SetActive(value: true);
		vipIcon.SetActive(value: false);
		premiumIcon.SetActive(value: false);
		buyIcon.SetActive(value: false);
		myButton.onClick.RemoveAllListeners();
	}

	public void LockTeamPermission(PermissionLevel permissionLevel)
	{
		humanIcon.SetActive(value: false);
		vipIcon.SetActive(GamePermissions.GetCurRegLevel() < permissionLevel && permissionLevel <= PermissionLevel.L3_VIP);
		premiumIcon.SetActive(GamePermissions.GetCurRegLevel() < permissionLevel && permissionLevel <= PermissionLevel.L6_Premium);
		buyIcon.SetActive(value: false);
		myButton.onClick.RemoveAllListeners();
		myButton.onClick.AddListener(delegate
		{
			SoundManager.instance.PlaySound(DataManager.instance.soundDefaultClick);
		});
	}

	private ItemToBuy GetItemToBuy(Team team)
	{
		unlockTeamBuyItem.image = team.GetLogoOrShirt();
		unlockTeamBuyItem.imageColor = team.GetLogoOrShirtColor();
		unlockTeamBuyItem.title = team.ShortName;
		return unlockTeamBuyItem;
	}
}
