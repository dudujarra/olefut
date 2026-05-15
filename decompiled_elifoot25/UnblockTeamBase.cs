using System;

[Serializable]
public class UnblockTeamBase : EliObject
{
	private string countryCode3;

	private string regionCode;

	private string teamShortName;

	private string dbTeamID;

	public string CountryCode3
	{
		get
		{
			return countryCode3;
		}
		set
		{
			countryCode3 = (string.IsNullOrEmpty(value) ? null : value);
		}
	}

	public string RegionCode
	{
		get
		{
			return regionCode;
		}
		set
		{
			regionCode = (string.IsNullOrEmpty(value) ? null : value);
		}
	}

	public string TeamShortName
	{
		get
		{
			return teamShortName;
		}
		set
		{
			teamShortName = (string.IsNullOrEmpty(value) ? null : value);
		}
	}

	public string DbTeamID
	{
		get
		{
			return dbTeamID;
		}
		set
		{
			dbTeamID = (string.IsNullOrEmpty(value) ? null : value);
		}
	}

	public UnblockTeamBase()
		: base(generateID: false)
	{
	}
}
