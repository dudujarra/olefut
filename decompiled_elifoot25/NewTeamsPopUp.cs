using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class NewTeamsPopUp : EliView
{
	public Text headerText;

	public Toggle selectAllToggle;

	public AddOnValueChangedGraphics selectAllToggleAddOns;

	public GameObject selectAllSomeCheck;

	public Text totalCountriesAndTeams;

	[Header("Countries & Regions List")]
	public GameObject countriesRegionsView;

	public Transform countriesRegionsList;

	public GameObject countryRegionPrefab;

	[Header("Teams List")]
	public GameObject teamsView;

	public Transform teamsList;

	public GameObject newTeamPrefab;

	[Header("Footer")]
	public GameObject backButton;

	[Header("Scripts")]
	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbTeams teamsUpdated;

	public DbCountries countries;

	public TeamInfoView teamInfoView;

	private int totalCountriesCount;

	private int totalTeamsCount;

	private int totalThingsSelectedCount;

	private int countryIndex;

	private int regionIndex;

	private Dictionary<int, bool> countriesSelected = new Dictionary<int, bool>();

	private Dictionary<(int, int), bool> regionsSelected = new Dictionary<(int, int), bool>();

	private List<LoadTeamsConflicts.TeamsResolution> teamsRes;

	private Action onClose;

	public void Initialize(Action onClose)
	{
		teamsRes = LoadTeamsConflicts.instance.teamsResolution;
		this.onClose = onClose;
		if (teamsRes.Count == 0)
		{
			ScreenController.instance.ShowInfoPopUp("EDITOR_TEAMS_UPDATED", null);
			teams.isFullyUpdated = true;
			teams.appVersion = Application.version;
			LoadAndSavingTeams.instance.RedoValidTeamFlags();
			LoadAndSavingTeams.instance.RedoNumberOfTeams(isUpdated: false);
			LoadAndSavingTeams.instance.SaveTeams();
			Close();
			return;
		}
		LoadAndSavingTeams.instance.RedoValidTeamFlags(isUpdated: true);
		string text = null;
		if (LoadAndSavingTeams.instance.isAppUpdate)
		{
			PreSelectCountriesAndRegions();
			text = "EDITOR_TEAMS_UPDATE_CONTENT";
		}
		else
		{
			LoadAndSavingTeams.instance.RedoNumberOfTeams(isUpdated: true);
			text = "EDITOR_TEAMS_FILE_CONTENT";
		}
		headerText.text = LanguageController.instance.Get_Translation(text);
		ResetView();
		Build_CountryView();
	}

	private void PreSelectCountriesAndRegions()
	{
		for (int i = 0; i < teamsRes.Count; i++)
		{
			if (teamsRes[i].status != LoadTeamsConflicts.TeamsResolution.Status.New && teamsRes[i].status != LoadTeamsConflicts.TeamsResolution.Status.Updated)
			{
				continue;
			}
			DbTeams.DbTeam dbTeam = teamsUpdated.AllTeams[teamsRes[i].teamsUpdateIndex];
			if (dbTeam.CountryIndex == -1)
			{
				break;
			}
			DbCountries.DbCountry dbCountry = countries.allCountries[dbTeam.CountryIndex];
			bool flag = false;
			if (dbCountry.preSelected)
			{
				flag = true;
			}
			else if (CanSearchByRegion(dbTeam.CountryIndex) && dbTeam.RegionIndex != -1)
			{
				if (dbTeam.RegionIndex == -1)
				{
					break;
				}
				if (dbCountry.regions[dbTeam.RegionIndex].preSelected)
				{
					flag = true;
				}
			}
			if (flag)
			{
				LoadTeamsConflicts.TeamsResolution value = teamsRes[i];
				value.isVerifiedToChange = true;
				teamsRes[i] = value;
			}
		}
	}

	public void SelectAll()
	{
		if (countriesRegionsView.activeSelf)
		{
			for (int i = 0; i < countriesRegionsList.childCount; i++)
			{
				NewTeamCountryRegionPrefab component = countriesRegionsList.GetChild(i).GetComponent<NewTeamCountryRegionPrefab>();
				if (component.toggle.interactable)
				{
					component.toggle.SetIsOnWithoutNotify(selectAllToggle.isOn);
					component.toggleAddOns.OnToggle(selectAllToggle.isOn);
					component.VerifyToggleState();
				}
			}
		}
		else if (teamsView.activeSelf)
		{
			for (int j = 0; j < teamsList.childCount; j++)
			{
				NewTeamPrefab component2 = teamsList.GetChild(j).GetComponent<NewTeamPrefab>();
				if (component2.toggle.interactable)
				{
					component2.toggle.SetIsOnWithoutNotify(selectAllToggle.isOn);
					component2.toggleAddOns.OnToggle(selectAllToggle.isOn);
					component2.ToggleVerified2();
				}
			}
		}
		ResetView();
	}

	public override void ResetView()
	{
		bool flag = CalculateCountriesAndTeams();
		selectAllToggle.SetIsOnWithoutNotify(flag);
		selectAllToggleAddOns.OnToggle(flag);
		selectAllSomeCheck.SetActive(!flag && totalThingsSelectedCount > 0);
		totalCountriesAndTeams.text = LanguageController.instance.Get_Translation("GEN_TEAMS_COUNTRIES_SELECTED", totalCountriesCount, totalTeamsCount);
	}

	private bool CalculateCountriesAndTeams()
	{
		totalCountriesCount = 0;
		totalTeamsCount = 0;
		totalThingsSelectedCount = 0;
		bool result = true;
		List<string> list = new List<string>();
		for (int i = 0; i < teamsRes.Count; i++)
		{
			LoadTeamsConflicts.TeamsResolution value = teamsRes[i];
			DbTeams.DbTeam dbTeam = teamsUpdated.AllTeams[value.teamsUpdateIndex];
			if (!value.isVerifiedToChange && value.status == LoadTeamsConflicts.TeamsResolution.Status.Same)
			{
				value.isVerifiedToChange = true;
				teamsRes[i] = value;
			}
			if (value.isVerifiedToChange)
			{
				totalTeamsCount++;
				if (!list.Contains(dbTeam.countryCode))
				{
					list.Add(dbTeam.countryCode);
				}
				if (countryIndex == -1 || (regionIndex == -1 && dbTeam.CountryIndex == countryIndex) || (dbTeam.CountryIndex == countryIndex && dbTeam.RegionIndex == regionIndex))
				{
					totalThingsSelectedCount++;
				}
			}
			else if (countryIndex == -1 || (regionIndex == -1 && dbTeam.CountryIndex == countryIndex) || (dbTeam.CountryIndex == countryIndex && dbTeam.RegionIndex == regionIndex))
			{
				result = false;
			}
		}
		totalCountriesCount = list.Count;
		return result;
	}

	private void CleanView(bool isTeams, bool isRegions, Transform list)
	{
		countriesRegionsView.SetActive(!isTeams);
		teamsView.SetActive(isTeams);
		selectAllToggle.gameObject.SetActive(isTeams || isRegions);
		for (int i = 0; i < list.childCount; i++)
		{
			UnityEngine.Object.Destroy(list.GetChild(i).gameObject);
		}
		backButton.SetActive(countryIndex != -1);
		ResetView();
	}

	private void Build_CountryView()
	{
		countryIndex = -1;
		CleanView(isTeams: false, isRegions: false, countriesRegionsList);
		List<(DbCountries.DbCountry, int, string, string, int)> countriesSorted = countries.GetCountriesSorted(countriesWithZeroTeams: false);
		for (int i = 0; i < countriesSorted.Count; i++)
		{
			int index = countriesSorted[i].Item2;
			UnityEngine.Object.Instantiate(countryRegionPrefab, countriesRegionsList).GetComponent<NewTeamCountryRegionPrefab>().Initialize(countries.allCountries[countriesSorted[i].Item2].Flag, countriesSorted[i].Item2, -1, countriesSorted[i].Item4, GetSelectedTeamsInCountry(index), countriesSorted[i].Item5, delegate
			{
				Build_RegionsView(index);
			}, ResetView);
		}
	}

	private int GetSelectedTeamsInCountry(int countryIndex)
	{
		int num = 0;
		for (int i = 0; i < teamsRes.Count; i++)
		{
			DbTeams.DbTeam dbTeam = teamsUpdated.AllTeams[teamsRes[i].teamsUpdateIndex];
			if (teamsRes[i].isVerifiedToChange && dbTeam.CountryIndex == countryIndex)
			{
				num++;
			}
		}
		return num;
	}

	private void Build_RegionsView(int countryIndex)
	{
		this.countryIndex = countryIndex;
		regionIndex = -1;
		CleanView(isTeams: false, isRegions: true, countriesRegionsList);
		DbCountries.DbCountry dbCountry = countries.allCountries[this.countryIndex];
		if (CanSearchByRegion(this.countryIndex))
		{
			for (int i = 0; i < dbCountry.regions.Count; i++)
			{
				DbCountries.DbRegion dbRegion = dbCountry.regions[i];
				if (dbRegion.numberOfTeams > 0)
				{
					int index = i;
					UnityEngine.Object.Instantiate(countryRegionPrefab, countriesRegionsList).GetComponent<NewTeamCountryRegionPrefab>().Initialize(dbRegion.Flag, this.countryIndex, i, dbRegion.fullName, GetSelectedTeamsInRegion(this.countryIndex, i), dbRegion.numberOfTeams, OnRegionClick(index), ResetView);
				}
			}
		}
		else
		{
			StartCoroutine(IOnRegionClick(-1));
		}
	}

	private Action OnRegionClick(int index)
	{
		return delegate
		{
			StartCoroutine(IOnRegionClick(index));
		};
	}

	private IEnumerator IOnRegionClick(int index)
	{
		ScreenController.instance.ShowLoadingView();
		yield return IBuild_TeamsView(index);
		ScreenController.instance.HideLoadingView();
	}

	private int GetSelectedTeamsInRegion(int countryIndex, int _regionIndex)
	{
		int num = 0;
		for (int i = 0; i < teamsRes.Count; i++)
		{
			DbTeams.DbTeam dbTeam = teamsUpdated.AllTeams[teamsRes[i].teamsUpdateIndex];
			if (teamsRes[i].isVerifiedToChange && dbTeam.CountryIndex == countryIndex && dbTeam.RegionIndex == _regionIndex)
			{
				num++;
			}
		}
		return num;
	}

	private IEnumerator IBuild_TeamsView(int regionSelectedIndex)
	{
		regionIndex = regionSelectedIndex;
		CleanView(isTeams: true, isRegions: false, teamsList);
		for (int i = 0; i < teamsRes.Count; i++)
		{
			DbTeams.DbTeam dbTeam = teamsUpdated.AllTeams[teamsRes[i].teamsUpdateIndex];
			if (dbTeam.CountryIndex == countryIndex && (dbTeam.RegionIndex == regionSelectedIndex || regionSelectedIndex == -1))
			{
				bool isVerifiedToChange = teamsRes[i].isVerifiedToChange;
				int teamResolutionIndex = i;
				NewTeamPrefab prefab = UnityEngine.Object.Instantiate(newTeamPrefab, teamsList).GetComponent<NewTeamPrefab>();
				prefab.Initialize(teamResolutionIndex, delegate
				{
					OpenConflictTeamInfoView(prefab);
				}, ResetView, isVerifiedToChange);
			}
			yield return null;
		}
	}

	private void OpenConflictTeamInfoView(NewTeamPrefab prefab)
	{
		UnityEngine.Object.Instantiate(teamInfoView, base.transform.parent).InitializeInConflitMode(prefab);
	}

	public void CloseButton()
	{
		ScreenController.instance.ShowDialogPopUp("CHANGES_DISCARD_TITLE", "CHANGES_DISCARD_TEXT", AppUpdatedDiscarded, null);
	}

	private void AppUpdatedDiscarded()
	{
		StartCoroutine(IAppUpdatedDiscarded());
	}

	private IEnumerator IAppUpdatedDiscarded()
	{
		ScreenController.instance.ShowLoadingView();
		yield return null;
		LoadAndSavingTeams.instance.AppUpdateDiscarded(IsAllDowngrade());
		yield return null;
		ScreenController.instance.HideLoadingView();
		yield return null;
		Close();
	}

	private bool IsAllDowngrade()
	{
		foreach (LoadTeamsConflicts.TeamsResolution teamsRe in teamsRes)
		{
			if (teamsRe.status != LoadTeamsConflicts.TeamsResolution.Status.Downgrade)
			{
				return false;
			}
		}
		return true;
	}

	public override void Close()
	{
		base.Close();
		LoadAndSavingTeams.instance.RedoNumberOfTeams(isUpdated: false);
		onClose?.Invoke();
	}

	public void Back()
	{
		if (teamsView.activeSelf)
		{
			if (regionIndex == -1)
			{
				Build_CountryView();
			}
			else
			{
				Build_RegionsView(countryIndex);
			}
		}
		else if (countriesRegionsView.activeSelf && countryIndex != -1)
		{
			Build_CountryView();
		}
		else
		{
			CloseButton();
		}
	}

	public void ConfirmChanges()
	{
		ScreenController.instance.ShowDialogPopUp("UPDATE_TEAMS_CONFIRM_TITLE", "UPDATE_TEAMS_CONFIRM_TEXT", UpdateSelectedTeams, null);
	}

	private void UpdateSelectedTeams()
	{
		StartCoroutine(IUpdateSelectedTeams());
	}

	private IEnumerator IUpdateSelectedTeams()
	{
		ScreenController.instance.ShowLoadingView();
		if (LoadAndSavingTeams.instance.isAppUpdate)
		{
			teams.isFullyUpdated = true;
		}
		for (int i = 0; i < teamsRes.Count; i++)
		{
			LoadTeamsConflicts.TeamsResolution teamsResolution = teamsRes[i];
			DbTeams.DbTeam dbTeam = teamsUpdated.AllTeams[teamsResolution.teamsUpdateIndex];
			if (teamsResolution.isVerifiedToChange)
			{
				DbTeams.DbTeam dbTeam2 = dbTeam;
				if (teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.New)
				{
					teams.AllTeams.Add(dbTeam2);
				}
				else if (teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Updated || teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Downgrade || teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Conflict)
				{
					DbTeams.DbTeam dbTeam3 = teams.AllTeams[teamsResolution.teamsIndex];
					if (!dbTeam2.PreviousTeamIDs.Contains(dbTeam3.teamID))
					{
						dbTeam2.PreviousTeamIDs.Add(dbTeam3.teamID);
					}
					foreach (string previousTeamID in dbTeam3.PreviousTeamIDs)
					{
						if (!dbTeam2.PreviousTeamIDs.Contains(previousTeamID))
						{
							dbTeam2.PreviousTeamIDs.Add(previousTeamID);
						}
					}
					Sprite logo = dbTeam3.Logo;
					try
					{
						if (logo != null)
						{
							Texture2D tex = Util.DecompressTexture(logo.texture);
							if (dbTeam2.Logo == null)
							{
								dbTeam2.savedLogoBytes = tex.EncodeToPNG();
							}
							else if (dbTeam2.savedLogoBytes.Length == 0)
							{
								dbTeam2.savedLogoBytes = tex.EncodeToPNG();
							}
						}
					}
					catch (Exception)
					{
						Debug.LogWarning("NewTeamsPopUp.ConfirmChangesYes(): Old logo sprite was destroyed, skipping logo encoding.");
					}
					teams.AllTeams[teamsResolution.teamsIndex] = dbTeam2;
				}
				if (teamsResolution.oldTeamsIndex != -1)
				{
					DbTeams.DbTeam value = teams.AllTeams[teamsResolution.oldTeamsIndex];
					value.PreviousTeamIDs.Add(value.teamID);
					value.teamID = Guid.NewGuid().ToString();
					teams.AllTeams[teamsResolution.oldTeamsIndex] = value;
				}
				RecordPreSelectedCountryAndRegion(dbTeam.CountryIndex, dbTeam.RegionIndex);
			}
			else if (LoadAndSavingTeams.instance.isAppUpdate)
			{
				RemovePreSelectedCountryRegion(dbTeam.CountryIndex, dbTeam.RegionIndex);
				teams.isFullyUpdated = false;
			}
			yield return null;
		}
		SavePreSelectedCountryAndRegion();
		teams.appVersion = Application.version;
		teams.AllTeams.Sort((DbTeams.DbTeam team1, DbTeams.DbTeam team2) => team1.shortName.CompareTo(team2.shortName));
		LoadAndSavingTeams.instance.RedoValidTeamFlags();
		LoadAndSavingTeams.instance.RedoNumberOfTeams(isUpdated: false);
		LoadAndSavingTeams.instance.SaveTeams();
		ScreenController.instance.HideLoadingView();
		Close();
	}

	private void RecordPreSelectedCountryAndRegion(int countryIndex, int regionIndex)
	{
		if (!countriesSelected.ContainsKey(countryIndex))
		{
			countriesSelected.Add(countryIndex, value: true);
		}
		if (CanSearchByRegion(countryIndex) && regionIndex != -1 && !regionsSelected.ContainsKey((countryIndex, regionIndex)))
		{
			regionsSelected.Add((countryIndex, regionIndex), value: true);
		}
	}

	private void RemovePreSelectedCountryRegion(int countryIndex, int regionIndex)
	{
		if (!countriesSelected.ContainsKey(countryIndex))
		{
			countriesSelected.Add(countryIndex, value: false);
		}
		else
		{
			countriesSelected[countryIndex] = false;
		}
		if (regionIndex != -1 && CanSearchByRegion(countryIndex))
		{
			if (!regionsSelected.ContainsKey((countryIndex, regionIndex)))
			{
				regionsSelected.Add((countryIndex, regionIndex), value: false);
			}
			else if (regionsSelected.ContainsKey((countryIndex, regionIndex)))
			{
				regionsSelected[(countryIndex, regionIndex)] = false;
			}
		}
	}

	private void SavePreSelectedCountryAndRegion()
	{
		foreach (KeyValuePair<int, bool> item in countriesSelected)
		{
			if (item.Key != -1)
			{
				DbCountries.DbCountry value = countries.allCountries[item.Key];
				value.preSelected = item.Value;
				countries.allCountries[item.Key] = value;
			}
		}
		foreach (KeyValuePair<(int, int), bool> item2 in regionsSelected)
		{
			if (item2.Key.Item1 == -1)
			{
				continue;
			}
			int num = -1;
			if (item2.Key.Item2 != -1)
			{
				num = item2.Key.Item2;
				if (num != -1)
				{
					DbCountries.DbRegion value2 = countries.allCountries[item2.Key.Item1].regions[num];
					value2.preSelected = item2.Value;
					countries.allCountries[item2.Key.Item1].regions[item2.Key.Item2] = value2;
				}
			}
		}
	}

	private bool CanSearchByRegion(int countryIndex)
	{
		DbCountries.DbCountry dbCountry = countries.allCountries[countryIndex];
		if (dbCountry.canSearchByRegion)
		{
			return dbCountry.regions.Count > 0;
		}
		return false;
	}
}
