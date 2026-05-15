using System;
using System.Collections;
using System.Collections.Generic;
using Picker;
using UnityEngine;
using UnityEngine.UI;

public class TeamMainView : EliView
{
	private enum Menu
	{
		Match,
		Season,
		Finance,
		Elifoot,
		Facebook,
		Developer,
		Dump
	}

	private enum MenuItemFormat
	{
		Standard,
		Title,
		Disabled,
		Close,
		Highlight
	}

	private Team myTeam;

	private Team myOpponent;

	public Text versionText;

	public Text titleText;

	public RectTransform borders;

	public Animation openAnimation;

	[Header("Team Panel")]
	public RectTransform teamPanel;

	public Text myCoachName;

	public Text myStadium;

	[Space]
	public Text bankAmount;

	public GameObject loanInterestObj;

	public Text loanInterestAmount;

	public Text salariesAmount;

	public GameObject ticketsAmountObj;

	public Text ticketsAmount;

	[Header("Match Panel")]
	public RectTransform matchPanel;

	public Image matchHomeTeamShirt;

	public Text matchHomeTeamName;

	public Text matchHomeCountry;

	public Text matchHomeDivision;

	public Text matchHomePoints;

	public Text matchHomePosition;

	public Image moraleImage;

	[Space]
	public Text homeAway;

	public Text firstLegScore;

	[Space]
	public Image matchAwayTeamShirt;

	public Text matchAwayTeamName;

	public Text matchAwayCountry;

	public Text matchAwayDivision;

	public Text matchAwayPoints;

	public Text matchAwayPosition;

	public Image opponentMoraleImage;

	[Header("Players Main")]
	public RectTransform playersMainPanel;

	public Transform playerGroup;

	public ScrollRect playersScroll;

	public GameObject playerScrollbar;

	public GameObject playerPrefab;

	public GameObject playerPrefabLandscape;

	[Header("Footer")]
	public RectTransform footer;

	public GameObject storeButton;

	public GameObject rewardedAdsButton;

	[Header("Icons for players")]
	public Sprite injuryIcon;

	public Sprite redCardIcon;

	public Sprite soldIcon;

	public Sprite lockedIconGreen;

	public Sprite lockedIconYellow;

	public Sprite lockedIconBlue;

	[Space]
	public Sprite devMessageImage;

	[Header("Selected colors")]
	public Color selectedColor;

	public Color unselectedColor;

	[Header("Menu Panel")]
	public GameObject menuPanel;

	public Transform menuGroup;

	public GameObject menuItemPrefab;

	[Header("Change Salary Panel")]
	public GameObject changeSalaryPanel;

	public Text playerNameText;

	public Text currentSalaryText;

	public StringPicker salaryPicker;

	public Button proposeSalaryBtn;

	public Button cancelSalaryBtn;

	private Dictionary<Player, (GameObject portrait, GameObject landscape)> playerObjList = new Dictionary<Player, (GameObject, GameObject)>();

	private Match currentMatch;

	private string homeText = "#>HOME";

	private string awayText = "#>AWAY";

	private string saveQuitText = "#>Save Before Exit?";

	private string bestFormationText = "#>Select best";

	private string seasonDesc = "#>Season";

	private string noPlayerSelectedMsg = "#>Must select a player first";

	private string cantChangeSalaryMsg = "#>Can't change player salary";

	private string salaryNotAcceptedMsg = "#>Change of salary not acceptable!";

	private string salaryMustAcceptCantSellMsg = "#>Must accept salary change! Can't Sell";

	private string salaryMustAcceptNoOffersMsg = "#>Must accept salary change! No Offers";

	private string salaryOutOfBoundsMsg = "#>Salary value is invalid!";

	private string forcedPlayerSoldMsg = "#>Player was sold!";

	private string mustSellMsg = "#>Must sell player";

	private string salaryForcedRaiseMsg = "#>I demand a raise!! Must accept!";

	private string salaryRaiseMsg = "#>I demand a raise!! Do you accept?";

	private string salaryRaiseFailedToSell = "#>Salary raise refused!! Nobody wants me...";

	private string salaryRaisePlayerSold = "#>Salary raise refused!! Player sold...";

	private string suggestSaveMsg = "#>Want to save?";

	private string saveQuitTitle = "#>Save";

	private Player selectedPlayer;

	private EliList calendarTable;

	private bool salaryPickerInitialized;

	private long playerSalaryDemand = -1L;

	private bool showMyStanding;

	private bool showOpponentStanding;

	private PlayerDetailsView tempSellPlayerDetailsView;

	private PlayerDetailsView tempSalaryPlayerDetailsView;

	private bool isPressingCoachLabel;

	private float pressedTimerCoachLabel;

	private void OnApplicationPause(bool pauseStatus)
	{
		if (pauseStatus && ElifootOptions.autoSaveOnPause)
		{
			DataManager.instance.SaveGame(isAutoSave: true, forcedSave: true);
		}
	}

	public void Initialize(Team myTeam, Match currentMatch)
	{
		InitializationsBeforeOpenAnimation(myTeam, currentMatch);
	}

