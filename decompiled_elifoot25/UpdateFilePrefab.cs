using System;
using UnityEngine;
using UnityEngine.UI;

public class UpdateFilePrefab : MonoBehaviour
{
	private struct GetFileForm
	{
		public string fileGuid;
	}

	public GameObject lockedIcon;

	public GameObject officialPackageIcon;

	public GameObject starPackageIcon;

	public GameObject alreadyDownloadedIcon;

	public Text title;

	public Text date;

	public GameObject authorTab;

	public Text authorName;

	public GameObject descriptionTab;

	public Text description;

	[Header("Scripts")]
	public DbTeams dbTeamsUpdate;

	public UpdatesRecorder updatesRecorder;

	private GetFileForm getFileForm;

	[Header("Internal")]
	[SerializeField]
	[ReadOnly]
	private string fileGuid;

	[SerializeField]
	[ReadOnly]
	private string dateAvailable;

	[SerializeField]
	[ReadOnly]
	private int fileVersion;

	private LoadingWithProgressView loadingWithProgressView;

	public void Initialize(string title, DateTime date, string author, string description, bool isLocked, bool isOfficial, bool isStar, bool alreadyDownloaded, string fileGuid, string dateAvailable, int fileVersion)
	{
		lockedIcon.SetActive(isLocked);
		officialPackageIcon.SetActive(isOfficial);
		starPackageIcon.SetActive(isStar);
		alreadyDownloadedIcon.SetActive(alreadyDownloaded);
		this.title.text = title;
		this.date.text = date.Day.ToString("00") + "/" + date.Month.ToString("00") + "/" + date.Year.ToString("0000");
		authorTab.SetActive(!string.IsNullOrEmpty(author) && author != "null");
		authorName.text = author;
		descriptionTab.SetActive(!string.IsNullOrEmpty(description) && description != "null");
		this.description.text = description;
		this.fileGuid = fileGuid;
		getFileForm.fileGuid = fileGuid;
		this.dateAvailable = dateAvailable;
		this.fileVersion = fileVersion;
	}

	public void DownloadButton()
	{
		if (lockedIcon.activeSelf)
		{
			ScreenController.instance.ShowInfoPopUp("WARNING_PREMIUM_ONLY", null);
		}
		else
		{
			ScreenController.instance.ShowDialogPopUp("PACKAGE_OPEN_CONFIRM", title.text, GetFileFromServer, null);
		}
	}

	private void GetFileFromServer()
	{
		Debug.Log("GetFileFromServer: " + fileGuid);
		if (Application.internetReachability == NetworkReachability.NotReachable)
		{
			NoInternetDetected();
			return;
		}
		Debug.Log("Has internet connection");
		Debug.Log("ShowLoadingWithProgressView");
		loadingWithProgressView = ScreenController.instance.ShowLoadingWithProgressView("WAIT_DOWNLOAD_TEAMS_PACKAGE", canCancel: true, StopLoad);
		try
		{
			StartCoroutine(Util.GetDbTeamsFile(this, getFileForm, UpdateProgressBar, LoadSuccess, LoadFailed));
		}
		catch (Exception arg)
		{
			Debug.LogError($"GetFileFromServer failed to start download for '{fileGuid}': {arg}");
			LoadFailed();
		}
	}

	private void UpdateProgressBar(float progressPercentage)
	{
		if (!(loadingWithProgressView == null))
		{
			loadingWithProgressView.UpdateProgress(progressPercentage);
		}
	}

	private void LoadSuccess(DbTeams teams)
	{
		if (teams == null)
		{
			Debug.LogError("LoadSuccess: downloaded teams object is null");
			LoadFailed();
			return;
		}
		Debug.Log($"LoadSuccess: received {teams.AllTeams?.Count ?? 0} teams, databaseVersion='{teams.databaseVersion}'");
		dbTeamsUpdate.SetEqualTo(teams);
		updatesRecorder.AddRecordedFile(fileGuid, dateAvailable, fileVersion);
		if (loadingWithProgressView != null)
		{
			loadingWithProgressView.Close();
		}
		StartCoroutine(LoadAndSavingTeams.instance.CheckSolveConflicts());
	}

	private void NoInternetDetected()
	{
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("ERROR_NETWORK_FAILED"), LanguageController.instance.Get_Translation("ERROR_RETRIEVING_FILE"), null);
		if (loadingWithProgressView != null)
		{
			loadingWithProgressView.Close();
		}
	}

	private void LoadFailed()
	{
		Debug.LogError("Download failed for package '" + fileGuid + "'");
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("ERROR_NETWORK_FAILED"), LanguageController.instance.Get_Translation("ERROR_READING_FILE"), null);
		if (loadingWithProgressView != null)
		{
			loadingWithProgressView.Close();
		}
	}

	private void StopLoad()
	{
		StopAllCoroutines();
		loadingWithProgressView.Close();
	}
}
