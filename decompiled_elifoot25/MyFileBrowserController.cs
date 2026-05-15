using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

[RequireComponent(typeof(MyFileBrowser))]
public class MyFileBrowserController : MonoBehaviour
{
	private enum FileBrowserMode
	{
		browsingForSharedTeams,
		browsingForLogoPhoto,
		savingTeamsFile,
		savingScreenshot
	}

	public DbTeams teamsUpdated;

	private FileBrowserMode fileBrowserMode;

	[HideInInspector]
	public MyFileBrowser fileBrowser;

	private EditTeamsView editTeamsView20;

	private EditTeamPrefab editTeamPrefab;

	[HideInInspector]
	public ShareScreenshot shareScreenshot;

	private readonly string screenshotFileName = "Elifoot_Screenshot.jpg";

	private bool alreadyAskedGalleryAccess;

	public Action onClose;

	public void InitializeLoadSharedTeams(EditTeamsView editTeamsView20, Action onClose)
	{
		this.editTeamsView20 = editTeamsView20;
		this.onClose = onClose;
		fileBrowserMode = FileBrowserMode.browsingForSharedTeams;
		Initialize();
	}

	public void InitializeLoadLogoImage(EditTeamPrefab editTeamPrefab, Action onClose)
	{
		this.editTeamPrefab = editTeamPrefab;
		this.onClose = onClose;
		fileBrowserMode = FileBrowserMode.browsingForLogoPhoto;
		Initialize();
	}

	public void InitializeShareTeams(EditTeamsView editTeamsView20, Action onClose)
	{
		this.editTeamsView20 = editTeamsView20;
		this.onClose = onClose;
		fileBrowserMode = FileBrowserMode.savingTeamsFile;
		Initialize();
	}

	public void InitializeShareScreenshot(ShareScreenshot shareScreenshot)
	{
		this.shareScreenshot = shareScreenshot;
		fileBrowserMode = FileBrowserMode.savingScreenshot;
		Initialize();
	}

	private void Initialize()
	{
		fileBrowser = GetComponent<MyFileBrowser>();
		ElifootOptions.ReadOptions();
		OpenInStandaloneWindows();
	}

	private void OpenInAndroid()
	{
		alreadyAskedGalleryAccess = false;
		RequestPermission();
	}

	private void RequestPermission()
	{
	}

	private void OpenInIOS()
	{
		DefineInitialMobile(3, new List<string>());
	}

	private void DefineInitialMobile(int numberSlashes, List<string> startingDirectories)
	{
		string lockPath = GetLockPath(numberSlashes);
		switch (fileBrowserMode)
		{
		case FileBrowserMode.browsingForSharedTeams:
		{
			string startingPath = GetStartingPath(startingDirectories, lockPath, ElifootOptions.pathSharingTeams);
			fileBrowser.SetBrowserWindow(OnPathSelected, startingPath, fullPath: true, "", "F", save: false, lockPath, LoadAndSavingTeams.instance.COMPATIBLE_FILE_VERSIONS);
			break;
		}
		case FileBrowserMode.browsingForLogoPhoto:
		{
			string startingPath = GetStartingPath(startingDirectories, lockPath, ElifootOptions.pathSharingScreenshots);
			fileBrowser.SetBrowserWindow(OnPathSelected, startingPath, fullPath: true, "", "F", save: false, lockPath, new string[2] { ".png", ".jpg" });
			break;
		}
		case FileBrowserMode.savingTeamsFile:
		{
			string startingPath = GetStartingPath(startingDirectories, lockPath, ElifootOptions.pathSharingTeams);
			fileBrowser.SetBrowserWindow(OnPathSelected, startingPath, fullPath: true, teamsUpdated.fileName + "." + teamsUpdated.fileFormat, "D", save: true, lockPath);
			break;
		}
		case FileBrowserMode.savingScreenshot:
		{
			string startingPath = GetStartingPath(startingDirectories, lockPath, ElifootOptions.pathSharingScreenshots);
			fileBrowser.SetBrowserWindow(OnPathSelected, startingPath, fullPath: true, screenshotFileName, "D", save: true, lockPath);
			break;
		}
		default:
			throw new Exception("Doing not defined in MyFileBrowserController");
		}
	}

