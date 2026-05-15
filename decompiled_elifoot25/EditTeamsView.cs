using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using EditorView;
using UnityEngine;
using UnityEngine.UI;

public class EditTeamsView : EliView
{
	[Header("Data")]
	public DbTeams teamsBase;

	public DbTeams teamsUpdate;

	public DbTeams teamsPackage;

	public DbCountries countries;

	[Header("CountriesView")]
	public GameObject countriesView;

	public Transform countriesScroll;

	public GameObject countryPrefab;

	[Header("RegionsView")]
	public GameObject regionsView;

	public Transform regionsScroll;

	public GameObject regionPrefab;

	[Header("TeamsView")]
	public GameObject teamsView;

	public InputField searchField;

	public GameObject cleanSearchButton;

	public ToggleGroup orderByToggleGroup;

	public Toggle orderByLevelToggle;

	public Toggle orderAButton;

	public Transform teamsScroll;

	public GameObject teamPrefab;

	[Header("File Browsing things")]
	public MyFileBrowserController fileBrowserPrefab;

	public GameObject newTeamsPopUp;

	[Header("Header")]
	public Text HeaderText;

	public GameObject CallAppUpdateButton;

	[Header("Footer")]
	public GameObject defaultbuttons;

	public GameObject sharingbuttons;

	public GameObject loadButton;

	public GameObject createPackagesButton;

	public GameObject shareOKButton;

	public GameObject sortButton;

	[SerializeField]
	private Button shareButton;

	[SerializeField]
	private Button shareOkButton;

	[Header("Warnings")]
	public GameObject invalidTeamsDetectedWarning;

	public Text invalidTeamsDetectedWarningMessage;

	[Header("PopUps")]
	public TeamInfoView teamInfoView;

	public EditTeamPrefab editTeamPrefab;

	public SharedFilePopUp sharedFilePopUpPrefab;

	[Header("Special packages")]
	[SerializeField]
	private bool europeBest = true;

	[SerializeField]
	private int europeBestTeamsPerCountry = 3;

	public NativeShare nativeShare;

	private int countryIndex;

	private int regionIndex;

	private DialogPopUpView dialogViewInstantiate;

	private bool reloadRegions;

	private bool reloadCountries;

	private bool invalidCountryTeamsDetected;

	private bool invalidRegionsTeamsDetected;

	public bool autoCreatePackages;

	public string autoCreateFileTitle;

	public string autoCreateFileDescription;

	public string autoCreateFileName;

	public string autoCreatePackageContent;

	private List<int> teamSelectedIDs = new List<int>();

	private static readonly float BUILD_PACKAGE_WAIT_TIME = 0.1f;

	private int packagesCounter;

	private GridLayoutGroup countriesGridLayoutGroup;

	private List<CountryPrefab> countryPrefabs;

	private GridLayoutGroup regionsGridLayoutGroup;

	private List<RegionPrefab> regionPrefabs;

	private List<TeamPrefab> teamPrefabs;

	private HorizontalLayoutGroup footerLayoutGroup;

	private void Awake()
	{
		footerLayoutGroup = defaultbuttons.GetComponent<HorizontalLayoutGroup>();
		countriesGridLayoutGroup = countriesScroll.GetComponent<GridLayoutGroup>();
		regionsGridLayoutGroup = regionsScroll.GetComponent<GridLayoutGroup>();
	}

	private void Start()
	{
		if (DataManager.instance.dbTeamsMode == DataManager.DbTeamsMode.PackageMode)
		{
			teamsBase = teamsPackage;
		}
		countryIndex = -1;
		regionIndex = -1;
		if (LoadAndSavingTeams.instance.ShowAppUpdateButtonNotification())
		{
			CallAppUpdateButton.GetComponent<EliButton>().ShowButtonNotification("1");
		}
		Build_CountriesView();
	}

	private void HideInvalidTeamsWarning()
	{
		invalidTeamsDetectedWarning.SetActive(value: false);
	}

	private void Build_CountriesView()
	{
		reloadCountries = false;
		countriesView.SetActive(value: true);
		regionsView.SetActive(value: false);
		teamsView.SetActive(value: false);
		UpdateHeaderFooter();
		InstantiateCountries();
	}

