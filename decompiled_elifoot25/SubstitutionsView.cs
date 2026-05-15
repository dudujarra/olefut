using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.UI.Extensions;

public class SubstitutionsView : EliView
{
	public enum RunMode
	{
		ReadOnly,
		Substitutions,
		SelectPlayers,
		SelectPlayersOpponent
	}

	[Serializable]
	public struct Spot
	{
		public GameObject spot;

		public Image background;

		public Text formationPosition;

		public GameObject alertIcon;

		public Image alertIconImage;

		public Animation swapAnimation;
	}

	public enum SubstitutionModeStatus
	{
		Standard,
		RedCard,
		NoKeeper,
		InjuredWithSubstitute,
		InjuredNoSubstitute,
		NoMoreSubstitutions,
		NoPermission
	}

	[Header("Header")]
	public Text titleText;

	[Header("Teams Info")]
	public Image team1ButtonBackground;

	public Image team2ButtonBackground;

	public Image team1Logo;

	public Image team2Logo;

	public Text team1Name;

	public Text team2Name;

	public Text team1CoachName;

	public Text team2CoachName;

	public GameObject team1CoachHumanIcon;

	public GameObject team2CoachHumanIcon;

	[Header("Match Score")]
	public Text team1Score;

	public Text team2Score;

	public Text ScoreVS;

	public Text team1PenaltyScore;

	public Text team2PenaltyScore;

	public GameObject PenaltyScoreVS;

	public Text team1FirstHandScore;

	public Text team2FirstHandScore;

	public GameObject FirstHandScoreVS;

	public GameObject team1RedCardInGame;

	public GameObject team2RedCardInGame;

	[Header("Formation")]
	public Button dropdownButton;

	public GameObject dropdownArrow;

	public CustomDropdown tacticsDropdown;

	public Toggle refreshPlayersCheckbox;

	[Header("Playing List")]
	public RectTransform playingMainObject;

	public RectTransform playingHeader;

	public Text playingTitle;

	public RectTransform playingParent;

	public ReorderableList reorderableList;

	public Spot[] playingSlots;

	[Header("Substitutes List")]
	public RectTransform substitutesMainObject;

	public RectTransform substitutesHeader;

	public Text substitutesTitle;

	public RectTransform substitutesParent;

	public GameObject substitutePrefab;

	[Header("Unused List")]
	public RectTransform unusedMainObject;

	public RectTransform unusedHeader;

	public Text unusedTitle;

	public RectTransform unusedScrollObj;

	public RectTransform unusedParent;

	[Header("Events List")]
	public GameObject eventsListObj;

	public RectTransform eventsMainObject;

	public RectTransform eventsHeader;

	public RectTransform eventsScrollObj;

	public RectTransform eventsParent;

	public GameObject eventPrefab;

	[Header("Footer")]
	public Button playButton;

	public Button doneButton;

	public Button backButton;

	[Header("Prefabs")]
	public Color selectedColor;

	public Color unselectedColor;

	private readonly Color ALERT_RED = new Color32(byte.MaxValue, 0, 0, byte.MaxValue);

	private readonly Color ALERT_YELLOW = new Color32(byte.MaxValue, byte.MaxValue, 0, byte.MaxValue);

	private readonly Color TEAM_SELECTED_BUTTON_BACKGROUND = new Color32(0, 0, 0, 85);

