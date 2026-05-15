using System.Collections.Generic;
using UnityEngine;

public class LoadConfederations : MonoBehaviour
{
	public TextAsset confederationsCSV;

	public TextAsset regionalFederationsCSV;

	public DbConfederations confederations;

	public void LoadEverything()
	{
		confederations.version = Application.version;
		LoadAllConfederations();
		LoadAllRegionalFederations();
	}

	private void LoadAllConfederations()
	{
		string[] array = confederationsCSV.text.Split('\n');
		if (array[0].Split(',').Length < 2)
		{
			Debug.LogError("ERROR: Something is wrong with the confederations.csv file");
			return;
		}
		for (int i = 1; i < array.Length; i++)
		{
			string[] array2 = array[i].Split(',');
			if (array2.Length >= 2)
			{
				DbConfederations.DbConfederation item = new DbConfederations.DbConfederation
				{
					code = array2[0].Trim(),
					name = array2[1].Trim(),
					Flag = null,
					regionalFederations = new List<DbConfederations.DbRegionalFederation>(),
					countryIndexes = new List<int>(),
					countryCodes = new List<string>()
				};
				confederations.allConfederations.Add(item);
			}
		}
	}

	private void LoadAllRegionalFederations()
	{
		int index = 0;
		string[] array = regionalFederationsCSV.text.Split('\n');
		if (array[0].Split(',').Length < 3)
		{
			Debug.LogError("ERROR: Something is wrong with the regionalFederations.csv file");
			return;
		}
		for (int i = 1; i < array.Length; i++)
		{
			string[] array2 = array[i].Split(',');
			if (array2.Length < 3)
			{
				continue;
			}
			DbConfederations.DbRegionalFederation item = new DbConfederations.DbRegionalFederation
			{
				code = array2[1].Trim(),
				name = array2[2].Trim(),
				Flag = null,
				countryIndexes = new List<int>(),
				countryCodes = new List<string>()
			};
			if (array2[0].Trim() == confederations.allConfederations[index].code)
			{
				confederations.allConfederations[index].regionalFederations.Add(item);
				continue;
			}
			bool flag = false;
			for (int j = 0; j < confederations.allConfederations.Count; j++)
			{
				if (array2[0].Trim() == confederations.allConfederations[j].code)
				{
					confederations.allConfederations[j].regionalFederations.Add(item);
					flag = true;
					index = j;
					break;
				}
			}
			if (!flag)
			{
				Debug.LogWarning("ERROR -> DIDNT FIND CONFEDERATION: " + array2[0].Trim() + ". REGIONAL FEDERATION IGNORED...");
			}
		}
	}
}
