using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

public class UpdatesView : EliView
{
	[Serializable]
	public struct UpdateFile
	{
		public int serverNumber;

		public string title;

		public string desc;

		public string author;

		public string fileGuid;

		public string dateAvailable;

		public DateTime date;

		public int locked;

		public int officialPackage;

		public int starPackage;

		public int fileVersion;

		public void ConvertDate()
		{
			try
			{
				string[] array = dateAvailable.Split('T')[0].Split('-');
				int year = int.Parse(array[0]);
				int month = int.Parse(array[1]);
				int day = int.Parse(array[2]);
				string[] array2 = dateAvailable.Split('T')[1].Split(':');
				int hour = int.Parse(array2[0]);
				int minute = int.Parse(array2[1]);
				int second = int.Parse(array2[2]);
				date = new DateTime(year, month, day, hour, minute, second);
			}
			catch (Exception ex)
			{
				Debug.LogWarning("ConvertDate failed for '" + dateAvailable + "': " + ex.Message);
			}
		}
	}

	private struct GetDownloadsForm
	{
		public int limitRecords;

		public int fileType;
	}

	public enum SortFieldDownloads
	{
		ServerOrder,
		Title,
		Author,
		Date,
		Locked,
		Official,
		Star
	}

	public enum SortOrder
	{
		Ascending,
		Descending
	}

	public RectTransform list;

	public UpdateFilePrefab prefab;

	[Space]
	public Toggle alreadyDownloadedToggle;

	public Text txtSortField;

	public Text txtSortOrder;

	public RectTransform arrowRotation;

	[Header("Scripts")]
	public UpdatesRecorder updatesRecorder;

	private List<UpdateFile> updateFiles;

	private GetDownloadsForm getDownloadsForm;

	public SortFieldDownloads sortField;

	public SortOrder sortOrder;

	private bool[] sortFieldSelected;

	public void Initialize()
	{
		LoadSortOptions();
		ClearList();
		GetDownloadsFromServer();
	}

	private void LoadSortOptions()
	{
		ElifootOptions.ReadOptions();
		sortField = (SortFieldDownloads)Mathf.Clamp(ElifootOptions.fileSortFieldEnum, 0, Enum.GetValues(typeof(SortFieldDownloads)).Length);
		sortOrder = (SortOrder)Mathf.Clamp(ElifootOptions.fileSortOrderEnum, 0, Enum.GetValues(typeof(SortOrder)).Length);
		alreadyDownloadedToggle.SetIsOnWithoutNotify(ElifootOptions.showDownloadedFiles);
		FillSortHeaders();
	}

	private void GetDownloadsFromServer()
	{
		ScreenController.instance.ShowLoadingView("WAIT_UPDATES");
		getDownloadsForm.limitRecords = 50;
		getDownloadsForm.fileType = 1;
		try
		{
			string url = ElifootUrlManager.GetCommandUrl("getdownloads") + "&nocrypt=1&nocs=1&json=1";
			StartCoroutine(Util.Call<GetDownloadsForm, UpdateFile>(this, url, getDownloadsForm, LoadSuccess, LoadFailed));
		}
		catch (Exception arg)
		{
			Debug.LogError($"GetDownloadsFromServer failed: {arg}");
			LoadFailed();
		}
	}

	private void LoadSuccess(UpdateFile[] updateFiles)
	{
		if (updateFiles == null || updateFiles.Length == 0)
		{
			LoadFailed();
		}
		else
		{
			SaveUpdateFiles(updateFiles);
			FillList();
		}
		ScreenController.instance.HideLoadingView();
	}

	private void SaveUpdateFiles(UpdateFile[] updateFiles)
	{
		for (int i = 0; i < updateFiles.Length; i++)
		{
			updateFiles[i].serverNumber = i;
			updateFiles[i].ConvertDate();
		}
		this.updateFiles = updateFiles.ToList();
	}