	private readonly Color TEAM_NOTSELECTED_TRANSPARENCY = new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, 130);

	private readonly float TEAM_NOTSELECTED_A = 0.51f;

	[HideInInspector]
	public Team myTeam;

	private Match currentMatch;

	private int gameTime;

	private bool showUnusedPlayers;

	private SubstitutePrefab firstSelectedPlayer;

	private SubstitutePrefab secondSelectedPlayer;

	private RunMode runMode;

	private SubstitutionModeStatus modeStatus;

	private bool firstTimeComputeStatus;

	private bool waitForInput;

	private PermissionLevel permissionLevel;

	private bool hasPermission;

	private Action onPlayPressed;

	private string confirmSubstitutionMsg = "";

	private string invalidSubstitutionMsg = "";

	private string noMoreSubstitutionMsg = "";

	private string invalidSelectionMsg = "";

	private readonly float prefabLandscapeModeY = 94f;

	private readonly float LANDSCAPEMODE_ANCHOR_Y_MIN = 0.015f;

	private readonly float LANDSCAPEMODE_ANCHOR_Y_MAX = 0.645f;

	private readonly float LANDSCAPEMODE_HEADER_Y_MIN = 0.93f;

	public void Initialize(Match currentMatch, Team myTeam, RunMode runMode, PermissionLevel substitutionPermissionRequired, Action onPlayPressed, bool waitForInput, int gameTime = 0)
	{
		this.myTeam = myTeam;
		this.onPlayPressed = onPlayPressed;
		this.runMode = runMode;
		permissionLevel = substitutionPermissionRequired;
		hasPermission = GamePermissions.allowed[(int)substitutionPermissionRequired];
		this.waitForInput = waitForInput;
		this.currentMatch = currentMatch;
		this.gameTime = gameTime;
		if (runMode == RunMode.SelectPlayers || runMode == RunMode.SelectPlayersOpponent)
		{
			eventsListObj.SetActive(value: false);
			titleText.text = LanguageController.instance.Get_Translation("SUBSTITUTES_TITLE_SELECTPLAYERS");
		}
		else
		{
			eventsListObj.SetActive(value: true);
			UpdateMatchEventList();
			titleText.text = LanguageController.instance.Get_Translation("SUBSTITUTES_TITLE_SUBSTITUTIONS");
		}
		ResetView();
		UpdateView();
		if (runMode == RunMode.ReadOnly || runMode == RunMode.SelectPlayersOpponent || modeStatus == SubstitutionModeStatus.NoPermission)
		{
			reorderableList.IsDraggable = false;
			dropdownButton.enabled = false;
			dropdownArrow.SetActive(value: false);
		}
		else
		{
			reorderableList.IsDraggable = true;
			dropdownButton.enabled = true;
			dropdownArrow.SetActive(value: true);
			reorderableList.OnElementDropped.AddListener(ReorderSelectedPlayers);
			reorderableList.IsDraggable = true;
		}
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

	public IEnumerator WaitForInput()
	{
		while (waitForInput)
		{
			yield return 0;
		}
	}

	public override void ResetView()
	{
		base.ResetView();
		confirmSubstitutionMsg = LanguageController.instance.Get_Translation("SUBSTITUTES_CONFIRMSUBMSG");
		invalidSubstitutionMsg = LanguageController.instance.Get_Translation("SUBSTITUTES_INVALIDSUBMSG");
		invalidSelectionMsg = LanguageController.instance.Get_Translation("SUBSTITUTES_INVALIDSELECTMSG");
		noMoreSubstitutionMsg = LanguageController.instance.Get_Translation("SUBSTITUTES_INVALIDSUBMSG");
		if (EliView.currentOrientation == EliOrientation.Landscape)
		{
			LandscapeMode();
		}
		else
		{
			PortraitMode();
		}
	}

	private void LandscapeMode()
	{
		ChangeAnchors(playingMainObject, 0f, 0.3f, LANDSCAPEMODE_ANCHOR_Y_MIN, LANDSCAPEMODE_ANCHOR_Y_MAX);
		ChangeAnchors(substitutesMainObject, 0.35f, 0.65f, LANDSCAPEMODE_ANCHOR_Y_MIN, LANDSCAPEMODE_ANCHOR_Y_MAX);
		ChangeAnchors(unusedMainObject, 0.7f, 1f, LANDSCAPEMODE_ANCHOR_Y_MIN, LANDSCAPEMODE_ANCHOR_Y_MAX);
		ChangeAnchors(unusedScrollObj, 0f, 1f, 0f, LANDSCAPEMODE_HEADER_Y_MIN);
		ChangeAnchors(eventsMainObject, 0.7f, 1f, LANDSCAPEMODE_ANCHOR_Y_MIN, LANDSCAPEMODE_ANCHOR_Y_MAX);
		ChangeAnchors(eventsScrollObj, 0f, 1f, 0f, LANDSCAPEMODE_HEADER_Y_MIN);
		ChangeAnchors(playingHeader, 0f, 1f, LANDSCAPEMODE_HEADER_Y_MIN, 1f);
		ChangeAnchors(substitutesHeader, 0f, 1f, LANDSCAPEMODE_HEADER_Y_MIN, 1f);
		ChangeAnchors(unusedHeader, 0f, 1f, LANDSCAPEMODE_HEADER_Y_MIN, 1f);
		ChangeAnchors(eventsHeader, 0f, 1f, LANDSCAPEMODE_HEADER_Y_MIN, 1f);
	}

	private void PortraitMode()
	{
		ChangeAnchors(playingMainObject, 0f, 0.535f, 0.24f, 0.645f);
		ChangeAnchors(substitutesMainObject, 0.55f, 1f, 0.24f, 0.645f);
		ChangeAnchors(unusedMainObject, 0f, 1f, 0f, 0.235f);
		ChangeAnchors(unusedScrollObj, 0f, 1f, 0f, 0.9f);
		ChangeAnchors(eventsMainObject, 0f, 1f, 0f, 0.235f);
		ChangeAnchors(eventsScrollObj, 0f, 1f, 0f, 0.9f);
		ChangeAnchors(playingHeader, 0f, 1f, 0.93f, 1f);
		ChangeAnchors(substitutesHeader, 0f, 1f, 0.93f, 1f);
		ChangeAnchors(unusedHeader, 0f, 1f, 0.9f, 1f);
		ChangeAnchors(eventsHeader, 0f, 1f, 0.9f, 1f);
	}

	private void UpdateView()
	{
		showUnusedPlayers = runMode == RunMode.SelectPlayers || runMode == RunMode.SelectPlayersOpponent;
		showUnusedPlayers &= myTeam.teamMatch.unusedPlayers.Count > 0;
		if (unusedParent?.parent?.parent != null)
		{
			unusedParent.parent.parent.gameObject.SetActive(showUnusedPlayers);
		}
		if (runMode == RunMode.SelectPlayers)
		{
			refreshPlayersCheckbox.gameObject.SetActive(value: true);
			playButton.gameObject.SetActive(value: true);
			backButton.gameObject.SetActive(value: true);
			doneButton.gameObject.SetActive(value: false);
			refreshPlayersCheckbox.SetIsOnWithoutNotify(myTeam.Coach.refreshPlayersInSubstitutionView);
			if (refreshPlayersCheckbox.isOn)
			{
				myTeam.RefreshBestPlayersForCurrentFormation();
			}
		}
		else if (runMode == RunMode.SelectPlayersOpponent)
		{
			refreshPlayersCheckbox.gameObject.SetActive(value: false);
			playButton.gameObject.SetActive(value: false);
			backButton.gameObject.SetActive(value: false);
			doneButton.gameObject.SetActive(value: false);
		}
		else
		{
			refreshPlayersCheckbox.gameObject.SetActive(value: false);
			playButton.gameObject.SetActive(value: false);
			backButton.gameObject.SetActive(value: false);
		}
		FillMatchInfo();
		SelectFormation();
		FillPlayerLists();
		ComputeSubstitutionModeStatus();
	}

	private void FillMatchInfo()
	{
		team1ButtonBackground.color = ((currentMatch.homeTeam == myTeam) ? TEAM_SELECTED_BUTTON_BACKGROUND : Color.clear);
		team1Logo.sprite = ((currentMatch.homeTeam.MyLogo != null) ? currentMatch.homeTeam.MyLogo : currentMatch.homeTeam.MyShirt);
		if (currentMatch.homeTeam.MyLogo == null && currentMatch.homeTeam.UsesStandardShirt)
		{
			team1Logo.color = Util.ParseColor(currentMatch.homeTeam.backgroundColor);
			team1Logo.color = ((currentMatch.homeTeam == myTeam) ? team1Logo.color : new Color(team1Logo.color.r, team1Logo.color.g, team1Logo.color.b, TEAM_NOTSELECTED_A));
		}
		else
		{
			team1Logo.color = ((currentMatch.homeTeam == myTeam) ? Color.white : new Color(team1Logo.color.r, team1Logo.color.g, team1Logo.color.b, TEAM_NOTSELECTED_A));
		}
		team1Name.text = currentMatch.homeTeam.ShortName;
		team1Name.color = ((currentMatch.homeTeam == myTeam) ? Color.white : TEAM_NOTSELECTED_TRANSPARENCY);
		team1CoachName.text = currentMatch.homeTeam.Coach.Name;
		team1CoachName.color = ((currentMatch.homeTeam == myTeam) ? Color.white : TEAM_NOTSELECTED_TRANSPARENCY);
		team1CoachHumanIcon.SetActive(currentMatch.homeTeam.Coach.human);
		team1Score.text = currentMatch.homeTeam.teamMatch.goals.ToString("0");
		team2ButtonBackground.color = ((currentMatch.awayTeam == myTeam) ? TEAM_SELECTED_BUTTON_BACKGROUND : Color.clear);
		team2Logo.sprite = ((currentMatch.awayTeam.MyLogo != null) ? currentMatch.awayTeam.MyLogo : currentMatch.awayTeam.MyShirt);
		if (currentMatch.awayTeam.MyLogo == null && currentMatch.awayTeam.UsesStandardShirt)
		{
			team2Logo.color = Util.ParseColor(currentMatch.awayTeam.backgroundColor);
			team2Logo.color = ((currentMatch.awayTeam == myTeam) ? team2Logo.color : new Color(team2Logo.color.r, team2Logo.color.g, team2Logo.color.b, TEAM_NOTSELECTED_A));
		}
		else
		{
			team2Logo.color = ((currentMatch.awayTeam == myTeam) ? Color.white : new Color(team2Logo.color.r, team2Logo.color.g, team2Logo.color.b, TEAM_NOTSELECTED_A));
		}
		team2Name.text = currentMatch.awayTeam.ShortName;
		team2Name.color = ((currentMatch.awayTeam == myTeam) ? Color.white : TEAM_NOTSELECTED_TRANSPARENCY);
		team2CoachName.text = currentMatch.awayTeam.Coach.Name;
		team2CoachName.color = ((currentMatch.awayTeam == myTeam) ? Color.white : TEAM_NOTSELECTED_TRANSPARENCY);
		team2CoachHumanIcon.SetActive(currentMatch.awayTeam.Coach.human);
		team2Score.text = currentMatch.awayTeam.teamMatch.goals.ToString("0");
		team1RedCardInGame.SetActive(currentMatch.homeTeam.teamMatch.hasRedCard);
		team2RedCardInGame.SetActive(currentMatch.awayTeam.teamMatch.hasRedCard);
		if (runMode == RunMode.SelectPlayers || runMode == RunMode.SelectPlayersOpponent)
		{
			team1Score.text = "";
			team2Score.text = "";
			ScoreVS.text = LanguageController.instance.Get_Translation("CUPDRAW_VS");
		}
		else
		{
			team1Score.text = currentMatch.homeTeam.teamMatch.goals.ToString("0");
			team2Score.text = currentMatch.awayTeam.teamMatch.goals.ToString("0");
			ScoreVS.text = LanguageController.instance.Get_Translation("GEN_GOAL_SEPARATOR");
		}
		if (WasDecidedByPenalties())
		{
			team1PenaltyScore.text = currentMatch.homeTeam.teamMatch.penaltyShootoutGoals.ToString("0");
			team2PenaltyScore.text = currentMatch.awayTeam.teamMatch.penaltyShootoutGoals.ToString("0");
		}
		else
		{
			team1PenaltyScore.text = "";
			team2PenaltyScore.text = "";
			PenaltyScoreVS.SetActive(value: false);
		}
		if (currentMatch.calEntry.matchType == MatchType.CupSecondLeg)
		{
			team1FirstHandScore.text = currentMatch.homeTeam.CompetitionData(currentMatch.competition).goalsFirstLeg.ToString("0");
			team2FirstHandScore.text = currentMatch.awayTeam.CompetitionData(currentMatch.competition).goalsFirstLeg.ToString("0");
		}
		else
		{
			team1FirstHandScore.text = "";
			team2FirstHandScore.text = "";
			FirstHandScoreVS.SetActive(value: false);
		}
	}

	private bool WasDecidedByPenalties()
	{
		Team.TeamMatch teamMatch = currentMatch.homeTeam.teamMatch;
		Team.TeamMatch teamMatch2 = currentMatch.awayTeam.teamMatch;
		if ((teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Won && teamMatch2.penaltyShootoutStatus == PenaltyShootoutStatus.Lost) || (teamMatch2.penaltyShootoutStatus == PenaltyShootoutStatus.Won && teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Lost))
		{
			return true;
		}
		return false;
	}

	private void FillPlayerLists()
	{
		DisableReorderableList();
		myTeam.teamMatch.substitutePlayers.SortByPosition();
		myTeam.teamMatch.unusedPlayers.SortByPosition();
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < myTeam.teamMatch.selectedPlayersSpots.Length; i++)
		{
			GameObject playerPrefab = playingParent.GetChild(i).gameObject;
			UpdatePrefab(playerPrefab, myTeam.teamMatch.selectedPlayersSpots[i].player, PlayerList.Selected, ref darkenThis, ref darkenNext);
			DrawSlot(i, darkenThis);
		}
		CheckFormationAlerts();
		FillSubstituteList(ref darkenThis, ref darkenNext);
		if (showUnusedPlayers)
		{
			foreach (Transform item in unusedParent)
			{
				item.gameObject.SetActive(value: false);
			}
			for (int j = 0; j < myTeam.teamMatch.unusedPlayers.Count; j++)
			{
				GameObject playerPrefab = GetUnusedPlayerPrefab(j);
				UpdatePrefab(playerPrefab, myTeam.teamMatch.unusedPlayers.Player(j), PlayerList.Unused, ref darkenThis, ref darkenNext);
				playerPrefab.SetActive(value: true);
			}
		}
		StartCoroutine(FixReorderableList());
	}

	private void UpdatePrefab(GameObject playerPrefab, Player player, PlayerList playerList, ref bool darkenThis, ref bool darkenNext)
	{
		DarkenListBackgroundObj(playerPrefab, ref darkenThis, ref darkenNext);
		SubstitutePrefab component = playerPrefab.GetComponent<SubstitutePrefab>();
		component.Initialize(player, playerList, OnPlayerSelected);
		bool buttonEnabled = runMode != RunMode.ReadOnly && runMode != RunMode.SelectPlayersOpponent && modeStatus != SubstitutionModeStatus.NoPermission;
		component.SetButtonEnabled(buttonEnabled);
	}

	private IEnumerator DrawSlotWithAnim(int index, bool darkenThis)
	{
		yield return new WaitForSeconds(0.2f);
		if (!(this == null))
		{
			DrawSlot(index, darkenThis);
		}
	}

	private void DrawSlot(int index, bool darkenThis)
	{
		PlayerPosition formationPosition = myTeam.teamMatch.selectedPlayersSpots[index].formationPosition;
		playingSlots[index].background.color = Player.GetBackgroundColor(formationPosition);
		DarkenListBackgroundObj(playingSlots[index].spot, darkenThis);
		string text = formationPosition.ToString().ToUpper();
		playingSlots[index].formationPosition.text = LanguageController.instance.Get_Translation("PLAYER_POSITION_CODE_" + text);
	}

	private void FillSubstituteList(ref bool darkenThis, ref bool darkenNext)
	{
		int count = myTeam.teamMatch.substitutePlayers.Count;
		foreach (Transform item in substitutesParent)
		{
			item.gameObject.SetActive(value: false);
		}
		for (int i = 0; i < count; i++)
		{
			GameObject subsitutePlayerPrefab = GetSubsitutePlayerPrefab(i);
			UpdatePrefab(subsitutePlayerPrefab, myTeam.teamMatch.substitutePlayers.Player(i), PlayerList.Substitute, ref darkenThis, ref darkenNext);
			subsitutePlayerPrefab.SetActive(value: true);
		}
	}

	private GameObject GetSubsitutePlayerPrefab(int i)
	{
		if (i < substitutesParent.childCount)
		{
			return substitutesParent.GetChild(i).gameObject;
		}
		return UnityEngine.Object.Instantiate(substitutePrefab, substitutesParent);
	}

	private GameObject GetUnusedPlayerPrefab(int i)
	{
		if (i < unusedParent.childCount)
		{
			return unusedParent.GetChild(i).gameObject;
		}
		return UnityEngine.Object.Instantiate(substitutePrefab, unusedParent);
	}

	private void CheckFormationAlerts()
	{
		for (int i = 0; i < myTeam.teamMatch.selectedPlayersSpots.Length; i++)
		{
			Team.TeamMatch.PlayerSpot playerSpot = myTeam.teamMatch.selectedPlayersSpots[i];
			if (playerSpot.player != null && playerSpot.formationPosition != playerSpot.player.Position)
			{
				playingSlots[i].alertIcon.SetActive(value: true);
				playingSlots[i].alertIconImage.color = ((Player.GetPositionSector(playerSpot.formationPosition) == playerSpot.player.Sector) ? ALERT_YELLOW : ALERT_RED);
			}
			else
			{
				playingSlots[i].alertIcon.SetActive(value: false);
			}
		}
	}

	private void DisableReorderableList()
	{
		reorderableList.IsDraggable = false;
		playingParent.GetComponent<VerticalLayoutGroup>().childControlHeight = true;
	}

	private IEnumerator FixReorderableList()
	{
		yield return new WaitForEndOfFrame();
		playingParent.GetComponent<VerticalLayoutGroup>().childControlHeight = false;
		if (runMode != RunMode.ReadOnly && runMode != RunMode.SelectPlayersOpponent && modeStatus != SubstitutionModeStatus.NoPermission)
		{
			reorderableList.IsDraggable = true;
		}
	}

	private void ComputeSubstitutionModeStatus()
	{
		SubstitutionModeStatus num = modeStatus;
		if (runMode != RunMode.Substitutions)
		{
			if (hasPermission)
			{
				if (!myTeam.teamMatch.HasGKFilled())
				{
					modeStatus = SubstitutionModeStatus.NoKeeper;
				}
				else
				{
					modeStatus = SubstitutionModeStatus.Standard;
				}
			}
			else
			{
				modeStatus = SubstitutionModeStatus.NoPermission;
			}
		}
		else if (myTeam.teamMatch.HasAnyPlayerSuspended())
		{
			modeStatus = SubstitutionModeStatus.RedCard;
		}
		else if (myTeam.teamMatch.HasAnyPlayerInjured())
		{
			if (!myTeam.teamMatch.HasSubstitutionsAvailable())
			{
				modeStatus = SubstitutionModeStatus.InjuredNoSubstitute;
			}
			else
			{
				modeStatus = SubstitutionModeStatus.InjuredWithSubstitute;
			}
		}
		else if (!myTeam.teamMatch.HasGKFilled())
		{
			modeStatus = SubstitutionModeStatus.NoKeeper;
		}
		else if (!myTeam.teamMatch.HasSubstitutionsAvailable())
		{
			modeStatus = SubstitutionModeStatus.NoMoreSubstitutions;
		}
		else
		{
			modeStatus = SubstitutionModeStatus.Standard;
		}
		if (num != modeStatus || !firstTimeComputeStatus)
		{
			UpdateViewStatus();
			firstTimeComputeStatus = true;
		}
	}

	private void UpdateViewStatus()
	{
		ShowToastStatus();
		FooterStatus();
	}

	private void ShowToastStatus()
	{
		string helpText = GetHelpText();
		if (!string.IsNullOrEmpty(helpText))
		{
			ScreenController.instance.ShowToastMessage(helpText, 240f, 4f);
		}
	}

	private string GetHelpText()
	{
		if (runMode == RunMode.ReadOnly || runMode == RunMode.SelectPlayersOpponent)
		{
			return "";
		}
		string text = ((runMode != RunMode.SelectPlayers) ? ("SUBSTITUTES_HELP_" + modeStatus.ToString().ToUpper()) : ((modeStatus != SubstitutionModeStatus.Standard) ? ("SUBSTITUTES_HELP_" + modeStatus.ToString().ToUpper()) : "SUBSTITUTES_HELP_SELECTPLAYERS"));
		return LanguageController.instance.Get_Translation(text);
	}

	private void FooterStatus()
	{
		if (runMode == RunMode.SelectPlayersOpponent)
		{
			playButton.gameObject.SetActive(value: false);
		}
		else if (runMode == RunMode.SelectPlayers)
		{
			playButton.gameObject.SetActive(modeStatus != SubstitutionModeStatus.NoKeeper);
		}
		else
		{
			doneButton.gameObject.SetActive(modeStatus == SubstitutionModeStatus.Standard || modeStatus == SubstitutionModeStatus.NoMoreSubstitutions || modeStatus == SubstitutionModeStatus.NoPermission);
		}
	}

	private void OnPlayerSelected(SubstitutePrefab prefab)
	{
		if (!CanSelectPlayer())
		{
			return;
		}
		if (WrongPlayerSelected(prefab))
		{
			ShowToastStatus();
			return;
		}
		if (!myTeam.teamMatch.HasSubstitutionsAvailable() && firstSelectedPlayer != null && firstSelectedPlayer.playerList != prefab.playerList)
		{
			ShowToastStatus();
			return;
		}
		switch (modeStatus)
		{
		case SubstitutionModeStatus.Standard:
		case SubstitutionModeStatus.NoKeeper:
		case SubstitutionModeStatus.InjuredWithSubstitute:
		case SubstitutionModeStatus.NoMoreSubstitutions:
			if (firstSelectedPlayer == null)
			{
				SelectPrefab(prefab);
				break;
			}
			if (prefab == firstSelectedPlayer)
			{
				DiselectSelectedPlayers();
				break;
			}
			secondSelectedPlayer = prefab;
			if (firstSelectedPlayer.playerList != secondSelectedPlayer.playerList && (firstSelectedPlayer.player == null || secondSelectedPlayer.player == null))
			{
				ShowToastStatus();
			}
			else
			{
				SubstitutePlayer();
			}
			break;
		case SubstitutionModeStatus.RedCard:
		case SubstitutionModeStatus.InjuredNoSubstitute:
			prefab.TradeAnimation(null);
			myTeam.teamMatch.selectedPlayersSpots[prefab.GetListIndex()].player = null;
			myTeam.ComputeAverageAttackDefence();
			ComputeSubstitutionModeStatus();
			CheckFormationAlerts();
			break;
		}
	}

	private bool CanSelectPlayer()
	{
		if (runMode == RunMode.ReadOnly)
		{
			return false;
		}
		if (modeStatus == SubstitutionModeStatus.NoPermission)
		{
			return false;
		}
		return true;
	}

	private bool WrongPlayerSelected(SubstitutePrefab prefab)
	{
		Player player = prefab.player;
		switch (modeStatus)
		{
		case SubstitutionModeStatus.RedCard:
			if (player.Suspended == 0)
			{
				return true;
			}
			break;
		case SubstitutionModeStatus.InjuredWithSubstitute:
		case SubstitutionModeStatus.InjuredNoSubstitute:
			if (firstSelectedPlayer == null && player.Injured == 0)
			{
				return true;
			}
			if (firstSelectedPlayer != null && prefab.playerList != PlayerList.Substitute)
			{
				return true;
			}
			break;
		}
		return false;
	}

	private void SelectPrefab(SubstitutePrefab prefab)
	{
		firstSelectedPlayer = prefab;
		prefab.Select();
	}

	private void DiselectSelectedPlayers()
	{
		if (firstSelectedPlayer != null)
		{
			firstSelectedPlayer.Diselect();
		}
		firstSelectedPlayer = null;
		secondSelectedPlayer = null;
	}

	private void ReorderSelectedPlayers(ReorderableList.ReorderableListEventStruct droppedStruct)
	{
		myTeam.teamMatch.ReorderSelectedPlayers(droppedStruct.FromIndex, droppedStruct.ToIndex);
		Invoke("RedrawPrefabBackgrounds", 0.01f);
		ComputeSubstitutionModeStatus();
		CheckFormationAlerts();
	}

	private void RedrawPrefabBackgrounds()
	{
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < playingParent.childCount; i++)
		{
			DarkenListBackgroundObj(playingParent.GetChild(i).gameObject, ref darkenThis, ref darkenNext);
		}
	}

	private void SubstitutePlayer()
	{
		if (runMode != RunMode.Substitutions)
		{
			SwapPlayers();
		}
		else if (firstSelectedPlayer.playerList != secondSelectedPlayer.playerList)
		{
			Player player = ((firstSelectedPlayer.playerList == PlayerList.Selected) ? firstSelectedPlayer.player : secondSelectedPlayer.player);
			Player player2 = ((firstSelectedPlayer.playerList == PlayerList.Substitute) ? firstSelectedPlayer.player : secondSelectedPlayer.player);
			string description = string.Format(confirmSubstitutionMsg, player.Name, player.PositionDesc(), player.skill, player2.Name, player2.PositionDesc(), player2.skill);
			ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("SUBSTITUTES_TITLE_SUBSTITUTION"), description, SwapPlayers, DiselectSelectedPlayers);
		}
		else
		{
			SwapPlayers();
		}
	}

	private void SwapPlayers()
	{
		if (runMode == RunMode.Substitutions)
		{
			myTeam.SubstitutePlayersInMatch(currentMatch, firstSelectedPlayer.playerList, secondSelectedPlayer.playerList, firstSelectedPlayer.GetListIndex(), secondSelectedPlayer.GetListIndex(), gameTime);
			UpdateMatchEventList();
		}
		else
		{
			myTeam.SubstitutePlayers(firstSelectedPlayer.playerList, secondSelectedPlayer.playerList, firstSelectedPlayer.GetListIndex(), secondSelectedPlayer.GetListIndex());
		}
		Player player = firstSelectedPlayer.player;
		firstSelectedPlayer.TradeAnimation(secondSelectedPlayer.player);
		secondSelectedPlayer.TradeAnimation(player);
		if (runMode == RunMode.Substitutions && firstSelectedPlayer.playerList != secondSelectedPlayer.playerList)
		{
			bool darkenThis = false;
			bool darkenNext = false;
			FillSubstituteList(ref darkenThis, ref darkenNext);
		}
		DiselectSelectedPlayers();
		ComputeSubstitutionModeStatus();
		CheckFormationAlerts();
	}

	private void UpdateMatchEventList()
	{
		foreach (Transform item in eventsParent)
		{
			item.gameObject.SetActive(value: false);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		int num = currentMatch.eventList.Count - 1;
		int num2 = 0;
		while (num >= 0)
		{
			GameObject gameObject = GetEventPrefab(num2);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			Match.MatchEvent matchEvent = currentMatch.eventList[num];
			Image image = gameObject.transform.Find("Icon")?.GetComponent<Image>();
			if (image != null)
			{
				if (matchEvent.GetSprite() != null)
				{
					image.sprite = matchEvent.GetSprite();
					image.color = Color.white;
				}
				else
				{
					image.color = Color.clear;
				}
			}
			Text text = gameObject.transform.Find("Description")?.GetComponent<Text>();
			if (text != null)
			{
				text.text = matchEvent.GetTextDescription(useEventColorCodes: true, includeGameTime: false);
			}
			Text text2 = gameObject.transform.Find("GameTime")?.GetComponent<Text>();
			if (text2 != null)
			{
				text2.text = $"{matchEvent.gameTime}'";
			}
			if (matchEvent.ShowGoals())
			{
				Text text3 = gameObject.transform.Find("Goals")?.GetComponent<Text>();
				if (text3 != null)
				{
					text3.text = matchEvent.GetGoalsDescription(useEventColorCodes: true);
				}
			}
			gameObject.SetActive(value: true);
			num--;
			num2++;
		}
	}

	private GameObject GetEventPrefab(int i)
	{
		if (i < eventsParent.childCount)
		{
			return eventsParent.GetChild(i).gameObject;
		}
		return UnityEngine.Object.Instantiate(eventPrefab, eventsParent);
	}

	private void SelectFormation()
	{
		tacticsDropdown.selectedItemIndex = FormationsData.GetFormationIndex(myTeam.teamMatch.Formation);
		if (tacticsDropdown.selectedItemIndex == -1)
		{
			Debug.LogWarning("Formation " + myTeam.teamMatch.Formation.FullName + " not found");
			tacticsDropdown.selectedItemIndex = 0;
		}
		tacticsDropdown.FillTactics(FormationPressed);
	}

	public void FormationPressed(int index)
	{
		Formation formation = myTeam.teamMatch.Formation;
		myTeam.teamMatch.SetFormation(FormationsData.gameFormations[index]);
		bool flag = false;
		for (int i = 0; i < myTeam.teamMatch.selectedPlayersSpots.Length; i++)
		{
			if (formation.positions[i] != myTeam.teamMatch.Formation.positions[i])
			{
				playingSlots[i].swapAnimation.Rewind();
				playingSlots[i].swapAnimation.Play();
			}
			StartCoroutine(DrawSlotWithAnim(i, flag));
			flag = !flag;
		}
		if (runMode == RunMode.SelectPlayers && refreshPlayersCheckbox.isOn)
		{
			RefreshPlayingPlayers();
		}
		CheckFormationAlerts();
	}

	private void RefreshPlayingPlayers()
	{
		myTeam.RefreshBestPlayersForCurrentFormation();
		Initialize(currentMatch, myTeam, runMode, permissionLevel, onPlayPressed, waitForInput, gameTime);
	}

	public void HomeTeamSelected()
	{
		if (runMode == RunMode.SelectPlayers)
		{
			ShowToastStatus();
		}
		else
		{
			ReInitialize(currentMatch.homeTeam);
		}
	}

	public void AwayTeamSelected()
	{
		if (runMode == RunMode.SelectPlayers)
		{
			ShowToastStatus();
		}
		else
		{
			ReInitialize(currentMatch.awayTeam);
		}
	}

	private void ReInitialize(Team team)
	{
		bool flag = true;
		if (team == myTeam)
		{
			return;
		}
		if (CanSelectTeam(team))
		{
			switch (runMode)
			{
			case RunMode.SelectPlayers:
				runMode = RunMode.SelectPlayersOpponent;
				flag = false;
				break;
			case RunMode.SelectPlayersOpponent:
				runMode = RunMode.SelectPlayers;
				flag = false;
				break;
			default:
				if (team.Coach.Present(ElifootOptions.SimulationFlag.Match))
				{
					runMode = RunMode.Substitutions;
					break;
				}
				runMode = RunMode.ReadOnly;
				flag = false;
				break;
			}
			Initialize(currentMatch, team, runMode, permissionLevel, onPlayPressed, waitForInput, gameTime);
		}
		if (flag)
		{
			ShowToastStatus();
		}
	}

	private bool CanSelectTeam(Team team)
	{
		return !((modeStatus == SubstitutionModeStatus.InjuredNoSubstitute) | (modeStatus == SubstitutionModeStatus.InjuredWithSubstitute) | (modeStatus == SubstitutionModeStatus.NoKeeper) | (modeStatus == SubstitutionModeStatus.RedCard) | (team.teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Shooting) | (runMode == RunMode.SelectPlayers && team != myTeam && !team.teamMatch.prepared));
	}

	public void RefreshPlayingPlayersCheckbox()
	{
		myTeam.Coach.refreshPlayersInSubstitutionView = refreshPlayersCheckbox.isOn;
		if (runMode == RunMode.SelectPlayers && refreshPlayersCheckbox.isOn)
		{
			RefreshPlayingPlayers();
		}
	}

	public void PlayPressed()
	{
		StartCoroutine(CloseAndLoad());
	}

	private IEnumerator CloseAndLoad()
	{
		myTeam.ComputeAverageAttackDefence();
		onPlayPressed?.Invoke();
		waitForInput = false;
		if (runMode == RunMode.SelectPlayers)
		{
			ScreenController.instance.ShowLoadingView("WAIT_PREPARE_MATCHES");
		}
		Close();
		yield return 0;
	}

	public void BackPressed()
	{
		waitForInput = false;
		Close();
	}
}
