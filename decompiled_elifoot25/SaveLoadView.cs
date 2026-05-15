using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;
using UnityEngine.UI;

public class SaveLoadView : EliView
{
	public DbCountries dbCountries;

	public DbConfederations dbConfederations;

	public GameObject savedGamePrefab;

	[Header("View General")]
	public RectTransform savedGamesGroup;

	public GameObject newSavePanel;

	public InputField inputField;

	public Button backButton;

	public Button saveButton;

	public Button cancelButton;

	public Text txtTitle;

	public Text txtFileName;

	public Text txtMessage;

	public Text txtNewSaveTitle;

	public VerticalLayoutGroup mainVerticalLayoutGroup;

	private bool isSaveMode;

	private string noSavesText = "#>No compatible save games found.";

	private string fileAlreadyExists = "#>File with the same name already exists.";

	private string emptySaveFile = "#>Empty Save File";

	private string invalidName = "#>Invalid file name...";

	private string saveSuccess = "#>Saved successfully!";

	private string overwriteTextTemplate = "#>Overwrite";

	private string autoSaveFileDesc = "#>Auto-save file";

	private string errorLoadingMsgTemplate = "#>Error loading file";

	private List<GameObject> savedGamesList = new List<GameObject>();

	private Action onSave;

	private Action onBack;

	public void Initialize(bool isSaveMode, Action onSave = null, Action onBack = null)
	{
		this.onSave = onSave;
		this.onBack = onBack;
		this.isSaveMode = isSaveMode;
		newSavePanel.SetActive(value: true);
		ResetView();
		FillSavedGames();
		newSavePanel.SetActive(value: false);
	}

	public override void ResetView()
	{
		base.ResetView();
		if (isSaveMode)
		{
			txtTitle.text = LanguageController.instance.Get_Translation("SAVELOAD_TITLESAVE");
		}
		else
		{
			txtTitle.text = LanguageController.instance.Get_Translation("SAVELOAD_TITLELOAD");
		}
		noSavesText = LanguageController.instance.Get_Translation("SAVELOAD_NOSAVESFOUND");
		fileAlreadyExists = LanguageController.instance.Get_Translation("SAVELOAD_ALREADYEXISTS");
		emptySaveFile = LanguageController.instance.Get_Translation("SAVELOAD_EMPTYFILE");
		invalidName = LanguageController.instance.Get_Translation("SAVELOAD_INVALIDNAME");
		saveSuccess = LanguageController.instance.Get_Translation("SAVELOAD_SAVESUCCESS");
		overwriteTextTemplate = LanguageController.instance.Get_Translation("SAVELOAD_OVERWRITE");
		autoSaveFileDesc = LanguageController.instance.Get_Translation("LABELS_AUTOSAVE_FILE_NAME");
		errorLoadingMsgTemplate = LanguageController.instance.Get_Translation("SAVELOAD_ERRORLOADING");
	}

	private void FillSavedGames()
	{
		savedGamesList.Clear();
		foreach (Transform item3 in savedGamesGroup)
		{
			if (item3 != savedGamesGroup)
			{
				UnityEngine.Object.Destroy(item3.gameObject);
			}
		}
		bool darkenNext = false;
		bool darkenThis = false;
		if (!Directory.Exists(DataManager.SAVELOAD_PATH))
		{
			Directory.CreateDirectory(DataManager.SAVELOAD_PATH);
			if (!isSaveMode)
			{
				ScreenController.instance.ShowInfoPopUp(noSavesText, null);
				UnityEngine.Object.Destroy(base.gameObject);
				return;
			}
		}
		string[] files = Directory.GetFiles(DataManager.SAVELOAD_PATH, "*.bin");
		if (!isSaveMode && files.Length == 0)
		{
			ScreenController.instance.ShowInfoPopUp(noSavesText, null);
			UnityEngine.Object.Destroy(base.gameObject);
			return;
		}
		if (isSaveMode)
		{
			GameObject gameObject = UnityEngine.Object.Instantiate(savedGamePrefab, savedGamesGroup);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<SavedGamePrefab>().Initialize(emptySaveFile, null, null, NewSavePressed, null);
		}
		List<string> savedGames = new List<string>(files);
		savedGames = OrderSaveGamesByDate(savedGames);
		for (int i = 0; i < savedGames.Count; i++)
		{
			string text = savedGames[i];
			if (GetFileName(text) == DataManager.AUTOSAVE_DEFAULT_NAME)
			{
				savedGames.RemoveAt(i);
				if (!isSaveMode)
				{
					savedGames.Insert(0, text);
				}
				break;
			}
		}
		for (int j = 0; j < savedGames.Count; j++)
		{
			string filePath = savedGames[j];
			(SavedGamesShortInfo.SavedGame?, string) tuple = DataManager.instance.CheckSaveGameVersionAndGetShortInfo(filePath);
			SavedGamesShortInfo.SavedGame? item = tuple.Item1;
			string item2 = tuple.Item2;
			bool flag = DataManager.instance.CheckSaveGameVersion(filePath);
			if (!(item.HasValue || flag))
			{
				continue;
			}
			GameObject gameObject2 = UnityEngine.Object.Instantiate(savedGamePrefab, savedGamesGroup);
			DarkenListBackgroundObj(gameObject2.transform, ref darkenThis, ref darkenNext);
			string fileName = GetFileName(filePath);
			if (fileName == DataManager.AUTOSAVE_DEFAULT_NAME)
			{
				gameObject2.GetComponent<SavedGamePrefab>().Initialize(autoSaveFileDesc, item, item2, delegate
				{
					SavedGamePressed(filePath);
				}, delegate
				{
					DeleteSavedGame(filePath);
				}, isTempAutoSave: true);
			}
			else
			{
				gameObject2.GetComponent<SavedGamePrefab>().Initialize(fileName, item, item2, delegate
				{
					SavedGamePressed(filePath);
				}, delegate
				{
					DeleteSavedGame(filePath);
				});
			}
			savedGamesList.Add(gameObject2);
		}
		StartCoroutine(ReactivateLayoutGroup());
		if (!isSaveMode && savedGamesList.Count == 0)
		{
			ScreenController.instance.ShowInfoPopUp(noSavesText, null);
			UnityEngine.Object.Destroy(base.gameObject);
		}
	}

