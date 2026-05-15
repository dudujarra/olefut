using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

public class LeaguesPopUp : EliView
{
	[Header("View")]
	public Toggle selectAllToggle;

	public AddOnValueChangedGraphics selectAllToggleAddOns;

	public GameObject selectAllSomeCheck;

	[Space]
	public Transform list;

	public LeaguePrefab prefab;

	public Text totalCountriesAndTeams;

	[Space]
	public Text textNationalLeagueTeamsPerDivision;

	public Slider sliderNationalLeagueTeamsPerDivision;

	public Text textNationalLeagueNumDivisions;

	public Slider sliderNationalLeagueNumDivisions;

	[Space]
	public GameObject superLeagueOptionsObject;

	public Text textSuperLeagueTeamsPerDivision;

	public Slider sliderSuperLeagueTeamsPerDivision;

	public Text textSuperLeagueNumDivisions;

	public Slider sliderSuperLeagueNumDivisions;

	[Space]
	public Toggle RegionalLeagueToggle;

	public Toggle InternationalLeagueToggle;

	public Toggle SuperLeagueToggle;

	[Header("Data")]
	public DbCountries dbCountries;

	private MenuManager menuManager;

	private int totalCountriesCount;

	private int totalTeamsCount;

	public void Initialize(MenuManager menuManager)
	{
		this.menuManager = menuManager;
		FillList();
		ResetView();
		CalculateDivisionSliders();
		LoadElifootOptions();
	}

	public override void ResetView()
	{
		bool flag = CalculateCountriesAndTeams();
		selectAllToggle.SetIsOnWithoutNotify(flag);
		selectAllToggleAddOns.OnToggle(flag);
		selectAllSomeCheck.SetActive(!flag && totalCountriesCount > 0);
		totalCountriesAndTeams.text = LanguageController.instance.Get_Translation("GEN_TEAMS_COUNTRIES_SELECTED", totalCountriesCount, totalTeamsCount);
	}