	private void LoadFailed()
	{
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("ERROR_NETWORK_FAILED"), LanguageController.instance.Get_Translation("ERROR_GETTING_UPDATES"), null);
		ScreenController.instance.HideLoadingView();
		Close();
	}

	private void ClearList()
	{
		for (int i = 0; i < list.childCount; i++)
		{
			UnityEngine.Object.Destroy(list.GetChild(i).gameObject);
		}
	}

	public void FillList()
	{
		ClearList();
		updateFiles.Sort(BySortOrderAndField);
		foreach (UpdateFile updateFile in updateFiles)
		{
			bool flag = updatesRecorder.CheckAlreadyDownloaded(updateFile.fileGuid, updateFile.dateAvailable, updateFile.fileVersion);
			if (alreadyDownloadedToggle.isOn || !flag)
			{
				UnityEngine.Object.Instantiate(prefab, list, worldPositionStays: false).Initialize(updateFile.title, updateFile.date, updateFile.author, updateFile.desc, updateFile.locked == 1, updateFile.officialPackage == 1, updateFile.starPackage == 1, flag, updateFile.fileGuid, updateFile.dateAvailable, updateFile.fileVersion);
			}
		}
		LayoutRebuilder.ForceRebuildLayoutImmediate(list);
	}

	public void ShowRecordedDownloadedFiles()
	{
		ElifootOptions.showDownloadedFiles = alreadyDownloadedToggle.isOn;
		SaveOptionsAndRefresh();
	}

	private int BySortOrderAndField(UpdateFile file1, UpdateFile file2)
	{
		if (sortOrder == SortOrder.Descending)
		{
			UpdateFile updateFile = file1;
			file1 = file2;
			file2 = updateFile;
		}
		return sortField switch
		{
			SortFieldDownloads.ServerOrder => file1.serverNumber.CompareTo(file2.serverNumber), 
			SortFieldDownloads.Title => file1.title.CompareTo(file2.title), 
			SortFieldDownloads.Author => file1.author.CompareTo(file2.author), 
			SortFieldDownloads.Date => file1.date.CompareTo(file2.date), 
			SortFieldDownloads.Locked => file2.locked.CompareTo(file1.locked), 
			SortFieldDownloads.Official => file2.officialPackage.CompareTo(file1.officialPackage), 
			SortFieldDownloads.Star => file2.starPackage.CompareTo(file1.starPackage), 
			_ => file1.serverNumber.CompareTo(file2.serverNumber), 
		};
	}

	private void FillSortHeaders()
	{
		txtSortField.text = LanguageController.instance.Get_Translation("SORT_FIELD_DOWNLOAD_" + sortField.ToString().ToUpper());
		txtSortOrder.text = LanguageController.instance.Get_Translation("SORT_ORDER_" + sortOrder.ToString().ToUpper());
		bool flag = sortOrder == SortOrder.Ascending;
		arrowRotation.eulerAngles = new Vector3(0f, 0f, flag ? 180 : 0);
	}

	public void OnSortFieldClick()
	{
		if ((int)sortField < Enum.GetNames(typeof(SortFieldDownloads)).Length - 1)
		{
			sortField++;
		}
		else
		{
			sortField = SortFieldDownloads.ServerOrder;
		}
		SaveSortOptionsAndRefresh();
	}

	public void OnSortOrderClick()
	{
		bool flag = sortOrder == SortOrder.Ascending;
		sortOrder = (flag ? SortOrder.Descending : SortOrder.Ascending);
		SaveSortOptionsAndRefresh();
	}

	private void SaveSortOptionsAndRefresh()
	{
		ElifootOptions.fileSortFieldEnum = (int)sortField;
		ElifootOptions.fileSortOrderEnum = (int)sortOrder;
		SaveOptionsAndRefresh();
	}

	private void SaveOptionsAndRefresh()
	{
		ElifootOptions.SaveOptions();
		FillSortHeaders();
		FillList();
	}

	public void OnSortFieldAllOptions()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		ManageSortFields(Util.ManageOption.CreateParameter, ref listOfParameters);
		ScreenController.instance.ShowParameterEditor("ID:SORT_FIELD_TITLE", listOfParameters, OnSortFieldSelected, showLoadingView: false);
	}

	private void OnSortFieldSelected(ListOfParameters listOfParameters)
	{
		ManageSortFields(Util.ManageOption.ReadParameter, ref listOfParameters);
		sortField = (SortFieldDownloads)Array.FindIndex(sortFieldSelected, (bool x) => x);
		SaveSortOptionsAndRefresh();
	}

	private void ManageSortFields(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		if (mode == Util.ManageOption.CreateParameter)
		{
			sortFieldSelected = new bool[Enum.GetValues(typeof(SortFieldDownloads)).Length];
			sortFieldSelected[(int)sortField] = true;
		}
		for (int i = 0; i < sortFieldSelected.Length; i++)
		{
			SortFieldDownloads sortFieldDownloads = (SortFieldDownloads)i;
			string text = sortFieldDownloads.ToString();
			string displayName = LanguageController.instance.Get_Translation("SORT_FIELD_DOWNLOAD_" + text.ToUpper());
			sortFieldSelected[i] = (bool)Util.ManageOneOption(mode, text, displayName, null, null, sortFieldSelected[i], false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.RadioButton, EliParameterPermissions.EditablePublic);
		}
	}
}