	private List<string> OrderSaveGamesByDate(List<string> savedGames)
	{
		savedGames.Sort(delegate(string s1, string s2)
		{
			(SavedGamesShortInfo.SavedGame?, string) tuple = DataManager.instance.CheckSaveGameVersionAndGetShortInfo(s1);
			(SavedGamesShortInfo.SavedGame?, string) tuple2 = DataManager.instance.CheckSaveGameVersionAndGetShortInfo(s2);
			var (savedGame, _) = tuple;
			var (savedGame2, _) = tuple2;
			if (savedGame.HasValue && savedGame2.HasValue)
			{
				return savedGame2.Value.date.GetAsDateTime().CompareTo(savedGame.Value.date.GetAsDateTime());
			}
			if (savedGame.HasValue)
			{
				return -1;
			}
			return savedGame2.HasValue ? 1 : 0;
		});
		return savedGames;
	}

	private void ForceResizeUpdate()
	{
		LayoutRebuilder.ForceRebuildLayoutImmediate(savedGamesGroup);
	}

	private IEnumerator ReactivateLayoutGroup()
	{
		yield return 0;
		LayoutRebuilder.ForceRebuildLayoutImmediate(savedGamesGroup);
		yield return 0;
	}

	public void NewSavePressed()
	{
		newSavePanel.SetActive(value: true);
		txtMessage.text = emptySaveFile;
		txtNewSaveTitle.text = emptySaveFile;
		saveButton.onClick.RemoveAllListeners();
		saveButton.onClick.AddListener(delegate
		{
			NewSaveGame();
		});
	}

	private void NewSaveGame()
	{
		string text = txtFileName.text.Trim();
		DataManager.instance.saveFileName = text;
		StartCoroutine(SaveGame(text, onSave));
	}

	public void SavedGamePressed(string filePath)
	{
		if (!isSaveMode)
		{
			StartCoroutine(LoadGame(filePath));
			return;
		}
		newSavePanel.SetActive(value: true);
		string fileName = GetFileName(filePath);
		inputField.text = fileName;
		txtNewSaveTitle.text = LanguageController.instance.Get_Translation("SAVELOAD_REPLACEFILE");
		txtFileName.text = fileName;
		saveButton.onClick.RemoveAllListeners();
		saveButton.onClick.AddListener(delegate
		{
			OverwriteSaveGame(filePath);
		});
	}

	private void DeleteSavedGame(string filePath)
	{
		Action a = delegate
		{
			try
			{
				File.Delete(filePath);
			}
			catch (Exception ex)
			{
				Debug.LogError("File operation failed: " + ex.Message);
			}
		};
		a = (Action)Delegate.Combine(a, (Action)delegate
		{
			FillSavedGames();
		});
		ScreenController.instance.ShowDialogPopUp("GEN_FILE_DELETE_COFIRM_TITLE", "GEN_FILE_DELETE_COFIRM_TEXT", a, null);
	}

	private void OverwriteSaveGame(string filePath)
	{
		string text = txtFileName.text.Trim();
		if (string.IsNullOrEmpty(text))
		{
			ScreenController.instance.ShowInfoPopUp("SAVELOAD_INVALIDNAME", null);
			return;
		}
		string path = Path.Combine(DataManager.SAVELOAD_PATH, text + ".bin");
		if (GetFileName(filePath) != text && File.Exists(path))
		{
			ScreenController.instance.ShowInfoPopUp(fileAlreadyExists, null);
		}
		else
		{
			StartCoroutine(SaveGame(text, onSave, isOverwrite: true, filePath));
		}
	}

