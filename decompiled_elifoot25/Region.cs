using System;
using UnityEngine;

[Serializable]
public class Region : EliObject
{
	public string regionCode;

	public readonly Country myCountry;

	private string fullName;

	public string championshipName;

	[NonSerialized]
	public Sprite flag;

	public Region(Country country, string regionCode, string fullName, string championshipName, Sprite flag)
		: base(generateID: false)
	{
		myCountry = country;
		this.regionCode = regionCode;
		this.fullName = fullName;
		this.championshipName = championshipName;
		this.flag = flag;
	}

	public int CompareTo(Region other)
	{
		int num = myCountry.CountryCode.CompareTo(other.myCountry.CountryCode);
		if (num == 0)
		{
			num = regionCode.CompareTo(other.regionCode);
		}
		return num;
	}

	public override string GetName()
	{
		return fullName;
	}

	public void LoadFlag(DbCountries dbCountries, int dbCountryIndex)
	{
		flag = dbCountries.FindFlagByRegionCode(dbCountryIndex, regionCode);
	}
}