	private void FillList()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			UnityEngine.Object.Destroy(list.GetChild(i).gameObject);
		}
		selectAllToggle.gameObject.SetActive(value: false);
		for (int j = 0; j < dbCountries.allCountries.Count; j++)
		{
			DbCountries.DbCountry dbCountry = dbCountries.allCountries[j];
			if (dbCountry.numberOfTeamsValid > 0)
			{
				LeaguePrefab component = UnityEngine.Object.Instantiate(prefab, list).GetComponent<LeaguePrefab>();
				component.Initialize(dbCountry.Flag, dbCountry.Name, dbCountry.numberOfTeamsValid, j, dbCountry.code, ResetView, dbCountry.numberOfTeamsValid >= 2);
				component.CheckAlertStatus(Calendars.divisionConfigurations[(int)sliderNationalLeagueTeamsPerDivision.value]);
				selectAllToggle.gameObject.SetActive(dbCountry.numberOfTeamsValid >= 2);
			}
		}
	}

	private bool CalculateCountriesAndTeams()
	{
		totalCountriesCount = 0;
		totalTeamsCount = 0;
		string text = "";
		bool result = true;
		for (int i = 0; i < list.childCount; i++)
		{
			LeaguePrefab component = list.GetChild(i).GetComponent<LeaguePrefab>();
			if (component.toggle.interactable)
			{
				if (component.toggle.isOn)
				{
					totalCountriesCount++;
					totalTeamsCount += dbCountries.allCountries[component.countryIndex].numberOfTeamsValid;
					text = text + dbCountries.allCountries[component.countryIndex].code + ";";
				}
				else
				{
					result = false;
				}
			}
		}
		ElifootOptions.newGameCountries = text;
		return result;
	}

	private void CalculateDivisionSliders()
	{
		DefineTeamsPerDivisionSlider(sliderNationalLeagueTeamsPerDivision, CompetitionType.NationalLeague, delegate
		{
			OnTeamsPerDivisionChanged(sliderNationalLeagueTeamsPerDivision, textNationalLeagueTeamsPerDivision, CompetitionType.NationalLeague);
		});
		DefineTeamsPerDivisionSlider(sliderSuperLeagueTeamsPerDivision, CompetitionType.SuperLeague, delegate
		{
			OnTeamsPerDivisionChanged(sliderSuperLeagueTeamsPerDivision, textSuperLeagueTeamsPerDivision, CompetitionType.SuperLeague);
		});
		DefineDivisionsNumberSlider(sliderNationalLeagueNumDivisions, textNationalLeagueNumDivisions, CompetitionType.NationalLeague);
		DefineDivisionsNumberSlider(sliderSuperLeagueNumDivisions, textSuperLeagueNumDivisions, CompetitionType.SuperLeague);
	}

	private void DefineTeamsPerDivisionSlider(Slider slider, CompetitionType competitionType, Action ActionOnChanged)
	{
		int num = 0;
		int[] divisionConfigurations = Calendars.divisionConfigurations;
		for (int i = 0; i < divisionConfigurations.Length && divisionConfigurations[i] < GamePermissions.minTeamsPerDivision; i++)
		{
			num++;
		}
		int num2 = Calendars.divisionConfigurations.Length - 1;
		int num3 = num;
		for (int j = num; j <= num2; j++)
		{
			if (Calendars.divisionConfigurations[j] == ElifootOptions.lastChoiceTeamsPerDivision[(int)competitionType])
			{
				num3 = j;
				break;
			}
		}
		slider.minValue = num;
		slider.maxValue = num2;
		slider.value = num3;
		ActionOnChanged();
	}

	private void DefineDivisionsNumberSlider(Slider slider, Text text, CompetitionType competitionType)
	{
		int num = ElifootOptions.numDivisionsLeagueMax[(int)competitionType];
		slider.minValue = ElifootOptions.numDivisionsLeagueMin[(int)competitionType];
		slider.maxValue = 10f;
		slider.value = num;
		text.text = num.ToString();
		ElifootOptions.numDivisionsLeagueMax[(int)competitionType] = num;
	}

	private void LoadElifootOptions()
	{
		ElifootOptions.ReadOptions();
		RegionalLeagueToggle.SetIsOnWithoutNotify(ElifootOptions.playRegionalLeagues);
		InternationalLeagueToggle.SetIsOnWithoutNotify(ElifootOptions.playInternationalLeagues);
		SuperLeagueToggle.SetIsOnWithoutNotify(ElifootOptions.playSuperLeague);
		superLeagueOptionsObject.SetActive(ElifootOptions.playSuperLeague);
		if (!string.IsNullOrEmpty(ElifootOptions.newGameCountries))
		{
			LoadPreviousCountriesSelected();
		}
	}

	private void LoadPreviousCountriesSelected()
	{
		string[] source = ElifootOptions.newGameCountries.Split(';');
		for (int i = 0; i < list.childCount; i++)
		{
			LeaguePrefab component = list.GetChild(i).GetComponent<LeaguePrefab>();
			component.toggle.SetIsOnWithoutNotify(source.Contains(component.countryCode));
			component.toggleAddOns.OnToggle(source.Contains(component.countryCode));
		}
		ResetView();
	}

	public void SelectAllCountries()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			LeaguePrefab component = list.GetChild(i).GetComponent<LeaguePrefab>();
			if (component.toggle.interactable)
			{
				component.toggle.SetIsOnWithoutNotify(selectAllToggle.isOn);
				component.toggleAddOns.OnToggle(selectAllToggle.isOn);
			}
		}
		ResetView();
	}

	public void OnTeamsPerDivisionNationalLeagueChanged()
	{
		OnTeamsPerDivisionChanged(sliderNationalLeagueTeamsPerDivision, textNationalLeagueTeamsPerDivision, CompetitionType.NationalLeague);
	}

	public void OnTeamsPerDivisionSuperLeagueChanged()
	{
		OnTeamsPerDivisionChanged(sliderSuperLeagueTeamsPerDivision, textSuperLeagueTeamsPerDivision, CompetitionType.SuperLeague);
	}

	private void OnTeamsPerDivisionChanged(Slider theSlider, Text theText, CompetitionType competitionType)
	{
		DataManager.instance.properties.divConfigIndex[(int)competitionType] = (int)theSlider.value;
		ElifootOptions.lastChoiceTeamsPerDivision[(int)competitionType] = DataManager.instance.TeamsPerDivision(competitionType);
		theText.text = ElifootOptions.lastChoiceTeamsPerDivision[(int)competitionType].ToString();
		SetAllAlertIcons();
	}

	private void SetAllAlertIcons()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			list.GetChild(i).GetComponent<LeaguePrefab>().CheckAlertStatus(Calendars.divisionConfigurations[(int)sliderNationalLeagueTeamsPerDivision.value]);
		}
	}

	public void OnDivisionsNumberChangedNationalLeague()
	{
		ElifootOptions.numDivisionsLeagueMax[0] = (int)sliderNationalLeagueNumDivisions.value;
		textNationalLeagueNumDivisions.text = ElifootOptions.numDivisionsLeagueMax[0].ToString();
	}

	public void OnDivisionsNumberChangedSuperLeague()
	{
		ElifootOptions.numDivisionsLeagueMax[7] = (int)sliderSuperLeagueNumDivisions.value;
		textSuperLeagueNumDivisions.text = ElifootOptions.numDivisionsLeagueMax[7].ToString();
	}

	public void PlayRegionalLeague()
	{
		ElifootOptions.playRegionalLeagues = RegionalLeagueToggle.isOn;
	}

	public void PlayInternationalLeague()
	{
		ElifootOptions.playInternationalLeagues = InternationalLeagueToggle.isOn;
	}

	public void PlaySuperLeague()
	{
		ElifootOptions.playSuperLeague = SuperLeagueToggle.isOn;
	}

	public void NoPressed()
	{
		Close();
	}

	public void YesPressed()
	{
		DataManager.instance.properties.playRegionalLeagues = ElifootOptions.playRegionalLeagues;
		DataManager.instance.properties.playInternationalLeagues = ElifootOptions.playInternationalLeagues;
		DataManager.instance.properties.playSuperLeague = ElifootOptions.playSuperLeague;
		if (GameIsPlayable())
		{
			ElifootOptions.lastChoiceTeamsPerDivision[0] = Calendars.divisionConfigurations[(int)sliderNationalLeagueTeamsPerDivision.value];
			ElifootOptions.lastChoiceTeamsPerDivision[7] = Calendars.divisionConfigurations[(int)sliderSuperLeagueTeamsPerDivision.value];
			ListOfParameters listOfParameters = null;
			ElifootOptions.ManageDivisionOptions(Util.ManageOption.WriteToCache, ref listOfParameters);
			ElifootOptions.SaveOptions();
			CheckExcludedCountries();
		}
		else
		{
			ScreenController.instance.ShowInfoPopUp("MENU_GAME_NOT_PLAYABLE", null);
		}
	}

	private bool GameIsPlayable()
	{
		bool flag = GamePermissions.allowed[(int)GamePermissions.Permissions.startAnyDivision];
		int num = Calendars.divisionConfigurations[(int)sliderNationalLeagueTeamsPerDivision.value] * (flag ? 1 : 2);
		int num2 = Calendars.divisionConfigurations[(int)sliderSuperLeagueTeamsPerDivision.value] * (flag ? 1 : 2);
		bool flag2 = false;
		int num3 = 0;
		int num4 = 0;
		for (int i = 0; i < list.childCount; i++)
		{
			LeaguePrefab component = list.GetChild(i).GetComponent<LeaguePrefab>();
			if (component.toggle.isOn && component.toggle.interactable)
			{
				int numberOfTeamsCount = component.numberOfTeamsCount;
				num3 += numberOfTeamsCount;
				num4++;
				flag2 = flag2 || numberOfTeamsCount >= num;
			}
		}
		if (DataManager.instance.properties.playSuperLeague)
		{
			bool flag3 = num3 >= num2 && num4 >= 2;
			return flag2 && flag3;
		}
		return flag2;
	}

	private bool NumberOfTeamsIsAcceptable(int numberOfTeams)
	{
		bool flag = GamePermissions.allowed[(int)GamePermissions.Permissions.startAnyDivision];
		return (flag && numberOfTeams >= Calendars.divisionConfigurations[(int)sliderNationalLeagueTeamsPerDivision.value]) | (!flag && numberOfTeams >= Calendars.divisionConfigurations[(int)sliderNationalLeagueTeamsPerDivision.value] * 2);
	}

	private void CheckExcludedCountries()
	{
		if (HasAnyAlertIcon())
		{
			ScreenController.instance.ShowLeagueAlertPopUp(GetIncludedCountries(), GetExcludedCountries(), PrepareNewGame);
		}
		else
		{
			PrepareNewGame();
		}
	}

	private bool HasAnyAlertIcon()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			LeaguePrefab component = list.GetChild(i).GetComponent<LeaguePrefab>();
			if (component.alertIcon.activeSelf && component.toggle.isOn)
			{
				return true;
			}
		}
		return false;
	}

	private List<DbCountries.DbCountry> GetIncludedCountries()
	{
		List<DbCountries.DbCountry> list = new List<DbCountries.DbCountry>();
		for (int i = 0; i < this.list.childCount; i++)
		{
			LeaguePrefab component = this.list.GetChild(i).GetComponent<LeaguePrefab>();
			if (CanChooseTeamsFromThisCountry(component))
			{
				list.Add(dbCountries.allCountries[component.countryIndex]);
			}
		}
		return list;
	}

	private List<DbCountries.DbCountry> GetExcludedCountries()
	{
		List<DbCountries.DbCountry> list = new List<DbCountries.DbCountry>();
		for (int i = 0; i < this.list.childCount; i++)
		{
			LeaguePrefab component = this.list.GetChild(i).GetComponent<LeaguePrefab>();
			if (CantChooseTeamsFromThisCountry(component))
			{
				list.Add(dbCountries.allCountries[component.countryIndex]);
			}
		}
		return list;
	}

	private bool CanChooseTeamsFromThisCountry(LeaguePrefab prefabScript)
	{
		if (prefabScript.toggle.isOn && prefabScript.toggle.interactable)
		{
			return !prefabScript.alertIcon.activeSelf;
		}
		return false;
	}

	private bool CantChooseTeamsFromThisCountry(LeaguePrefab prefabScript)
	{
		if (prefabScript.toggle.isOn && prefabScript.toggle.interactable)
		{
			return prefabScript.alertIcon.activeSelf;
		}
		return false;
	}

	private void PrepareNewGame()
	{
		Close();
		menuManager.StartCoroutine(DataManager.instance.NewGame(GetSelectedCountryIndexes()));
		Action a = DataManager.instance.StartUpNewGame;
		a = (Action)Delegate.Combine(a, new Action(ScreenController.instance.StartUpNewGame));
		DataManager.instance.ClearData();
		ScreenController.instance.ShowCoachesView(CoachManagerViewMode.NewGame, a);
	}

	private List<int> GetSelectedCountryIndexes()
	{
		List<int> list = new List<int>();
		for (int i = 0; i < this.list.childCount; i++)
		{
			LeaguePrefab component = this.list.GetChild(i).GetComponent<LeaguePrefab>();
			if (component.toggle.isOn && component.toggle.interactable)
			{
				list.Add(component.countryIndex);
			}
		}
		return list;
	}
}
