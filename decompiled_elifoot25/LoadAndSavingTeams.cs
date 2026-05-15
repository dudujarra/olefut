using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(LoadLogosAndShirts), typeof(LoadCountries), typeof(LoadTeamsConflicts))]
public class LoadAndSavingTeams : MonoBehaviour
{
	public DbTeams teamsFactory;

	public DbTeams teams;

	public DbTeams teamsUpdate;

	public DbTeams teamsPackage;

	public DbCountries countries;

	public DbConfederations confederations;

	[HideInInspector]
	public LoadLogosAndShirts loadLogosAndShirts;

	private LoadCountries loadCountries;

	private LoadConfederations loadConfederations;

	private LoadTeamsConflicts loadTeamsConflicts;

	public readonly string[] COMPATIBLE_FILE_VERSIONS = new string[1] { ".ef20" };

	private readonly string[] COMPATIBLE_DATABASE_VERSIONS = new string[1] { "EF20.2" };

	private readonly string DEFAULT_DATABASE_VERSION = "EF20.2";

	private readonly string DEFAULT_FILE_VERSION = "ef20";

	public static readonly string OTHER_REGION_CODE = "";

	private readonly string TEAMS_PATH = "Teams Final";

	private readonly string TEAMS_PACKAGE_PATH = "Teams Package";

	private string teamsDatabaseName = "Teams";

	private string databasePath;

	private string databaseTempPath;

	private string databaseDBCreatingTestPath;

	private string databaseDirectory;

	[HideInInspector]
	public bool isAppUpdate;

	public Text debugText;

	public static LoadAndSavingTeams instance;

	private void Awake()
	{
		instance = this;
		GetComponents();
	}

	private void GetComponents()
	{
		loadLogosAndShirts = GetComponent<LoadLogosAndShirts>();
		loadCountries = GetComponent<LoadCountries>();
		loadConfederations = GetComponent<LoadConfederations>();
		loadTeamsConflicts = GetComponent<LoadTeamsConflicts>();
	}

	public void Start()
	{
		databaseDirectory = Path.Combine(Application.persistentDataPath, "Database");
		databasePath = Application.persistentDataPath + "/Database/" + teamsDatabaseName + ".data";
		databaseTempPath = Application.persistentDataPath + "/Database/" + teamsDatabaseName + "Temp.data";
		if (File.Exists(databasePath))
		{
			LoadSavedTeams();
			RedoValidTeamFlags();
			RedoNumberOfTeams(isUpdated: false);
		}
		else
		{
			InitializeTeamsDatabase();
		}
	}

	private void LoadSavedTeams()
	{
		string text = CheckAndLoadLocalTeamsFile();
		if (!string.IsNullOrEmpty(text))
		{
			ScreenController.instance.ShowDialogPopUp("ERROR_INTERNAL", "ERROR_DATABASE_READ_ERROR", null);
			Debug.LogError("LoadSavedTeams exception:\n" + text);
			File.Delete(databasePath);
			InitializeTeamsDatabase();
		}
		if (teams.AllTeams.Count == 0)
		{
			File.Delete(databasePath);
			InitializeTeamsDatabase();
		}
		if (teams.CheckDuplicateTeamIDs())
		{
			SaveTeams();
		}
	}

	private string CheckAndLoadLocalTeamsFile()
	{
		return LoadTeamsFile(databasePath);
	}

	private string CheckAndLoadTempTeamsFile()
	{
		return LoadTeamsFile(databaseTempPath);
	}

	private string LoadTeamsFile(string path)
	{
		try
		{
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			using (FileStream serializationStream = File.Open(path, FileMode.Open))
			{
				JsonUtility.FromJsonOverwrite((string)binaryFormatter.Deserialize(serializationStream), teams);
			}
			return "";
		}
		catch (Exception ex)
		{
			return ex.ToString();
		}
	}

	private void InitializeTeamsDatabase()
	{
		teams.appVersion = teamsFactory.appVersion;
		teams.isFullyUpdated = true;
		teams.databaseVersion = teamsFactory.databaseVersion;
		teams.fileFormat = teamsFactory.fileFormat;
		teams.AllTeams = new List<DbTeams.DbTeam>(teamsFactory.AllTeams);
		RedoValidTeamFlags();
		RedoNumberOfTeams(isUpdated: false);
		SaveTeams();
	}

	public void SaveTeams()
	{
		if (databaseDirectory == null)
		{
			return;
		}
		if (string.IsNullOrEmpty(CheckAndSaveTempTeamsFile()))
		{
			if (string.IsNullOrEmpty(CheckAndLoadTempTeamsFile()))
			{
				string text = databasePath + ".bak";
				if (File.Exists(databasePath))
				{
					if (File.Exists(text))
					{
						File.Delete(text);
					}
					File.Move(databasePath, text);
				}
				File.Move(databaseTempPath, databasePath);
				if (File.Exists(text))
				{
					File.Delete(text);
				}
			}
			else
			{
				ShowSaveError();
			}
		}
		else
		{
			ShowSaveError();
		}
	}

