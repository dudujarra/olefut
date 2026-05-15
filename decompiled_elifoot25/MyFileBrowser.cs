using System;
using System.IO;
using UnityEngine;
using UnityEngine.UI;

public class MyFileBrowser : EliView
{
	public delegate void OnPathSelected(string path);

	public DbTeams teamsUpdated;

	public RectTransform canvas;

	public Text title;

	public InputField currentPathField;

	public ScrollRect contentWindow;

	public Transform list;

	public GameObject ContentItem;

	public Text inputSelection;

	public Button selectionButton;

	public AddTargetGraphics selectionButtonAddedGraphics;

	private OnPathSelected _return;

	private readonly float defaultItemSize = 0.05f;

	private bool _fullPath;

	private string _lockPath;

	private string fileName;

	private string _selectionMode = "F";

	private bool _save;

	private string _selectedItem;

	private string _selectionType;

	private bool _open;

	private string[] _extension;

	[SerializeField]
	private MyFileBrowserController myFileBrowserController;

	public void SetBrowserWindow(OnPathSelected selectionReturn, string iniPath = "", bool fullPath = false, string fileName = "", string selectionMode = "F", bool save = false, string lockPath = "", string[] extension = null)
	{
		_selectionMode = selectionMode;
		_return = selectionReturn;
		_lockPath = FileManagement.NormalizePath(lockPath);
		string path = FileManagement.NormalizePath(iniPath);
		currentPathField.text = FileManagement.Combine(_lockPath, path);
		_fullPath = fullPath;
		this.fileName = fileName;
		_save = save;
		_extension = extension;
		ResetView();
		ShowFolderContent();
		Invoke("UpdateSelectedItem", 0.01f);
	}

	public override void ResetView()
	{
		base.ResetView();
		if (_selectionMode == "F")
		{
			title.text = LanguageController.instance.Get_Translation("EDITOR_SELECT_FILE");
		}
		else
		{
			title.text = LanguageController.instance.Get_Translation("EDITOR_SELECT FOLDER");
		}
	}

	private void ShowFolderContent()
	{
		_selectedItem = "";
		EnableSelectButton();
		while (list.childCount > 0)
		{
			list.GetChild(0).GetComponent<ContentItem>().Delete();
		}
		currentPathField.text = FileManagement.NormalizePath(currentPathField.text);
		if (currentPathField.text == "" && _fullPath)
		{
			string[] array = FileManagement.ListLogicalDrives();
			for (int i = 0; i < array.Length; i++)
			{
				InstantiateContentItem(array[i], "D");
			}
		}
		else
		{
			string[] array2 = FileManagement.ListDirectories(currentPathField.text, checkSA: true, _fullPath);
			if (array2 != null)
			{
				for (int j = 0; j < array2.Length; j++)
				{
					if (!array2[j].StartsWith(".", StringComparison.Ordinal))
					{
						InstantiateContentItem(array2[j], "D");
					}
				}
			}
			string[] array3 = null;
			if (_extension != null)
			{
				array3 = FileManagement.ListFiles(currentPathField.text, _extension, checkSA: true, _fullPath);
			}
			if (array3 != null && _selectionMode == "F")
			{
				for (int k = 0; k < array3.Length; k++)
				{
					InstantiateContentItem(array3[k], "F");
				}
			}
			if (array2 == null)
			{
				if (FileManagement.DirectoryExists(currentPathField.text))
				{
					InstantiateContentItem("Access denied", "I");
				}
				else
				{
					InstantiateContentItem("Folder not exists", "I");
				}
			}
			else if (array2.Length == 0 && (array3 == null || array3.Length == 0))
			{
				InstantiateContentItem("Folder is empty", "I");
			}
		}
		SetContentSize();
		contentWindow.verticalNormalizedPosition = 1f;
	}

	private void InstantiateContentItem(string itemName, string itemType)
	{
		UnityEngine.Object.Instantiate(ContentItem).GetComponent<ContentItem>().SetItem(list, itemName, itemType);
	}

