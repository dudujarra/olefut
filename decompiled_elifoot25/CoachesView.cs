using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

public class CoachesView : EliView
{
	[Header("Icons")]
	public Sprite vacationDisabledIcon;

	public Sprite vacationEnabledIcon;

	[Header("Coaches Panel")]
	public ScrollRect coachesScroll;

	public RectTransform coachGroupParent;

	public CoachPrefab coachPrefab;

	[Header("Footer")]
	public Button playButton;

	public Button backButton;

	public GameObject okButton;

	[Header("Teams Panel")]
	public GameObject teamPanel;

	public RectTransform teamGroupParent;

	public TeamCoachPrefab3 teamCoachPrefab;

	public Transform teamCoachPrefabPool;

	public GameObject teamPanelLoadingAnimation;

	public GameObject countryTitlePrefab;

	public GameObject regionTitlePrefab;

	[Header("Recorded coach Panel")]
	public GameObject recordedCoachPanel;

	public Transform recordedCoachGroupParent;

	public RecordedCoachPrefab recordedCoachPrefab;

	[Header("Warning Message")]
	public GameObject warningMessageObject;

	public TextLabelID warningMessage;

	private CoachManagerViewMode mode;

	private Action onClose;

	private Action onCloseOK;

	private Action onCloseCancel;

	private readonly BooleanObj askChooseInitialTeam = new BooleanObj(value: false);

	private readonly BooleanObj showCannotChooseTeam = new BooleanObj(value: true);

	private Account coachAccount;

	private Account pressedCoachAccount;

	private object humanCoachStart;

	public void Initialize(CoachManagerViewMode mode, Action onCloseOK, Action onCloseCancel)
	{
		this.mode = mode;
		this.onCloseOK = (Action)Delegate.Combine(this.onCloseOK, onCloseOK);
		this.onCloseCancel = (Action)Delegate.Combine(this.onCloseCancel, onCloseCancel);
		DataManager.instance.properties.isSocialGame = false;
		teamPanel.SetActive(mode != CoachManagerViewMode.InGame);
		CheckInitState();
	}

	private void CheckInitState()
	{
		FillCoachList();
		if (mode == CoachManagerViewMode.NewGame)
		{
			AddPressed();
		}
	}

	private void FillCoachList()
	{
		ClearCoachLists();
		bool flag = false;
		ListOfCoaches allHumanCoaches = DataManager.instance.allCoaches.GetAllHumanCoaches();
		if (allHumanCoaches.Count > 0)
		{
			foreach (Coach item in allHumanCoaches)
			{
				InstantiateCoach(item, flag);
				flag = !flag;
			}
		}
		ResetView();
	}

	private void ClearCoachLists()
	{
		for (int i = 0; i < coachGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(coachGroupParent.GetChild(i).gameObject);
		}
		warningMessageObject.SetActive(value: false);
	}

	private void InstantiateCoach(Coach coach, bool darken)
	{
		CoachPrefab coachPrefab = UnityEngine.Object.Instantiate(this.coachPrefab, coachGroupParent);
		DarkenListBackgroundObj(coachPrefab.gameObject, darken);
		coachPrefab.Initialize(coach, mode == CoachManagerViewMode.InGame, ResetView, PlayPressed);
	}

	public override void ResetView()
	{
		UpdateCoachesButtons();
		SetFooterButtons();
		okButton.SetActive(CanAddMoreCoaches());
	}

