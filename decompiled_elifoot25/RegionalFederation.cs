using System;
using UnityEngine;

[Serializable]
public class RegionalFederation : EliObject
{
	private string regionalFederationCode;

	private string regionalFederationName;

	public readonly Confederation myConfederation;

	private ListOfCountries myCountries = new ListOfCountries();

	public bool isActive;

	public int numActiveCountries;

	public int numActiveTeams;

	[NonSerialized]
	public Sprite flag;

	public string RegionalFederationCode => regionalFederationCode;

	public string RegionalFederationName => regionalFederationName;

	public RegionalFederation(Confederation confederation, string regionalFederationCode, string regionalFederationName, Sprite flag)
		: base(generateID: false)
	{
		myConfederation = confederation;
		this.regionalFederationCode = regionalFederationCode;
		this.regionalFederationName = regionalFederationName;
		this.flag = flag;
	}

	public void AddCountry(Country country)
	{
		myCountries.Add(country);
	}

	public override string GetName()
	{
		return LanguageController.instance.Get_Translation("RegionalFederation_" + regionalFederationCode);
	}

	public int CompareTo(RegionalFederation other)
	{
		int num = myConfederation.ConfederationCode.CompareTo(other.myConfederation.ConfederationCode);
		if (num == 0)
		{
			num = regionalFederationCode.CompareTo(other.regionalFederationCode);
		}
		return num;
	}

	public void LoadFlag(DbConfederations dbConfederation, int dbConfederationIndex)
	{
		flag = dbConfederation.FindFlagByRegionalFederationCode(dbConfederationIndex, regionalFederationCode);
	}

	public void IncreaseOneCountry()
	{
		if (!isActive)
		{
			myConfederation.IncreaseOneRegionalFederation();
		}
		isActive = true;
		numActiveCountries++;
		myConfederation.IncreaseOneCountry();
	}

	public void IncreaseOneTeam()
	{
		numActiveTeams++;
		myConfederation.IncreaseOneTeam();
	}
}
