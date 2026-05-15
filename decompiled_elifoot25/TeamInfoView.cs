using System;
using System.Collections;
using System.Collections.Generic;
using EditorView;
using UnityEngine;
using UnityEngine.UI;

public class TeamInfoView : EliView
{
	[Header("TeamInfoView")]
	public GameObject topButton;

	public Image teamLogoOrShirt;

	public Image backColor;

	public Text textColor;

	[Space]
	public Text longName;

	public Image countryFlag;

	public Text countryName;

	public GameObject regionTab;

	public Image regionFlag;

	public Text regionName;

	public Text coachName;

	public Text levelText;

	[Space]
	public Transform playersScroll;

	public GameObject playerPrefab;

	[Space]
	[SerializeField]
	private LayoutElement frameLayoutElement;

	[Header("Footer")]
	public GameObject defaultbuttons;

	public GameObject conflitbuttons;

	public GameObject ToggleDuoBackground;

	public Toggle oldToggle;

	public Toggle newToggle;

	public Toggle vToggle;

	public GameObject keepbothButton;

	[Header("Warnings")]
	public GameObject invalidTeamsDetectedWarning;

	public Text invalidTeamsDetectedWarningMessage;

	[Header("PopUps")]
	public EditTeamPrefab editTeamPrefab;

	public EditPlayerPrefab editPlayerPrefab;

	[Header("Scripts")]
	public DbTeams dbTeams;

	public DbTeams dbTeamsUpdate;

	public DbTeams dbTeamsPackage;

	public DbCountries countries;

	private DbTeams.DbTeam team;

	private bool conflictMode;

	private NewTeamPrefab newTeamPrefab;

	private Action<bool> onClose;

	private bool teamWasChanged;

	private bool firstTimeInstantiating = true;

	private List<PlayerPrefab> playerPrefabs = new List<PlayerPrefab>();

	private LayoutElement topButtonGroupLayoutElement;

	private void Awake()
	{
		foreach (Transform item in playersScroll)
		{
			PlayerPrefab component = item.GetComponent<PlayerPrefab>();
			if (component != null)
			{
				playerPrefabs.Add(component);
			}
		}
		topButtonGroupLayoutElement = topButton.GetComponent<LayoutElement>();
	}

	public void Initialize(DbTeams.DbTeam team, Action<bool> onClose)
	{
		this.onClose = onClose;
		conflictMode = false;
		StartCoroutine(FillView(team));
	}

	public void InitializeInConflitMode(NewTeamPrefab newTeamPrefab)
	{
		this.newTeamPrefab = newTeamPrefab;
		conflictMode = true;
		DefineFooterButtons();
		oldToggle.SetIsOnWithoutNotify(value: false);
		newToggle.SetIsOnWithoutNotify(value: true);
		vToggle.SetIsOnWithoutNotify(value: true);
		DbTeams.DbTeam dbTeam = dbTeamsUpdate.AllTeams[LoadTeamsConflicts.instance.teamsResolution[newTeamPrefab.teamResolutionIndex].teamsUpdateIndex];
		StartCoroutine(FillView(dbTeam));
	}

	private IEnumerator FillView(DbTeams.DbTeam team)
	{
		this.team = team;
		FillTeamInfo();
		yield return StartCoroutine(FillPlayersList());
		CheckWarnings();
		OnRectTransformDimensionsChange();
		ScreenController.instance.HideLoadingView();
	}

	private void FillTeamInfo()
	{
		topButton.SetActive(!conflictMode);
		backColor.color = team.backColor;
		textColor.color = team.textColor;
		textColor.text = team.shortName;
		teamLogoOrShirt.sprite = team.GetLogoOrShirt();
		teamLogoOrShirt.color = team.GetLogoOrShirtColor();
		longName.text = team.longName;
		coachName.text = team.coach;
		levelText.text = LanguageController.instance.Get_Translation("TEAM_INIT_LEVEL_X", team.level);
		countryName.text = countries.allCountries[team.CountryIndex].Name;
		countryFlag.sprite = countries.GetCountryFlag(team.CountryIndex);
		regionTab.SetActive(team.CountryIndex >= 0 && team.RegionIndex >= 0);
		if (regionTab.activeSelf)
		{
			regionFlag.sprite = countries.GetRegionFlag(team.CountryIndex, team.RegionIndex);
			regionName.text = countries.allCountries[team.CountryIndex].regions[team.RegionIndex].fullName;
		}
	}