	private void UpdateCoachesButtons()
	{
		int num = CountPresentCoaches();
		bool removeButtonVisible = num > 1 && mode == CoachManagerViewMode.InGame && GamePermissions.allowed[(int)GamePermissions.Permissions.removeHumanCoaches];
		bool vacationButtonVisible = num > 1 && mode == CoachManagerViewMode.InGame && GamePermissions.allowed[(int)GamePermissions.Permissions.vacationHumanCoaches];
		warningMessageObject.SetActive(value: false);
		if (coachGroupParent.childCount > 0)
		{
			for (int i = 0; i < coachGroupParent.childCount; i++)
			{
				CoachPrefab component = coachGroupParent.GetChild(i).GetComponent<CoachPrefab>();
				UpdateCoachPrefab(component, removeButtonVisible, vacationButtonVisible);
				if (!component.myCoach.HasAccount())
				{
					warningMessageObject.SetActive(value: true);
					warningMessage.labelID = "NO_ACCOUNTS_ASSOCIATED_TO_COACHES";
					warningMessage.ReloadElementConfig();
				}
			}
		}
		else
		{
			warningMessageObject.SetActive(value: true);
			warningMessage.labelID = "NO_COACHES_IN_GAME";
			warningMessage.ReloadElementConfig();
		}
	}

	private int CountPresentCoaches()
	{
		int num = 0;
		for (int i = 0; i < coachGroupParent.childCount; i++)
		{
			CoachPrefab component = coachGroupParent.GetChild(i).GetComponent<CoachPrefab>();
			if (component.IsActive() && !component.IsInVacation())
			{
				num++;
			}
		}
		return num;
	}

	private void UpdateCoachPrefab(CoachPrefab coachPrefab, bool removeButtonVisible, bool vacationButtonVisible)
	{
		if (coachPrefab.IsActive() && !coachPrefab.IsInVacation())
		{
			coachPrefab.SetRemoveButton(removeButtonVisible);
			coachPrefab.SetVacationButton(vacationButtonVisible);
		}
		coachPrefab.UpdateNoAccountIcon();
	}

	private void SetFooterButtons()
	{
		switch (mode)
		{
		case CoachManagerViewMode.NewGame:
		{
			bool flag = CountPresentCoaches() > 0;
			flag &= !teamPanel.activeSelf;
			flag &= !recordedCoachPanel.activeSelf;
			playButton.gameObject.SetActive(flag);
			backButton.gameObject.SetActive(value: true);
			break;
		}
		case CoachManagerViewMode.InGame:
			playButton.gameObject.SetActive(value: false);
			backButton.gameObject.SetActive(value: true);
			break;
		default:
			throw new Exception("CoachesView: SetFooterButtons => No mode");
		}
	}

	private bool CanAddMoreCoaches()
	{
		int num = Mathf.Min(DataManager.HUMAN_COACHES_MAX, DataManager.instance.TeamsPerDivision(CompetitionType.NationalLeague));
		num = ((!GamePermissions.allowed[(int)GamePermissions.Permissions.multipleHumanCoaches]) ? 1 : num);
		return (DataManager.instance.allCoaches.GetAllHumanCoaches().Count < num) & (DataManager.instance.allTeams.Count == 0 || DataManager.instance.allTeams.GetTeamsForHumanCoaches().Count > 0);
	}

	public void AddPressed()
	{
		StartCoachCreation();
	}

	private void StartCoachCreation()
	{
		if (GetNumberAvailableCoaches() > 0)
		{
			FillRecordedCoachesPanel();
		}
		else
		{
			ScreenController.instance.ShowAccountView(AccountView.ViewMode.Login, null, PrepareAddHumanCoach);
		}
	}

	private int GetNumberAvailableCoaches()
	{
		int num = 0;
		ListOfCoaches allHumanCoaches = DataManager.instance.allCoaches.GetAllHumanCoaches();
		foreach (Account allRecordedCoach in DataManager.instance.allRecordedCoaches)
		{
			if (!allHumanCoaches.ContainsCoachGuid(allRecordedCoach.guid))
			{
				num++;
			}
		}
		return num;
	}

