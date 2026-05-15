using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class ScreenController : MonoBehaviour
{
	public Image blackForeground;

	[Header("Data")]
	public DbTeams dbTeamsUpdate;

	[Header("Views")]
	public AccountView accountView;

	public AboutView aboutView;

	public BugReportView bugReportView;

	public AuctionView auctionView;

	public BankView bankView;

	public BankLoanView bankLoanView;

	public BestStrikersView bestStrikersView;

	public BestStrikersAllTimeView bestStrikersAllTimeView;

	public CoachesView coachesView;

	public CoachHistoryView coachHistoryView;

	public CoachNewsView coachNewsView;

	public CupDrawView cupDrawView;

	public DialogPopUpView dialogViewSimple;

	public DialogPopUpView dialogViewCb;

	public DialogInputfieldView dialogInputfieldView;

	public DialogSelectionView dialogSelectionView;

	public EditTeamsView editTeamsView;

	public EndOfSeasonView endOfSeasonView;

	public ItemBuyView itemBuyView;

	public LastYearWinnersView lastYearWinnersView;

	public LeagueAlertPopUp leagueAlertPopUp;

	public LeagueCalendarView leagueCalendarView;

	public LeaguesPopUp leaguesPopUp;

	public LoadingView loadingView;

	public LoadingWithProgressView loadingWithProgressView;

	public MatchesView matchesView;

	public MatchResumeView matchesResumeView;

	public MsgDlgImgView messageWithImageView;

	public NewTeamsPopUp newTeamsPopUp;

	public ParametersView parametersView;

	public PauseView pauseView;

	public PenaltyPlayersView penaltyPlayersView;

	public PlayerBuyView playerBuyView;

	public PlayerListView playerListView;

	public PlayerMarketView playerMarketView;

	public PlayerSellView playerSellView;

	public RankingView rankingView;

	public SaveLoadView saveLoadView;

	public ScrollableTextView scrollableTextView;

	public StadiumView stadiumView;

	public StandingsView standingsView;

	public StoreView storeView;

	public SubstitutionsView substitutionsView;

	public TeamMainView teamMainView;

	public DialogPopUpView threeDialogView;

	public TicketsView ticketsView;

	public TitlesView titlesView;

	public TitlesPopUp titlesPopUp;

	public UpdatesView updatesView;

	public PackageLoadedPopUp packageLoadedPopUp;

	[Header("Prefabs")]
	public ToastMessage toastMessagePrefab;

	[Header("Icons")]
	public Sprite coachInvitedMessageImage;

	public Sprite coachFiredMessageImage;

	public Sprite coachLeagueWinnerImage;

	public Sprite coachLeagueSecondImage;

	public Sprite coachLeagueThirdImage;

	public Sprite coachCupWinnerImage;

	public Sprite divisionUpImage;

	public Sprite divisionDownImage;

	public Sprite goalEventIcon;

	public Sprite penaltyGoalEventIcon;

	public Sprite redCardEventIcon;

	public Sprite yellowCardEventIcon;

	public Sprite secondYellowCardEventIcon;

	public Sprite injuredEventIcon;

	public Sprite disallowedEventIcon;

	public Sprite playerInEventIcon;

	public Sprite playerOutEventIcon;

	public Sprite coachFiredIcon;

	public Sprite coachResignedIcon;

	public Sprite coachHiredIcon;

	public Sprite coachInvitedIcon;

	public Sprite genericHumanIcon;

	public static ScreenController instance;

	private GameObject currentLoadingScreen;

	private Action optionsReturnAction;

	private static string[] languageFlagsToShow;

	private static Action<string> AfterLanguageSelected;

	private static bool[] languageSelected;

	private readonly float fadeSpeed = 1f;

	private void Awake()
	{
		if (instance == null)
		{
			instance = this;
			UnityEngine.Object.DontDestroyOnLoad(base.gameObject);
		}
		else
		{
			UnityEngine.Object.Destroy(base.gameObject);
		}
	}

	public IEnumerator FadeBlack(float alphaValue, bool immediatelly = false)
	{
		float i = 0f;
		blackForeground.gameObject.SetActive(value: true);
		Color startColor = blackForeground.color;
		Color endColor = new Color(blackForeground.color.r, blackForeground.color.g, blackForeground.color.b, alphaValue);
		if (immediatelly)
		{
			blackForeground.color = endColor;
			yield break;
		}
		while (i < 1f)
		{
			i += Time.deltaTime * fadeSpeed;
			blackForeground.color = Color.Lerp(startColor, endColor, i);
			yield return 0;
		}
	}

	public void SetAlpha(float alphaValue)
	{
		blackForeground.color = new Color(blackForeground.color.r, blackForeground.color.g, blackForeground.color.b, alphaValue);
	}

	public void StartUpNewGame()
	{
		UnityEngine.Object.Destroy(GameObject.Find("Canvas"));
		SceneManager.LoadScene("Game");
	}

	public void ShowMainMenu()
	{
		SceneManager.LoadScene("Menu20");
	}

	public void ShowAccountView(AccountView.ViewMode startingMode, Account coachAccount, Action<Account> onCoachComplete)
	{
		UnityEngine.Object.Instantiate(accountView, base.transform, worldPositionStays: false).Initialize(startingMode, coachAccount, onCoachComplete);
	}

	public void ShowAccountView(AccountView.ViewMode startingMode, Account coachAccount, Action<Account> onCoachComplete, Action ignoreAccountCreation)
	{
		UnityEngine.Object.Instantiate(accountView, base.transform, worldPositionStays: false).Initialize(startingMode, coachAccount, onCoachComplete, ignoreAccountCreation);
	}

	public void ShowAboutView()
	{
		UnityEngine.Object.Instantiate(aboutView, base.transform, worldPositionStays: false).Initialize();
	}

	public void ShowBugReportView()
	{
		UnityEngine.Object.Instantiate(bugReportView, base.transform, worldPositionStays: false).Initialize();
	}

	public IEnumerator ShowAuctionView(Player player, long baseValue, bool humanSellingPlayer = false, bool forcedSell = false, Action onCloseView = null)
	{
		HideLoadingView();
		AuctionView thisView = UnityEngine.Object.Instantiate(auctionView, base.transform, worldPositionStays: false);
		thisView.Initialize(player, baseValue, humanSellingPlayer, forcedSell, onCloseView);
		yield return new WaitUntil(() => thisView.isDone);
		if (!(thisView == null))
		{
			thisView.Close();
		}
	}

	public void ShowBankAccount(Bank teamBank)
	{
		UnityEngine.Object.Instantiate(bankView, base.transform, worldPositionStays: false).Initialize(teamBank);
	}

	public void ShowBankLoanView(Team team, Action onCloseView)
	{
		UnityEngine.Object.Instantiate(bankLoanView, base.transform, worldPositionStays: false).Initialize(team, onCloseView);
	}

	public IEnumerator ShowBestStrikersView(Competition baseCompetition, float secondsToClose = 0f)
	{
		BestStrikersView thisView = UnityEngine.Object.Instantiate(bestStrikersView, base.transform, worldPositionStays: false);
		thisView.Initialize(baseCompetition, ParametersView.prefabSize[ParametersView.GridViewMode.Normal]);
		thisView.StartTimeToClose(secondsToClose);
		yield return StartCoroutine(thisView.WaitForInput());
		_ = thisView == null;
	}

	public void ShowBestStrikersAllTimeView(Team baseTeam)
	{
		UnityEngine.Object.Instantiate(bestStrikersAllTimeView, base.transform, worldPositionStays: false).Initialize(baseTeam);
	}

	public void ShowCoachesView(CoachManagerViewMode mode, Action onCloseOK = null, Action onCloseCancel = null)
	{
		if (coachesView == null)
		{
			Debug.LogError("Assign the variable 'coachesView' in ScreenController", this);
			GameObject gameObject = Resources.Load("Prefabs/Views/CoachesView20") as GameObject;
			if (gameObject == null)
			{
				Debug.LogWarning("Failed to load Prefabs/Views/CoachesView20");
				return;
			}
			coachesView = gameObject.GetComponent<CoachesView>();
		}
		UnityEngine.Object.Instantiate(coachesView, base.transform, worldPositionStays: false).Initialize(mode, onCloseOK, onCloseCancel);
	}

	public void ShowCoachHistoryView(Coach coach)
	{
		UnityEngine.Object.Instantiate(coachHistoryView, base.transform, worldPositionStays: false).Initialize(coach.coachEvents);
	}

	public IEnumerator ShowCoachNews(float secondsToClose)
	{
		if (DataManager.instance.properties.coachEventNews.Count != 0)
		{
			if (ElifootOptions.simulationSkipCoachNewsDisplay)
			{
				DataManager.instance.properties.coachEventNews.Clear();
			}
			else
			{
				yield return ShowCoachNews(DataManager.instance.properties.coachEventNews, secondsToClose);
			}
		}
	}

	public IEnumerator ShowSimulatedCoachNews()
	{
		EliList eliList = new EliList();
		int num = 3;
		do
		{
			Team randomItem = DataManager.instance.allTeams.GetRandomItem();
			eliList.Add(new Coach.CoachEventNews(randomItem.Coach, randomItem, null, isResign: true));
			Team randomItem2 = DataManager.instance.allTeams.GetRandomItem();
			eliList.Add(new Coach.CoachEventNews(randomItem2.Coach, randomItem2, null, isResign: false));
			Coach coach = null;
			foreach (Coach allCoach in DataManager.instance.allCoaches)
			{
				if (allCoach.MyTeam != null)
				{
					coach = allCoach;
					break;
				}
			}
			if (coach != null)
			{
				eliList.Add(new Coach.CoachEventNews(null, randomItem2, coach, coach.MyTeam, null, isResign: false));
			}
			Coach coach3 = DataManager.instance.allCoaches.GetAllUnemployedCoaches().Coach(0);
			if (coach3 != null)
			{
				eliList.Add(new Coach.CoachEventNews(null, null, null, randomItem2, coach3, isResign: false));
			}
		}
		while (--num > 0);
		yield return ShowCoachNews(eliList, 0f);
	}

	private IEnumerator ShowCoachNews(EliList coachNews, float secondsToClose)
	{
		CoachNewsView coachNewsView = UnityEngine.Object.Instantiate(this.coachNewsView, base.transform, worldPositionStays: false);
		coachNewsView.Initialize(coachNews);
		coachNewsView.StartTimeToClose(secondsToClose);
		yield return StartCoroutine(coachNewsView.WaitForInput());
	}

	public void ShowCupDrawView(Competition baseCompetition, Team baseTeam)
	{
		UnityEngine.Object.Instantiate(cupDrawView, base.transform, worldPositionStays: false).Initialize(baseCompetition, baseTeam);
	}

	public void ShowEditTeamsView()
	{
		UnityEngine.Object.Instantiate(editTeamsView, base.transform, worldPositionStays: false);
	}

	public IEnumerator ShowEndSeasonView(Competition competition, Team bestAttack, float secondsToClose)
	{
		EndOfSeasonView endOfSeasonView = UnityEngine.Object.Instantiate(this.endOfSeasonView, base.transform, worldPositionStays: false);
		endOfSeasonView.Initialize(competition, bestAttack);
		endOfSeasonView.StartTimeToClose(secondsToClose);
		yield return StartCoroutine(endOfSeasonView.WaitForInput());
	}

	public void ShowItemBuyView(ItemToBuy itemToBuy, Action onBuyAction, string toastSuccessMessageTag = "")
	{
		UnityEngine.Object.Instantiate(itemBuyView, base.transform, worldPositionStays: false).Initialize(itemToBuy, onBuyAction, toastSuccessMessageTag);
	}

	public void ShowLastYearWinnersView(int baseYear = 0)
	{
		UnityEngine.Object.Instantiate(lastYearWinnersView, base.transform, worldPositionStays: false).Initialize(baseYear);
	}

	public void ShowLeagueAlertPopUp(List<DbCountries.DbCountry> includedCountries, List<DbCountries.DbCountry> excludedCountries, Action yesAction = null)
	{
		UnityEngine.Object.Instantiate(leagueAlertPopUp, base.transform, worldPositionStays: false).Initialize(includedCountries, excludedCountries, yesAction);
	}

	public void ShowLeagueCalendar(Team currentTeam, Team opponentTeam, EliList calendarTable)
	{
		UnityEngine.Object.Instantiate(leagueCalendarView, base.transform, worldPositionStays: false).Initialize(currentTeam, opponentTeam, calendarTable);
	}

	public void ShowLeaguesPopUp(MenuManager menuManager)
	{
		UnityEngine.Object.Instantiate(leaguesPopUp, base.transform, worldPositionStays: false).Initialize(menuManager);
	}

	public void ShowLoadingView(string description = null)
	{
		StartCoroutine(IShowLoadingView(description));
	}

	internal IEnumerator IShowLoadingView(string description = null)
	{
		if (currentLoadingScreen != null)
		{
			UnityEngine.Object.Destroy(currentLoadingScreen);
		}
		LoadingView loadingView = UnityEngine.Object.Instantiate(this.loadingView, base.transform, worldPositionStays: false);
		loadingView.Initialize(description);
		currentLoadingScreen = loadingView.gameObject;
		yield return 0;
	}

	public void HideLoadingView()
	{
		if (currentLoadingScreen != null)
		{
			UnityEngine.Object.Destroy(currentLoadingScreen);
		}
	}

	public LoadingWithProgressView ShowLoadingWithProgressView(string description = null, bool canCancel = false, Action onCancelAction = null)
	{
		LoadingWithProgressView obj = UnityEngine.Object.Instantiate(loadingWithProgressView, base.transform, worldPositionStays: false);
		obj.Initialize(description, canCancel, onCancelAction);
		return obj;
	}

	public IEnumerator ShowMatchesView()
	{
		MatchesView thisView = UnityEngine.Object.Instantiate(matchesView, base.transform, worldPositionStays: false);
		thisView.Initialize(DataManager.instance.allMatches);
		yield return StartCoroutine(thisView.WaitForMatchesFinished());
		UnityEngine.Object.Destroy(thisView.gameObject);
	}

	public IEnumerator ShowMatchesResumeView()
	{
		if (!DataManager.instance.recordedMatches.HasCoachPresent(ElifootOptions.SimulationFlag.Match))
		{
			yield return 0;
			yield break;
		}
		MatchResumeView thisView = UnityEngine.Object.Instantiate(matchesResumeView, base.transform, worldPositionStays: false);
		thisView.Initialize(DataManager.instance.recordedMatches);
		while (!thisView.isDone)
		{
			yield return 0;
		}
		UnityEngine.Object.Destroy(thisView.gameObject);
	}

	public void ShowConflictTeamsView(Action onClose = null, bool calledInAnyView = false)
	{
		if (calledInAnyView)
		{
			onClose = GetConflictsViewOnCloseAction();
		}
		UnityEngine.Object.Instantiate(newTeamsPopUp, base.transform, worldPositionStays: false).Initialize(GetConflictsViewOnCloseAction());
	}

	private Action GetConflictsViewOnCloseAction()
	{
		EditTeamsView editTeamsView = UnityEngine.Object.FindObjectOfType<EditTeamsView>();
		UpdatesView updatesView = UnityEngine.Object.FindObjectOfType<UpdatesView>();
		Action action = null;
		if (editTeamsView != null)
		{
			action = (Action)Delegate.Combine(action, new Action(editTeamsView.RedrawCurrentView));
		}
		else if (updatesView != null)
		{
			action = (Action)Delegate.Combine(action, new Action(updatesView.FillList));
		}
		return action;
	}

	public IEnumerator ShowPauseView()
	{
		PauseView thisView = UnityEngine.Object.Instantiate(pauseView, base.transform, worldPositionStays: false);
		thisView.Initialize();
		yield return StartCoroutine(thisView.WaitForInput());
		if (thisView != null)
		{
			UnityEngine.Object.Destroy(thisView.gameObject);
		}
	}

	public IEnumerator ShowPenaltyPlayersView(Team team)
	{
		PenaltyPlayersView thisView = UnityEngine.Object.Instantiate(penaltyPlayersView, base.transform, worldPositionStays: false);
		thisView.Initialize(team);
		yield return new WaitUntil(() => thisView.isDone);
	}

	public void ShowPlayerBuyView(Coach coach, Action onCloseView)
	{
		UnityEngine.Object.Instantiate(playerBuyView, base.transform, worldPositionStays: false).Initialize(coach, onCloseView);
	}

	public void ShowPlayerListView(Team myTeam, Team baseTeam, Player basePlayer = null, bool showMoreInfoButton = false, Action onClose = null)
	{
		UnityEngine.Object.Instantiate(playerListView, base.transform, worldPositionStays: false).Initialize(myTeam, baseTeam, basePlayer, showMoreInfoButton, onClose);
	}

	public void ShowPlayerMarketView()
	{
		UnityEngine.Object.Instantiate(playerMarketView, base.transform, worldPositionStays: false).Initialize(DataManager.instance.properties.playerTransferEventList);
	}

	public void ShowPlayerSellView(Team team, bool mustSell, Action onCloseView)
	{
		UnityEngine.Object.Instantiate(playerSellView, base.transform, worldPositionStays: false).Initialize(team, mustSell, onCloseView);
	}

	public void ShowRankingView(bool showLoadingView, bool showWarningMessages, bool forceReload, Func<bool> checkBeforeShowing = null, Action onClose = null)
	{
		UnityEngine.Object.Instantiate(rankingView, base.transform, worldPositionStays: false).Initialize(showLoadingView, showWarningMessages, forceReload, checkBeforeShowing, onClose);
	}

	public void ShowSaveLoadView(bool isSaveMode, Action onSave = null, Action onBack = null)
	{
		UnityEngine.Object.Instantiate(saveLoadView, base.transform, worldPositionStays: false).Initialize(isSaveMode, onSave, onBack);
	}

	public void ShowScrollableTextView(string title, string description)
	{
		string title2 = LanguageController.instance.Get_Translation(title);
		string description2 = LanguageController.instance.Get_Translation(description);
		UnityEngine.Object.Instantiate(scrollableTextView, base.transform, worldPositionStays: false).Initialize(title2, description2);
	}

	public void ShowScrollableTextView(string title, string description, Action yesAction, Action noAction)
	{
		string title2 = LanguageController.instance.Get_Translation(title);
		string description2 = LanguageController.instance.Get_Translation(description);
		UnityEngine.Object.Instantiate(scrollableTextView, base.transform, worldPositionStays: false).GetComponent<ScrollableTextView>().Initialize(title2, description2, yesAction, noAction);
	}

	public void ShowStadiumView(Team team, Action onCloseView)
	{
		UnityEngine.Object.Instantiate(stadiumView, base.transform, worldPositionStays: false).Initialize(team, onCloseView);
	}

	public IEnumerator ShowStandingsView(Competition baseCompetition, int secondsToClose, Team baseTeam)
	{
		if (standingsView == null)
		{
			Debug.LogError("Assign the variable 'standingsView' in ScreenController", this);
			GameObject gameObject = Resources.Load("Prefabs/Views/StandingsView20") as GameObject;
			if (gameObject == null)
			{
				Debug.LogWarning("Failed to load Prefabs/Views/StandingsView20");
				yield break;
			}
			standingsView = gameObject.GetComponent<StandingsView>();
		}
		StandingsView thisView = UnityEngine.Object.Instantiate(standingsView, base.transform, worldPositionStays: false);
		thisView.Initialize(baseCompetition, baseTeam);
		thisView.StartTimeToClose(secondsToClose);
		yield return StartCoroutine(thisView.WaitForInput());
		UnityEngine.Object.Destroy(thisView.gameObject);
	}

	public void ShowStoreView(Team team, Action onExit, InAppPurchases.GameItemType autoSelectGameItemType)
	{
		if (StoreView.myOwnView == null)
		{
			StoreView.myOwnView = UnityEngine.Object.Instantiate(storeView, base.transform, worldPositionStays: false);
		}
		StoreView.myOwnView.Initialize(team, onExit, autoSelectGameItemType);
	}

	public void ShowStoreViewOneType(Action onExit, InAppPurchases.GameItemType showType)
	{
		if (StoreView.myOwnView == null)
		{
			StoreView.myOwnView = UnityEngine.Object.Instantiate(storeView, base.transform, worldPositionStays: false);
		}
		StoreView.myOwnView.Initialize(null, onExit, InAppPurchases.GameItemType.None, showType);
	}

	public IEnumerator ShowSubstitutionView(Match match, Team team, SubstitutionsView.RunMode mode, PermissionLevel substitutionPermissionRequired, Action onPlayPressed, bool waitForInput, int gameTime)
	{
		SubstitutionsView substitutionsView = UnityEngine.Object.Instantiate(this.substitutionsView, base.transform, worldPositionStays: false);
		substitutionsView.Initialize(match, team, mode, substitutionPermissionRequired, onPlayPressed, waitForInput, gameTime);
		if (waitForInput)
		{
			yield return StartCoroutine(substitutionsView.WaitForInput());
		}
	}

	public void ShowTeamView(Team team, Match currentMatch)
	{
		TeamMainView teamMainView = UnityEngine.Object.Instantiate(this.teamMainView, base.transform, worldPositionStays: false);
		if (team.teamMatch.isHome)
		{
			teamMainView.transform.SetAsLastSibling();
		}
		else
		{
			teamMainView.transform.SetAsFirstSibling();
		}
		teamMainView.Initialize(team, currentMatch);
	}

	public void ShowTicketsView(EliLimitedList ticketIncomeList)
	{
		UnityEngine.Object.Instantiate(ticketsView, base.transform, worldPositionStays: false).Initialize(ticketIncomeList);
	}

	public void ShowTitlesView(Competition baseCompetition)
	{
		UnityEngine.Object.Instantiate(titlesView, base.transform, worldPositionStays: false).Initialize(baseCompetition);
	}

	public void ShowTitlesPopUp(Coach coach)
	{
		UnityEngine.Object.Instantiate(titlesPopUp, base.transform, worldPositionStays: false).Initialize(coach);
	}

	public void ShowTitlesPopUp(Team team)
	{
		UnityEngine.Object.Instantiate(titlesPopUp, base.transform, worldPositionStays: false).Initialize(team);
	}

	public void ShowUpdatesView()
	{
		UnityEngine.Object.Instantiate(updatesView, base.transform, worldPositionStays: false).Initialize();
	}

	public void ShowParameterEditor(Action returnAction)
	{
		optionsReturnAction = returnAction;
		ListOfParameters listOfParameters = new ListOfParameters();
		if (DataManager.instance.buildLevel.CompareTo(GamePermissions.Permissions.impersonation) >= 0)
		{
			List<string> list = new List<string>();
			foreach (PermissionLevel value2 in Enum.GetValues(typeof(PermissionLevel)))
			{
				if (value2.CompareTo(Registration.RegLevel) <= 0)
				{
					list.Add(GamePermissions.GetLevelString(value2));
				}
			}
			string levelString = GamePermissions.GetLevelString(GamePermissions.impersonationLevel);
			int key = list.IndexOf(levelString);
			KeyValuePair<int, string[]> value = new KeyValuePair<int, string[]>(key, list.ToArray());
			listOfParameters.StartSection(LanguageController.instance.Get_Translation("OPTIONS_IMPERSONATIONTITLE"));
			listOfParameters.RegisterParameter("impersonation", LanguageController.instance.Get_Translation("OPTIONS_IMPERSONATIONLEVEL"), value);
		}
		ElifootOptions.ManageOptions(Util.ManageOption.CreateParameter, ref listOfParameters);
		ShowParameterEditor("ID:OPTIONS_TITLE", listOfParameters, ParameterEditorDefaultReturn, showLoadingView: true, ParametersView.GridViewMode.Normal, hasFoldout: true);
	}

	public void ParameterEditorDefaultReturn(ListOfParameters parametersList)
	{
		ElifootOptions.ParametersSaved(parametersList);
		optionsReturnAction?.Invoke();
	}

	public IEnumerator ShowParameterEditor(string title, ListOfParameters parametersList, Action<ListOfParameters> onSaveParameters, float secondsToClose, bool showLoadingView, ParametersView.GridViewMode viewMode = ParametersView.GridViewMode.Normal)
	{
		if (this.parametersView == null)
		{
			Debug.LogError("Assign the variable 'parametersView' in ScreenController", this);
			GameObject gameObject = Resources.Load("Prefabs/Views/ParametersView20") as GameObject;
			if (gameObject == null)
			{
				Debug.LogWarning("Failed to load Prefabs/Views/ParametersView20");
				yield break;
			}
			this.parametersView = gameObject.GetComponent<ParametersView>();
		}
		ParametersView parametersView = UnityEngine.Object.Instantiate(this.parametersView, base.transform, worldPositionStays: false);
		parametersView.Initialize(title, parametersList, onSaveParameters, showLoadingView, viewMode);
		parametersView.StartTimeToClose(secondsToClose);
		yield return StartCoroutine(parametersView.WaitForInput());
	}

	public void ShowParameterEditor(string title, ListOfParameters parametersList, Action<ListOfParameters> onSaveParameters, bool showLoadingView, ParametersView.GridViewMode viewMode = ParametersView.GridViewMode.Normal, bool hasFoldout = false)
	{
		if (parametersView == null)
		{
			Debug.LogError("Assign the variable 'parametersView' in ScreenController", this);
			GameObject gameObject = Resources.Load("Prefabs/Views/ParametersView20") as GameObject;
			if (gameObject == null)
			{
				Debug.LogWarning("Failed to load Prefabs/Views/ParametersView20");
				return;
			}
			parametersView = gameObject.GetComponent<ParametersView>();
		}
		UnityEngine.Object.Instantiate(parametersView, base.transform, worldPositionStays: false).Initialize(title, parametersList, onSaveParameters, showLoadingView, viewMode, inCoachRanking: false, hasFoldout);
	}

	public IEnumerator ISelectLanguage(string title, Action<string> onClick, string[] flagsToShow)
	{
		SelectLanguage(title, onClick, flagsToShow);
		yield return 0;
	}

	public void SelectLanguage(string title, Action<string> onClick, string[] flagsToShow)
	{
		if (string.IsNullOrEmpty(LanguageController.activeLanguage))
		{
			switch (Application.systemLanguage)
			{
			case SystemLanguage.English:
				LanguageController.activeLanguage = "EN";
				break;
			case SystemLanguage.Spanish:
				LanguageController.activeLanguage = "ES";
				break;
			case SystemLanguage.Portuguese:
				LanguageController.activeLanguage = "PT-BR";
				break;
			case SystemLanguage.German:
				LanguageController.activeLanguage = "DE";
				break;
			case SystemLanguage.French:
				LanguageController.activeLanguage = "FR";
				break;
			case SystemLanguage.Italian:
				LanguageController.activeLanguage = "IT";
				break;
			case SystemLanguage.Turkish:
				LanguageController.activeLanguage = "TK";
				break;
			case SystemLanguage.Indonesian:
				LanguageController.activeLanguage = "ID";
				break;
			case SystemLanguage.Japanese:
				LanguageController.activeLanguage = "JP";
				break;
			case SystemLanguage.Arabic:
				LanguageController.activeLanguage = "AR";
				break;
			default:
				LanguageController.activeLanguage = "EN";
				break;
			}
		}
		AfterLanguageSelected = onClick;
		languageFlagsToShow = flagsToShow;
		ListOfParameters listOfParameters = new ListOfParameters();
		languageSelected = new bool[languageFlagsToShow.Length];
		int num = 0;
		string[] array = languageFlagsToShow;
		foreach (string text in array)
		{
			languageSelected[num] = text == LanguageController.activeLanguage;
			num++;
		}
		ManageLanguages(Util.ManageOption.CreateParameter, ref listOfParameters);
		ShowParameterEditor("ID:OPTIONS_SELECTLANGUAGETITLE", listOfParameters, OnLanguageSelected, showLoadingView: false);
	}

	private void ManageLanguages(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		for (int i = 0; i < languageSelected.Length; i++)
		{
			languageSelected[i] = (bool)Util.ManageOneOption(mode, languageFlagsToShow[i], LanguageController.instance.languagesDesc[i], "ID:OPTIONS_LANGUAGEBUTTON", null, languageSelected[i], false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic, EliParameterPermissions.RadioButton);
		}
	}

	public void OnLanguageSelected(ListOfParameters listOfParameters)
	{
		ManageLanguages(Util.ManageOption.ReadParameter, ref listOfParameters);
		string obj = "";
		for (int i = 0; i < languageSelected.Length; i++)
		{
			if (languageSelected[i])
			{
				obj = languageFlagsToShow[i];
				break;
			}
		}
		AfterLanguageSelected(obj);
	}

	public void ShowOptionsView(Action returnAction)
	{
		StartCoroutine(IShowOptionsView(returnAction));
	}

	private IEnumerator IShowOptionsView(Action returnAction)
	{
		yield return StartCoroutine(IShowLoadingView());
		yield return new WaitForSeconds(0.25f);
		ShowParameterEditor(returnAction);
	}

	public void ShowBalanceView(Team team)
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		listOfParameters.StartSection("ID:TEAM_BALANCE_INCOME");
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_TICKETS", Util.MoneyString(team.teamSeason.seasonBalance.inTickets), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_PLAYERS_SOLD", Util.MoneyString(team.teamSeason.seasonBalance.inPlayersSold), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_PRIZES", Util.MoneyString(team.teamSeason.seasonBalance.inPrizes), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_SPONSORSHIP", Util.MoneyString(team.teamSeason.seasonBalance.inSponsorship), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_LOAN_REQUEST", Util.MoneyString(team.teamSeason.seasonBalance.inLoan), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_OTHER", Util.MoneyString(team.teamSeason.seasonBalance.inOther), TextAnchor.MiddleRight);
		listOfParameters.StartSection("ID:TEAM_BALANCE_OUTCOME");
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_SALARIES", Util.MoneyString(team.teamSeason.seasonBalance.outSalaries), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_PLAYERS_BOUGHT", Util.MoneyString(team.teamSeason.seasonBalance.outPlayerBought), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_STADIUM", Util.MoneyString(team.teamSeason.seasonBalance.outStadium), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_LOAN_PAY", Util.MoneyString(team.teamSeason.seasonBalance.outLoan), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_LOANINTEREST", Util.MoneyString(team.teamSeason.seasonBalance.outLoanInterest), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_OTHER", Util.MoneyString(team.teamSeason.seasonBalance.outOther), TextAnchor.MiddleRight);
		listOfParameters.StartSection("ID:TEAM_BALANCE_RESUME");
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_INCOME", Util.MoneyString(team.teamSeason.seasonBalance.totalIn), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_OUTCOME", Util.MoneyString(team.teamSeason.seasonBalance.totalOut), TextAnchor.MiddleRight);
		listOfParameters.RegisterReadOnlyParameter("ID:TEAM_BALANCE_TOTAL_BALANCE", Util.MoneyString(team.teamSeason.seasonBalance.totalBalance), TextAnchor.MiddleRight);
		ShowParameterEditor("ID:MENU_TEAMSEASONBALANCE", listOfParameters, null, showLoadingView: false);
	}

	public void ShowCoachRanking(string title, ListOfParameters parametersList)
	{
		if (parametersView == null)
		{
			Debug.LogError("Assign the variable 'parametersView' in ScreenController", this);
			GameObject gameObject = Resources.Load("Prefabs/Views/ParametersView20") as GameObject;
			if (gameObject == null)
			{
				Debug.LogWarning("Failed to load Prefabs/Views/ParametersView20");
				return;
			}
			parametersView = gameObject.GetComponent<ParametersView>();
		}
		UnityEngine.Object.Instantiate(parametersView, base.transform, worldPositionStays: false).Initialize(title, parametersList, null, showLoadingView: false, ParametersView.GridViewMode.Normal, inCoachRanking: true);
	}

	public void ShowPlayerDetailsView(Player player, Action<PlayerDetailsView, Player, PlayerDetailsView.ReturnAction> onReturnAction, bool canEdit = true)
	{
		if (parametersView == null)
		{
			Debug.LogError("Assign the variable 'parametersView' in ScreenController", this);
			GameObject gameObject = Resources.Load("Prefabs/Views/ParametersView20") as GameObject;
			if (gameObject == null)
			{
				Debug.LogWarning("Failed to load Prefabs/Views/ParametersView20");
				return;
			}
			parametersView = gameObject.GetComponent<ParametersView>();
		}
		UnityEngine.Object.Instantiate(parametersView, base.transform, worldPositionStays: false).gameObject.AddComponent<PlayerDetailsView>().Initialize(player, onReturnAction, canEdit);
	}

	public IEnumerator ShowCoachEventView(Coach.CoachEvent.CoachEventType eventType, Coach coach, Team team)
	{
		MsgDlgReturnObj msgReturn = new MsgDlgReturnObj
		{
			Value = MsgDlgView.MsgDlgReturn.Void
		};
		MsgDlgImgView msgDlgImgView = UnityEngine.Object.Instantiate(messageWithImageView, base.transform, worldPositionStays: false);
		MsgDlgView.MsgDlgType messageType = MsgDlgView.MsgDlgType.Info;
		string title = "";
		string message = "";
		Sprite imageSprite = null;
		DlgViewButtonInfo[] toArray = null;
		switch (eventType)
		{
		case Coach.CoachEvent.CoachEventType.Fired:
			messageType = MsgDlgView.MsgDlgType.Info;
			title = LanguageController.instance.Get_Translation("COACHEVENT_FIRED_TITLE");
			message = LanguageController.instance.Get_Translation("COACHEVENT_FIRED_TEXT", coach.Name, team.Name);
			imageSprite = coachFiredMessageImage;
			break;
		case Coach.CoachEvent.CoachEventType.Invited:
		{
			messageType = MsgDlgView.MsgDlgType.Custom;
			title = LanguageController.instance.Get_Translation("COACHEVENT_INVITED_TITLE");
			string leagueDivisionName = team.GetLeagueDivisionName(CompetitionType.NationalLeague);
			if (leagueDivisionName == null)
			{
				leagueDivisionName = team.country.GetName();
			}
			message = LanguageController.instance.Get_Translation("COACHEVENT_INVITED_TEXT", coach.Name, team.Name, leagueDivisionName);
			imageSprite = coachInvitedMessageImage;
			DlgViewButtonInfo itemToAdd = new DlgViewButtonInfo(null, "Yes", MsgDlgView.MsgDlgReturn.Yes, closeDialog: true, null);
			Extensions.AddItemInArray(ref toArray, itemToAdd);
			DlgViewButtonInfo itemToAdd2 = new DlgViewButtonInfo(null, "No", MsgDlgView.MsgDlgReturn.No, closeDialog: true, null);
			Extensions.AddItemInArray(ref toArray, itemToAdd2);
			DlgViewButtonInfo itemToAdd3 = new DlgViewButtonInfo(null, "Team", MsgDlgView.MsgDlgReturn.Custom1, closeDialog: false, delegate
			{
				ShowPlayerListView(team, null, null, showMoreInfoButton: true);
			});
			Extensions.AddItemInArray(ref toArray, itemToAdd3);
			break;
		}
		}
		msgDlgImgView.Initialize(messageType, title, message, imageSprite, null, msgReturn, toArray);
		yield return StartCoroutine(msgDlgImgView.WaitForInput());
		yield return msgReturn.Value == MsgDlgView.MsgDlgReturn.Yes;
	}

	public IEnumerator AnnounceCoachEvents()
	{
		foreach (Coach c in DataManager.instance.allCoaches)
		{
			foreach (Coach.CoachEvent ce in c.coachEvents)
			{
				if (c.Present(ElifootOptions.SimulationFlag.Other) && ce.shallAnnounce)
				{
					string titleText = ce.GetTitleText();
					string messageText = ce.GetMessageText(c.Name);
					Sprite messageImage = ce.GetMessageImage();
					AudioSource messageSound = ce.GetMessageSound();
					MsgDlgReturnObj msgDlgReturnObj = new MsgDlgReturnObj();
					msgDlgReturnObj.Value = MsgDlgView.MsgDlgReturn.Void;
					MsgDlgImgView msgDlgImgView = UnityEngine.Object.Instantiate(messageWithImageView, base.transform, worldPositionStays: false);
					msgDlgImgView.Initialize(MsgDlgView.MsgDlgType.Info, titleText, messageText, messageImage, messageSound, msgDlgReturnObj);
					yield return StartCoroutine(msgDlgImgView.WaitForInput());
				}
				ce.shallAnnounce = false;
			}
		}
	}

	public void ShowDialogPopUpCheckBox(string title, string description, string checkBoxText, Action yesAction, Action noAction, BooleanObj isChecked)
	{
		UnityEngine.Object.Instantiate(dialogViewCb, base.transform, worldPositionStays: false).Initialize(title, description, checkBoxText, yesAction, noAction, isChecked);
	}

	public void ShowDialogPopUpCheckBox(string title, string description, string checkBoxText, Action okAction, BooleanObj isChecked)
	{
		UnityEngine.Object.Instantiate(dialogViewCb, base.transform, worldPositionStays: false).Initialize(title, description, checkBoxText, okAction, isChecked);
	}

	public DialogPopUpView ShowDialogPopUp(string title, string description, Action yesAction, Action noAction)
	{
		DialogPopUpView dialogPopUpView = UnityEngine.Object.Instantiate(dialogViewSimple, base.transform, worldPositionStays: false);
		dialogPopUpView.Initialize(title, description, yesAction, noAction);
		return dialogPopUpView;
	}

	public DialogPopUpView ShowDialogPopUp(string title, string description, Action okAction)
	{
		DialogPopUpView dialogPopUpView = UnityEngine.Object.Instantiate(dialogViewSimple, base.transform, worldPositionStays: false);
		dialogPopUpView.Initialize(title, description, okAction);
		return dialogPopUpView;
	}

	public void ShowThreeDialogPopUp(string description, Action yesAction, Action noAction, Action cancelAction)
	{
		ShowThreeDialogPopUp(null, description, yesAction, noAction, cancelAction);
	}

	public void ShowThreeDialogPopUp(string title, string description, Action yesAction, Action noAction, Action cancelAction)
	{
		UnityEngine.Object.Instantiate(threeDialogView, base.transform, worldPositionStays: false).Initialize(title, description, yesAction, noAction, cancelAction);
	}

	public void ShowThreeDialogPopUpWithMoreInfo(string title, string description, Action yesAction, Action moreInfoAction, Action noAction)
	{
		UnityEngine.Object.Instantiate(threeDialogView, base.transform, worldPositionStays: false).InitializeWithMoreInfo(title, description, yesAction, moreInfoAction, noAction);
	}

	public void ShowDialogInputfieldPopUp(string title, string description, string placeholder, Action<string> yesAction, Action noAction)
	{
		UnityEngine.Object.Instantiate(dialogInputfieldView, base.transform, worldPositionStays: false).Initialize(title, description, placeholder, yesAction, noAction);
	}

	public void ShowDialogPlayerSellTypePopUp(Player player, Action<int> okAction, bool forcedSell)
	{
		string title = LanguageController.instance.Get_Translation(player.GetName() ?? "");
		string[] optionDescriptions = new string[2]
		{
			LanguageController.instance.Get_Translation("PLAYER_SELL_OPTION_TEAM", player.BestOfferTeam.Name, Util.MoneyString(player.BestOfferValue)),
			LanguageController.instance.Get_Translation("PLAYER_SELL_OPTION_AUCTION")
		};
		ShowDialogSelectionPopUp(title, optionDescriptions, okAction, forcedSell);
	}

	private void ShowDialogSelectionPopUp(string title, string[] optionDescriptions, Action<int> okAction, bool noCancelButton = false, Action cancelAction = null)
	{
		UnityEngine.Object.Instantiate(dialogSelectionView, base.transform, worldPositionStays: false).Initialize(title, optionDescriptions, okAction, noCancelButton, cancelAction);
	}

	public void ShowInfoPopUp(string description, Action okAction)
	{
		ShowInfoPopUp(null, description, okAction);
	}

	public void ShowInfoPopUp(string title, string description, Action okAction)
	{
		ShowDialogPopUp(title, description, okAction);
	}

	public void ShowTeamsFileInfoPopUp(string countriesString)
	{
		string text = LanguageController.instance.Get_Translation("ID:FILE_TITLE");
		string text2 = LanguageController.instance.Get_Translation("ID:FILE_AUTHOR");
		string text3 = LanguageController.instance.Get_Translation("ID:FILE_EMAIL");
		string text4 = LanguageController.instance.Get_Translation("ID:FILE_WEBSITE");
		string text5 = LanguageController.instance.Get_Translation("ID:FILE_DESCRIPTION");
		string arg = LanguageController.instance.Get_Translation("ID:FILE_DATE");
		List<string> countryCodes = countriesString.Split(',').ToList();
		List<DbCountries.DbCountry> countries = LoadAndSavingTeams.instance.countries.allCountries.FindAll((DbCountries.DbCountry country) => countryCodes.Contains(country.code));
		string text6 = "";
		if (dbTeamsUpdate.fileTitle != "")
		{
			text6 = text + ": " + dbTeamsUpdate.fileTitle;
		}
		if (dbTeamsUpdate.fileAuthor != "")
		{
			text6 = text6 + "\n" + text2 + ": " + dbTeamsUpdate.fileAuthor;
		}
		if (dbTeamsUpdate.fileEmail != "")
		{
			text6 = text6 + "\n" + text3 + ": " + dbTeamsUpdate.fileEmail;
		}
		if (dbTeamsUpdate.fileWebsite != "")
		{
			text6 = text6 + "\n" + text4 + ": " + dbTeamsUpdate.fileWebsite;
		}
		if (dbTeamsUpdate.fileDescription != "")
		{
			text6 = text6 + "\n" + text5 + ": " + dbTeamsUpdate.fileDescription;
		}
		text6 += $"\n{arg}: {dbTeamsUpdate.FileDate.Date:dd-MMM-yyyy}";
		UnityEngine.Object.Instantiate(packageLoadedPopUp, base.transform, worldPositionStays: false).Initialize(dbTeamsUpdate, countries, delegate
		{
			ShowConflictTeamsView(null, calledInAnyView: true);
		});
	}

	public void ShowToastMessage(string message, float positionYfromBottom = 240f, float timetoHide = 4f, params object[] list)
	{
		string message2 = LanguageController.instance.Get_Translation(message, list);
		UnityEngine.Object.Instantiate(toastMessagePrefab, base.transform, worldPositionStays: false).Initialize(message2, positionYfromBottom, timetoHide);
	}
}
