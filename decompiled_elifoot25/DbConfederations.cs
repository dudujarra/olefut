using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "DB Confederations", menuName = "DB Confederations")]
public class DbConfederations : ScriptableObject
{
	[Serializable]
	public struct DbConfederation
	{
		public string code;

		public string name;

		[SerializeField]
		private Sprite flag;

		public List<DbRegionalFederation> regionalFederations;

		public List<int> countryIndexes;

		public List<string> countryCodes;

		public Sprite Flag
		{
			get
			{
				if (flag != null)
				{
					return flag;
				}
				return LoadAndSavingTeams.instance.confederations.defaultConfederationFlag;
			}
			set
			{
				flag = value;
			}
		}
	}

	[Serializable]
	public struct DbRegionalFederation
	{
		public string code;

		public string name;

		[SerializeField]
		private Sprite flag;

		public List<int> countryIndexes;

		public List<string> countryCodes;

		public Sprite Flag
		{
			get
			{
				if (flag != null)
				{
					return flag;
				}
				return LoadAndSavingTeams.instance.confederations.defaultFederationFlag;
			}
			set
			{
				flag = value;
			}
		}
	}

	public bool saved;

	public string version;

	public List<DbConfederation> allConfederations;

	[SerializeField]
	private Sprite defaultConfederationFlag;

	[SerializeField]
	private Sprite defaultFederationFlag;

	public void Erase()
	{
		saved = false;
		version = "";
		allConfederations.Clear();
	}

	public int FindConfederationIndex(string confederationCode)
	{
		for (int i = 0; i < allConfederations.Count; i++)
		{
			if (confederationCode == allConfederations[i].code)
			{
				return i;
			}
		}
		if (DataManager.instance != null && DataManager.instance.DBDebugMode)
		{
			Debug.LogWarning("Error 1001: confederationCode='" + confederationCode + "' not found.");
		}
		return -1;
	}

	public int FindRegionalFederationIndex(int confederationIndex, string regionalFederationCode)
	{
		for (int i = 0; i < allConfederations[confederationIndex].regionalFederations.Count; i++)
		{
			if (regionalFederationCode == allConfederations[confederationIndex].regionalFederations[i].code)
			{
				return i;
			}
		}
		if (DataManager.instance != null && DataManager.instance.DBDebugMode)
		{
			Debug.LogWarning("Error 1002: regionalFederationCode='" + regionalFederationCode + "' not found for confederation " + allConfederations[confederationIndex].name + ".");
		}
		return -1;
	}

	public Sprite FindFlagByConfederationCode(string confederationCode)
	{
		int num = FindConfederationIndex(confederationCode);
		if (num == -1)
		{
			return null;
		}
		return allConfederations[num].Flag;
	}

	public Sprite GetRegionalFederationFlag(int confederationIndex, int regionalFederationIndex)
	{
		if (confederationIndex >= 0 && regionalFederationIndex >= 0)
		{
			return allConfederations[confederationIndex].regionalFederations[regionalFederationIndex].Flag;
		}
		return defaultFederationFlag;
	}

	public Sprite FindFlagByRegionalFederationCode(string confederationCode, string regionalFederationCode)
	{
		int num = FindConfederationIndex(confederationCode);
		if (num == -1)
		{
			return null;
		}
		return FindFlagByRegionalFederationCode(num, regionalFederationCode);
	}

	public Sprite FindFlagByRegionalFederationCode(int confederationIndex, string regionalFederationCode)
	{
		int num = FindRegionalFederationIndex(confederationIndex, regionalFederationCode);
		if (num == -1)
		{
			return null;
		}
		return GetRegionalFederationFlag(confederationIndex, num);
	}
}