	private void PrepareAddHumanCoach(Account account)
	{
		if (AccountIsInGame(account))
		{
			ScreenController.instance.ShowDialogPopUp("DUPLICATE_COACH", "COACH_ALREADY_IN_GAME", null);
			return;
		}
		coachAccount = account;
		askChooseInitialTeam.Value = ElifootOptions.GetFlag(ElifootOptions.Flags.askChooseInitialTeam, defautValue: true);
		showCannotChooseTeam.Value = ElifootOptions.GetFlag(ElifootOptions.Flags.showCannotChooseInitialTeam, defautValue: true);
		bool num = DataManager.instance.allCoaches.GetAllHumanCoaches().Count == 0 && askChooseInitialTeam.Value && GamePermissions.allowed[(int)GamePermissions.Permissions.chooseInitialTeam];
		bool flag = DataManager.instance.allCoaches.GetAllHumanCoaches().Count == 0 && showCannotChooseTeam.Value && !GamePermissions.allowed[(int)GamePermissions.Permissions.chooseInitialTeam];
		if (num)
		{
			ScreenController.instance.ShowDialogPopUpCheckBox(LanguageController.instance.Get_Translation("GEN_CHOOSE_TEAM"), LanguageController.instance.Get_Translation("FLAG_CHOOSE_INITIAL_TEAM"), ElifootOptions.GetFlagText(ElifootOptions.Flags.askChooseInitialTeam), WillChooseInitialTeam, RandomInitialTeam, askChooseInitialTeam);
		}
		else if (flag)
		{
			ScreenController.instance.ShowDialogPopUpCheckBox(LanguageController.instance.Get_Translation("GEN_CHOOSE_TEAM"), ElifootOptions.GetFlagText(ElifootOptions.Flags.showCannotChooseInitialTeam), LanguageController.instance.Get_Translation("FLAG_ALAWAYS_WARN"), RandomInitialTeam, showCannotChooseTeam);
		}
		else
		{
			StartCoroutine(AddHumanCoach());
		}
	}

	private bool AccountIsInGame(Account account)
	{
		if (string.IsNullOrEmpty(account.guid))
		{
			return false;
		}
		foreach (Coach allHumanCoach in DataManager.instance.allCoaches.GetAllHumanCoaches())
		{
			if (allHumanCoach.MyGUID == account.guid)
			{
				UpdateCoachName(account);
				return true;
			}
		}
		return false;
	}

	private void UpdateCoachName(Account account)
	{
		for (int i = 0; i < coachGroupParent.childCount; i++)
		{
			CoachPrefab component = coachGroupParent.GetChild(i).GetComponent<CoachPrefab>();
			if (component.myCoach.Account.guid == account.guid)
			{
				component.UpdateAccount(account);
			}
		}
	}

	public void WillChooseInitialTeam()
	{
		ElifootOptions.SetFlag(ElifootOptions.Flags.askChooseInitialTeam, askChooseInitialTeam.Value);
		ElifootOptions.chooseInitialTeam = true;
		StartCoroutine(AddHumanCoach());
	}

	public void RandomInitialTeam()
	{
		ElifootOptions.SetFlag(ElifootOptions.Flags.askChooseInitialTeam, askChooseInitialTeam.Value);
		ElifootOptions.SetFlag(ElifootOptions.Flags.showCannotChooseInitialTeam, showCannotChooseTeam.Value);
		ElifootOptions.chooseInitialTeam = false;
		StartCoroutine(AddHumanCoach());
	}

	private IEnumerator AddHumanCoach()
	{
		Coach newCoach = new Coach(coachAccount.coachName, 0, isHuman: true, coachAccount.guid, coachAccount);
		switch (mode)
		{
		case CoachManagerViewMode.NewGame:
			if (ElifootOptions.chooseInitialTeam)
			{
				StartCoroutine(ShowTeamsSelectPanel(newCoach));
			}
			else
			{
				TeamPressed(newCoach, GetRandomTeam());
			}
			break;
		case CoachManagerViewMode.InGame:
			AddCoach(newCoach);
			break;
		default:
			throw new Exception("CoachesView:AddHumanCoach => No mode");
		}
		yield return 0;
	}

