using System;
using System.Collections.Generic;
using System.Globalization;
using UnityEngine;

[CreateAssetMenu(fileName = "DB Countries", menuName = "DB Countries")]
public class DbCountries : ScriptableObject
{
	[Serializable]
	public struct DbCountry
	{
		public string code;

		[SerializeField]
		private Sprite flag;

		public List<DbRegion> regions;

		public string regionLabel;

		public bool canSearchByRegion;

		public bool packagesByRegion;

		public bool playRegional;

		public string confederationCode;

		public string regionalFederationCode;

		public int numberOfTeams;

		public int numberOfTeamsValid;

		public bool hasInvalidTeams;

		public bool preSelected;

		public string Name => LanguageController.instance.Get_Translation("NAC_" + code);

		public Sprite Flag
		{
			get
			{
				if (flag != null)
				{
					return flag;
				}
				return LoadAndSavingTeams.instance.countries.defaultCountryFlag;
			}
			set
			{
				flag = value;
			}
		}
	}

	[Serializable]
	public struct DbRegion
	{
		public string code;

		public string fullName;

		public string championshipName;

		[SerializeField]
		private Sprite flag;

		public int numberOfTeams;

		public int numberOfTeamsValid;

		public bool hasInvalidTeams;

		public bool preSelected;

		public Sprite Flag
		{
			get
			{
				if (flag != null)
				{
					return flag;
				}
				return LoadAndSavingTeams.instance.countries.defaultRegionFlag;
			}
			set
			{
				flag = value;
			}
		}
	}

	public bool saved;

	public string version;

	public List<DbCountry> allCountries;

	[SerializeField]
	private Sprite defaultCountryFlag;

	[SerializeField]
	private Sprite defaultRegionFlag;

	public void Erase()
	{
		saved = false;
		version = "";
		allCountries.Clear();
	}

	public int FindCountryIndex(string countryCode)
	{
		for (int i = 0; i < allCountries.Count; i++)
		{
			if (countryCode == allCountries[i].code)
			{
				return i;
			}
		}
		return -1;
	}

	public int FindRegionIndex(int countryIndex, string regionCode)
	{
		for (int i = 0; i < allCountries[countryIndex].regions.Count; i++)
		{
			if (regionCode == allCountries[countryIndex].regions[i].code)
			{
				return i;
			}
		}
		return -1;
	}

	public List<(DbCountry, int, string, string, int)> GetCountriesSorted(bool countriesWithZeroTeams)
	{
		List<(DbCountry, int, string, string, int)> list = new List<(DbCountry, int, string, string, int)>();
		for (int i = 0; i < allCountries.Count; i++)
		{
			if (countriesWithZeroTeams || allCountries[i].numberOfTeams != 0)
			{
				list.Add((allCountries[i], i, allCountries[i].code, allCountries[i].Name, allCountries[i].numberOfTeams));
			}
		}
		list.Sort(((DbCountry dbCountry, int index, string code, string name, int numberOfTeams) a, (DbCountry dbCountry, int index, string code, string name, int numberOfTeams) b) => string.Compare(a.name, b.name, CultureInfo.CurrentCulture, CompareOptions.IgnoreNonSpace));
		return list;
	}

	public Sprite GetCountryFlag(int countryIndex)
	{
		if (countryIndex >= 0 && countryIndex < allCountries.Count)
		{
			return allCountries[countryIndex].Flag;
		}
		return defaultCountryFlag;
	}

	public Sprite FindFlagByCountryCode(string countryCode)
	{
		foreach (DbCountry allCountry in allCountries)
		{
			if (countryCode == allCountry.code)
			{
				return allCountry.Flag;
			}
		}
		return defaultCountryFlag;
	}

	public Sprite GetDefaultCountryFlag()
	{
		return defaultCountryFlag;
	}

	public Sprite GetRegionFlag(int countryIndex, int regionIndex)
	{
		if (countryIndex >= 0 && countryIndex < allCountries.Count && regionIndex >= 0 && regionIndex < allCountries[countryIndex].regions.Count)
		{
			return allCountries[countryIndex].regions[regionIndex].Flag;
		}
		return defaultRegionFlag;
	}

	public Sprite FindFlagByRegionCode(int countryIndex, string regionCode)
	{
		foreach (DbRegion region in allCountries[countryIndex].regions)
		{
			if (regionCode == region.code)
			{
				return region.Flag;
			}
		}
		return defaultRegionFlag;
	}
}
