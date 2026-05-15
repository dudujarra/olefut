using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;

[CreateAssetMenu(fileName = "UpdatesRecorder", menuName = "UpdatesRecorder")]
public class UpdatesRecorder : ScriptableObject
{
	[Serializable]
	private class DbTeamsFile
	{
		public string fileGuid;

		public string dateAvailable;

		public int fileVersion;
	}

	[SerializeField]
	private List<DbTeamsFile> filesDownloaded = new List<DbTeamsFile>();

	private readonly string recorderName = "UpdatesRecorder";

	private static string recorderDatabaseFullPath;

	public bool CheckAlreadyDownloaded(string fileGuid, string dateAvailable, int fileVersion)
	{
		if (filesDownloaded.Find((DbTeamsFile x) => x.fileGuid == fileGuid && x.fileVersion >= fileVersion) == null)
		{
			return false;
		}
		return true;
	}

	public void AddRecordedFile(string fileGuid, string dateAvailable, int fileVersion)
	{
		DbTeamsFile dbTeamsFile = filesDownloaded.Find((DbTeamsFile x) => x.fileGuid == fileGuid);
		if (dbTeamsFile == null)
		{
			filesDownloaded.Add(new DbTeamsFile
			{
				fileGuid = fileGuid,
				dateAvailable = dateAvailable,
				fileVersion = fileVersion
			});
		}
		else
		{
			dbTeamsFile.dateAvailable = dateAvailable;
			dbTeamsFile.fileVersion = fileVersion;
		}
		Save();
	}

	private void Save()
	{
		using FileStream serializationStream = File.Create(recorderDatabaseFullPath);
		new BinaryFormatter().Serialize(serializationStream, filesDownloaded);
	}

	private void OnEnable()
	{
		filesDownloaded.Clear();
		recorderDatabaseFullPath = Application.persistentDataPath + "/Database/" + recorderName + ".data";
		Load();
	}

	private void Load()
	{
		if (!File.Exists(recorderDatabaseFullPath))
		{
			return;
		}
		try
		{
			using FileStream serializationStream = File.Open(recorderDatabaseFullPath, FileMode.Open);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			filesDownloaded = (List<DbTeamsFile>)binaryFormatter.Deserialize(serializationStream);
		}
		catch (Exception arg)
		{
			Debug.LogError($"UpdatesRecorder.Load failed (file may be corrupted): {arg}");
			filesDownloaded = new List<DbTeamsFile>();
		}
	}

	public static void Erase()
	{
		if (File.Exists(recorderDatabaseFullPath))
		{
			File.Delete(recorderDatabaseFullPath);
		}
	}
}