	private string CheckAndSaveTempTeamsFile()
	{
		return SaveTeamsFile(databaseTempPath);
	}

	private string CheckAndSaveDBCreatingTestTeamsFile()
	{
		return SaveTeamsFile(databaseDBCreatingTestPath);
	}

	private string SaveTeamsFile(string path)
	{
		try
		{
			if (!Directory.Exists(databaseDirectory))
			{
				Directory.CreateDirectory(databaseDirectory);
			}
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			using (FileStream serializationStream = File.Create(path))
			{
				string graph = JsonUtility.ToJson(teams);
				binaryFormatter.Serialize(serializationStream, graph);
			}
			return "";
		}
		catch (Exception ex)
		{
			return ex.ToString();
		}
	}

	private void ShowSaveError()
	{
		ScreenController.instance.ShowDialogPopUp("ERROR_INTERNAL", "ERROR_DATABASE_WRITE_ERROR", null);
		if (File.Exists(databaseTempPath))
		{
			File.Delete(databaseTempPath);
		}
	}

	private void OnDisable()
	{
		SaveTeams();
	}

	private void OnApplicationPause(bool pause)
	{
		if (pause)
		{
			SaveTeams();
		}
	}

	public void CheckAppUpdate()
	{
		if (HasAppUpdate())
		{
			AskAppUpdate();
		}
	}

	public bool HasAppUpdate()
	{
		if (DataManager.instance.dbTeamsMode == DataManager.DbTeamsMode.PackageMode)
		{
			return false;
		}
		return teamsFactory.appVersion.Trim() != teams.appVersion.Trim();
	}

	public bool ShowAppUpdateButtonNotification()
	{
		if (!HasAppUpdate())
		{
			return false;
		}
		if (ElifootOptions.appUpdateVersionIgnored.Trim() == teamsFactory.appVersion.Trim())
		{
			return false;
		}
		return true;
	}

	private void AskAppUpdate()
	{
		if (ElifootOptions.appUpdateVersionDiscarded.Trim() != teamsFactory.appVersion.Trim())
		{
			ScreenController.instance.ShowDialogPopUp("ID:EDITOR_TEAMS_UPDATE_TITLE", "ID:EDITOR_TEAMS_UPDATE_VERSION_TEXT", DoAppUpdate, AppUpdateCanceled);
		}
	}

	private void AppUpdateCanceled()
	{
		AppUpdateDiscarded();
	}

	public void AppUpdateDiscarded(bool allDowngrade = false)
	{
		ElifootOptions.appUpdateVersionDiscarded = teamsFactory.appVersion.Trim();
		ElifootOptions.appUpdateVersionIgnored = (allDowngrade ? teamsFactory.appVersion.Trim() : "");
		ElifootOptions.SaveOptions();
	}

	public void DoAppUpdate()
	{
		isAppUpdate = true;
		StartCoroutine(DoAppUpdateInvoke());
	}

	private IEnumerator DoAppUpdateInvoke()
	{
		if (DataManager.instance.dbTeamsMode == DataManager.DbTeamsMode.PackageMode)
		{
			yield break;
		}
		if (teamsFactory == null || teamsFactory.AllTeams == null)
		{
			Debug.LogError("DoAppUpdateInvoke failed: teamsFactory or teamsFactory.AllTeams is null");
			ScreenController.instance.ShowDialogPopUp("EDITOR_FILE_DAMAGED_TITLE", "EDITOR_FILE_DAMAGED_TEXT", null);
			yield break;
		}
		Debug.Log($"DoAppUpdateInvoke: {teamsFactory.AllTeams.Count} factory teams");
		teamsUpdate.AllTeams = new List<DbTeams.DbTeam>(teamsFactory.AllTeams);
		yield return StartCoroutine(loadTeamsConflicts.SolveConflicts());
		if (loadTeamsConflicts.teamsResolution.Count == 0)
		{
			ScreenController.instance.ShowInfoPopUp("EDITOR_TEAMS_UPDATED", null);
			teams.isFullyUpdated = true;
			teams.appVersion = Application.version;
			SaveTeams();
		}
		else
		{
			RedoValidTeamFlags();
			RedoNumberOfTeams(isUpdated: true);
			ScreenController.instance.ShowConflictTeamsView();
		}
	}