	private string GetLockPath(int numberSlashes)
	{
		string text = Application.persistentDataPath;
		string[] array = text.Split('/');
		if (array.Length >= numberSlashes)
		{
			text = "";
			for (int i = 0; i < numberSlashes; i++)
			{
				text = text + array[i] + "/";
			}
		}
		return text;
	}

	private string GetStartingPath(List<string> startingDirectories, string lockPath, string lastPath)
	{
		if (!string.IsNullOrEmpty(lastPath))
		{
			return lastPath;
		}
		string text = lockPath;
		for (int i = 0; i < startingDirectories.Count; i++)
		{
			if (HasFolderInDirectory(startingDirectories[i], lockPath))
			{
				text = text + "/" + startingDirectories[i];
				break;
			}
		}
		return text;
	}

	private bool HasFolderInDirectory(string folderName, string directory)
	{
		string[] array = FileManagement.ListDirectories(directory, checkSA: true, fullPath: true);
		if (array != null)
		{
			for (int i = 0; i < array.Length; i++)
			{
				if (array[i] == folderName)
				{
					return true;
				}
			}
		}
		return false;
	}

	private void OpenInEditor()
	{
		OpenInStandaloneOSX();
	}

	private void OpenInStandaloneOSX()
	{
		DefineInitialStandalone();
	}

	private void OpenInStandaloneWindows()
	{
		DefineInitialStandalone();
	}

	private void DefineInitialStandalone()
	{
		if (editTeamsView20 != null && editTeamsView20.autoCreatePackages && fileBrowserMode == FileBrowserMode.savingTeamsFile)
		{
			OnPathSelected(GetStandaloneStartingPath(ElifootOptions.pathSharingTeams));
			UnityEngine.Object.Destroy(base.gameObject);
			return;
		}
		switch (fileBrowserMode)
		{
		case FileBrowserMode.browsingForSharedTeams:
		{
			string standaloneStartingPath = GetStandaloneStartingPath(ElifootOptions.pathSharingTeams);
			fileBrowser.SetBrowserWindow(OnPathSelected, standaloneStartingPath, fullPath: true, "", "F", save: false, "", LoadAndSavingTeams.instance.COMPATIBLE_FILE_VERSIONS);
			break;
		}
		case FileBrowserMode.browsingForLogoPhoto:
		{
			string standaloneStartingPath = GetStandaloneStartingPath(ElifootOptions.pathSharingScreenshots);
			fileBrowser.SetBrowserWindow(OnPathSelected, standaloneStartingPath, fullPath: true, "", "F", save: false, "", new string[2] { ".png", ".jpg" });
			break;
		}
		case FileBrowserMode.savingTeamsFile:
		{
			string standaloneStartingPath = GetStandaloneStartingPath(ElifootOptions.pathSharingTeams);
			fileBrowser.SetBrowserWindow(OnPathSelected, standaloneStartingPath, fullPath: true, teamsUpdated.fileName + "." + teamsUpdated.fileFormat, "D", save: true);
			break;
		}
		case FileBrowserMode.savingScreenshot:
		{
			string standaloneStartingPath = GetStandaloneStartingPath(ElifootOptions.pathSharingScreenshots);
			fileBrowser.SetBrowserWindow(OnPathSelected, standaloneStartingPath, fullPath: true, screenshotFileName, "D", save: true);
			break;
		}
		default:
			throw new Exception("Doing not defined in MyFileBrowserController");
		}
	}

	private string GetStandaloneStartingPath(string lastPath)
	{
		if (!string.IsNullOrEmpty(lastPath))
		{
			return lastPath;
		}
		return Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
	}

