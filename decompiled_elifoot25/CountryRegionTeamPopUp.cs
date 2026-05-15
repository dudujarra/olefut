using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class CountryRegionTeamPopUp : EliView
{
	public enum Type
	{
		Country,
		Region,
		Team
	}

	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbCountries countries;

	public Text title;

	public InputField searchField;

	public Transform list;

	public GameObject prefab;

	private Type searchingType;

	private Type viewState;

	private EditTeamPrefab editTeamPrefab;

	private EditPlayerPrefab editPlayerPrefab;

	private int countryIndex;

	private int teamTransferIndex;

	private bool transferingPlayer;

	public void InitializedByEditTeam(Type type, EditTeamPrefab editTeam, int countryindex = -1)
	{
		editTeamPrefab = editTeam;
		Initialize(type, countryindex);
	}

	public void InitializedByEditPlayer(Type type, EditPlayerPrefab editPlayer, bool transferingPlayer, int countryindex = -1)
	{
		editPlayerPrefab = editPlayer;
		this.transferingPlayer = transferingPlayer;
		Initialize(type, countryindex);
	}

	private void Initialize(Type type, int countryindex = -1)
	{
		if (DataManager.instance.dbTeamsMode == DataManager.DbTeamsMode.PackageMode)
		{
			teams = teamsPackage;
		}
		searchingType = type;
		if (searchingType == Type.Country || searchingType == Type.Team)
		{
			BuildCountries();
		}
		else if (searchingType == Type.Region)
		{
			BuildRegions(countryindex);
		}
	}

	public override void ResetView()
	{
		base.ResetView();
		UpdateBackAndTitleAndSearch();
		if (viewState == Type.Country)
		{
			BuildCountries();
		}
	}

	private void BuildCountries()
	{
		viewState = Type.Country;
		UpdateBackAndTitleAndSearch();
		DestroyListPrefabs();
		List<(DbCountries.DbCountry, int, string, string, int)> countriesSorted = countries.GetCountriesSorted(!transferingPlayer);
		for (int i = 0; i < countriesSorted.Count; i++)
		{
			int countryindex = countriesSorted[i].Item2;
			UnityEngine.Object.Instantiate(prefab, list).GetComponent<CountryRegionTeamPrefab>().Initialize(countries.allCountries[countriesSorted[i].Item2].Flag, Color.white, countriesSorted[i].Item3, delegate
			{
				CountrySelected(countryindex);
			});
		}
	}

	private void BuildRegions(int countryindex)
	{
		countryIndex = countryindex;
		viewState = Type.Region;
		UpdateBackAndTitleAndSearch();
		DestroyListPrefabs();
		for (int i = 0; i < countries.allCountries[countryindex].regions.Count; i++)
		{
			DbCountries.DbRegion dbRegion = countries.allCountries[countryindex].regions[i];
			if (!transferingPlayer || dbRegion.numberOfTeams != 0)
			{
				int regionIndex = i;
				UnityEngine.Object.Instantiate(prefab, list).GetComponent<CountryRegionTeamPrefab>().Initialize(dbRegion.Flag, Color.white, dbRegion.fullName, delegate
				{
					RegionSelected(countryindex, regionIndex);
				});
			}
		}
	}

	private void BuildTeams(int countryindex, int regionIndex)
	{
		countryIndex = countryindex;
		viewState = Type.Team;
		UpdateBackAndTitleAndSearch();
		DestroyListPrefabs();
		List<(int, string)> teamsSorted = teams.GetTeamsSorted(countryindex, regionIndex, sortByLevel: false);
		for (int i = 0; i < teamsSorted.Count; i++)
		{
			(int index, string shortName) team = teamsSorted[i];
			Sprite logoOrShirt = teams.GetLogoOrShirt(team.index);
			Color logoOrShirtColor = teams.GetLogoOrShirtColor(team.index);
			UnityEngine.Object.Instantiate(prefab, list).GetComponent<CountryRegionTeamPrefab>().Initialize(logoOrShirt, logoOrShirtColor, team.shortName, delegate
			{
				TeamSelected(team.index);
			});
		}
	}

	private void DestroyListPrefabs()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			UnityEngine.Object.Destroy(list.GetChild(i).gameObject);
		}
		searchField.text = "";
	}

	public void CountrySelected(int countryindex)
	{
		DbCountries.DbCountry dbCountry = countries.allCountries[countryindex];
		if (searchingType == Type.Country || searchingType == Type.Region)
		{
			if (editTeamPrefab != null)
			{
				if (dbCountry.regions.Count > 0)
				{
					BuildRegions(countryindex);
					return;
				}
				editTeamPrefab.SelectedCountryAndRegion(countryindex);
				UnityEngine.Object.Destroy(base.gameObject);
			}
			else if (editPlayerPrefab != null)
			{
				editPlayerPrefab.SelectedCountry(countryindex);
				UnityEngine.Object.Destroy(base.gameObject);
			}
		}
		else if (dbCountry.canSearchByRegion)
		{
			BuildRegions(countryindex);
		}
		else
		{
			BuildTeams(countryindex, -1);
		}
	}

	public void RegionSelected(int countryindex, int regionIndex)
	{
		if (searchingType == Type.Country || searchingType == Type.Region)
		{
			editTeamPrefab.SelectedCountryAndRegion(countryindex, regionIndex);
			UnityEngine.Object.Destroy(base.gameObject);
		}
		else
		{
			BuildTeams(countryindex, regionIndex);
		}
	}

	public void TeamSelected(int teamIndex)
	{
		teamTransferIndex = teamIndex;
		string description = LanguageController.instance.Get_Translation("EDITOR_TRANSFER_CONFIRM", editPlayerPrefab.playerNameField.text, teams.AllTeams[teamIndex].shortName);
		ScreenController.instance.ShowDialogPopUp("ID:EDITOR_TRANSFER_TITLE", description, TeamSelected_YES, null);
	}

	public void TeamSelected_YES()
	{
		editPlayerPrefab.TransferSelectedTeam(teamTransferIndex);
		UnityEngine.Object.Destroy(base.gameObject);
		string description = LanguageController.instance.Get_Translation("EDITOR_TRANSFER_COMPLETED", editPlayerPrefab.playerNameField.text, teams.AllTeams[teamTransferIndex].shortName);
		ScreenController.instance.ShowDialogPopUp("ID:EDITOR_TRANSFER_TITLE", description, null);
	}

	public void SearchField()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			if (searchField.text == "" || list.GetChild(i).GetComponent<CountryRegionTeamPrefab>().nameText.text.ToLower().Contains(searchField.text.ToLower()))
			{
				list.GetChild(i).gameObject.SetActive(value: true);
			}
			else
			{
				list.GetChild(i).gameObject.SetActive(value: false);
			}
		}
	}

	private void UpdateBackAndTitleAndSearch()
	{
		switch (viewState)
		{
		case Type.Country:
			if (searchingType == Type.Country || searchingType == Type.Region)
			{
				title.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_COUNTRY");
			}
			else
			{
				title.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_TEAM_COUNTRY");
			}
			searchField.placeholder.GetComponent<Text>().text = LanguageController.instance.Get_Translation("EDITOR_SEARCH_COUNTRY");
			break;
		case Type.Region:
		{
			string text = LanguageController.instance.Get_Translation(countries.allCountries[countryIndex].regionLabel);
			if (searchingType == Type.Region)
			{
				title.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_REGION", text);
			}
			else
			{
				title.text = LanguageController.instance.Get_Translation("EDITOR_SEARCH_TEAM_IN_REGION", text);
			}
			searchField.placeholder.GetComponent<Text>().text = LanguageController.instance.Get_Translation("EDITOR_SEARCH_REGION", text);
			break;
		}
		case Type.Team:
			title.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_TEAM");
			searchField.placeholder.GetComponent<Text>().text = "EDITOR_SEARCH_TEAM";
			break;
		default:
			throw new NotFiniteNumberException($"CountryRegionTeamPopUp.UpdateBackAndTitleAndSearch, viewState={viewState}");
		}
	}

	public void Back()
	{
		if (viewState == Type.Country)
		{
			Close();
		}
		else if (viewState == Type.Region)
		{
			BuildCountries();
		}
		else if (viewState == Type.Team)
		{
			if (countries.allCountries[countryIndex].canSearchByRegion)
			{
				BuildRegions(countryIndex);
			}
			else
			{
				BuildCountries();
			}
		}
	}
}