	public void LoadSharedFile(string filePath)
	{
		try
		{
			string text = FileManagement.ReadFile<string>(filePath);
			if (string.IsNullOrEmpty(text))
			{
				Debug.LogError("LoadSharedFile: file is empty or unreadable: '" + filePath + "'");
				ScreenController.instance.ShowDialogPopUp("EDITOR_FILE_DAMAGED_TITLE", "EDITOR_FILE_DAMAGED_TEXT", null);
				return;
			}
			teamsUpdate.Erase();
			Debug.Log($"LoadSharedFile: Deserializing {text.Length} chars...");
			JsonUtility.FromJsonOverwrite(text, teamsUpdate);
			Debug.Log($"LoadSharedFile: Deserialized {teamsUpdate.AllTeams?.Count ?? 0} teams");
			StartCoroutine(CheckSolveConflicts());
		}
		catch (Exception arg)
		{
			Debug.LogError($"LoadSharedFile failed for path '{filePath}': {arg}");
			ScreenController.instance.ShowDialogPopUp("EDITOR_FILE_DAMAGED_TITLE", "EDITOR_FILE_DAMAGED_TEXT", null);
		}
	}

	public IEnumerator CheckSolveConflicts()
	{
		if (IsDatabaseVersionCompatible())
		{
			isAppUpdate = false;
			yield return StartCoroutine(loadTeamsConflicts.SolveConflicts());
			SetTeamsUpdateCountryCodes();
			ScreenController.instance.ShowTeamsFileInfoPopUp(teamsUpdate.countryCodes);
		}
		else
		{
			Debug.LogError("Database version incompatible: '" + teamsUpdate.databaseVersion + "' (expected one of: " + string.Join(", ", COMPATIBLE_DATABASE_VERSIONS) + ")");
			ScreenController.instance.ShowDialogPopUp("EDITOR_FILE_DAMAGED_TITLE", "EDITOR_FILE_INCOMPATIBLE_TEXT", null);
		}
	}

	private void SetTeamsUpdateCountryCodes()
	{
		string text = "";
		for (int i = 0; i < teamsUpdate.AllTeams.Count; i++)
		{
			if (!string.IsNullOrEmpty(teamsUpdate.AllTeams[i].countryCode) && !text.Contains(teamsUpdate.AllTeams[i].countryCode))
			{
				text = text + ((text.Length > 0) ? "," : "") + teamsUpdate.AllTeams[i].countryCode;
			}
		}
		teamsUpdate.countryCodes = text;
	}

	private bool IsDatabaseVersionCompatible()
	{
		for (int i = 0; i < COMPATIBLE_DATABASE_VERSIONS.Length; i++)
		{
			if (teamsUpdate.databaseVersion == COMPATIBLE_DATABASE_VERSIONS[i])
			{
				return true;
			}
		}
		return false;
	}

	private void ResetNumberOfTeams()
	{
		for (int i = 0; i < countries.allCountries.Count; i++)
		{
			DbCountries.DbCountry value = countries.allCountries[i];
			value.numberOfTeams = 0;
			value.numberOfTeamsValid = 0;
			value.hasInvalidTeams = false;
			countries.allCountries[i] = value;
			for (int j = 0; j < countries.allCountries[i].regions.Count; j++)
			{
				DbCountries.DbRegion value2 = countries.allCountries[i].regions[j];
				value2.numberOfTeams = 0;
				value2.numberOfTeamsValid = 0;
				value2.hasInvalidTeams = false;
				countries.allCountries[i].regions[j] = value2;
			}
		}
	}

	public void RedoNumberOfTeams(bool isUpdated)
	{
		ResetNumberOfTeams();
		DbTeams dbTeams = (isUpdated ? teamsUpdate : teams);
		for (int i = 0; i < dbTeams.AllTeams.Count; i++)
		{
			DbTeams.DbTeam dbTeam = dbTeams.AllTeams[i];
			if (dbTeam.CountryIndex < 0)
			{
				Debug.LogError($"team {dbTeam.shortName} has broken countryIndex {dbTeam.CountryIndex} in country {dbTeam.countryCode}.");
				continue;
			}
			DbCountries.DbCountry value = countries.allCountries[dbTeam.CountryIndex];
			value.numberOfTeams++;
			value.numberOfTeamsValid += (dbTeam.isTeamValid ? 1 : 0);
			value.hasInvalidTeams |= !dbTeam.isTeamValid;
			countries.allCountries[dbTeam.CountryIndex] = value;
			if (dbTeam.RegionIndex >= 0)
			{
				DbCountries.DbRegion value2 = countries.allCountries[dbTeam.CountryIndex].regions[dbTeam.RegionIndex];
				value2.numberOfTeams++;
				value2.numberOfTeamsValid += (dbTeam.isTeamValid ? 1 : 0);
				value2.hasInvalidTeams |= !dbTeam.isTeamValid;
				countries.allCountries[dbTeam.CountryIndex].regions[dbTeam.RegionIndex] = value2;
			}
		}
	}

	public void RedoValidTeamFlags(bool isUpdated = false)
	{
		DbTeams dbTeams = (isUpdated ? teamsUpdate : teams);
		for (int i = 0; i < dbTeams.AllTeams.Count; i++)
		{
			DbTeams.DbTeam value = dbTeams.AllTeams[i];
			value.isTeamValid = dbTeams.AllTeams[i].IsTeamValid();
			dbTeams.AllTeams[i] = value;
		}
	}
}
