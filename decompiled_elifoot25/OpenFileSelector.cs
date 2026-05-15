using UnityEngine;
using UnityEngine.UI;

public class OpenFileSelector : MonoBehaviour
{
	public GameObject fileBrowser;

	private GameObject browserInstance;

	public Sprite captionIcon;

	private InputField selectionLabel;

	private Toggle fullPath;

	private Dropdown mode;

	private Toggle save;

	private InputField iniPath;

	private InputField lockPath;

	private InputField defaultName;

	private void Start()
	{
		Transform transform = base.transform.parent.Find("PanelShow");
		fullPath = transform.Find("ToggleFullPath").GetComponent<Toggle>();
		mode = transform.Find("Dropdown").GetComponent<Dropdown>();
		save = transform.Find("ToggleSave").GetComponent<Toggle>();
		iniPath = transform.Find("InputIniPath").GetComponent<InputField>();
		lockPath = transform.Find("InputLockPath").GetComponent<InputField>();
		defaultName = transform.Find("InputDefaultName").GetComponent<InputField>();
		selectionLabel = base.transform.Find("FilePathLabel").GetComponent<InputField>();
	}

	private void OnPathSelected(string path)
	{
		selectionLabel.text = path;
	}

	public void OpenFileBrowser()
	{
		if (browserInstance == null)
		{
			browserInstance = Object.Instantiate(fileBrowser);
			browserInstance.GetComponent<FileBrowser>().SetBrowserWindow(OnPathSelected, iniPath.text, fullPath.isOn, mode.captionText.text.Substring(0, 1), save.isOn, lockPath.text, defaultName.text);
			browserInstance.GetComponent<FileBrowser>().SetBrowserIcon(captionIcon, Color.white);
		}
	}

	public void SetDefaultPath()
	{
		if (fullPath.isOn)
		{
			iniPath.text = Application.persistentDataPath;
		}
		else
		{
			iniPath.text = "";
		}
	}
}