	private void OnPathSelected(string path)
	{
		switch (fileBrowserMode)
		{
		case FileBrowserMode.browsingForSharedTeams:
			LoadAndSavingTeams.instance.LoadSharedFile(path);
			RecordFilePath(Path.GetDirectoryName(path), dealingWithTeams: true);
			break;
		case FileBrowserMode.browsingForLogoPhoto:
			LoadAndShowLogo(path);
			RecordFilePath(path, dealingWithTeams: false);
			break;
		case FileBrowserMode.savingTeamsFile:
			SaveFile(path);
			RecordFilePath(path, dealingWithTeams: true);
			break;
		case FileBrowserMode.savingScreenshot:
			SaveScreenshotFile(path);
			RecordFilePath(path, dealingWithTeams: false);
			break;
		default:
			throw new Exception("Doing not defined in MyFileBrowserController");
		}
	}

	private void LoadAndShowLogo(string path)
	{
		byte[] data;
		try
		{
			data = File.ReadAllBytes(path);
		}
		catch (Exception ex)
		{
			Debug.LogError("Error reading file: " + ex.Message);
			editTeamPrefab.ErrorLoadingPhoto();
			return;
		}
		Texture2D texture2D = new Texture2D(2, 2);
		if (texture2D.LoadImage(data))
		{
			if (texture2D.width == 8 && texture2D.height == 8)
			{
				UnityEngine.Object.Destroy(texture2D);
				editTeamPrefab.ErrorLoadingPhoto();
			}
			else
			{
				editTeamPrefab.PhotoLoaded(Sprite.Create(texture2D, new Rect(0f, 0f, texture2D.width, texture2D.height), new Vector2(0.5f, 0.5f), 100f));
			}
		}
		else
		{
			UnityEngine.Object.Destroy(texture2D);
			editTeamPrefab.ErrorLoadingPhoto();
		}
	}

	private void SaveFile(string path)
	{
		string text = path + "/" + teamsUpdated.fileName + "." + teamsUpdated.fileFormat;
		try
		{
			string contents = JsonUtility.ToJson(teamsUpdated);
			File.WriteAllText(text, contents);
		}
		catch (Exception arg)
		{
			Debug.LogError($"SaveFile failed for '{text}': {arg}");
			string description = LanguageController.instance.Get_Translation("EDITOR_ERROR_SAVING_FILE", text);
			ScreenController.instance.ShowInfoPopUp(description, null);
			return;
		}
		editTeamsView20.CloseSharing();
		string title = LanguageController.instance.Get_Translation("EDITOR_FILE_SAVED_TITLE");
		string text2 = LanguageController.instance.Get_Translation("EDITOR_FILE_SAVED_TEXT", teamsUpdated.fileName, path);
		if (editTeamsView20.autoCreatePackages)
		{
			Debug.Log(text2);
		}
		else
		{
			ScreenController.instance.ShowDialogPopUp(title, text2, null);
		}
	}

	private void SaveScreenshotFile(string path)
	{
		File.WriteAllBytes(path + "/" + screenshotFileName, shareScreenshot.screenshotImage.EncodeToJPG());
		UnityEngine.Object.Destroy(shareScreenshot.screenshotImage);
		shareScreenshot.afterShareCallback?.Invoke();
		string description = LanguageController.instance.Get_Translation("EDITOR_FILE_SAVED_TEXT", screenshotFileName, path);
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("EDITOR_FILE_SAVED_TITLE"), description, null);
	}

	private void RecordFilePath(string path, bool dealingWithTeams)
	{
		string[] array = path.Split('/');
		path = "";
		for (int i = 0; i < array.Length; i++)
		{
			path = path + array[i] + "/";
		}
		path = path.TrimEnd('/');
		if (dealingWithTeams)
		{
			ElifootOptions.pathSharingTeams = path;
			PlayerPrefs.SetString("pathSharingTeams", path);
		}
		else
		{
			ElifootOptions.pathSharingScreenshots = path;
		}
		ElifootOptions.SaveOptions();
	}
}