	private IEnumerator ShowTeamsSelectPanel(Coach newCoach)
	{
		teamPanel.SetActive(value: true);
		teamPanelLoadingAnimation.SetActive(value: true);
		teamGroupParent.gameObject.SetActive(value: false);
		recordedCoachPanel.SetActive(value: false);
		ListOfTeams teamsForHumanCoaches = DataManager.instance.allTeams.GetTeamsForHumanCoaches();
		yield return StartCoroutine(FillTeamPanel(newCoach, teamsForHumanCoaches));
		teamGroupParent.gameObject.SetActive(value: true);
		teamPanelLoadingAnimation.SetActive(value: false);
	}

	private Team GetRandomTeam()
	{
		ListOfTeams teamsForHumanCoaches = DataManager.instance.allTeams.GetTeamsForHumanCoaches();
		Team randomItem;
		do
		{
			randomItem = teamsForHumanCoaches.GetRandomItem();
		}
		while (randomItem.IsAvailableForHumanCoach().Item1 != HumanCoachStart.Available);
		return randomItem;
	}

	private void AddCoach(Coach newCoach)
	{
		DataManager.instance.allCoaches.Add(newCoach);
		recordedCoachPanel.SetActive(value: false);
		InstantiateCoach(newCoach, DataManager.instance.allCoaches.GetAllHumanCoaches().Count % 2 == 0);
		StartCoroutine(ScrollToBot());
		ResetView();
	}

	private IEnumerator ScrollToBot()
	{
		yield return new WaitForEndOfFrame();
		coachesScroll.verticalNormalizedPosition = 0f;
	}

	private IEnumerator FillTeamPanel(Coach newCoach, ListOfTeams teams)
	{
		yield return new WaitForSeconds(0.5f);
		DataManager.instance.myUnblockTeams.ApplyUnblockTeams(teams);
		teams.SortByCountryRegionName();
		SendTeamsToPool();
		bool darkenNext = false;
		bool darkenThis = false;
		Country country = null;
		Region region = null;
		foreach (Team team in teams)
		{
			try
			{
				if (team.country != country)
				{
					region = null;
					GameObject obj = UnityEngine.Object.Instantiate(countryTitlePrefab);
					obj.transform.SetParent(teamGroupParent);
					RectTransform component = obj.GetComponent<RectTransform>();
					Vector3 localScale = component.localScale;
					localScale.x = 1f;
					localScale.y = 1f;
					component.localScale = localScale;
					Vector2 sizeDelta = component.sizeDelta;
					sizeDelta.y = 100f;
					component.sizeDelta = sizeDelta;
					Image gameObjectImage = Util.GetGameObjectImage(obj, "Image");
					gameObjectImage.sprite = team.country.flag;
					gameObjectImage.gameObject.SetActive(value: true);
					gameObjectImage.type = Image.Type.Simple;
					gameObjectImage.preserveAspect = true;
					Text gameObjectText = Util.GetGameObjectText(obj, "Name");
					gameObjectText.text = team.country.GetName();
					gameObjectText.alignment = TextAnchor.MiddleLeft;
					obj.GetComponent<RectTransform>();
					country = team.country;
					obj.gameObject.SetActive(value: true);
				}
				if (team.region != region && team.country.playRegional)
				{
					GameObject obj2 = UnityEngine.Object.Instantiate(regionTitlePrefab);
					obj2.transform.SetParent(teamGroupParent);
					RectTransform component2 = obj2.GetComponent<RectTransform>();
					Vector3 localScale2 = component2.localScale;
					localScale2.x = 1f;
					localScale2.y = 1f;
					component2.localScale = localScale2;
					Vector2 sizeDelta2 = component2.sizeDelta;
					sizeDelta2.y = 100f;
					component2.sizeDelta = sizeDelta2;
					Image gameObjectImage2 = Util.GetGameObjectImage(obj2, "Image");
					gameObjectImage2.sprite = team.region.flag;
					gameObjectImage2.gameObject.SetActive(value: true);
					gameObjectImage2.type = Image.Type.Simple;
					gameObjectImage2.preserveAspect = true;
					Text gameObjectText2 = Util.GetGameObjectText(obj2, "Name");
					gameObjectText2.text = team.region.GetName();
					gameObjectText2.alignment = TextAnchor.MiddleLeft;
					obj2.GetComponent<RectTransform>();
					region = team.region;
					obj2.gameObject.SetActive(value: true);
				}
				TeamCoachPrefab3 teamCoachPrefabFromPool = GetTeamCoachPrefabFromPool();
				teamCoachPrefabFromPool.gameObject.SetActive(value: true);
				teamCoachPrefabFromPool.transform.SetParent(teamGroupParent);
				DarkenListBackgroundObj(teamCoachPrefabFromPool.gameObject, ref darkenThis, ref darkenNext);
				teamCoachPrefabFromPool.Initialize(team, delegate
				{
					TeamPressed(newCoach, team);
				}, showCountry: false, showInitLevel: true);
			}
			catch (Exception ex)
			{
				Debug.LogError($"FillTeamPanel: skipping team '{team?.Name}' (country='{team?.country?.CountryCode}' region='{team?.region?.regionCode}'): {ex}");
			}
		}
		yield return 0;
	}

