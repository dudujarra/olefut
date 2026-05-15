using System;
using UnityEngine;

[Serializable]
public class Confederation : EliObject
{
	private string confederationCode;

	private string confederationName;

	public ListOfRegionalFederations myRegionalFederations = new ListOfRegionalFederations();

	public ListOfCountries myCountries = new ListOfCountries();

	public bool isActive;

	public int numActiveRegionalFederations;

	public int numActiveCountries;

	public int numActiveTeams;

	[NonSerialized]
	public Sprite flag;

	[NonSerialized]
	public ListOfCompetitions myCompetitions = new ListOfCompetitions();

	public string ConfederationCode => confederationCode;

	public string ConfederationName => confederationName;

	public Confederation(string confederationCode, string confederationName, Sprite flag)
		: base(generateID: false)
	{
		this.confederationCode = confederationCode;
		this.confederationName = confederationName;
		this.flag = flag;
	}

	public void AddRegionalFederation(RegionalFederation regionalFederation)
	{
		myRegionalFederations.Add(regionalFederation);
		DataManager.instance.allRegionalFederations.Add(regionalFederation);
	}

	public void AddCountry(Country country)
	{
		myCountries.Add(country);
	}

	public override string GetName()
	{
		return LanguageController.instance.Get_Translation("CONFEDERATION_" + confederationCode);
	}

	public int CompareTo(Confederation otherConfederation)
	{
		return confederationCode.CompareTo(otherConfederation.confederationCode);
	}

	public void LoadFlag(DbConfederations dbConfederation)
	{
		flag = dbConfederation.FindFlagByConfederationCode(confederationCode);
	}

	public void LoadRegionFlags(DbConfederations dbConfederation)
	{
		int dbConfederationIndex = dbConfederation.FindConfederationIndex(confederationCode);
		myRegionalFederations.LoadFlags(dbConfederation, dbConfederationIndex);
	}

	public void IncreaseOneRegionalFederation()
	{
		isActive = true;
		numActiveRegionalFederations++;
	}

	public void IncreaseOneCountry()
	{
		numActiveCountries++;
	}

	public void IncreaseOneTeam()
	{
		numActiveTeams++;
	}
}
