using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class FileBrowser : MonoBehaviour
{
	public delegate void OnPathSelected(string path);

	private delegate void ConfirmationAction();

	private RectTransform canvas;

	private Transform browserUI;

	private InputField currentPath;

	private Transform content;

	private InputField inputSelection;

	private Button selectionButton;

	private Text selectionButtonLabel;

	private Dropdown filterDropdown;

	private Slider sizeSlider;

	private ScrollRect contentWindow;

	private Text caption;

	private Image captionIcon;

	private OnPathSelected _return;

	private List<string> navHistory = new List<string>();

	private bool browsingHistory;

	private int navIndex;

	public int minWidth = 400;

	public int minHeight = 300;

	public GameObject ContentItem;

	[SerializeField]
	private float defaultItemSize = 0.05f;

	[SerializeField]
	private List<string> filter;

	[SerializeField]
	private bool _fullPath;

	[SerializeField]
	private string _lockPath = "";

	[SerializeField]
	private string _selectionMode = "F";

	[SerializeField]
	private bool _save;

	private string _selectedItem = "";

	private string _selectionType;

	private bool _open;

	private GameObject confirmation;

	private Text confirmLabel;

	private GameObject newNameWindow;

	private Text newNameLabel;

	private InputField inputNewName;

	private GameObject errorMessage;

	private Text errorMsgLabel;

	private string sourcePath;

	private string sourceType;

	private bool moveSourcePath;

	private ConfirmationAction _action;

	private void Awake()
	{
		canvas = base.gameObject.GetComponent<RectTransform>();
		browserUI = base.transform.Find("BrowserWindow");
		currentPath = browserUI.Find("InputCurrentPath").GetComponent<InputField>();
		content = browserUI.Find("ContentWindow").Find("Viewport").Find("Content");
		contentWindow = browserUI.Find("ContentWindow").GetComponent<ScrollRect>();
		inputSelection = browserUI.Find("InputSelection").GetComponent<InputField>();
		selectionButton = browserUI.Find("ButtonSelect").GetComponent<Button>();
		selectionButtonLabel = selectionButton.transform.Find("Text").GetComponent<Text>();
		caption = browserUI.Find("Caption").GetComponent<Text>();
		confirmation = browserUI.Find("Confirmation").gameObject;
		confirmLabel = confirmation.transform.Find("Label").GetComponent<Text>();
		confirmation.SetActive(value: false);
		newNameWindow = browserUI.Find("NewName").gameObject;
		newNameLabel = newNameWindow.transform.Find("Label").GetComponent<Text>();
		inputNewName = newNameWindow.transform.Find("InputNewName").GetComponent<InputField>();
		newNameWindow.SetActive(value: false);
		errorMessage = browserUI.Find("ErrorMessage").gameObject;
		errorMsgLabel = errorMessage.transform.Find("Label").GetComponent<Text>();
		errorMessage.SetActive(value: false);
		Transform transform;
		if ((bool)(transform = browserUI.Find("Icon")))
		{
			captionIcon = transform.GetComponent<Image>();
		}
		if ((bool)(transform = browserUI.Find("SizeSlider")))
		{
			sizeSlider = transform.GetComponent<Slider>();
		}
		if ((bool)(transform = browserUI.Find("FilterDropdown")))
		{
			filterDropdown = transform.GetComponent<Dropdown>();
		}
		SetBrowserWindow(null);
	}

	private void LateUpdate()
	{
		SetContentSize();
	}

	public void SetBrowserWindow(OnPathSelected selectionReturn, string iniPath = "", bool fullPath = false, string selectionMode = "F", bool save = false, string lockPath = "", string defaultSelection = "")
	{
		_selectionMode = selectionMode;
		_return = selectionReturn;
		_lockPath = FileManagement.NormalizePath(lockPath);
		string path = FileManagement.NormalizePath(iniPath);
		currentPath.text = FileManagement.Combine(_lockPath, path);
		_fullPath = fullPath;
		_save = save;
		inputSelection.interactable = _save;
		navHistory.Clear();
		RememberPath();
		ShowFolderContent(defaultSelection);
		if (_save)
		{
			inputSelection.text = defaultSelection;
		}
	}

	public void SetBrowserCaption(string title)
	{
		caption.text = title;
	}

	public void SetBrowserCaption(string title, Color32 colour)
	{
		caption.text = title;
		caption.color = colour;
	}

	public void SetBrowserIcon(Sprite icon)
	{
		if (captionIcon != null)
		{
			captionIcon.sprite = icon;
		}
	}

	public void SetBrowserIcon(Sprite icon, Color32 colour)
	{
		if (captionIcon != null)
		{
			captionIcon.sprite = icon;
			captionIcon.color = colour;
		}
	}

	public void SetBrowserWindowFilter(List<string> newFilter)
	{
		filter = newFilter;
		if (filter.Count > 1)
		{
			string item = string.Join(";", newFilter.ToArray());
			filter.Insert(0, item);
		}
		filterDropdown.ClearOptions();
		filterDropdown.AddOptions(filter);
		CorrectInputPath();
	}

	public void SetBrowserWindowFilter(string[] newFilter)
	{
		SetBrowserWindowFilter(new List<string>(newFilter));
	}

	public void SetBrowserWindowFilter(string newFilter)
	{
		SetBrowserWindowFilter(newFilter.Split(';'));
	}

	public void ReturnSelectedFile()
	{
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		inputSelection.text = FileManagement.NormalizePath(inputSelection.text);
		if (!_open && inputSelection.text != "" && (_selectionType == _selectionMode || _save))
		{
			if (_return != null)
			{
				string path = FileManagement.Combine(currentPath.text, inputSelection.text);
				_return(FileManagement.NormalizePath(path));
			}
			CloseFileBrowser();
		}
		else
		{
			GoToNextFolder();
		}
	}

	public void CloseFileBrowser()
	{
		Object.Destroy(base.gameObject);
	}

	private void ShowFolderContent(string defaultSelection = "")
	{
		_selectedItem = "";
		EnableSelectButton();
		int num = 0;
		while (content.childCount > 0)
		{
			content.GetChild(0).GetComponent<ContentItem>().Delete();
		}
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		if (currentPath.text == "" && _fullPath)
		{
			string[] array = FileManagement.ListLogicalDrives();
			for (int i = 0; i < array.Length; i++)
			{
				GameObject gameObject = Object.Instantiate(ContentItem);
				gameObject.GetComponent<ContentItem>().SetItem(content, array[i], "D");
				if (defaultSelection == array[i] && _selectionMode == "D")
				{
					gameObject.GetComponent<Toggle>().isOn = true;
				}
			}
			num += array.Length;
		}
		else
		{
			string[] array2 = FileManagement.ListDirectories(currentPath.text, checkSA: true, _fullPath);
			if (array2 != null)
			{
				for (int j = 0; j < array2.Length; j++)
				{
					GameObject gameObject2 = Object.Instantiate(ContentItem);
					gameObject2.GetComponent<ContentItem>().SetItem(content, array2[j], "D");
					if (defaultSelection == array2[j] && _selectionMode == "D")
					{
						gameObject2.GetComponent<Toggle>().isOn = true;
					}
				}
				num += array2.Length;
			}
			string[] array3 = filter.ToArray();
			if (filterDropdown != null)
			{
				array3 = filterDropdown.captionText.text.Split(';');
			}
			string[] array4 = FileManagement.ListFiles(currentPath.text, array3, checkSA: true, _fullPath);
			if (array4 != null && _selectionMode == "F")
			{
				for (int k = 0; k < array4.Length; k++)
				{
					GameObject gameObject3 = Object.Instantiate(ContentItem);
					gameObject3.GetComponent<ContentItem>().SetItem(content, array4[k], "F");
					if (defaultSelection == array4[k] && _selectionMode == "F")
					{
						gameObject3.GetComponent<Toggle>().isOn = true;
					}
				}
				num += array4.Length;
			}
			if (array2 == null)
			{
				if (FileManagement.DirectoryExists(currentPath.text))
				{
					Object.Instantiate(ContentItem).GetComponent<ContentItem>().SetItem(content, "Access denied", "I");
					num = 1;
				}
				else
				{
					Object.Instantiate(ContentItem).GetComponent<ContentItem>().SetItem(content, "Folder not exists", "I");
					num = 1;
				}
			}
			else if (array2.Length == 0 && array4.Length == 0)
			{
				Object.Instantiate(ContentItem).GetComponent<ContentItem>().SetItem(content, "Folder is empty", "I");
				num = 1;
			}
		}
		SetContentSize();
		contentWindow.verticalNormalizedPosition = 1f;
	}

	public void SetContentSize()
	{
		float num = canvas.rect.height * defaultItemSize;
		if (sizeSlider != null)
		{
			num = canvas.rect.height * sizeSlider.value;
		}
		content.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, (float)content.childCount * num);
	}

	public void CorrectInputPath()
	{
		if (!_fullPath)
		{
			currentPath.text = currentPath.text.Replace("..", "");
			currentPath.text = currentPath.text.Replace("/.", "");
		}
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		if (!currentPath.text.StartsWith(_lockPath))
		{
			currentPath.text = _lockPath;
		}
		ShowFolderContent();
		RememberPath();
	}

	public void GoToParentFolder()
	{
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		string parentDirectory = FileManagement.GetParentDirectory(currentPath.text);
		currentPath.text = parentDirectory;
		CorrectInputPath();
	}

	public void GoToNextFolder()
	{
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		currentPath.text = FileManagement.Combine(currentPath.text, _selectedItem);
		ShowFolderContent();
		RememberPath();
	}

	private void RememberPath()
	{
		if (!browsingHistory && (FileManagement.DirectoryExists(currentPath.text, checkSA: true, _fullPath) || currentPath.text == ""))
		{
			if (navHistory.Count == 0)
			{
				navHistory.Add(currentPath.text);
				navIndex = navHistory.Count - 1;
			}
			else if (currentPath.text != navHistory[navHistory.Count - 1])
			{
				navIndex++;
				if (navIndex < navHistory.Count)
				{
					navHistory.Insert(navIndex, currentPath.text);
					navHistory.RemoveRange(navIndex + 1, navHistory.Count - navIndex - 1);
				}
				else
				{
					navHistory.Add(currentPath.text);
					navIndex = navHistory.Count - 1;
				}
			}
		}
		browsingHistory = false;
	}

	public void BrowseBack()
	{
		browsingHistory = true;
		navIndex--;
		if (navIndex < 0)
		{
			navIndex = 0;
		}
		currentPath.text = navHistory[navIndex];
		CorrectInputPath();
	}

	public void BrowseFwd()
	{
		browsingHistory = true;
		navIndex++;
		if (navIndex == navHistory.Count)
		{
			navIndex--;
		}
		currentPath.text = navHistory[navIndex];
		CorrectInputPath();
	}

	public void UpdateSelectedItem(string item, string type)
	{
		_selectionType = type;
		if (_selectionType == _selectionMode)
		{
			inputSelection.text = item;
			_selectedItem = item;
			if (_save)
			{
				selectionButtonLabel.text = "Save";
			}
			else
			{
				selectionButtonLabel.text = "Select";
			}
			selectionButton.interactable = true;
			_open = false;
		}
		else if (_selectionType == "D")
		{
			if (!_save)
			{
				inputSelection.text = "";
			}
			_selectedItem = item;
			selectionButtonLabel.text = "Open";
			selectionButton.interactable = true;
			_open = true;
		}
		else
		{
			inputSelection.text = "";
			_selectedItem = "";
			selectionButtonLabel.text = "Select";
			selectionButton.interactable = false;
			_open = false;
		}
	}

	public void EnableSelectButton()
	{
		inputSelection.text = FileManagement.NormalizePath(inputSelection.text);
		selectionButton.interactable = false;
		if (_save && inputSelection.text != "")
		{
			selectionButtonLabel.text = "Save";
			selectionButton.interactable = true;
			_open = false;
		}
	}

	public string GetCurrentPath()
	{
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		return currentPath.text;
	}

	public void OnDrag(BaseEventData eventData)
	{
		if (eventData is PointerEventData pointerEventData)
		{
			Vector3 position = browserUI.position;
			position.x += pointerEventData.delta.x;
			position.y += pointerEventData.delta.y;
			browserUI.position = position;
		}
	}

	public void OnResize(BaseEventData eventData)
	{
		if (eventData is PointerEventData pointerEventData)
		{
			RectTransform component = browserUI.GetComponent<RectTransform>();
			float num = canvas.rect.width / (float)Screen.width;
			Vector2 offsetMax = component.offsetMax;
			Vector2 offsetMin = component.offsetMin;
			component.offsetMax = new Vector2(component.offsetMax.x + pointerEventData.delta.x * num, component.offsetMax.y);
			component.offsetMin = new Vector2(component.offsetMin.x, component.offsetMin.y + pointerEventData.delta.y * num);
			Rect rect = component.rect;
			if (rect.width < (float)minWidth)
			{
				component.offsetMax = offsetMax;
			}
			if (rect.height < (float)minHeight)
			{
				component.offsetMin = offsetMin;
			}
		}
	}

	public void PromptDeleteSelection()
	{
		if (!(_selectedItem != ""))
		{
			return;
		}
		string folder = FileManagement.Combine(currentPath.text, _selectedItem);
		string selectionType = _selectionType;
		if (!(selectionType == "F"))
		{
			if (selectionType == "D")
			{
				if (FileManagement.DirectoryExists(folder, checkSA: false, _fullPath))
				{
					confirmLabel.text = "Delete this folder and all of its content? " + _selectedItem;
					confirmation.SetActive(value: true);
					_action = DeleteFolder;
				}
				else
				{
					PromtErrorMessage("Can't delete. The folder is read only (" + _selectedItem + ").");
				}
			}
		}
		else if (FileManagement.FileExists(folder, checkSA: false, _fullPath))
		{
			confirmLabel.text = "Delete this file permanently? " + _selectedItem;
			confirmation.SetActive(value: true);
			_action = DeleteFile;
		}
		else
		{
			PromtErrorMessage("Can't delete. The file is read only (" + _selectedItem + ").");
		}
	}

	private void DeleteFile()
	{
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		FileManagement.DeleteFile(FileManagement.Combine(currentPath.text, _selectedItem), _fullPath);
		Cancel();
	}

	private void DeleteFolder()
	{
		currentPath.text = FileManagement.NormalizePath(currentPath.text);
		FileManagement.DeleteDirectory(FileManagement.Combine(currentPath.text, _selectedItem), _fullPath);
		Cancel();
	}

	public void PromptNewFolderName()
	{
		newNameWindow.SetActive(value: true);
		newNameLabel.text = "Plase write the new folder name:";
		inputNewName.ActivateInputField();
		inputNewName.text = "";
		_action = NewFolder;
	}

	private void NewFolder()
	{
		if (inputNewName.text != "")
		{
			currentPath.text = FileManagement.NormalizePath(currentPath.text);
			FileManagement.CreateDirectory(FileManagement.Combine(currentPath.text, inputNewName.text));
			inputNewName.text = "";
			newNameWindow.SetActive(value: false);
			Cancel();
		}
	}

	public void PromptForRename()
	{
		if (_selectedItem != "")
		{
			string folder = FileManagement.Combine(currentPath.text, _selectedItem);
			if (!FileManagement.FileExists(folder, checkSA: false, _fullPath) && _selectionType == "F")
			{
				PromtErrorMessage("Can't rename. The file is read only (" + _selectedItem + ").");
				return;
			}
			if (!FileManagement.DirectoryExists(folder, checkSA: false, _fullPath) && _selectionType == "D")
			{
				PromtErrorMessage("Can't rename. The folder is read only (" + _selectedItem + ").");
				return;
			}
			newNameWindow.SetActive(value: true);
			newNameLabel.text = "Plase write a new name for: " + _selectedItem;
			inputNewName.ActivateInputField();
			inputNewName.text = _selectedItem;
			_action = Rename;
		}
	}

	private void Rename()
	{
		if (inputNewName.text != "")
		{
			currentPath.text = FileManagement.NormalizePath(currentPath.text);
			string source = FileManagement.Combine(currentPath.text, _selectedItem);
			string dest = FileManagement.Combine(currentPath.text, inputNewName.text);
			FileManagement.Rename(source, dest, _fullPath, _fullPath);
			Cancel();
		}
	}

	private void PromtErrorMessage(string msg)
	{
		errorMsgLabel.text = msg;
		errorMessage.SetActive(value: true);
		_action = Cancel;
	}

	public void Confirm()
	{
		_action();
	}

	public void Cancel()
	{
		if (confirmation.activeInHierarchy)
		{
			confirmation.SetActive(value: false);
		}
		if (newNameWindow.activeInHierarchy)
		{
			newNameWindow.SetActive(value: false);
		}
		if (errorMessage.activeInHierarchy)
		{
			errorMessage.SetActive(value: false);
		}
		ShowFolderContent();
	}

	public void Cut()
	{
		if (_selectedItem != "")
		{
			string text = FileManagement.Combine(currentPath.text, _selectedItem);
			if (!FileManagement.FileExists(text, checkSA: false, _fullPath) && _selectionType == "F")
			{
				PromtErrorMessage("Can't cut. The file is read only (" + _selectedItem + ").");
				return;
			}
			if (!FileManagement.DirectoryExists(text, checkSA: false, _fullPath) && _selectionType == "D")
			{
				PromtErrorMessage("Can't cut. The folder is read only (" + _selectedItem + ").");
				return;
			}
			sourceType = _selectionType;
			sourcePath = FileManagement.NormalizePath(text);
			moveSourcePath = true;
		}
	}

	public void Copy()
	{
		if (_selectedItem != "")
		{
			sourcePath = FileManagement.Combine(currentPath.text, _selectedItem);
			sourcePath = FileManagement.NormalizePath(sourcePath);
			sourceType = _selectionType;
			moveSourcePath = false;
		}
	}

	public void Paste()
	{
		string path = FileManagement.Combine(currentPath.text, FileManagement.GetFileName(sourcePath));
		path = FileManagement.NormalizePath(path);
		if (sourcePath != path)
		{
			if (moveSourcePath)
			{
				FileManagement.Move(sourcePath, path, _fullPath, _fullPath);
			}
			else if (sourceType == "F")
			{
				FileManagement.CopyFile(sourcePath, path, checkSA: true, _fullPath, _fullPath);
			}
			else if (sourceType == "D")
			{
				FileManagement.CopyDirectory(sourcePath, path, checkSA: true, _fullPath, _fullPath);
			}
			ShowFolderContent();
		}
	}
}
