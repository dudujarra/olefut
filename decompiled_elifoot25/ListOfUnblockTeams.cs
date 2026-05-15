using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;

[Serializable]
public class ListOfUnblockTeams : EliList
{
	public void Initialize()
	{
	}

	public void Add(UnblockTeam unblockTeam)
	{
		if ((UnblockTeam)Find((EliObject p) => IsEqual((UnblockTeam)p, unblockTeam)) == null)
		{
			Add((EliObject)unblockTeam);
		}
	}

	public bool IsEqual(UnblockTeam ut1, UnblockTeam ut2)
	{
		bool flag = true;
		if (ut1 == null || ut2 == null)
		{
			return false;
		}
		if ((ut1.CountryCode3 == null) ^ (ut2.CountryCode3 == null))
		{
			flag = false;
		}
		else if (ut1.CountryCode3 != null && ut2.CountryCode3 != null)
		{
			flag &= string.Equals(ut1.CountryCode3, ut2.CountryCode3);
		}
		if (flag && ((ut1.RegionCode == null) ^ (ut2.RegionCode == null)))
		{
			flag = false;
		}
		else if (flag && ut1.RegionCode != null && ut2.RegionCode != null)
		{
			flag &= string.Equals(ut1.RegionCode, ut2.RegionCode);
		}
		if (flag && ((ut1.TeamShortName == null) ^ (ut2.TeamShortName == null)))
		{
			flag = false;
		}
		else if (flag && ut1.TeamShortName != null && ut2.TeamShortName != null)
		{
			flag &= string.Equals(ut1.TeamShortName, ut2.TeamShortName);
		}
		return flag & (ut1.DbTeamID == ut2.DbTeamID);
	}

	public void ReadFromFile()
	{
		try
		{
			string path = Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH) + "/" + DataManager.UNBLOCK_TEAMS_FILE_NAME;
			if (!File.Exists(path))
			{
				return;
			}
			using Stream stream = File.Open(path, FileMode.Open, FileAccess.Read);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			while (stream.Position < stream.Length)
			{
				UnblockTeam unblockTeam = (UnblockTeam)binaryFormatter.Deserialize(stream);
				Add(unblockTeam);
			}
		}
		catch (Exception ex)
		{
			Debug.LogError("ERROR Reading unblock teams - " + ex.Message);
		}
	}

	public void SaveToFile()
	{
		try
		{
			if (!Directory.Exists(Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH)))
			{
				Directory.CreateDirectory(Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH));
			}
			using Stream stream = File.Open(Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH) + "/" + DataManager.UNBLOCK_TEAMS_FILE_NAME, FileMode.Create);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			using (Enumerator enumerator = GetEnumerator())
			{
				while (enumerator.MoveNext())
				{
					UnblockTeam graph = (UnblockTeam)enumerator.Current;
					binaryFormatter.Serialize(stream, graph);
				}
			}
			stream.Close();
		}
		catch (Exception ex)
		{
			Debug.LogError("ERROR Saving unblock teams - " + ex.Message);
		}
	}

	public void ApplyUnblockTeams(ListOfTeams listOfTeams)
	{
		if (listOfTeams == null)
		{
			return;
		}
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((UnblockTeam)enumerator.Current).Use(listOfTeams);
		}
	}
}