	internal override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		if (EliView.currentOrientation == EliOrientation.Landscape)
		{
			LandscapeMode();
		}
		else
		{
			PortraitMode();
		}
	}

	private void InitializationsBeforeOpenAnimation(Team myTeam, Match currentMatch)
	{
		this.myTeam = myTeam;
		this.currentMatch = currentMatch;
		myOpponent = ((currentMatch.homeTeam == myTeam) ? currentMatch.awayTeam : currentMatch.homeTeam);
		showMyStanding = myTeam.CompetitionData(currentMatch.competition).leaguePosition > 0;
		showOpponentStanding = showMyStanding;
		myStadium.text = LanguageController.instance.Get_Translation("TEAM_SEATS", myTeam.stadium.NumberSeats.ToString("#,##0"));
		myCoachName.text = myTeam.Coach.Name;
		if (DataManager.instance.buildLevel.CompareTo(PermissionLevel.L7_Tester) >= 0)
		{
			versionText.text = DataManager.instance.GetGameVersion();
		}
		else
		{
			versionText.text = "";
		}
		ScreenController.instance.HideLoadingView();
		LoadLanguage();
		myTeam.Players.SortByPosition();
		FillPlayerObjectList();
		ResetView();
		if (DataManager.instance.isNewGame || DataManager.instance.isLoadedGame)
		{
			if (ElifootOptions.playWorldRanking)
			{
				StartCoroutine(UpdateAndShowRanking());
			}
			else
			{
				PlayOpenAnimation();
			}
		}
		else
		{
			DataManager.instance.UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: false, forceSend: false);
			PlayOpenAnimation();
		}
	}

	private new void PlayOpenAnimation()
	{
		openAnimation.Play();
		Invoke("InitializationsAfterOpenAnimation", openAnimation.clip.length);
	}

	private void InitializationsAfterOpenAnimation()
	{
		if (!DataManager.instance.isLoadedGame)
		{
			myTeam.Players.Shuffle();
			if (!CheckTeamFinance())
			{
				CheckPlayerSalaries();
			}
			CheckSponsorship();
		}
		rewardedAdsButton.SetActive(value: false);
		if (DataManager.instance.matchesWithoutSaving >= 10)
		{
			ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("SAVELOAD_TITLESAVE"), suggestSaveMsg, OpenSaveLoadView, null);
			DataManager.instance.matchesWithoutSaving = 0;
		}
	}

	private IEnumerator UpdateAndShowRanking()
	{
		DataManager.instance.UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: false, forceSend: false);
		if (CheckTeamMainActive())
		{
			if (Application.internetReachability == NetworkReachability.NotReachable)
			{
				PlayOpenAnimation();
			}
			else
			{
				ScreenController.instance.ShowRankingView(showLoadingView: true, showWarningMessages: false, forceReload: false, CheckTeamMainActive, PlayOpenAnimation);
			}
		}
		yield return 0;
	}

	private bool CheckTeamMainActive()
	{
		if (this != null)
		{
			return base.gameObject.activeSelf;
		}
		return false;
	}

	private void LoadLanguage()
	{
		if (LanguageController.instance != null)
		{
			homeText = LanguageController.instance.Get_Translation("TEAM_HOME");
			awayText = LanguageController.instance.Get_Translation("TEAM_AWAY");
			bestFormationText = LanguageController.instance.Get_Translation("TEAM_BESTFORMATION");
			salaryOutOfBoundsMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYINVALID", 100L.ToString(), 200000L.ToString());
			salaryNotAcceptedMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYNOTACCEPTED");
			salaryMustAcceptCantSellMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYMUSTACCEPTCANTSELL");
			salaryMustAcceptNoOffersMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYMUSTACCEPTNOOFFERS");
			cantChangeSalaryMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYUNCHANGEABLE");
			noPlayerSelectedMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYNOTSELECTED");
			forcedPlayerSoldMsg = LanguageController.instance.Get_Translation("FINANCE_FORCEDPLAYERSOLD");
			mustSellMsg = LanguageController.instance.Get_Translation("FINANCE_MUSTSELLPLAYER");
			salaryForcedRaiseMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYRAISEMUSTACCEPT");
			salaryRaiseMsg = LanguageController.instance.Get_Translation("FINANCE_SALARYRAISE");
			salaryRaiseFailedToSell = LanguageController.instance.Get_Translation("FINANCE_SALARYRAISEFAILEDTOSELL");
			salaryRaisePlayerSold = LanguageController.instance.Get_Translation("FINANCE_SALARYRAISEPLAYERSOLD");
			suggestSaveMsg = LanguageController.instance.Get_Translation("SAVE_SUGGESTMSG");
			saveQuitTitle = LanguageController.instance.Get_Translation("TEAM_SAVEQUIT_TITLE");
			saveQuitText = LanguageController.instance.Get_Translation("TEAM_SAVEQUIT_MESSAGE");
			Util.UpdateLanguage();
		}
	}

	private void CheckSponsorship()
	{
		long sponsorshipValue = myTeam.GetSponsorshipValue();
		if (sponsorshipValue > 0)
		{
			myTeam.PaySponsorship();
			ScreenController.instance.ShowDialogPopUp("TEAM_SPONSORSHIP_TITLE", LanguageController.instance.Get_Translation("TEAM_SPONSORSHIP_DESC", Util.MoneyString(sponsorshipValue)), null);
		}
	}

	private void CheckPlayerSalaries()
	{
		float num = (float)myTeam.Money() * 1f;
		float num2 = (float)myTeam.GetTotalSalaries() * 1f;
		if (!(num / num2 >= 6f))
		{
			return;
		}
		foreach (Player p in myTeam.Players)
		{
			if (!p.CanChangeSalary(spontaneous: true))
			{
				continue;
			}
			long fairSalary = Player.GetFairSalary(p.skill, p.MaxSalaryIncrease());
			if (!(num / (num2 - (float)p.Salary + (float)fairSalary) >= 6f) || (p.Salary > 0 && fairSalary <= (long)((float)p.Salary * 1.2f)))
			{
				continue;
			}
			playerSalaryDemand = (long)(Mathf.Round((float)fairSalary * 1.2f / 100f) * 100f);
			string text = LanguageController.instance.Get_Translation("FINANCE_SALARYPLAYERDESC", p.Name, Player.GetPositionDesc(p.Position), p.skill, Player.GetBehaviourDesc(p.Behaviour));
			if (myTeam.CanSellPlayer(p) == SellPlayer.OK)
			{
				ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("TEAM_SALARYRAISE"), string.Format(salaryRaiseMsg, myTeam.Coach.Name, text, Util.MoneyString(p.Salary), Util.MoneyString(playerSalaryDemand)), delegate
				{
					PlayerRaiseAccepted(p, playerSalaryDemand);
				}, delegate
				{
					PlayerRaiseRefused(p);
				});
			}
			else
			{
				ForceRaisePlayerSalary(p);
			}
			break;
		}
	}

	public override void ResetView()
	{
		base.ResetView();
		LoadLanguage();
		RefreshView();
		UpdatePlayerList();
		if (EliView.currentOrientation == EliOrientation.Landscape)
		{
			LandscapeMode();
		}
		else
		{
			PortraitMode();
		}
	}

	private void RefreshView()
	{
		FillTitle();
		bool showHomeStanding = (currentMatch.homeTeam == myTeam && showMyStanding) || (currentMatch.homeTeam == myOpponent && showOpponentStanding);
		bool showAwayStanding = (currentMatch.awayTeam == myTeam && showMyStanding) || (currentMatch.awayTeam == myOpponent && showOpponentStanding);
		FillMatchInfo(showHomeStanding, showAwayStanding);
		if (myTeam != null)
		{
			UpdateFinancesPanel();
		}
	}

	private void LandscapeMode()
	{
		ChangeAnchors(playersMainPanel, 0f, 0.73f, 0f, 1f);
		ChangeAnchors(teamPanel, 0.745f, 1f, 0.6f, 1f);
		ChangeAnchors(matchPanel, 0.745f, 1f, 0.1f, 0.6f);
		footer.SetParent(teamPanel.parent, worldPositionStays: false);
		ChangeAnchors(footer, 0.745f, 1f, 0f, 0.1f);
		footer.offsetMin = new Vector2(0f, 0f);
		footer.offsetMax = new Vector2(0f, 0f);
		borders.sizeDelta = new Vector2(-40f, 0f);
		TogglePortraitPlayers(portrait: false);
		LayoutRebuilder.ForceRebuildLayoutImmediate(footer.parent.GetComponent<RectTransform>());
	}

	private void PortraitMode()
	{
		ChangeAnchors(playersMainPanel, 0f, 1f, 0f, 0.75f);
		ChangeAnchors(teamPanel, 0f, 0.5f, 0.75f, 1f);
		ChangeAnchors(matchPanel, 0.5f, 1f, 0.75f, 1f);
		footer.SetParent(menuPanel.transform.parent, worldPositionStays: false);
		footer.SetSiblingIndex(2);
		ChangeAnchors(footer, 0f, 0f, 1f, 1f);
		borders.sizeDelta = new Vector2(-40f, 0f);
		TogglePortraitPlayers(portrait: true);
		LayoutRebuilder.ForceRebuildLayoutImmediate(footer.parent.GetComponent<RectTransform>());
	}

	private void TogglePortraitPlayers(bool portrait)
	{
		if (myTeam == null || myTeam.Players == null || myTeam.Players.Count == 0)
		{
			return;
		}
		foreach (Player player in myTeam.Players)
		{
			playerObjList[player].portrait.SetActive(portrait);
			playerObjList[player].landscape.SetActive(!portrait);
		}
	}

	private void FillTitle()
	{
		string text = LanguageController.instance.Get_Translation("SEASON_COUNTER_TITLE", DataManager.instance.properties.currentSeasonNumber.ToString());
		string title = currentMatch.calEntry.GetTitle();
		text.Replace(" ", "&nbsp");
		title.Replace(" ", "&nbsp");
		titleText.text = $"{text}\n{title}";
	}

	private void FillMatchInfo(bool showHomeStanding, bool showAwayStanding)
	{
		FillMatchInfoTeam(myTeam, showHomeStanding, matchHomeTeamShirt, matchHomeTeamName, matchHomeCountry, matchHomeDivision, matchHomePoints, matchHomePosition, moraleImage);
		FillMatchInfoTeam(myOpponent, showAwayStanding, matchAwayTeamShirt, matchAwayTeamName, matchAwayCountry, matchAwayDivision, matchAwayPoints, matchAwayPosition, opponentMoraleImage);
		if (myTeam.teamMatch.isHome)
		{
			homeAway.text = LanguageController.instance.Get_Translation("TEAM_HOME");
		}
		else
		{
			homeAway.text = LanguageController.instance.Get_Translation("TEAM_AWAY");
		}
		if (currentMatch.calEntry.matchType == MatchType.CupSecondLeg)
		{
			int goalsFirstLeg = currentMatch.homeTeam.CompetitionData(currentMatch.competition).goalsFirstLeg;
			int goalsFirstLeg2 = currentMatch.awayTeam.CompetitionData(currentMatch.competition).goalsFirstLeg;
			firstLegScore.text = LanguageController.instance.Get_Translation("MATCH_RESULT", goalsFirstLeg, goalsFirstLeg2);
		}
		else
		{
			firstLegScore.text = "";
		}
	}

	private void FillMatchInfoTeam(Team team, bool showStanding, Image shirt, Text lblTeamName, Text lblCountry, Text lblDivision, Text lblPoints, Text lblPosition, Image moraleImage)
	{
		team.DrawLogoOnImage(shirt);
		lblTeamName.text = team.ShortName.ToUpper();
		lblCountry.text = team.country.GetName();
		lblDivision.text = team.GetDivisionName(currentMatch.competition);
		moraleImage.color = myTeam.GetMoraleColor();
		if (showStanding)
		{
			TeamCompetitionData teamCompetitionData = team.CompetitionData(currentMatch.competition);
			if (teamCompetitionData.points == 1)
			{
				lblPoints.text = LanguageController.instance.Get_Translation("TEAM_POINT", teamCompetitionData.points);
			}
			else
			{
				lblPoints.text = LanguageController.instance.Get_Translation("TEAM_POINTS", teamCompetitionData.points);
			}
			lblPosition.text = LanguageController.instance.Get_Translation("TEAM_PLACING", Util.OrdinalString(teamCompetitionData.leaguePosition, LanguageController.activeLanguage));
		}
		else
		{
			lblPoints.text = "";
			lblPosition.text = "";
		}
	}

	private void UpdateFinancesPanel()
	{
		bankAmount.text = Util.MoneyString(myTeam.Money());
		salariesAmount.text = Util.MoneyString(myTeam.GetTotalSalaries());
		loanInterestObj.SetActive(myTeam.BankLoanValue > 0);
		if (myTeam.BankLoanValue > 0)
		{
			float num = (float)myTeam.BankLoanValue * 0.01f;
			loanInterestAmount.text = Util.MoneyString((long)num) ?? "";
		}
		long ticketPrice = currentMatch.ticketPrice;
		bool flag = myTeam.teamMatch.isHome || currentMatch.calEntry.matchType == MatchType.CupSingleLeg;
		if (flag)
		{
			ticketsAmount.text = Util.MoneyString(ticketPrice);
		}
		ticketsAmountObj.SetActive(flag);
	}

	public void OpponentPressed()
	{
		ScreenController.instance.ShowPlayerListView(myOpponent, myTeam);
		HideMenu();
	}

	private void UpdatePlayerObject(Player player)
	{
		var (gameObject, gameObject2) = playerObjList[player];
		if (!(gameObject == null) && !(gameObject2 == null))
		{
			UpdatePlayerObject(gameObject, player);
			UpdatePlayerObject(gameObject2, player);
		}
	}

	private void UpdatePlayerObject(GameObject playerObj, Player player)
	{
		playerObj.transform.Find("Position/Position").GetComponent<Text>().text = player.PositionCode();
		playerObj.transform.Find("Position/PositionBackground").GetComponent<Image>().color = player.PositionColor();
		playerObj.transform.Find("Name").GetComponent<Text>().text = player.GetName();
		Text text = playerObj.transform.Find("Nationality")?.GetComponent<Text>();
		if (text != null)
		{
			text.text = player.country.GetName();
		}
		Image image = playerObj.transform.Find("CountryFlag/Flag")?.GetComponent<Image>();
		if (image != null)
		{
			image.sprite = player.country.flag;
		}
		playerObj.transform.Find("Skill").GetComponent<Text>().text = player.skill.ToString();
		playerObj.transform.Find("Behaviour").GetComponent<Text>().text = player.BehaviourDesc();
		playerObj.transform.Find("Value").GetComponent<Text>().text = Util.MoneyString(player.Salary);
		Text component = playerObj.transform.Find("GoalsScored/Text").GetComponent<Text>();
		component.text = player.playerSeason.GetGoals(currentMatch.competition).ToString();
		if (component.text == "0")
		{
			component.transform.parent.gameObject.SetActive(value: false);
		}
		SetSuspendedIcon(player, playerObj);
		SetLockedIcon(player, playerObj);
		Button.ButtonClickedEvent onClick = playerObj.GetComponentInChildren<Button>().onClick;
		onClick.RemoveListener(delegate
		{
			PlayerSelected(player, autoScroll: false);
		});
		onClick.RemoveAllListeners();
		onClick.AddListener(delegate
		{
			PlayerSelected(player, autoScroll: false);
		});
	}

	private void UpdatePlayerList()
	{
		foreach (Player player in myTeam.Players)
		{
			if (playerObjList.ContainsKey(player))
			{
				UpdatePlayerObject(player);
			}
		}
	}

	private void FillPlayerObjectList()
	{
		ListOfPlayers listOfPlayers = new ListOfPlayers(myTeam.Players);
		listOfPlayers.SortByPosition();
		playerObjList.Clear();
		foreach (Transform item in playerGroup)
		{
			if (item != playerGroup)
			{
				UnityEngine.Object.Destroy(item.gameObject);
			}
		}
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < listOfPlayers.Count; i++)
		{
			Player player = listOfPlayers.Player(i);
			GameObject gameObject = UnityEngine.Object.Instantiate(playerPrefab, playerGroup);
			UpdatePlayerObject(gameObject, player);
			GameObject gameObject2 = UnityEngine.Object.Instantiate(playerPrefabLandscape, playerGroup);
			UpdatePlayerObject(gameObject2, player);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			playerObjList.Add(player, (gameObject, gameObject2));
		}
	}

	private void SetLockedIcon(Player player, GameObject playerObj)
	{
		Image component = playerObj.transform.Find("Icon").GetComponent<Image>();
		Sprite lockedIcon = player.GetLockedIcon(myTeam);
		component.enabled = lockedIcon != null;
		component.sprite = lockedIcon;
		Button component2 = playerObj.transform.Find("Icon").GetComponent<Button>();
		component2.onClick.RemoveAllListeners();
		if (lockedIcon != null)
		{
			component2.onClick.AddListener(Player.ShowLockedLegend);
		}
	}

	private void SetSuspendedIcon(Player player, GameObject playerObj)
	{
		Text component = playerObj.transform.Find("Suspended/Text").GetComponent<Text>();
		component.text = "";
		Image component2 = playerObj.transform.Find("Suspended/Icon").GetComponent<Image>();
		component2.enabled = false;
		if (player.Injured > 0)
		{
			component2.enabled = true;
			component2.sprite = injuryIcon;
			component.text = player.Injured.ToString();
		}
		if (player.Suspended > 0)
		{
			component2.enabled = true;
			component2.sprite = redCardIcon;
			component.text = player.Suspended.ToString();
		}
	}

	private void ForceRaisePlayerSalary(Player player)
	{
		string text = LanguageController.instance.Get_Translation("FINANCE_SALARYPLAYERDESC", player.GetName(), Player.GetPositionDesc(player.Position), player.skill, Player.GetBehaviourDesc(player.Behaviour));
		ScreenController.instance.ShowInfoPopUp(LanguageController.instance.Get_Translation("TEAM_SALARYRAISE"), string.Format(salaryForcedRaiseMsg, myTeam.Coach.Name, text, Util.MoneyString(player.Salary), Util.MoneyString(playerSalaryDemand)), delegate
		{
			ForceRaisePlayerSalaryConfirm(player, playerSalaryDemand);
		});
	}

	private void ForceRaisePlayerSalaryConfirm(Player player, long salaryDemand)
	{
		player.Salary = playerSalaryDemand;
		ResetView();
	}

	private void PlayerRaiseRefused(Player player)
	{
		if (player.BestOfferTeam == null)
		{
			ScreenController.instance.ShowInfoPopUp("PLAYER_MUST_SELL_AUCTION", delegate
			{
				GoToAuction(player);
			});
		}
		else
		{
			selectedPlayer = player;
			ScreenController.instance.ShowDialogPlayerSellTypePopUp(player, OnSellingTypeSelected, forcedSell: true);
		}
	}

	private void GoToAuction(Player player)
	{
		bool forcedSell = tempSellPlayerDetailsView == null;
		StartCoroutine(ScreenController.instance.ShowAuctionView(player, 0L, humanSellingPlayer: true, forcedSell, delegate
		{
			CheckIfPlayerWasSold(player);
		}));
	}

	private void OnSellingTypeSelected(int option)
	{
		if (selectedPlayer != null)
		{
			switch (option)
			{
			case 0:
				DirectSell(selectedPlayer);
				break;
			case 1:
				GoToAuction(selectedPlayer);
				break;
			}
		}
	}

	private void DirectSell(Player player)
	{
		if (tempSellPlayerDetailsView != null)
		{
			tempSellPlayerDetailsView.ReInitialize(player);
			tempSellPlayerDetailsView = null;
		}
		long newSalary = player.BestOfferTeam.AverageSalaryForSkill(player.skill);
		DataManager.PlayerTraded(player, myTeam, player.BestOfferTeam, player.BestOfferValue, newSalary);
		ScreenController.instance.ShowInfoPopUp(string.Format(salaryRaisePlayerSold, player.GetName(), player.BestOfferTeam.Name, Util.MoneyString(player.BestOfferValue)), null);
		myTeam.ComputePlayerOffers();
		ResetView();
	}

	private void CheckIfPlayerWasSold(Player player)
	{
		if (tempSellPlayerDetailsView != null)
		{
			tempSellPlayerDetailsView.ReInitialize(player);
			tempSellPlayerDetailsView = null;
			ResetView();
		}
		else if (myTeam.CanSellPlayer(player) == SellPlayer.OK)
		{
			ForceRaisePlayerSalary(player);
		}
		else
		{
			ResetView();
		}
	}

	private void PlayerRaiseAccepted(Player player, long salaryDemand)
	{
		player.Salary = salaryDemand;
		ResetView();
	}

	private bool CheckTeamFinance()
	{
		bool flag = false;
		if (myTeam.Money() < 0)
		{
			foreach (Player player in myTeam.Players)
			{
				if (myTeam.CanSellPlayer(player) == SellPlayer.OK && player.BestOfferTeam != null)
				{
					flag = true;
					break;
				}
			}
			if (flag)
			{
				ScreenController.instance.ShowInfoPopUp(string.Format(mustSellMsg, myTeam.Coach.Name, myTeam.Name), ShowForcedPlayerSell);
			}
		}
		return flag;
	}

	private void ShowForcedPlayerSell()
	{
		ScreenController.instance.ShowPlayerSellView(myTeam, mustSell: true, ResetView);
	}

	private void OpenSaveLoadView()
	{
		ScreenController.instance.ShowSaveLoadView(isSaveMode: true);
	}

	public void MatchPressed()
	{
		myTeam.SetGamePlayers();
		StartCoroutine(ScreenController.instance.ShowSubstitutionView(currentMatch, myTeam, SubstitutionsView.RunMode.SelectPlayers, PermissionLevel.L0_None, OnFormationSelectedPressed, waitForInput: false, -1));
	}

	public void SeasonPressed()
	{
		ShowMenu(Menu.Season);
	}

	public void FinancePressed()
	{
		ShowMenu(Menu.Finance);
	}

	public void OnWorldRankingPressed()
	{
		ShowRanking();
	}

	public void OnRewardedAdsButtonPressed()
	{
		Util.DoNothing();
	}

	public void OnStoreButtonPressed()
	{
		StorePressed();
	}

	public void ElifootPressed()
	{
		ShowMenu(Menu.Elifoot);
	}

	private void ShowRanking()
	{
		HideMenu();
		bool key = Input.GetKey(KeyCode.LeftShift);
		ScreenController.instance.ShowRankingView(showLoadingView: true, showWarningMessages: true, key);
	}

	private void ShowMenu(Menu menu)
	{
		foreach (Transform item in menuGroup)
		{
			if (item != menuGroup)
			{
				UnityEngine.Object.Destroy(item.gameObject);
			}
		}
		switch (menu)
		{
		case Menu.Season:
		{
			AddMenuTitle("TEAM_SEASONBUTTON");
			AddMenuItem("TEAM_SEASONSTANDINGSBUTTON", OnStandingsPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_ELIFOOTCUPDRAWBUTTON", OnCupDrawPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_ELIFOOTCOACHHISTORYBUTTON", OnCoachHistoryPressed, (!myTeam.Coach.HasEvents()) ? MenuItemFormat.Disabled : MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_CALENDAR", OnCalendarPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_STRIKERS_SEASON", OnStrikersSeasonPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_STRIKERS_EVER", OnStrikersEverPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("PLAYER_MARKET", OnPlayerMarketPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			bool flag = DataManager.instance.allCompetitions.GetCompetitionsWithRecordedWinners().Count > 0;
			AddMenuItem("WINNERS", OnWinnersPressed, (!flag) ? MenuItemFormat.Disabled : MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("WINNERS_BY_YEAR", OnWinnersByYearPressed, (!flag) ? MenuItemFormat.Disabled : MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("COACHRANKING_TITLE", OnLocalRankingPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("RANKING_TITLE", OnWorldRankingPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("COACH_RESIGN", OnCoachResignPressed, (!myTeam.Coach.CanResign()) ? MenuItemFormat.Disabled : MenuItemFormat.Standard, PermissionLevel.L0_None);
			break;
		}
		case Menu.Finance:
			AddMenuTitle("TEAM_FINANCEBUTTON");
			AddMenuItem("TEAM_FINANCEPLAYERBUYBUTTON", PlayerBuyPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_FINANCEBANKBUTTON", BankPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_FINANCESTADIUMBUTTON", StadiumPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_FINANCETICKETSBUTTON", TicketsPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("MENU_TEAMSEASONBALANCE", OnTeamSeasonBalancePressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("MENU_TEAMPLAYEROFFERS", OnPlayerOffersPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("MENU_BANK_LOAN", OnBankLoanPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			break;
		case Menu.Elifoot:
			AddMenuTitle("TEAM_ELIFOOTBUTTON");
			AddMenuItem("TEAM_ELIFOOT_DEVELOPERMENU", DeveloperMenuPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("FACEBOOK", FacebookMenuPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_ELIFOOTOPTIONSBUTTON", OptionsPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_ELIFOOTSAVEBUTTON", SavePressed, MenuItemFormat.Standard, GamePermissions.Permissions.save);
			if (!DataManager.instance.properties.isSocialGame)
			{
				AddMenuItem("TEAM_ELIFOOTCOACHESBUTTON", CoachesPressed, MenuItemFormat.Standard, GamePermissions.Permissions.multipleHumanCoaches);
			}
			AddMenuItem("TEAM_ELIFOOTSHOWPARAMETERSBUTTON", OnReadParametersPressed, MenuItemFormat.Standard, GamePermissions.Permissions.applicationStatus);
			AddMenuItem("OPTIONS_LANGUAGEBUTTON", LanguagePressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("MENU_ABOUT", AboutPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("TEAM_ELIFOOTEXITBUTTON", ExitPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			break;
		case Menu.Facebook:
			AddMenuTitle("FACEBOOK");
			AddMenuItem("FACEBOOK_OFFICIAL_PAGE", FBOfficialPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("FACEBOOK_PLAYERS_PAGE", FBPlayersPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			AddMenuItem("FACEBOOK_TESTERS_PAGE", FBTestersPressed, MenuItemFormat.Standard, PermissionLevel.L7_Tester);
			AddMenuItem("FACEBOOK_ELIAS_PAGE", FBEliasPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			break;
		case Menu.Developer:
			AddMenuTitle("TEAM_ELIFOOT_DEVELOPERMENU");
			AddMenuItem("TEAM_DUMPMENU", DumpMenuPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MENU_COACH_NEWS", DevCoachNewsPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("ENDOFSEASON_TITLE", DevEndOfSeasonPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MENU_UNLOCK_ALL_PLAYERS", UnblockAllPlayersPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MENU_SEND_ERROR", SendErrorPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MENU_SEND_CRASHINFO", SendCrashInfoPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MENU_FORCE_EXCEPTION", ForceExceptionPressed, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MsgDlgView Info", delegate
			{
				StartCoroutine(MsgDlgViewPressed(MsgDlgView.MsgDlgType.Info));
			}, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MsgDlgView YesNo", delegate
			{
				StartCoroutine(MsgDlgViewPressed(MsgDlgView.MsgDlgType.YesNo));
			}, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MsgDlgView Custom", delegate
			{
				StartCoroutine(MsgDlgViewPressed(MsgDlgView.MsgDlgType.Custom));
			}, MenuItemFormat.Standard, GamePermissions.Permissions.devMenu);
			AddMenuItem("MENU_SEND_RANKING_POINTS", SendRankPressed, MenuItemFormat.Standard, PermissionLevel.L0_None);
			break;
		}
		AddMenuCloseItem();
		menuPanel.SetActive(value: true);
	}

	private void AddMenuCloseItem()
	{
		AddMenuItem(LanguageController.instance.Get_Translation("TEAM_CLOSEPANEL"), HideMenu, MenuItemFormat.Close, PermissionLevel.L0_None);
	}

	private void AddMenuTitle(string titleLabel)
	{
		AddMenuItem(titleLabel, null, MenuItemFormat.Title, PermissionLevel.L0_None);
	}

	private void AddMenuItem(string menuLabel, Action onClickRedirect, MenuItemFormat menuItemFormat, PermissionLevel permissionRequired = PermissionLevel.LZ_Infinite)
	{
		if (permissionRequired == PermissionLevel.LZ_Infinite || !GamePermissions.allowed[(int)permissionRequired])
		{
			return;
		}
		string text = LanguageController.instance.Get_Translation(menuLabel);
		GameObject gameObject = UnityEngine.Object.Instantiate(menuItemPrefab);
		gameObject.transform.SetParent(menuGroup, worldPositionStays: false);
		gameObject.GetComponentInChildren<Text>().text = text;
		Color color = ConfigManager.instance.MenuItem_Standard_TextColor;
		Color color2 = ConfigManager.instance.MenuItem_Standard_BackgroundColor;
		Font font = ConfigManager.instance.MenuItem_Standard_Font;
		bool flag = false;
		switch (menuItemFormat)
		{
		case MenuItemFormat.Close:
			color = ConfigManager.instance.MenuItem_Cancel_TextColor;
			font = ConfigManager.instance.MenuItem_Cancel_Font;
			color2 = ConfigManager.instance.MenuItem_Cancel_BackgroundColor;
			flag = true;
			break;
		case MenuItemFormat.Disabled:
			color = ConfigManager.instance.MenuItem_Disabled_TextColor;
			color2 = ConfigManager.instance.MenuItem_Disabled_BackgroundColor;
			font = ConfigManager.instance.MenuItem_Disabled_Font;
			break;
		case MenuItemFormat.Highlight:
			color = ConfigManager.instance.MenuItem_Highlight_TextColor;
			font = ConfigManager.instance.MenuItem_Highlight_Font;
			color2 = ConfigManager.instance.MenuItem_Highlight_BackgroundColor;
			flag = true;
			break;
		case MenuItemFormat.Standard:
			color = ConfigManager.instance.MenuItem_Standard_TextColor;
			font = ConfigManager.instance.MenuItem_Standard_Font;
			color2 = ConfigManager.instance.MenuItem_Standard_BackgroundColor;
			flag = true;
			break;
		case MenuItemFormat.Title:
			color = ConfigManager.instance.MenuItem_Title_TextColor;
			font = ConfigManager.instance.MenuItem_Title_Font;
			color2 = ConfigManager.instance.MenuItem_Title_BackgroundColor;
			gameObject.GetComponentInChildren<Button>().transition = Selectable.Transition.None;
			break;
		}
		if (flag)
		{
			gameObject.GetComponentInChildren<Button>().onClick.RemoveAllListeners();
			gameObject.GetComponentInChildren<Button>().onClick.AddListener(delegate
			{
				onClickRedirect();
			});
			gameObject.GetComponentInChildren<Button>().onClick.AddListener(delegate
			{
				SoundManager.instance.PlaySound(DataManager.instance.soundDefaultClick);
			});
		}
		gameObject.GetComponentInChildren<Text>().color = color;
		gameObject.GetComponentInChildren<Text>().font = font;
		Image[] componentsInChildren = gameObject.GetComponentsInChildren<Image>(includeInactive: true);
		for (int num = 0; num < componentsInChildren.Length; num++)
		{
			componentsInChildren[num].color = color2;
		}
	}

	private void HideMenu()
	{
		menuPanel.SetActive(value: false);
	}

	private void OnFormationSelectedPressed()
	{
		StartCoroutine(FinishedPreparingRoutine());
	}

	private IEnumerator FinishedPreparingRoutine()
	{
		ScreenController.instance.ShowLoadingView();
		yield return 0;
		myTeam.teamMatch.Prepared = true;
		Close();
	}

	private void OnCoachHistoryPressed()
	{
		ScreenController.instance.ShowCoachHistoryView(myTeam.Coach);
		HideMenu();
	}

	private void OnCalendarPressed()
	{
		_ = currentMatch.competition.competitionType;
		_ = currentMatch.competition.competitionSubtype;
		if (calendarTable == null)
		{
			calendarTable = new EliList();
			int num = 0;
			TeamCalendar calendar = myOpponent.teamSeason.calendar;
			foreach (TeamCalendarEntry myCalEntry in myTeam.teamSeason.calendar)
			{
				_ = myCalEntry;
				bool flag = false;
				if (myCalEntry.competition == currentMatch.competition)
				{
					flag = true;
				}
				else if (myCalEntry.competitionType == currentMatch.competition.competitionType)
				{
					flag = true;
				}
				if (flag)
				{
					TeamCalendarEntry calEntry = (TeamCalendarEntry)myOpponent.teamSeason.calendar.Find((EliObject x) => ((TeamCalendarEntry)x).index == myCalEntry.index);
					if (calendar.Count > num)
					{
						calendarTable.Add(new CalendarTableEntry(myCalEntry, calEntry));
					}
					else
					{
						calendarTable.Add(new CalendarTableEntry(myCalEntry, null));
					}
				}
			}
		}
		ScreenController.instance.ShowLeagueCalendar(myTeam, myOpponent, calendarTable);
		HideMenu();
	}

	private void OnStrikersSeasonPressed()
	{
		StartCoroutine(ScreenController.instance.ShowBestStrikersView(currentMatch.competition));
		HideMenu();
	}

	private void OnStrikersEverPressed()
	{
		ScreenController.instance.ShowBestStrikersAllTimeView(myTeam);
		HideMenu();
	}

	private void OnPlayerMarketPressed()
	{
		ScreenController.instance.ShowPlayerMarketView();
		HideMenu();
	}

	private void OnWinnersPressed()
	{
		ScreenController.instance.ShowTitlesView(currentMatch.competition);
		HideMenu();
	}

	private void OnWinnersByYearPressed()
	{
		ScreenController.instance.ShowLastYearWinnersView();
		HideMenu();
	}

	public void OnLocalRankingPressed()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		DataManager.instance.allCoaches.SortByCurrentSocialPointsDesc();
		int num = 1;
		foreach (Coach allCoach in DataManager.instance.allCoaches)
		{
			if (allCoach.human || num <= 20)
			{
				string format = (allCoach.human ? "<color=yellow>{0} {1}</color>" : "{0} {1}");
				listOfParameters.RegisterReadOnlyParameter(string.Format(format, num, allCoach.Name), allCoach.CurrentSocialPoints(), TextAnchor.MiddleRight);
			}
			num++;
		}
		ScreenController.instance.ShowCoachRanking("ID:COACHRANKING_TITLE", listOfParameters);
		HideMenu();
	}

	public void OnCoachResignPressed()
	{
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("COACH_RESIGN"), LanguageController.instance.Get_Translation("COACH_RESIGN_CONFIRM", DataManager.SOCIAL_POINTS_RESIGN), CoachResignConfirm, null);
		HideMenu();
	}

	public void CoachResignConfirm()
	{
		StartCoroutine(TryCoachResign());
	}

	public IEnumerator TryCoachResign()
	{
		CoroutineWithData response = new CoroutineWithData(this, CoachFireAndHire.instance.TryResignCoach(myTeam));
		yield return response.coroutine;
		List<Coach.Invitation> list = (List<Coach.Invitation>)response.result;
		if (list != null && list.Count != 0)
		{
			ScreenController.instance.ShowToastMessage(LanguageController.instance.Get_Translation("COACH_RESIGN_ACCEPTED"), 240f, 4f);
			CheckActiveCoach();
		}
		else
		{
			ScreenController.instance.ShowToastMessage(LanguageController.instance.Get_Translation("COACH_RESIGN_DENIED"), 240f, 4f);
		}
	}

	private void OnCupDrawPressed()
	{
		ScreenController.instance.ShowCupDrawView(currentMatch.competition, myTeam);
		HideMenu();
	}

	private void OnStandingsPressed()
	{
		StartCoroutine(ScreenController.instance.ShowStandingsView(currentMatch.competition, 0, myTeam));
		HideMenu();
	}

	private void BankPressed()
	{
		ScreenController.instance.ShowBankAccount(myTeam.TeamBank);
		HideMenu();
	}

	private void StadiumPressed()
	{
		ScreenController.instance.ShowStadiumView(myTeam, RefreshView);
		HideMenu();
	}

	private void TicketsPressed()
	{
		ScreenController.instance.ShowTicketsView(myTeam.teamTicketIncomeList);
		HideMenu();
	}

	private void PlayerBuyPressed()
	{
		HideMenu();
		ScreenController.instance.ShowPlayerBuyView(myTeam.Coach, RefreshView);
	}

	private void OnPrizesPressed()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		listOfParameters.StartSection("ID:WINNERS");
		ScreenController.instance.ShowParameterEditor(LanguageController.instance.Get_Translation("MENU_PRIZES"), listOfParameters, null, showLoadingView: false);
		HideMenu();
	}

	private void OnPlayerOffersPressed()
	{
		ScreenController.instance.ShowPlayerSellView(myTeam, mustSell: false, ResetView);
		HideMenu();
	}

	private void OnTeamSeasonBalancePressed()
	{
		ScreenController.instance.ShowBalanceView(myTeam);
		HideMenu();
	}

	private void OnBankLoanPressed()
	{
		ScreenController.instance.ShowBankLoanView(myTeam, ResetView);
		HideMenu();
	}

	public void StorePressed()
	{
		HideMenu();
		ScreenController.instance.ShowStoreView(myTeam, null, InAppPurchases.GameItemType.None);
	}

	private void FacebookMenuPressed()
	{
		ShowMenu(Menu.Facebook);
	}

	private void DeveloperMenuPressed()
	{
		ShowMenu(Menu.Developer);
	}

	private void DumpMenuPressed()
	{
		ShowMenu(Menu.Dump);
	}

	private void AboutPressed()
	{
		ScreenController.instance.ShowAboutView();
		HideMenu();
	}

	private void LanguagePressed()
	{
		HideMenu();
		string title = LanguageController.instance.Get_Translation("OPTIONS_SELECTLANGUAGETITLE");
		ScreenController.instance.SelectLanguage(title, SetLanguage, LanguageController.instance.languagesSupported.ToArray());
	}

	private void SetLanguage(string language)
	{
		ScreenController.instance.ShowLoadingView();
		DataManager.instance.SetLanguage(language);
		ResetView();
		ScreenController.instance.HideLoadingView();
	}

	private void TeamEditorPressed()
	{
		HideMenu();
		ScreenController.instance.ShowEditTeamsView();
	}

	private void OnTeamsEdited()
	{
		ResetView();
	}

	private void OptionsPressed()
	{
		HideMenu();
		ScreenController.instance.ShowOptionsView(null);
	}

	private void CoachesPressed()
	{
		ScreenController.instance.ShowCoachesView(CoachManagerViewMode.InGame, CheckActiveCoach);
		HideMenu();
	}

	private void SavePressed()
	{
		ScreenController.instance.ShowSaveLoadView(isSaveMode: true);
		HideMenu();
	}

	private void ExitPressed()
	{
		ScreenController.instance.ShowThreeDialogPopUp(saveQuitTitle, saveQuitText, OnExitSavePressed, OnExitOnlyPressed, OnCancelPressed);
		HideMenu();
	}

	private void OnCancelPressed()
	{
		HideMenu();
	}

	private void OnExitSavePressed()
	{
		ScreenController.instance.ShowSaveLoadView(isSaveMode: true, ExitSavedSuccess);
	}

	private void ExitSavedSuccess()
	{
		DataManager.instance.UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: false, forceSend: false);
		DataManager.instance.stopElifoot = true;
		ScreenController.instance.ShowMainMenu();
		UnityEngine.Object.Destroy(base.gameObject);
	}

	private void OnExitOnlyPressed()
	{
		DataManager.instance.UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: false, forceSend: false);
		DataManager.instance.stopElifoot = true;
		DataManager.instance.DeleteAutoSaveFile();
		ScreenController.instance.ShowMainMenu();
		UnityEngine.Object.Destroy(base.gameObject);
	}

	private void OnReadParametersPressed()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		listOfParameters.StartSection("ID:GEN_FINANCIAL_DATA");
		listOfParameters.StartSection("ID:GEN_DATABASE");
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_NUMBER_OF_TEAMS", DataManager.instance.allTeams.Count, TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_NUMBER_OF_DIVISIONS", DataManager.instance.allDivisions.Count, TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_TEAMS_PER_DIVISION", DataManager.instance.TeamsPerDivision(CompetitionType.NationalLeague), TextAnchor.MiddleRight);
		listOfParameters.StartSection("ID:GEN_DATA_USAGE");
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_NUM_BANK_TRANSACTIONS", DataManager.instance.allTeams.NumBankTransactions(), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_TICKET_INCOME_DATA", DataManager.instance.allTeams.NumTicketIncomeEntries(), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_NUM_COACH_EVENTS", DataManager.instance.allCoaches.NumCoachEvents(), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_PLAYER_TRANSFER", DataManager.instance.properties.playerTransferEventList.Count, TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:GEN_COACH_EVENT_NEWS", DataManager.instance.properties.coachEventNews.Count, TextAnchor.MiddleRight);
		listOfParameters.StartSection("ID:GEN_INTERNAL_VARS");
		listOfParameters.RegisterReadOnlyParameter("EliObject.lastUsedID", EliObject.lastUsedID, TextAnchor.MiddleRight);
		ScreenController.instance.ShowParameterEditor("ID:TEAM_ELIFOOTSHOWPARAMETERSBUTTON", listOfParameters, null, showLoadingView: false);
		HideMenu();
	}

	private static void AddItemToCoachPointsList(ref ListOfParameters theList, Coach.CoachEvent.CoachEventType eventType, CompetitionType competitionType, params object[] args)
	{
	}

	private void OnCoachPointsTablePressed()
	{
		ListOfParameters parametersList = new ListOfParameters();
		ScreenController.instance.ShowParameterEditor("ID:COACH_POINTSTABLE", parametersList, null, showLoadingView: false);
		HideMenu();
	}

	private void SendRankPressed()
	{
		if (!ElifootOptions.playWorldRanking)
		{
			ScreenController.instance.ShowToastMessage("ERROR_WORLD_RANKING_NOT_AUTHORIZED", 240f, 4f);
		}
		else
		{
			DataManager.instance.UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: true, forceSend: true);
		}
		HideMenu();
	}

	private void DevCoachNewsPressed()
	{
		StartCoroutine(ScreenController.instance.ShowSimulatedCoachNews());
	}

	private void DevEndOfSeasonPressed()
	{
		Competition competition = DataManager.instance.allCompetitions.Competition(0);
		Team bestAttack = DataManager.instance.allTeams.Team(3);
		StartCoroutine(ScreenController.instance.ShowEndSeasonView(competition, bestAttack, 0f));
	}

	private void UnblockAllPlayersPressed()
	{
		foreach (Player player in myTeam.Players)
		{
			player.Unlock();
		}
		ResetView();
	}

	private void SendErrorPressed()
	{
		string errorMessage = $"Test. {DateTime.Now.ToLongTimeString()}";
		StartCoroutine(DataManager.instance.SendError(0, "TeamMain", errorMessage));
	}

	private void SendCrashInfoPressed()
	{
		StartCoroutine(DataManager.instance.eliCrash.SendCrashInfo(forceSend: true));
	}

	private void ForceExceptionPressed()
	{
		_ = ((List<int>)null).Count;
	}

	private IEnumerator MsgDlgViewPressed(MsgDlgView.MsgDlgType messageType)
	{
		string title = "Message title";
		string message = "Message text";
		MsgDlgReturnObj msgDlgReturnObj = new MsgDlgReturnObj();
		new MsgDlgReturnObj();
		msgDlgReturnObj.Value = MsgDlgView.MsgDlgReturn.Void;
		MsgDlgImgView msgDlgImgView = UnityEngine.Object.Instantiate(ScreenController.instance.messageWithImageView, base.transform.parent, worldPositionStays: false);
		DlgViewButtonInfo[] toArray = null;
		if (messageType == MsgDlgView.MsgDlgType.Custom)
		{
			DlgViewButtonInfo itemToAdd = new DlgViewButtonInfo(null, "Yes", MsgDlgView.MsgDlgReturn.Yes, closeDialog: true, null);
			Extensions.AddItemInArray(ref toArray, itemToAdd);
			DlgViewButtonInfo itemToAdd2 = new DlgViewButtonInfo(null, "No", MsgDlgView.MsgDlgReturn.No, closeDialog: true, null);
			Extensions.AddItemInArray(ref toArray, itemToAdd2);
			DlgViewButtonInfo itemToAdd3 = new DlgViewButtonInfo(null, "Team", MsgDlgView.MsgDlgReturn.Custom1, closeDialog: false, delegate
			{
				OpponentPressed();
			});
			Extensions.AddItemInArray(ref toArray, itemToAdd3);
		}
		msgDlgImgView.Initialize(messageType, title, message, devMessageImage, null, msgDlgReturnObj, toArray);
		yield return StartCoroutine(msgDlgImgView.WaitForInput());
	}

	private void FBOfficialPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("fb-official"));
	}

	private void FBPlayersPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("fb-players"));
	}

	private void FBTestersPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("fb-testers"));
	}

	private void FBEliasPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("fb-elias"));
	}

	public void CheckActiveCoach()
	{
		if (!myTeam.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement))
		{
			myTeam.PrePrepareMatchByComputer();
			myTeam.PrepareMatchByComputer();
			Close();
		}
	}

	public void DumpPressed()
	{
	}

	private void OnPlayerDetailsPressed()
	{
		HideMenu();
		if (selectedPlayer == null)
		{
			ScreenController.instance.ShowToastMessage(noPlayerSelectedMsg, 240f, 4f);
		}
		else
		{
			selectedPlayer.ShowDetails(OnPlayerDetailsReturnAction);
		}
	}

	private void OnPlayerDetailsReturnAction(PlayerDetailsView playerDetailsView, Player player, PlayerDetailsView.ReturnAction returnAction)
	{
		Player player2 = null;
		switch (returnAction)
		{
		case PlayerDetailsView.ReturnAction.Next:
			player2 = (Player)myTeam.Players.Next(player, rotate: true);
			break;
		case PlayerDetailsView.ReturnAction.Previous:
			player2 = (Player)myTeam.Players.Previous(player, rotate: true);
			break;
		case PlayerDetailsView.ReturnAction.Sell:
			SellOnePlayer(playerDetailsView, player);
			UpdatePlayerObject(player);
			break;
		case PlayerDetailsView.ReturnAction.ChangeSalary:
			ChangePlayerSalary(playerDetailsView, player);
			UpdatePlayerObject(player);
			break;
		case PlayerDetailsView.ReturnAction.Heal:
			player.Injured = 0;
			UpdatePlayerObject(player);
			playerDetailsView.ReInitialize(player);
			break;
		case PlayerDetailsView.ReturnAction.RemoveSuspension:
			player.Suspended = 0;
			UpdatePlayerObject(player);
			playerDetailsView.ReInitialize(player);
			break;
		case PlayerDetailsView.ReturnAction.Close:
			ResetView();
			break;
		}
		if (player2 != null)
		{
			PlayerSelected(player2, autoScroll: true);
			playerDetailsView.ReInitialize(player2);
		}
	}

	private void SellOnePlayer(PlayerDetailsView playerDetailsView, Player player)
	{
		tempSellPlayerDetailsView = playerDetailsView;
		ScreenController.instance.ShowDialogPlayerSellTypePopUp(player, OnSellingTypeSelected, forcedSell: false);
	}

	private void ChangePlayerSalary(PlayerDetailsView playerDetailsView, Player player)
	{
		tempSalaryPlayerDetailsView = playerDetailsView;
		ChangeSalaryPressed();
	}

	public void PlayerDetailsReturn(PlayerDetailsView.ReturnAction returnAction)
	{
	}

	public void ChangeSalaryPressed()
	{
		HideMenu();
		if (selectedPlayer == null)
		{
			ScreenController.instance.ShowToastMessage(noPlayerSelectedMsg, 240f, 4f);
		}
		else if (selectedPlayer.CanChangeSalary(spontaneous: false))
		{
			playerNameText.text = LanguageController.instance.Get_Translation("TEAM_PLAYER_NEW_SALARY", selectedPlayer.Name);
			currentSalaryText.text = string.Format(LanguageController.instance.Get_Translation("TEAM_CURRENTSALARY"), Util.MoneyString(selectedPlayer.Salary));
			long salary = Util.Clamp(selectedPlayer.Salary, 100L, 200000L);
			InitSalaryPicker(salary);
			proposeSalaryBtn.onClick.RemoveAllListeners();
			proposeSalaryBtn.onClick.AddListener(delegate
			{
				ProposeSalaryPressed(selectedPlayer);
			});
			cancelSalaryBtn.onClick.RemoveAllListeners();
			cancelSalaryBtn.onClick.AddListener(delegate
			{
				BackSalaryPressed(selectedPlayer);
			});
			changeSalaryPanel.SetActive(value: true);
		}
		else
		{
			ScreenController.instance.ShowToastMessage(cantChangeSalaryMsg, 240f, 4f);
		}
	}

	private long ReadProposedSalary()
	{
		PickerScrollRect component = salaryPicker.transform.Find("ColumnList/FirstColumn").GetComponent<PickerScrollRect>();
		PickerScrollRect component2 = salaryPicker.transform.Find("ColumnList/SecondColumn").GetComponent<PickerScrollRect>();
		GameObject selectedItem = component.GetSelectedItem();
		GameObject selectedItem2 = component2.GetSelectedItem();
		if (!long.TryParse(selectedItem.name + selectedItem2.name, out var result))
		{
			return 0L;
		}
		return result;
	}

	public void ProposeSalaryPressed(Player player)
	{
		long num = ReadProposedSalary();
		if (num < 100 || num > 200000)
		{
			ScreenController.instance.ShowToastMessage(salaryOutOfBoundsMsg, 240f, 4f);
			return;
		}
		changeSalaryPanel.SetActive(value: false);
		if (player.AcceptsNewSalary(num, out playerSalaryDemand))
		{
			UpdatePlayerObject(player);
			UpdateFinancesPanel();
		}
		else if (myTeam.CanSellPlayer(player) == SellPlayer.OK)
		{
			if (player.BestOfferTeam == null)
			{
				ScreenController.instance.ShowInfoPopUp(LanguageController.instance.Get_Translation("TEAM_SALARYCHANGE"), string.Format(salaryMustAcceptNoOffersMsg, Util.MoneyString(playerSalaryDemand)), null);
				player.Salary = playerSalaryDemand;
				UpdatePlayerObject(player);
				UpdateFinancesPanel();
			}
			else
			{
				ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("TEAM_SALARYCHANGE"), string.Format(salaryNotAcceptedMsg, Util.MoneyString(playerSalaryDemand)), delegate
				{
					PlayerDemandAccepted(player);
				}, delegate
				{
					PlayerDemandRefused(player);
				});
			}
		}
		else
		{
			ScreenController.instance.ShowInfoPopUp(LanguageController.instance.Get_Translation("TEAM_SALARYCHANGE"), string.Format(salaryMustAcceptCantSellMsg, Util.MoneyString(playerSalaryDemand)), null);
			player.Salary = playerSalaryDemand;
			UpdatePlayerObject(player);
			UpdateFinancesPanel();
		}
		ChangeSalaryComplete(player);
	}

	public void PlayerDemandAccepted(Player player)
	{
		player.Salary = playerSalaryDemand;
		ResetView();
		ChangeSalaryComplete(player);
	}

	public void PlayerDemandRefused(Player player)
	{
		long newSalary = player.BestOfferTeam.AverageSalaryForSkill(player.skill);
		DataManager.PlayerTraded(player, myTeam, player.BestOfferTeam, player.BestOfferValue, newSalary);
		ScreenController.instance.ShowInfoPopUp(string.Format(forcedPlayerSoldMsg, player.GetName(), player.BestOfferTeam.Name, Util.MoneyString(player.BestOfferValue)), null);
		myTeam.ComputePlayerOffers();
		ResetView();
		ChangeSalaryComplete(player);
	}

	private void ChangeSalaryComplete(Player player)
	{
		PlayerDetailsView playerDetailsView = tempSalaryPlayerDetailsView;
		tempSellPlayerDetailsView = null;
		if (playerDetailsView != null)
		{
			playerDetailsView.ReInitialize(player);
		}
	}

	public void BackSalaryPressed(Player player)
	{
		changeSalaryPanel.SetActive(value: false);
		ChangeSalaryComplete(player);
	}

	public void PlayerSelected(Player player, bool autoScroll)
	{
		if (selectedPlayer != null)
		{
			UnSelectPlayer(selectedPlayer);
		}
		selectedPlayer = player;
		(GameObject portrait, GameObject landscape) tuple = playerObjList[player];
		GameObject item = tuple.portrait;
		GameObject item2 = tuple.landscape;
		Image component = item.transform.Find("Selected").GetComponent<Image>();
		item.transform.Find("Frame").gameObject.SetActive(value: true);
		component.color = selectedColor;
		component = item2.transform.Find("Selected").GetComponent<Image>();
		item2.transform.Find("Frame").gameObject.SetActive(value: true);
		component.color = selectedColor;
		if (!autoScroll)
		{
			OnPlayerDetailsPressed();
		}
	}

	private void UnSelectPlayer(Player player)
	{
		var (gameObject, gameObject2) = playerObjList[player];
		gameObject.transform.Find("Frame").gameObject.SetActive(value: false);
		selectedPlayer = null;
		gameObject.transform.Find("Selected").GetComponent<Image>().color = unselectedColor;
		gameObject2.transform.Find("Frame").gameObject.SetActive(value: false);
		selectedPlayer = null;
		gameObject2.transform.Find("Selected").GetComponent<Image>().color = unselectedColor;
	}

	private void InitSalaryPicker(long salary)
	{
		if (!salaryPickerInitialized)
		{
			salaryPickerInitialized = true;
			Text[] componentsInChildren = salaryPicker.transform.GetComponentsInChildren<Text>();
			for (int i = 0; i < componentsInChildren.Length; i++)
			{
				componentsInChildren[i].resizeTextMaxSize = 55;
			}
			salaryPicker.SyncItemList();
		}
		SetSalaryPickerValue(salary);
	}

	private void SetSalaryPickerValue(long newSalary)
	{
		PickerScrollRect component = salaryPicker.transform.Find("ColumnList/FirstColumn").GetComponent<PickerScrollRect>();
		PickerScrollRect component2 = salaryPicker.transform.Find("ColumnList/SecondColumn").GetComponent<PickerScrollRect>();
		component.initialPositionItemIndex = (int)(newSalary / 1000);
		component.initialPositionItemIndex = component.initialPositionItemIndex;
		component.initialPositionItemIndex = Mathf.Max(0, component.initialPositionItemIndex);
		component2.initialPositionItemIndex = int.Parse(newSalary.ToString().Substring(newSalary.ToString().Length - 3)) / 100;
		component.initialPosition = InitialPosition.SelectItemIndex;
		component2.initialPosition = InitialPosition.SelectItemIndex;
		Transform child = component.transform.GetChild(0).GetChild(component.initialPositionItemIndex);
		Transform child2 = component2.transform.GetChild(0).GetChild(component2.initialPositionItemIndex);
		if (child != null && child2 != null)
		{
			PickerItem component3 = child.GetComponent<PickerItem>();
			PickerItem component4 = child2.GetComponent<PickerItem>();
			component.ScrollTo(component3);
			component2.ScrollTo(component4);
		}
	}

	private void ChangePickerSalary(long deltaSalary)
	{
		long num = ReadProposedSalary();
		long salaryPickerValue = Util.Clamp(100L, num + deltaSalary, 200000L);
		SetSalaryPickerValue(salaryPickerValue);
	}

	public void SalaryPickerIncrease1000()
	{
		ChangePickerSalary(1000L);
	}

	public void SalaryPickerDecrease1000()
	{
		ChangePickerSalary(-1000L);
	}

	public void SalaryPickerIncrease100()
	{
		ChangePickerSalary(100L);
	}

	public void SalaryPickerDecrease100()
	{
		ChangePickerSalary(-100L);
	}

	public void CoachLabelPressing()
	{
		isPressingCoachLabel = true;
		pressedTimerCoachLabel = 0f;
	}

	public void CoachLabelExit()
	{
		isPressingCoachLabel = false;
	}

	public void CoachLabelPressed()
	{
		CoachLabelExit();
		_ = pressedTimerCoachLabel;
		_ = 1f;
	}

	private void CoachLabelLongPress()
	{
		Debug.Log("Coach label long press.");
		DataManager.instance.UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: true, forceSend: true);
	}

	public override void Update()
	{
		if (isPressingCoachLabel)
		{
			pressedTimerCoachLabel += Time.deltaTime;
			if (pressedTimerCoachLabel >= 3f)
			{
				isPressingCoachLabel = false;
				CoachLabelLongPress();
			}
		}
		base.Update();
	}

	private void OnDisable()
	{
	}
}