	private IEnumerator FillPlayersList()
	{
		List<(DbTeams.DbPlayer player, int playerIndex)> sortedPlayersIndexes = team.PlayersSorted();
		List<string> positions = new List<string>();
		foreach (PlayerPosition value in Enum.GetValues(typeof(PlayerPosition)))
		{
			positions.Add(LanguageController.instance.Get_Translation("PLAYER_POSITION_CODE_" + value.ToString().ToUpper()));
		}
		for (int i = 0; i < sortedPlayersIndexes.Count; i++)
		{
			int item = sortedPlayersIndexes[i].playerIndex;
			DbTeams.DbPlayer item2 = sortedPlayersIndexes[i].player;
			int countryIndex = item2.CountryIndex;
			PlayerPrefab nextPlayerPrefab = GetNextPlayerPrefab(i);
			Action<int> action = null;
			if (!conflitbuttons.activeSelf)
			{
				action = (Action<int>)Delegate.Combine(action, new Action<int>(OpenEditPlayer));
			}
			nextPlayerPrefab.Initialize(position: LanguageController.instance.Get_Translation("PLAYER_POSITION_DESC_" + item2.position.ToString().ToUpper()), country: LanguageController.instance.Get_Translation("NAC_" + item2.countryCode), index: item, player: item2, flag: countries.GetCountryFlag(countryIndex), firstTime: firstTimeInstantiating, action: action, positionsText: positions);
			yield return new WaitForEndOfFrame();
		}
		for (int j = sortedPlayersIndexes.Count; j < playersScroll.childCount; j++)
		{
			playersScroll.GetChild(j).gameObject.SetActive(value: false);
		}
		firstTimeInstantiating = false;
	}

	private PlayerPrefab GetNextPlayerPrefab(int i)
	{
		if (i < playerPrefabs.Count)
		{
			PlayerPrefab obj = playerPrefabs[i];
			obj.gameObject.SetActive(value: true);
			return obj;
		}
		PlayerPrefab component = UnityEngine.Object.Instantiate(playerPrefab, playersScroll).GetComponent<PlayerPrefab>();
		playerPrefabs.Add(component);
		return component;
	}

	private void CheckWarnings()
	{
		if (team.isTeamValid)
		{
			HideInvalidTeamsWarning();
		}
		else
		{
			ShowInvalidTeamsWarningOnCountries();
		}
	}

	private void HideInvalidTeamsWarning()
	{
		invalidTeamsDetectedWarning.SetActive(value: false);
	}

	private void ShowInvalidTeamsWarningOnCountries()
	{
		invalidTeamsDetectedWarning.SetActive(value: true);
		invalidTeamsDetectedWarningMessage.text = LanguageController.instance.Get_Translation("ERROR_INVALID_TEAM");
	}

	private void DefineFooterButtons()
	{
		defaultbuttons.SetActive(!conflictMode);
		conflitbuttons.SetActive(conflictMode);
		if (conflictMode)
		{
			LoadTeamsConflicts.TeamsResolution.Status status = LoadTeamsConflicts.instance.teamsResolution[newTeamPrefab.teamResolutionIndex].status;
			bool active = status != LoadTeamsConflicts.TeamsResolution.Status.New;
			ToggleDuoBackground.gameObject.SetActive(active);
			oldToggle.gameObject.SetActive(active);
			newToggle.gameObject.SetActive(active);
			newToggle.isOn = true;
			keepbothButton.SetActive(status == LoadTeamsConflicts.TeamsResolution.Status.Conflict || status == LoadTeamsConflicts.TeamsResolution.Status.Updated);
		}
	}

	public void OpenEditTeam()
	{
		base.enabled = false;
		UnityEngine.Object.Instantiate(editTeamPrefab, base.transform.parent).Initialize(dbTeams.FindTeamIndex(team.teamID), delegate
		{
			base.enabled = true;
		}, OnTeamInfoUpdate, OnTeamDeleted);
	}

	private void OnTeamInfoUpdate()
	{
		int index = dbTeams.FindTeamIndex(team.teamID);
		team = dbTeams.AllTeams[index];
		team.isTeamValid = team.IsTeamValid();
		dbTeams.AllTeams[index] = team;
		teamWasChanged = true;
		base.enabled = true;
		FillTeamInfo();
		CheckWarnings();
	}

	private void OnTeamDeleted()
	{
		teamWasChanged = true;
		Close();
	}

	public void OpenEditPlayer(int playerIndex)
	{
		base.enabled = false;
		UnityEngine.Object.Instantiate(editPlayerPrefab, base.transform.parent).Initialize(dbTeams.FindTeamIndex(team.teamID), playerIndex, delegate
		{
			base.enabled = true;
		}, delegate
		{
			StartCoroutine(OnPlayerUpdate());
		});
	}