	private IEnumerator SaveGame(string fileName, Action onSave = null, bool isOverwrite = false, string overwritePath = null)
	{
		if (string.IsNullOrEmpty(fileName))
		{
			ScreenController.instance.ShowInfoPopUp("SAVELOAD_INVALIDNAME", null);
			yield break;
		}
		if (!isOverwrite && File.Exists(Path.Combine(DataManager.SAVELOAD_PATH, fileName + ".bin")))
		{
			ScreenController.instance.ShowInfoPopUp("SAVELOAD_ALREADYEXISTS", null);
			yield break;
		}
		DataManager.instance.saveFileName = fileName;
		ScreenController.instance.ShowLoadingView("WAIT_GAME_SAVING");
		yield return 0;
		DataManager.instance.SaveGame(isAutoSave: false, forcedSave: false, onSave, isOverwrite, overwritePath);
		ScreenController.instance.HideLoadingView();
		UnityEngine.Object.Destroy(base.gameObject);
	}

	private IEnumerator LoadGame(string filePath)
	{
		ScreenController.instance.ShowLoadingView(LanguageController.instance.Get_Translation("WAIT_GAME_LOADING"));
		yield return 0;
		string text = string.Empty;
		try
		{
			DataManager.instance.stopElifoot = false;
			DataManager.instance.ClearData();
			using (Stream stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
			{
				BinaryFormatter binaryFormatter = new BinaryFormatter();
				text = (string)binaryFormatter.Deserialize(stream);
				if (!DataManager.GameVersionAllowed(text))
				{
					ScreenController.instance.HideLoadingView();
					yield break;
				}
				binaryFormatter.Deserialize(stream);
				DataManager.instance.properties.DoLoad(binaryFormatter, stream, text);
				EliObject.lastUsedID = DataManager.instance.properties.lastUsedID;
				object[] array = (object[])binaryFormatter.Deserialize(stream);
				DataManager.instance.allCoaches = (ListOfCoaches)array[0];
				DataManager.instance.allPlayers = (ListOfPlayers)array[1];
				DataManager.instance.allTeams = (ListOfAllTeams)array[2];
				DataManager.instance.allMatches = (ListOfMatches)array[3];
				DataManager.instance.allDivisions = (ListOfDivisions)array[4];
				DataManager.instance.allRegionalFederations = (ListOfRegionalFederations)array[5];
				DataManager.instance.allConfederations = (ListOfConfederations)array[6];
				DataManager.instance.allRegions = (ListOfRegions)array[7];
				DataManager.instance.allCountries = (ListOfCountries)array[8];
				DataManager.instance.tradedPlayers = (ListOfPlayers)array[9];
				DataManager.instance.allCompetitions = (ListOfCompetitions)array[10];
				DataManager.instance.allTeams.PostLoad();
				DataManager.instance.allPlayers.PostLoad();
				DataManager.instance.allCoaches.PostLoad();
				DataManager.instance.allMatches.PostLoad();
				DataManager.instance.allDivisions.PostLoad();
				DataManager.instance.allCountries.PostLoad();
				DataManager.instance.allCompetitions.PostLoad(text);
				DataManager.instance.SetLanguage();
				DataManager.instance.properties.AfterLoad(text);
			}
			DataManager.instance.allCountries.LoadFlags(dbCountries);
			DataManager.instance.allConfederations.LoadFlags(dbConfederations);
			DataManager.instance.StartLoadedGame();
			Close();
			DataManager.instance.saveFileName = GetFileName(filePath);
			PostLoadGame(text);
		}
		catch (Exception ex)
		{
			Debug.LogError("ERROR Loading - " + ex.Message);
			ScreenController.instance.HideLoadingView();
			string description = string.Format(errorLoadingMsgTemplate, ex.Message);
			ScreenController.instance.ShowInfoPopUp(description, null);
		}
	}

	private void PostLoadGame(string saveGameVersion)
	{
		RankingView.EraseSavedRankingAndFollows();
		DataManager.instance.SaveCoachGuids();
		DataManager.instance.allCountries.ComputeTargetSkills();
		DataManager.instance.allTeams.SetHistoryDataLength();
		DataManager.instance.myUnblockTeams.ApplyUnblockTeams(DataManager.instance.allTeams);
		if (saveGameVersion.CompareTo("20201110") <= 0)
		{
			DataManager.instance.allTeams.CheckCoachTeamPointers();
			DataManager.instance.allCoaches.CheckTeamPointers();
			foreach (Team allTeam in DataManager.instance.allTeams)
			{
				allTeam.UpdateMoneyRatio();
				allTeam.UpdateTotalSalaries();
				allTeam.SetInitialTicketPrice();
			}
		}
		DataManager.instance.CheckCoachesGuids();
	}

	public void CancelPressed()
	{
		if (newSavePanel.activeSelf)
		{
			newSavePanel.SetActive(value: false);
			return;
		}
		onBack?.Invoke();
		Close();
	}

	private string GetFileName(string filePath)
	{
		string text = filePath.Split('/', '\\')[^1];
		return text.Substring(0, text.Length - 4);
	}
}
