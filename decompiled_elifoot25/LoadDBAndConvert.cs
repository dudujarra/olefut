using System;
using System.Collections.Generic;
using UnityEngine;

public class LoadDBAndConvert : MonoBehaviour
{
	public DbTeams dbTeams;

	public DbTeams dbTeamsPackage;

	public DbCountries dbCountries;

	public DbConfederations dbConfederations;

	public static LoadDBAndConvert instance;

	private void Awake()
	{
		instance = this;
	}

	public void ConvertDBTeamsIntoTeams(List<int> countryIndexes)
	{
		DataManager.instance.allTeams.Clear();
		DataManager.instance.allPlayers.Clear();
		DataManager.instance.allCoaches.Clear();
		DataManager.instance.allCountries.Clear();
		DataManager.instance.allRegions.Clear();
		DataManager.instance.allConfederations.Clear();
		DataManager.instance.allRegionalFederations.Clear();
		foreach (DbConfederations.DbConfederation allConfederation in dbConfederations.allConfederations)
		{
			Confederation confederation = new Confederation(allConfederation.code, allConfederation.name, allConfederation.Flag);
			DataManager.instance.allConfederations.Add(confederation);
			foreach (DbConfederations.DbRegionalFederation regionalFederation3 in allConfederation.regionalFederations)
			{
				RegionalFederation regionalFederation = new RegionalFederation(confederation, regionalFederation3.code, regionalFederation3.name, regionalFederation3.Flag);
				confederation.AddRegionalFederation(regionalFederation);
			}
		}
		foreach (DbCountries.DbCountry allCountry in dbCountries.allCountries)
		{
			Confederation confederation2 = DataManager.instance.allConfederations.FindByCode(allCountry.confederationCode);
			RegionalFederation regionalFederation2 = DataManager.instance.allRegionalFederations.FindByCode(confederation2, allCountry.regionalFederationCode);
			Country country = new Country(confederation2, regionalFederation2, allCountry.code, allCountry.playRegional, allCountry.Flag);
			DataManager.instance.allCountries.Add(country);
			confederation2.AddCountry(country);
			regionalFederation2.AddCountry(country);
			foreach (DbCountries.DbRegion region3 in allCountry.regions)
			{
				Region region = new Region(country, region3.code, region3.fullName, region3.championshipName, region3.Flag);
				country.AddRegion(region);
			}
		}
		List<DbTeams.DbTeam> list = new List<DbTeams.DbTeam>(dbTeams.AllTeams);
		int num = 0;
		foreach (DbTeams.DbTeam item in list)
		{
			if (!TeamIsValid(item, countryIndexes))
			{
				continue;
			}
			Color32 color = item.textColor;
			Color32 color2 = item.backColor;
			string textColor = $"{(int)color.r};{(int)color.g};{(int)color.b}";
			string backgroundColor = $"{(int)color2.r};{(int)color2.g};{(int)color2.b}";
			ListOfPlayers listOfPlayers = new ListOfPlayers();
			Coach coach = null;
			Country country2 = DataManager.instance.allCountries.FindCountryByCode(item.countryCode);
			Region region2 = DataManager.instance.allRegions.FindByCode(country2, item.regionCode);
			if (country2 == null)
			{
				Debug.LogError("LoadDBAndConvert: skipping team '" + item.longName + "' (ID=" + item.teamID + "): country code '" + item.countryCode + "' not found in allCountries");
				continue;
			}
			if (country2.playRegional && region2 == null)
			{
				Debug.LogError("LoadDBAndConvert: skipping team '" + item.longName + "' (ID=" + item.teamID + "): region code '" + item.regionCode + "' not found in country '" + country2.CountryCode + "'");
				continue;
			}
			int level = item.level;
			coach = new Coach(item.coach, level);
			DataManager.instance.allCoaches.Add(coach);
			int level2 = item.level;
			for (int i = 0; i < item.players.Count; i++)
			{
				DbTeams.DbPlayer dbPlayer = item.players[i];
				Country country3 = DataManager.instance.allCountries.FindCountryByCode(dbPlayer.countryCode);
				if (country3 == null)
				{
					country3 = country2;
				}
				Player player = new Player(dbPlayer.name, dbPlayer.isStar, dbPlayer.position, dbPlayer.behaviour, country3, level2);
				DataManager.instance.allPlayers.Add(player);
				listOfPlayers.Add(DataManager.instance.allPlayers[DataManager.instance.allPlayers.Count - 1]);
			}
			Team team = new Team(item.teamID, num, item.longName, item.shortName, textColor, backgroundColor, item.level, listOfPlayers, country2, region2);
			team.Coach = coach;
			try
			{
				if (item.Logo != null)
				{
					team.MyLogo = item.Logo;
				}
			}
			catch (Exception ex)
			{
				Debug.LogError(ex.Message);
				team.MyLogo = null;
			}
			try
			{
				if (item.Shirt != null)
				{
					team.MyShirt = item.Shirt;
				}
			}
			catch (Exception ex2)
			{
				Debug.LogError(ex2.Message);
				team.MyShirt = null;
			}
			team.UsesStandardShirt = item.usesStandardShirt;
			DataManager.instance.allTeams.Add(team);
			team.country.AddActiveTeam(team);
			num++;
		}
	}

	private bool TeamIsValid(DbTeams.DbTeam team, List<int> countryIndexes)
	{
		return team.IsTeamValid() & countryIndexes.Contains(team.CountryIndex);
	}
}
