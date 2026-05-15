using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class ContentItem : MonoBehaviour
{
	public Sprite[] icons;

	private Toggle toggle;

	private Text nameLabel;

	private FileBrowser browser;

	private MyFileBrowser myBrowser;

	private string _type;

	private float doubleClickTimeLimit = 0.3f;

	private bool clickedOnce;

	private float count;

	public void SetItem(Transform parent, string name, string type, bool thumb = false)
	{
		_type = type;
		base.transform.SetParent(parent, worldPositionStays: false);
		toggle = base.gameObject.GetComponent<Toggle>();
		toggle.group = parent.GetComponent<ToggleGroup>();
		nameLabel = base.transform.Find("Label").GetComponent<Text>();
		nameLabel.text = name;
		Image component = base.transform.Find("Icon").GetComponent<Image>();
		switch (type)
		{
		case "I":
			component.sprite = icons[0];
			toggle.interactable = false;
			break;
		case "D":
			component.sprite = icons[1];
			break;
		case "F":
			switch (FileManagement.GetFileExtension(name).ToLower())
			{
			case ".txt":
			case ".doc":
				component.sprite = icons[3];
				break;
			case ".bmp":
			case ".jpg":
			case ".png":
				if (thumb)
				{
					string file = FileManagement.Combine(parent.root.GetComponent<FileBrowser>().GetCurrentPath(), name);
					component.sprite = FileManagement.ImportSprite(file);
				}
				else
				{
					component.sprite = icons[4];
				}
				break;
			case ".wav":
			case ".mp3":
			case ".ogg":
				component.sprite = icons[5];
				break;
			default:
				component.sprite = icons[2];
				break;
			}
			break;
		}
		browser = parent.root.GetComponent<FileBrowser>();
		if (browser == null)
		{
			myBrowser = parent.parent.parent.parent.parent.parent.parent.GetComponent<MyFileBrowser>();
		}
	}

	public void SetSelectedItem()
	{
		if (toggle.isOn)
		{
			if (browser != null)
			{
				browser.UpdateSelectedItem(nameLabel.text, _type);
			}
			else
			{
				myBrowser.UpdateSelectedItem(nameLabel.text, _type);
			}
			StartCoroutine(ClickEvent());
		}
		else if (clickedOnce)
		{
			StartCoroutine(ClickEvent());
		}
		else
		{
			myBrowser.UpdateSelectedItem(nameLabel.text, "");
		}
	}

	public void Delete()
	{
		toggle.group = null;
		base.transform.SetParent(null);
		Object.Destroy(base.gameObject);
	}

	public IEnumerator ClickEvent()
	{
		if (!clickedOnce && count < doubleClickTimeLimit)
		{
			clickedOnce = true;
			yield return new WaitForEndOfFrame();
			while (count < doubleClickTimeLimit)
			{
				if (!clickedOnce)
				{
					count = 0f;
					DoubleClick();
					clickedOnce = false;
					yield break;
				}
				count += Time.deltaTime;
				yield return null;
			}
			count = 0f;
			SingleClick();
			clickedOnce = false;
		}
		else
		{
			clickedOnce = false;
		}
	}

	private void DoubleClick()
	{
		if (browser != null)
		{
			if (_type == "D")
			{
				browser.GoToNextFolder();
			}
			else
			{
				browser.ReturnSelectedFile();
			}
		}
		else if (_type == "D")
		{
			myBrowser.GoToNextFolder();
		}
		else
		{
			myBrowser.ReturnSelectedFile();
		}
	}

	private void SingleClick()
	{
	}
}