	private TeamCoachPrefab3 GetTeamCoachPrefabFromPool()
	{
		TeamCoachPrefab3 teamCoachPrefab = ((teamCoachPrefabPool.childCount <= 0) ? UnityEngine.Object.Instantiate(this.teamCoachPrefab, teamGroupParent) : teamCoachPrefabPool.transform.GetChild(0).GetComponent<TeamCoachPrefab3>());
		teamCoachPrefab.name = "Team";
		return teamCoachPrefab;
	}

	private void SendTeamsToPool()
	{
		for (int num = teamGroupParent.childCount - 1; num >= 0; num--)
		{
			Transform child = teamGroupParent.GetChild(num);
			if (child.name == "Team")
			{
				child.SetParent(teamCoachPrefabPool);
				child.gameObject.SetActive(value: false);
			}
			else
			{
				child.SetParent(null);
				UnityEngine.Object.Destroy(child.gameObject);
			}
		}
	}

	private void TeamPressed(Coach newCoach, Team myTeam, bool supernumerary = false)
	{
		CheckSupernumeraryTrade(myTeam, supernumerary);
		teamPanel.SetActive(value: false);
		recordedCoachPanel.SetActive(value: false);
		myTeam.Coach = newCoach;
		AddCoach(newCoach);
	}

	private void CheckSupernumeraryTrade(Team myTeam, bool supernumerary = false)
	{
		CompetitionType[] array = new CompetitionType[2]
		{
			CompetitionType.NationalLeague,
			CompetitionType.SuperLeague
		};
		foreach (CompetitionType competitionType in array)
		{
			Country country = ((competitionType != CompetitionType.NationalLeague) ? null : myTeam.country);
			Country country2 = country;
			Competition competition = DataManager.instance.allCompetitions.FindCompetition(competitionType, country2);
			if (competition != null && (myTeam.MyDivision(competition) == null || supernumerary) && competition.divisions.Count != 0)
			{
				Division division = (Division)competition.divisions.Last();
				Team randomItem = division.teams.GetAllNonHumanTeams().GetRandomItem();
				if (randomItem != null)
				{
					division.RemoveTeam(randomItem);
					division.AddTeam(myTeam);
					competition.supernumeraryTeams.Remove(myTeam);
					competition.supernumeraryTeams.Add(randomItem);
				}
			}
		}
	}

	private void FillRecordedCoachesPanel()
	{
		recordedCoachPanel.SetActive(value: true);
		ClearRecordedCoaches();
		bool darkenNext = false;
		bool darkenThis = false;
		InstantiateAsNewCoach(ref darkenThis, ref darkenNext);
		List<Account> list = DataManager.instance.allRecordedCoaches.ToList();
		list.Sort((Account acc1, Account acc2) => string.Compare(acc1.coachName, acc2.coachName, StringComparison.CurrentCultureIgnoreCase));
		ListOfCoaches allHumanCoaches = DataManager.instance.allCoaches.GetAllHumanCoaches();
		foreach (Account account in list)
		{
			if (!allHumanCoaches.ContainsCoachGuid(account.guid))
			{
				InstantiateRecordedCoach(account, delegate
				{
					RecordedCoachPressed(account);
				}, ref darkenThis, ref darkenNext);
			}
		}
	}