	private void InstantiateCountries()
	{
		for (int i = 0; i < countriesScroll.childCount; i++)
		{
			UnityEngine.Object.Destroy(countriesScroll.GetChild(i).gameObject);
		}
		HideInvalidTeamsWarning();
		invalidCountryTeamsDetected = false;
		countryPrefabs = new List<CountryPrefab>();
		List<(DbCountries.DbCountry, int, string, string, int)> countriesSorted = countries.GetCountriesSorted(countriesWithZeroTeams: false);
		for (int j = 0; j < countriesSorted.Count; j++)
		{
			(DbCountries.DbCountry, int, string, string, int) tuple = countriesSorted[j];
			Sprite countryFlag = countries.GetCountryFlag(tuple.Item2);
			bool hasInvalidTeams = countries.allCountries[tuple.Item2].hasInvalidTeams;
			CountryPrefab component = UnityEngine.Object.Instantiate(countryPrefab, countriesScroll).GetComponent<CountryPrefab>();
			countryPrefabs.Add(component);
			component.Initialize(tuple.Item1, countryFlag, tuple.Item3, tuple.Item4, tuple.Item2, tuple.Item5.ToString(), hasInvalidTeams, Build_RegionsView);
			if (hasInvalidTeams)
			{
				ShowInvalidTeamsWarningOnCountries();
			}
		}
		OnRectTransformDimensionsChange();
	}

	private void ShowInvalidTeamsWarningOnCountries()
	{
		invalidCountryTeamsDetected = true;
		invalidTeamsDetectedWarning.SetActive(value: true);
		invalidTeamsDetectedWarningMessage.text = LanguageController.instance.Get_Translation("ERROR_INVALID_TEAMS_COUNTRY");
	}

	public void Build_RegionsView(int countrySelectedIndex)
	{
		reloadRegions = false;
		countryIndex = countrySelectedIndex;
		countriesView.SetActive(value: false);
		regionsView.SetActive(value: true);
		DbCountries.DbCountry dbCountry = countries.allCountries[countryIndex];
		if (dbCountry.canSearchByRegion && dbCountry.regions.Count > 0)
		{
			UpdateHeaderFooter();
			for (int i = 0; i < regionsScroll.childCount; i++)
			{
				UnityEngine.Object.Destroy(regionsScroll.GetChild(i).gameObject);
			}
			HideInvalidTeamsWarning();
			invalidRegionsTeamsDetected = false;
			regionPrefabs = new List<RegionPrefab>();
			for (int j = 0; j < dbCountry.regions.Count; j++)
			{
				DbCountries.DbRegion dbRegion = dbCountry.regions[j];
				if (dbRegion.numberOfTeams != 0)
				{
					Sprite regionFlag = countries.GetRegionFlag(countryIndex, j);
					RegionPrefab component = UnityEngine.Object.Instantiate(regionPrefab, regionsScroll).GetComponent<RegionPrefab>();
					regionPrefabs.Add(component);
					component.Initialize(regionFlag, dbRegion.code, dbRegion.fullName, j, dbRegion.numberOfTeams.ToString(), dbRegion.hasInvalidTeams, Build_TeamsView);
					if (dbRegion.hasInvalidTeams)
					{
						ShowInvalidTeamsWarningOnRegions();
					}
				}
			}
			OnRectTransformDimensionsChange();
		}
		else
		{
			Build_TeamsView(-1);
		}
	}

	private void ShowInvalidTeamsWarningOnRegions()
	{
		invalidRegionsTeamsDetected = true;
		invalidTeamsDetectedWarning.SetActive(value: true);
		invalidTeamsDetectedWarningMessage.text = LanguageController.instance.Get_Translation("ERROR_INVALID_TEAMS_REGION", LanguageController.instance.Get_Translation(countries.allCountries[countryIndex].regionLabel));
	}

	public void Build_TeamsView(int regionSelectedIndex)
	{
		regionIndex = regionSelectedIndex;
		regionsView.SetActive(value: false);
		teamsView.SetActive(value: true);
		CleanSearch();
		UpdateHeaderFooter();
		BuildTeams();
	}

	public void BuildTeams()
	{
		for (int i = 0; i < teamsScroll.childCount; i++)
		{
			UnityEngine.Object.Destroy(teamsScroll.GetChild(i).gameObject);
		}
		HideInvalidTeamsWarning();
		StartCoroutine(BuildTeams2(orderBy: false));
	}