	private IEnumerator OnPlayerUpdate()
	{
		ScreenController.instance.ShowLoadingView();
		yield return new WaitForEndOfFrame();
		teamWasChanged = true;
		base.enabled = true;
		team.isTeamValid = team.IsTeamValid();
		int index = dbTeams.FindTeamIndex(team.teamID);
		dbTeams.AllTeams[index] = team;
		StartCoroutine(FillPlayersList());
		CheckWarnings();
		OnRectTransformDimensionsChange();
		yield return new WaitForEndOfFrame();
		ScreenController.instance.HideLoadingView();
	}

	public void AddButton()
	{
		OpenEditPlayer(-1);
	}

	public void OldTeamConflict()
	{
		if (oldToggle.isOn)
		{
			vToggle.isOn = false;
			int teamsIndex = LoadTeamsConflicts.instance.teamsResolution[newTeamPrefab.teamResolutionIndex].teamsIndex;
			if (teamsIndex < 0 || teamsIndex >= dbTeams.AllTeams.Count)
			{
				Debug.LogError($"OldTeamConflict: invalid teamsIndex {teamsIndex} (AllTeams count: {dbTeams.AllTeams.Count})");
				return;
			}
			DbTeams.DbTeam dbTeam = dbTeams.AllTeams[teamsIndex];
			StartCoroutine(FillView(dbTeam));
		}
	}

	public void NewTeamConflict()
	{
		if (newToggle.isOn)
		{
			vToggle.isOn = true;
			int teamsUpdateIndex = LoadTeamsConflicts.instance.teamsResolution[newTeamPrefab.teamResolutionIndex].teamsUpdateIndex;
			if (teamsUpdateIndex < 0 || teamsUpdateIndex >= dbTeamsUpdate.AllTeams.Count)
			{
				Debug.LogError($"NewTeamConflict: invalid teamsUpdateIndex {teamsUpdateIndex} (AllTeams count: {dbTeamsUpdate.AllTeams.Count})");
				return;
			}
			DbTeams.DbTeam dbTeam = dbTeamsUpdate.AllTeams[teamsUpdateIndex];
			StartCoroutine(FillView(dbTeam));
		}
	}

	public void vTogglePressed()
	{
		LoadTeamsConflicts.TeamsResolution.Status status = LoadTeamsConflicts.instance.teamsResolution[newTeamPrefab.teamResolutionIndex].status;
		if (status != LoadTeamsConflicts.TeamsResolution.Status.New && status != LoadTeamsConflicts.TeamsResolution.Status.Same)
		{
			if (vToggle.isOn)
			{
				newToggle.isOn = true;
				NewTeamConflict();
			}
			else
			{
				oldToggle.isOn = true;
				OldTeamConflict();
			}
		}
	}

	public void KeepbothPressed()
	{
		base.enabled = false;
		ScreenController.instance.ShowDialogPopUp("EDITOR_KEEP_BOTH_TITLE", "EDITOR_KEEP_BOTH_TEXT", KeepbothPopUpYES, delegate
		{
			base.enabled = true;
		});
	}

	public void KeepbothPopUpYES()
	{
		base.enabled = true;
		newTeamPrefab.ChangeConflictToNewStatus();
		vToggle.isOn = true;
		CloseConflictTeamInfoView();
	}

	public void CloseConflictTeamInfoView()
	{
		if (vToggle.isOn)
		{
			newTeamPrefab.ConfirmConflict();
		}
		else
		{
			newTeamPrefab.NegateConflict();
		}
		Close();
	}

	public void WarningMessageButton()
	{
		string description = LanguageController.instance.Get_Translation("TEAM_VALID_CRITERIA", 14, 50, 1, 10, DataManager.TEAM_INIT_SKILL_MIN, DataManager.TEAM_INIT_SKILL_MAX);
		ScreenController.instance.ShowScrollableTextView("ERROR_INVALID_TEAMS", description);
	}

	public override void Close()
	{
		base.Close();
		onClose?.Invoke(teamWasChanged);
	}

	public override void Update()
	{
		base.Update();
		if (Input.GetKeyDown(KeyCode.Escape))
		{
			Close();
		}
	}

	internal override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		if (Screen.width > 1700)
		{
			topButtonGroupLayoutElement.preferredWidth = 1690f;
			frameLayoutElement.preferredWidth = 1705f;
		}
		else
		{
			frameLayoutElement.preferredWidth = 920f;
			topButtonGroupLayoutElement.preferredWidth = 900f;
		}
	}
}