	private void ClearRecordedCoaches()
	{
		for (int i = 0; i < recordedCoachGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(recordedCoachGroupParent.GetChild(i).gameObject);
		}
		warningMessageObject.SetActive(value: false);
	}

	private void InstantiateAsNewCoach(ref bool darkenThis, ref bool darkenNext)
	{
		RecordedCoachPrefab recordedCoachPrefab = UnityEngine.Object.Instantiate(this.recordedCoachPrefab, recordedCoachGroupParent, worldPositionStays: false);
		DarkenListBackgroundObj(recordedCoachPrefab.gameObject, ref darkenThis, ref darkenNext);
		recordedCoachPrefab.InitializeAsNewCoach(NewCoachPressed);
	}

	private void InstantiateRecordedCoach(Account coachAccount, Action onClickAction, ref bool darkenThis, ref bool darkenNext)
	{
		RecordedCoachPrefab recordedCoachPrefab = UnityEngine.Object.Instantiate(this.recordedCoachPrefab, recordedCoachGroupParent, worldPositionStays: false);
		DarkenListBackgroundObj(recordedCoachPrefab.gameObject, ref darkenThis, ref darkenNext);
		bool flag = !coachAccount.HasCredentials();
		recordedCoachPrefab.Initialize(flag, coachAccount, onClickAction, OnRecordedCoachDeleted);
		if (flag)
		{
			warningMessageObject.SetActive(value: true);
			warningMessage.labelID = "NO_ACCOUNTS_ASSOCIATED_TO_COACHES";
			warningMessage.ReloadElementConfig();
		}
	}

	private void OnRecordedCoachDeleted()
	{
		warningMessageObject.SetActive(value: false);
		for (int i = 0; i < recordedCoachGroupParent.childCount; i++)
		{
			if (recordedCoachGroupParent.GetChild(i).GetComponent<RecordedCoachPrefab>().showNoAccountIcon)
			{
				warningMessageObject.SetActive(value: true);
				warningMessage.labelID = "NO_ACCOUNTS_ASSOCIATED_TO_COACHES";
				warningMessage.ReloadElementConfig();
			}
		}
	}

	private void NewCoachPressed()
	{
		ScreenController.instance.ShowAccountView(AccountView.ViewMode.Login, null, PrepareAddHumanCoach);
	}

	private void RecordedCoachPressed(Account recordedCoachAccount)
	{
		pressedCoachAccount = recordedCoachAccount;
		if (recordedCoachAccount.HasCredentials())
		{
			CreateHumanCoach();
		}
		else
		{
			ScreenController.instance.ShowAccountView(AccountView.ViewMode.CreateAccountForExistingCoach, recordedCoachAccount, PrepareAddHumanCoach, CreateHumanCoach);
		}
	}

	private void CreateHumanCoach()
	{
		recordedCoachPanel.SetActive(value: false);
		PrepareAddHumanCoach(pressedCoachAccount);
	}

	public void PlayPressed()
	{
		if (ElifootOptions.playWorldRanking)
		{
			CloseRankingPermissionPopUp();
		}
		else
		{
			DataManager.instance.CheckRankingPermission(CloseRankingPermissionPopUp);
		}
	}

	public void CloseRankingPermissionPopUp()
	{
		onClose = onCloseOK;
		Close();
	}

	public void BackPressed()
	{
		if (recordedCoachPanel.activeSelf)
		{
			recordedCoachPanel.SetActive(value: false);
		}
		else if (teamPanel.activeSelf)
		{
			teamPanel.SetActive(value: false);
			FillCoachList();
		}
		else
		{
			onClose = onCloseCancel;
			Close();
		}
	}

	public override void Close()
	{
		base.Close();
		DataManager.instance.SaveCoachGuids();
		onClose?.Invoke();
	}
}