	private IEnumerator BuildTeams2(bool orderBy)
	{
		ScreenController.instance.ShowLoadingView();
		List<(int, string)> sortedTeamsIndexes = (orderByLevelToggle.isOn ? teamsBase.GetTeamsSorted(countryIndex, regionIndex, sortByLevel: true) : teamsBase.GetTeamsSorted(countryIndex, regionIndex, sortByLevel: false));
		teamPrefabs = new List<TeamPrefab>();
		for (int i = 0; i < sortedTeamsIndexes.Count; i++)
		{
			DbTeams.DbTeam dbTeam = teamsBase.AllTeams[sortedTeamsIndexes[i].Item1];
			Sprite logoOrShirt = teamsBase.GetLogoOrShirt(sortedTeamsIndexes[i].Item1);
			Color? standardShirtColor = ((dbTeam.Logo == null && dbTeam.usesStandardShirt) ? new Color?(dbTeam.backColor) : ((Color?)null));
			GameObject gameObject;
			if (!orderBy)
			{
				gameObject = UnityEngine.Object.Instantiate(teamPrefab, teamsScroll);
			}
			else
			{
				gameObject = teamsScroll.GetChild(i).gameObject;
				if (sharingbuttons.activeSelf && gameObject.GetComponent<SharedPrefab>().toggle.isOn)
				{
					teamSelectedIDs.Add(gameObject.GetComponent<TeamPrefab>().teamIndex);
				}
			}
			int item = sortedTeamsIndexes[i].Item1;
			TeamPrefab component = gameObject.GetComponent<TeamPrefab>();
			teamPrefabs.Add(component);
			component.Initialize(logoOrShirt, standardShirtColor, dbTeam.shortName, dbTeam.longName, dbTeam.level.ToString(), item, CallTeamInfoView);
			if (!teamsBase.AllTeams[item].isTeamValid)
			{
				ShowInvalidTeamsWarningOnTeams();
			}
			if (i % 10 == 0)
			{
				yield return new WaitForEndOfFrame();
			}
		}
		OnRectTransformDimensionsChange();
		ScreenController.instance.HideLoadingView();
	}