	private void EnableSelectButton()
	{
		inputSelection.text = FileManagement.NormalizePath(inputSelection.text);
		_selectionType = "";
		if (_selectionMode == "D" && currentPathField.text != "" && _save)
		{
			ActivateButton();
		}
		else
		{
			DeactivateButton();
		}
	}

	public void GoToParentFolder()
	{
		currentPathField.text = FileManagement.NormalizePath(currentPathField.text);
		string parentDirectory = FileManagement.GetParentDirectory(currentPathField.text);
		currentPathField.text = parentDirectory;
		CorrectInputPath();
	}

	public void CorrectInputPath()
	{
		if (!_fullPath)
		{
			currentPathField.text = currentPathField.text.Replace("..", "");
			currentPathField.text = currentPathField.text.Replace("/.", "");
		}
		currentPathField.text = FileManagement.NormalizePath(currentPathField.text);
		if (!currentPathField.text.StartsWith(_lockPath, StringComparison.Ordinal))
		{
			currentPathField.text = _lockPath;
		}
		ShowFolderContent();
	}

	public void ReturnSelectedFile()
	{
		currentPathField.text = FileManagement.NormalizePath(currentPathField.text);
		inputSelection.text = FileManagement.NormalizePath(inputSelection.text);
		if (_selectionType == "D")
		{
			GoToNextFolder();
		}
		else if (_selectionType == "F")
		{
			if (_selectionMode == "F")
			{
				string path = FileManagement.Combine(currentPathField.text, inputSelection.text);
				_return(FileManagement.NormalizePath(path));
				CloseWithoutCallback();
			}
		}
		else
		{
			if (!(_selectionType == "") || !(_selectionMode == "D") || !(currentPathField.text != "") || !_save)
			{
				return;
			}
			string path2 = FileManagement.NormalizePath(currentPathField.text);
			if (File.Exists(path2 + "/" + fileName))
			{
				Action a = delegate
				{
					_return(path2);
				};
				a = (Action)Delegate.Combine(a, new Action(CloseWithoutCallback));
				ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("EDITOR_FILE_OVERWRITE_TITLE"), LanguageController.instance.Get_Translation("EDITOR_FILE_OVERWRITE_CONFIRM", fileName), a, null);
			}
			else
			{
				_return(path2);
				CloseWithoutCallback();
			}
		}
	}

	public void GoToNextFolder()
	{
		currentPathField.text = FileManagement.NormalizePath(currentPathField.text);
		currentPathField.text = FileManagement.Combine(currentPathField.text, _selectedItem);
		ShowFolderContent();
		UpdateSelectedItem("", "");
	}

	public void CloseFileBrowser()
	{
		CloseWithoutCallback();
		myFileBrowserController.onClose?.Invoke();
	}

	private void CloseWithoutCallback()
	{
		if (myFileBrowserController != null && myFileBrowserController.shareScreenshot != null)
		{
			myFileBrowserController.shareScreenshot.afterShareCallback?.Invoke();
		}
		while (list.childCount > 0)
		{
			list.GetChild(0).GetComponent<ContentItem>().Delete();
		}
		Close();
	}

	private void UpdateSelectedItem()
	{
		UpdateSelectedItem("", "");
	}

	public void UpdateSelectedItem(string item, string type)
	{
		_selectionType = type;
		if (_selectionType == _selectionMode)
		{
			inputSelection.text = item;
			_selectedItem = item;
			ActivateButton();
		}
		else if (_selectionType == "D")
		{
			if (!_save)
			{
				inputSelection.text = "";
			}
			_selectedItem = item;
			ActivateButton();
		}
		else
		{
			inputSelection.text = "";
			_selectedItem = "";
			if (_selectionMode == "F")
			{
				DeactivateButton();
			}
		}
	}

	private void ActivateButton()
	{
		selectionButton.interactable = true;
		selectionButtonAddedGraphics.ChangeToNormalState();
	}

	private void DeactivateButton()
	{
		selectionButton.interactable = false;
		selectionButtonAddedGraphics.ChangeToDisabledState();
	}

	public void SetContentSize()
	{
		float num = canvas.rect.height * defaultItemSize;
		list.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, (float)list.childCount * num);
	}
}
