using System;
using UnityEngine;

[Serializable]
public class Country : EliObject
{
	[NonSerialized]
	private Confederation myConfederation;

	[NonSerialized]
	public RegionalFederation myRegionalFederation;

	private string confederationCode;

	private string regionalFederationCode;

	private string countryCode;

	private string name;

	public readonly bool playRegional;

	private ListOfTeams myTeams = new ListOfTeams();

	public bool isActive;

	public int numActiveTeams;

	public int targetSkillFirst = DataManager.PLAYER_SKILL_MAX;

	private ListOfRegions myRegions = new ListOfRegions();

	[NonSerialized]
	public Sprite flag;

	public Confederation MyConfederation
	{
		get
		{
			return myConfederation;
		}
		set
		{
			myConfederation = value;
			confederationCode = ((myConfederation == null) ? "" : myConfederation.ConfederationCode);
		}
	}

	public RegionalFederation MyRegionalFederation
	{
		get
		{
			return myRegionalFederation;
		}
		set
		{
			myRegionalFederation = value;
			regionalFederationCode = ((myRegionalFederation == null) ? "" : myRegionalFederation.RegionalFederationCode);
		}
	}

	public string CountryCode => countryCode;

	public Country(Confederation confederation, RegionalFederation regionalFederation, string countryCode, bool playRegional, Sprite flag)
		: base(generateID: false)
	{
		myConfederation = confederation;
		myRegionalFederation = regionalFederation;
		this.countryCode = countryCode;
		this.playRegional = playRegional;
		this.flag = flag;
	}

	public void AddRegion(Region region)
	{
		myRegions.Add(region);
		DataManager.instance.allRegions.Add(region);
	}

	public override string GetName()
	{
		if (name == null)
		{
			SetName();
		}
		return name;
	}

	public void SetName()
	{
		name = LanguageController.instance.Get_Translation("NAC_" + countryCode);
	}

	public int CompareTo(Country otherCountry)
	{
		return countryCode.CompareTo(otherCountry.countryCode);
	}

	public void LoadFlag(DbCountries dbCountries)
	{
		flag = dbCountries.FindFlagByCountryCode(CountryCode);
	}

	public void LoadRegionFlags(DbCountries dbCountries)
	{
		int dbCountryIndex = dbCountries.FindCountryIndex(CountryCode);
		myRegions.LoadFlags(dbCountries, dbCountryIndex);
	}

	public void AddActiveTeam(Team team)
	{
		if (!isActive)
		{
			MyRegionalFederation.IncreaseOneCountry();
		}
		isActive = true;
		numActiveTeams++;
		myTeams.Add(team);
		MyRegionalFederation.IncreaseOneTeam();
	}

	public void Initialize()
	{
		ComputeTargetSkills();
	}

	public void ComputeTargetSkills()
	{
		myTeams.ComputeTargetSkills(targetSkillFirst);
	}

	public override void PostLoad()
	{
		myConfederation = DataManager.instance.allConfederations.FindByCode(confederationCode);
		myRegionalFederation = DataManager.instance.allRegionalFederations.FindByCode(myConfederation, regionalFederationCode);
		SetName();
	}
}