	internal override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		if ((float)(Screen.width / Screen.height) > 0.9f)
		{
			footerLayoutGroup.spacing = 100f;
		}
		else
		{
			footerLayoutGroup.spacing = 12f;
		}
		if (countriesView.activeSelf)
		{
			UpdateCountriesCellSize();
		}
		else if (regionsView.activeSelf)
		{
			UpdateRegionsCellSize();
		}
		else if (teamsView.activeSelf)
		{
			UpdateTeamsCellSize();
		}
	}

	private void UpdateTeamsCellSize()
	{
		if (teamPrefabs == null)
		{
			return;
		}
		if ((float)(Screen.width / Screen.height) > 0.9f)
		{
			foreach (TeamPrefab teamPrefab in teamPrefabs)
			{
				teamPrefab.SetTextSize(landscape: true);
			}
			return;
		}
		foreach (TeamPrefab teamPrefab2 in teamPrefabs)
		{
			teamPrefab2.SetTextSize(landscape: false);
		}
	}

	private void UpdateCountriesCellSize()
	{
		if ((float)(Screen.width / Screen.height) > 0.9f)
		{
			countriesGridLayoutGroup.cellSize = new Vector2(450f, 450f);
			if (countryPrefabs == null)
			{
				return;
			}
			{
				foreach (CountryPrefab countryPrefab in countryPrefabs)
				{
					countryPrefab.SetTextSize(landscape: true);
				}
				return;
			}
		}
		countriesGridLayoutGroup.cellSize = new Vector2(250f, 250f);
		if (countryPrefabs == null)
		{
			return;
		}
		foreach (CountryPrefab countryPrefab2 in countryPrefabs)
		{
			countryPrefab2.SetTextSize(landscape: false);
		}
	}

	private void UpdateRegionsCellSize()
	{
		if ((float)(Screen.width / Screen.height) > 0.9f)
		{
			regionsGridLayoutGroup.cellSize = new Vector2(450f, 450f);
			if (regionPrefabs == null)
			{
				return;
			}
			{
				foreach (RegionPrefab regionPrefab in regionPrefabs)
				{
					regionPrefab.SetTextSize(landscape: true);
				}
				return;
			}
		}
		regionsGridLayoutGroup.cellSize = new Vector2(250f, 250f);
		if (regionPrefabs == null)
		{
			return;
		}
		foreach (RegionPrefab regionPrefab2 in regionPrefabs)
		{
			regionPrefab2.SetTextSize(landscape: false);
		}
	}

	private void CallTeamInfoView(int teamindex, DbTeams teams)
	{
		base.enabled = false;
		UnityEngine.Object.Instantiate(teamInfoView, base.transform.parent).Initialize(teams.AllTeams[teamindex], CheckIfShouldRedraw);
	}

	private void ShowInvalidTeamsWarningOnTeams()
	{
		invalidTeamsDetectedWarning.SetActive(value: true);
		invalidTeamsDetectedWarningMessage.text = LanguageController.instance.Get_Translation("ERROR_INVALID_TEAM");
	}

	public void SearchTeam()
	{
		if (searchField.text == "")
		{
			cleanSearchButton.SetActive(value: false);
			for (int i = 0; i < teamsScroll.childCount; i++)
			{
				teamsScroll.GetChild(i).gameObject.SetActive(value: true);
			}
			return;
		}
		cleanSearchButton.SetActive(value: true);
		for (int j = 0; j < teamsScroll.childCount; j++)
		{
			if (teamsScroll.GetChild(j).GetComponent<TeamPrefab>().teamName.text.ToLower().Contains(searchField.text.ToLower()) || teamsScroll.GetChild(j).GetComponent<TeamPrefab>().teamLongName.text.ToLower().Contains(searchField.text.ToLower()))
			{
				teamsScroll.GetChild(j).gameObject.SetActive(value: true);
			}
			else
			{
				teamsScroll.GetChild(j).gameObject.SetActive(value: false);
			}
		}
	}

	public void CleanSearch()
	{
		searchField.text = "";
		cleanSearchButton.SetActive(value: false);
	}

	public void OrderBy()
	{
		teamSelectedIDs.Clear();
		StartCoroutine(BuildTeams2(orderBy: true));
		if (sharingbuttons.activeSelf)
		{
			for (int i = 0; i < teamsScroll.childCount; i++)
			{
				Transform child = teamsScroll.GetChild(i);
				int teamIndex = child.GetComponent<TeamPrefab>().teamIndex;
				child.GetComponent<SharedPrefab>().toggle.isOn = teamSelectedIDs.Contains(teamIndex);
			}
		}
		if (searchField.text != "")
		{
			SearchTeam();
		}
	}

	public void SortButtonClick()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		ManageSortOptions(Util.ManageOption.CreateParameter, ref listOfParameters);
		ScreenController.instance.ShowParameterEditor("ID:SORT_OPTIONS_TEAM", listOfParameters, OnSortOptionChosen, showLoadingView: false);
	}

	public void OnSortOptionChosen(ListOfParameters sortOptions)
	{
		ManageSortOptions(Util.ManageOption.ReadParameter, ref sortOptions);
		OrderBy();
	}

	private void ManageSortOptions(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		bool flag = !orderByLevelToggle.isOn;
		bool isOn = orderByLevelToggle.isOn;
		flag = (bool)Util.ManageOneOption(mode, "sortTeamsByName", "SORT_TEAM_BY_NAME", null, null, flag, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.RadioButton, EliParameterPermissions.EditablePublic);
		isOn = (bool)Util.ManageOneOption(mode, "sortTeamsByLevel", "SORT_TEAM_BY_VALUE", null, null, isOn, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.RadioButton, EliParameterPermissions.EditablePublic);
		orderByLevelToggle.isOn = isOn;
		orderAButton.isOn = !orderByLevelToggle.isOn;
		orderByLevelToggle.isOn = orderByLevelToggle.isOn;
	}

	public void AddButton()
	{
		base.enabled = false;
		UnityEngine.Object.Instantiate(editTeamPrefab, base.transform.parent).Initialize(-1, delegate
		{
			base.enabled = true;
		}, RedrawCurrentView, null, countryIndex, regionIndex);
	}

	public void OpenSharedFile()
	{
		base.enabled = false;
		UnityEngine.Object.Instantiate(fileBrowserPrefab, base.transform.parent).InitializeLoadSharedTeams(this, delegate
		{
			base.enabled = true;
		});
	}

	public void Share()
	{
		defaultbuttons.SetActive(value: false);
		sharingbuttons.SetActive(value: true);
		Transform transform = base.transform;
		if (countriesView.activeSelf)
		{
			HeaderText.text = LanguageController.instance.Get_Translation("EDITOR_SHARE_COUNTRY_TEAMS");
			transform = countriesScroll;
		}
		else if (regionsView.activeSelf)
		{
			HeaderText.text = LanguageController.instance.Get_Translation("EDITOR_SHARE_REGION_TEAMS");
			transform = regionsScroll;
		}
		else if (teamsView.activeSelf)
		{
			HeaderText.text = LanguageController.instance.Get_Translation("EDITOR_SHARE_TEAMS");
			transform = teamsScroll;
		}
		SharedPrefab[] componentsInChildren = transform.GetComponentsInChildren<SharedPrefab>();
		for (int i = 0; i < componentsInChildren.Length; i++)
		{
			componentsInChildren[i].ChangeModeToToggle();
		}
	}

	public void ShareTeams()
	{
		string description = null;
		teamsUpdate.Erase();
		if (countriesView.activeSelf)
		{
			List<int> list = new List<int>();
			for (int i = 0; i < countriesScroll.childCount; i++)
			{
				Transform child = countriesScroll.GetChild(i);
				if (child.GetComponent<SharedPrefab>().toggle.isOn)
				{
					list.Add(child.GetComponent<CountryPrefab>().countryIndex);
				}
			}
			for (int j = 0; j < teamsBase.AllTeams.Count; j++)
			{
				for (int k = 0; k < list.Count; k++)
				{
					if (teamsBase.AllTeams[j].CountryIndex == list[k])
					{
						teamsUpdate.AllTeams.Add(teamsBase.AllTeams[j]);
						break;
					}
				}
			}
			description = LanguageController.instance.Get_Translation("SHARE_NO_COUNTRY");
		}
		else if (regionsView.activeSelf)
		{
			List<int> list2 = new List<int>();
			for (int l = 0; l < regionsScroll.childCount; l++)
			{
				Transform child2 = regionsScroll.GetChild(l);
				if (child2.GetComponent<SharedPrefab>().toggle.isOn)
				{
					list2.Add(child2.GetComponent<RegionPrefab>().regionIndex);
				}
			}
			for (int m = 0; m < teamsBase.AllTeams.Count; m++)
			{
				for (int n = 0; n < list2.Count; n++)
				{
					if (teamsBase.AllTeams[m].CountryIndex == countryIndex && teamsBase.AllTeams[m].RegionIndex == list2[n])
					{
						teamsUpdate.AllTeams.Add(teamsBase.AllTeams[m]);
						break;
					}
				}
			}
			description = LanguageController.instance.Get_Translation("SHARE_NO_REGIONS", countries.allCountries[countryIndex].regionLabel);
		}
		else if (teamsView.activeSelf)
		{
			for (int num = 0; num < teamsScroll.childCount; num++)
			{
				Transform child3 = teamsScroll.GetChild(num);
				if (child3.GetComponent<SharedPrefab>().toggle.isOn)
				{
					teamsUpdate.AllTeams.Add(teamsBase.AllTeams[child3.GetComponent<TeamPrefab>().teamIndex]);
				}
			}
			description = LanguageController.instance.Get_Translation("SHARE_NO_TEAMS");
		}
		if (teamsUpdate.AllTeams.Count >= 1)
		{
			base.enabled = false;
			UnityEngine.Object.Instantiate(sharedFilePopUpPrefab, base.transform.parent).GetComponent<SharedFilePopUp>().Initialize(this);
		}
		else
		{
			dialogViewInstantiate = ScreenController.instance.ShowDialogPopUp("SHARE_TEAMS_EMPTY_TITLE", description, null);
		}
	}

	public void CloseSharing()
	{
		base.enabled = true;
		UpdateHeaderFooter();
		DefaultFooter();
		SharedPrefab[] componentsInChildren = (countriesView.activeSelf ? countriesScroll : (regionsView.activeSelf ? regionsScroll : teamsScroll)).GetComponentsInChildren<SharedPrefab>();
		for (int i = 0; i < componentsInChildren.Length; i++)
		{
			componentsInChildren[i].ChangeModeToButton();
		}
	}

	public void CheckIfShouldRedraw(bool shouldRedraw)
	{
		base.enabled = true;
		if (shouldRedraw)
		{
			RedrawCurrentView();
		}
	}

	public void RedrawCurrentView()
	{
		if (!(this == null))
		{
			base.enabled = true;
			if (countriesView.activeSelf)
			{
				Build_CountriesView();
			}
			else if (regionsView.activeSelf)
			{
				reloadCountries = true;
				Build_RegionsView(countryIndex);
			}
			else if (teamsView.activeSelf)
			{
				reloadCountries = (reloadRegions = true);
				Build_TeamsView(regionIndex);
			}
		}
	}

	public void SendingSharedTeams(string fileAuthor, string fileEmail, string fileWebsite, string fileName, string fileTitle, string fileDescription, string countryCodes, string regionCodes, string confederationCodes)
	{
		teamsUpdate.appVersion = teamsBase.appVersion;
		teamsUpdate.databaseVersion = teamsBase.databaseVersion;
		teamsUpdate.fileFormat = teamsBase.fileFormat;
		teamsUpdate.fileAuthor = fileAuthor;
		teamsUpdate.fileEmail = fileEmail;
		teamsUpdate.fileWebsite = fileWebsite;
		teamsUpdate.fileName = fileName;
		teamsUpdate.fileTitle = fileTitle;
		teamsUpdate.fileDescription = fileDescription;
		teamsUpdate.FileDate = DateTime.Now;
		teamsUpdate.teamsCount = teamsUpdate.AllTeams.Count;
		DbTeams.DbTeam dbTeam = teamsUpdate.AllTeams.OrderByDescending((DbTeams.DbTeam team) => team.teamVersion).FirstOrDefault();
		teamsUpdate.mostRecentTeamVersion = dbTeam.teamVersion;
		teamsUpdate.countryCodes = countryCodes;
		teamsUpdate.regionCodes = regionCodes;
		teamsUpdate.confederationCodes = confederationCodes;
		base.enabled = false;
		UnityEngine.Object.Instantiate(fileBrowserPrefab, base.transform.parent).InitializeShareTeams(this, delegate
		{
			base.enabled = true;
		});
	}

	public void Back()
	{
		if (dialogViewInstantiate != null)
		{
			if (dialogViewInstantiate.noButton.gameObject.activeSelf)
			{
				dialogViewInstantiate.NoPressed();
			}
			else if (dialogViewInstantiate.okButton.gameObject.activeSelf)
			{
				dialogViewInstantiate.OkPressed();
			}
		}
		else if (sharingbuttons.activeSelf)
		{
			CloseSharing();
		}
		else if (countriesView.activeSelf)
		{
			UnityEngine.Object.Destroy(base.gameObject);
		}
		else if (regionsView.activeSelf)
		{
			regionsView.SetActive(value: false);
			countryIndex = -1;
			if (reloadCountries)
			{
				Build_CountriesView();
			}
			else
			{
				countriesView.SetActive(value: true);
				if (invalidCountryTeamsDetected)
				{
					ShowInvalidTeamsWarningOnCountries();
				}
			}
		}
		else if (teamsView.activeSelf)
		{
			teamsView.SetActive(value: false);
			if (countries.allCountries[countryIndex].canSearchByRegion && countries.allCountries[countryIndex].regions.Count > 0)
			{
				if (reloadRegions)
				{
					Build_RegionsView(countryIndex);
				}
				else
				{
					regionsView.SetActive(value: true);
					if (invalidRegionsTeamsDetected)
					{
						ShowInvalidTeamsWarningOnRegions();
					}
				}
				regionIndex = -1;
			}
			else
			{
				if (reloadCountries)
				{
					Build_CountriesView();
				}
				else
				{
					countriesView.SetActive(value: true);
					if (invalidCountryTeamsDetected)
					{
						ShowInvalidTeamsWarningOnCountries();
					}
				}
				countryIndex = -1;
			}
		}
		UpdateHeaderFooter();
	}

	private IEnumerator CreateCountryPackages()
	{
		try
		{
			packagesCounter = 0;
			autoCreatePackages = true;
			if (europeBest)
			{
				yield return BestTeamsByConfederation("UEFA");
			}
			int numCountries = countriesScroll.childCount;
			for (int countryID = 0; countryID < numCountries; countryID++)
			{
				shareButton.onClick.Invoke();
				yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
				CountryPrefab countryPrefab = countriesScroll.GetChild(countryID).GetComponent<CountryPrefab>();
				SharedPrefab sharedPrefab = countryPrefab.GetComponent<SharedPrefab>();
				sharedPrefab.toggle.isOn = true;
				yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
				autoCreateFileTitle = countryPrefab.countryName.text;
				autoCreateFileDescription = countryPrefab.numberOfTeams.text + " equipas de " + countryPrefab.countryName.text;
				autoCreateFileName = countryPrefab.countryCode + " " + DateTime.Now.ToString("yyMM") + " PT";
				packagesCounter++;
				shareOkButton.onClick.Invoke();
				yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
				sharedPrefab.toggle.isOn = false;
				if (countryPrefab.dbCountry.canSearchByRegion && countryPrefab.dbCountry.packagesByRegion)
				{
					sharedPrefab.button.onClick.Invoke();
					yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
					int numRegions = regionsScroll.childCount;
					for (int regionIndex = 0; regionIndex < numRegions; regionIndex++)
					{
						shareButton.onClick.Invoke();
						yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
						RegionPrefab regionPrefab = regionsScroll.GetChild(regionIndex).GetComponent<RegionPrefab>();
						sharedPrefab = regionPrefab.GetComponent<SharedPrefab>();
						sharedPrefab.toggle.isOn = true;
						yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
						autoCreateFileTitle = countryPrefab.countryName.text + " - " + regionPrefab.regionName.text;
						autoCreateFileDescription = countryPrefab.numberOfTeams.text + " equipas de " + regionPrefab.regionName.text + " (" + countryPrefab.countryName.text + ")";
						autoCreateFileName = countryPrefab.countryCode + "-" + regionPrefab.regionCode + " " + DateTime.Now.ToString("yyMM") + " PT";
						packagesCounter++;
						shareOkButton.onClick.Invoke();
						yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
						sharedPrefab.toggle.isOn = false;
					}
					Back();
					yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
				}
			}
		}
		finally
		{
			EditTeamsView editTeamsView = this;
			editTeamsView.autoCreatePackages = false;
			string title = LanguageController.instance.Get_Translation("EDITOR_FILE_SAVED_TITLE");
			string description = LanguageController.instance.Get_Translation("EDITOR_FILE_SAVED_TEXT", editTeamsView.packagesCounter + " created", ElifootOptions.pathSharingTeams);
			ScreenController.instance.ShowDialogPopUp(title, description, null);
		}
		yield return 0;
	}

	private IEnumerator BestTeamsByConfederation(string confederation)
	{
		int numCountries = countriesScroll.childCount;
		List<TeamPrefabData> confederationBestTeams = new List<TeamPrefabData>();
		int teamsCount = 0;
		for (int countryID = 0; countryID < numCountries; countryID++)
		{
			CountryPrefab component = countriesScroll.GetChild(countryID).GetComponent<CountryPrefab>();
			Debug.Log($"Country {countryID}: {component.countryName.text} - Confederation: {component.dbCountry.confederationCode}");
			if (component.dbCountry.confederationCode.Contains(confederation))
			{
				component.GetComponent<SharedPrefab>().button.onClick.Invoke();
				yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
				List<TeamPrefab> list = new List<TeamPrefab>();
				for (int i = 0; i < teamsScroll.childCount; i++)
				{
					TeamPrefab component2 = teamsScroll.GetChild(i).GetComponent<TeamPrefab>();
					Debug.Log($"Country {countryID}: Team {i} = {component2.teamNameText} - {component2.Level.text}");
					list.Add(component2);
				}
				list.Distinct().ToList();
				List<TeamPrefab> list2 = list.OrderByDescending((TeamPrefab team) => int.TryParse(team.Level.text, out var result) ? result : 0).Take(3).Concat((from team in list.OrderByDescending((TeamPrefab team) => int.TryParse(team.Level.text, out var result) ? result : 0).Skip(3)
					where (int.TryParse(team.Level.text, out var result) ? result : 0) >= 90
					select team).Take(7))
					.ToList();
				for (int num = 0; num < list2.Count; num++)
				{
					TeamPrefabData teamPrefabData = new TeamPrefabData(list2[num]);
					Debug.Log($"Adding to bestTeams: {teamPrefabData.teamNameText}, Total Count: {confederationBestTeams.Count}");
					confederationBestTeams.Add(teamPrefabData);
					teamsCount++;
				}
				if (countryID < numCountries - 2)
				{
					Back();
					yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
				}
			}
		}
		for (int num2 = teamsScroll.childCount - 1; num2 >= 0; num2--)
		{
			UnityEngine.Object.Destroy(teamsScroll.GetChild(num2).gameObject);
		}
		for (int num3 = 0; num3 < confederationBestTeams.Count; num3++)
		{
			UnityEngine.Object.Instantiate(teamPrefab, teamsScroll).GetComponent<TeamPrefab>().Initialize(confederationBestTeams[num3]);
		}
		yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
		shareButton.onClick.Invoke();
		for (int num4 = 0; num4 < teamsScroll.childCount; num4++)
		{
			teamsScroll.GetChild(num4).GetComponent<SharedPrefab>().toggle.isOn = true;
		}
		yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
		autoCreateFileTitle = confederation + " Best Teams";
		autoCreateFileDescription = "3 best teams of each country + 7 teams with 90+ level";
		autoCreateFileName = autoCreateFileTitle + " " + DateTime.Now.ToString("yyMM") + " PT";
		autoCreatePackageContent = confederation + " Best";
		packagesCounter++;
		shareOkButton.onClick.Invoke();
		yield return new WaitForSeconds(BUILD_PACKAGE_WAIT_TIME);
		Back();
	}

	public void CreatePackagesButton()
	{
		StartCoroutine(CreateCountryPackages());
	}

	private void UpdateHeaderFooter()
	{
		if (countriesView.activeSelf)
		{
			HeaderText.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_COUNTRY");
			CallAppUpdateButton.SetActive(LoadAndSavingTeams.instance.HasAppUpdate() || !teamsBase.isFullyUpdated);
			DefaultFooter();
		}
		else if (regionsView.activeSelf)
		{
			if (countries.allCountries[countryIndex].regionLabel == "REGION_STATE")
			{
				HeaderText.text = LanguageController.instance.Get_Translation("REGION_STATE");
			}
			else if (countries.allCountries[countryIndex].regionLabel == "REGION_DISTRICT")
			{
				HeaderText.text = LanguageController.instance.Get_Translation("REGION_DISTRICT");
			}
			else if (countries.allCountries[countryIndex].regionLabel == "REGION")
			{
				HeaderText.text = LanguageController.instance.Get_Translation("REGION");
			}
			CallAppUpdateButton.SetActive(LoadAndSavingTeams.instance.HasAppUpdate() || !teamsBase.isFullyUpdated);
			DefaultFooter();
		}
		else if (teamsView.activeSelf)
		{
			HeaderText.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_TEAM");
			CallAppUpdateButton.SetActive(LoadAndSavingTeams.instance.HasAppUpdate() || !teamsBase.isFullyUpdated);
			DefaultFooter();
		}
		sortButton.SetActive(teamsView.activeSelf);
	}

	private void DefaultFooter()
	{
		defaultbuttons.SetActive(value: true);
		sharingbuttons.SetActive(value: false);
		sortButton.SetActive(value: false);
	}

	public void WarningMessageButton()
	{
		string description = LanguageController.instance.Get_Translation("TEAM_VALID_CRITERIA", 14, 50, 1, 10, DataManager.TEAM_INIT_SKILL_MIN, DataManager.TEAM_INIT_SKILL_MAX);
		ScreenController.instance.ShowScrollableTextView("ERROR_INVALID_TEAMS", description);
	}

	public void CallAppUpdate()
	{
		dialogViewInstantiate = ScreenController.instance.ShowDialogPopUp("EDITOR_TEAMS_UPDATE_TITLE", "EDITOR_TEAMS_UPDATE_PENDING", CallAppUpdateYES, null);
	}

	private void CallAppUpdateYES()
	{
		UnityEngine.Object.Destroy(base.gameObject, 0.1f);
		LoadAndSavingTeams.instance.DoAppUpdate();
	}

	public override void Update()
	{
		base.Update();
		if (Input.GetKeyDown(KeyCode.Escape))
		{
			Back();
		}
	}
}
