using System.Collections.Generic;
using UnityEngine;

public class LoadCountries : MonoBehaviour
{
	public TextAsset countriesCSV;

	public TextAsset regionsCSV;

	[ReadOnly]
	public List<(Sprite, string, string)> allFlags = new List<(Sprite, string, string)>();

	public DbCountries countries;

	public DbConfederations confederations;

	private readonly string COUNTRY_AND_REGIONS_FLAGS_PATH = "Flags";

	public void LoadEverything()
	{
		countries.version = Application.version;
		LoadFlags();
		LoadAllCountries();
		LoadAllRegions();
	}

	private void LoadFlags()
	{
		Sprite[] array = Resources.LoadAll<Sprite>(COUNTRY_AND_REGIONS_FLAGS_PATH);
		foreach (Sprite sprite in array)
		{
			string text = sprite.name.Split(' ')[1].Split('_')[0];
			string text2 = ((sprite.name.Split(' ')[1].Split('_').Length == 2) ? sprite.name.Split(' ')[1].Split('_')[1] : "");
			allFlags.Add((sprite, text.Trim(), text2.Trim()));
		}
	}

	private void LoadAllCountries()
	{
		string[] array = countriesCSV.text.Split('\n');
		if (array[0].Split(',').Length < 5)
		{
			Debug.LogError("ERROR: Something is wrong with the countries.csv file");
			return;
		}
		for (int i = 1; i < array.Length; i++)
		{
			string[] array2 = array[i].Split(',');
			if (array2.Length >= 7)
			{
				DbCountries.DbCountry item = new DbCountries.DbCountry
				{
					code = array2[0].Trim(),
					Flag = FindFlag(array2[0].Trim()),
					regionLabel = array2[2].Trim(),
					canSearchByRegion = (array2[3].Trim() == "1"),
					packagesByRegion = (array2[4].Trim() == "1"),
					playRegional = (array2[5].Trim() == "1"),
					confederationCode = array2[6].Trim(),
					regionalFederationCode = array2[7].Trim(),
					regions = new List<DbCountries.DbRegion>()
				};
				countries.allCountries.Add(item);
				if (item.canSearchByRegion)
				{
					DbCountries.DbRegion item2 = new DbCountries.DbRegion
					{
						code = LoadAndSavingTeams.OTHER_REGION_CODE,
						fullName = "...",
						championshipName = "...",
						Flag = null
					};
					countries.allCountries[countries.allCountries.Count - 1].regions.Add(item2);
				}
				int num = confederations.FindConfederationIndex(item.confederationCode);
				int index = confederations.FindRegionalFederationIndex(num, item.regionalFederationCode);
				confederations.allConfederations[num].countryIndexes.Add(countries.allCountries.Count - 1);
				confederations.allConfederations[num].regionalFederations[index].countryIndexes.Add(countries.allCountries.Count - 1);
				confederations.allConfederations[num].countryCodes.Add(item.code);
				confederations.allConfederations[num].regionalFederations[index].countryCodes.Add(item.code);
			}
		}
	}

	private void LoadAllRegions()
	{
		int index = 0;
		string[] array = regionsCSV.text.Split('\n');
		if (array[0].Split(',').Length < 4)
		{
			Debug.LogError("ERROR: Something is wrong with the regions.csv file");
			return;
		}
		for (int i = 1; i < array.Length; i++)
		{
			string[] array2 = array[i].Split(',');
			if (array2.Length < 4)
			{
				continue;
			}
			DbCountries.DbRegion item = new DbCountries.DbRegion
			{
				code = array2[1].Trim(),
				fullName = array2[2].Trim(),
				championshipName = array2[3].Trim(),
				Flag = FindFlag(array2[0].Trim(), array2[1].Trim())
			};
			if (array2[0].Trim() == countries.allCountries[index].code)
			{
				countries.allCountries[index].regions.Add(item);
				continue;
			}
			bool flag = false;
			for (int j = 0; j < countries.allCountries.Count; j++)
			{
				if (array2[0].Trim() == countries.allCountries[j].code)
				{
					countries.allCountries[j].regions.Add(item);
					flag = true;
					index = j;
					break;
				}
			}
			if (!flag)
			{
				Debug.LogWarning("ERROR -> DIDNT FIND COUNTRY: " + array2[0].Trim() + ". REGION IGNORED...");
			}
		}
	}

	public Sprite FindFlag(string countryName, string regionName = "")
	{
		foreach (var allFlag in allFlags)
		{
			if (allFlag.Item2 == countryName)
			{
				if (regionName == "" && allFlag.Item3 == "")
				{
					return allFlag.Item1;
				}
				if (regionName != "" && allFlag.Item3 == regionName)
				{
					return allFlag.Item1;
				}
			}
		}
		return null;
	}
}
