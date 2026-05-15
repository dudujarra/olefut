using System.Collections.Generic;
using System.IO;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class BugReportView : EliView
{
	private const string PREF_NAME = "BugReport.Name";

	private const string PREF_EMAIL = "BugReport.Email";

	private const int MAX_IMAGES = 5;

	[Header("Title")]
	public Text titleText;

	[Header("User info")]
	public Text nameLabel;

	public InputField nameInput;

	public Text emailLabel;

	public InputField emailInput;

	public Text rememberMeLabel;

	public Toggle rememberMeToggle;

	[Header("Report")]
	public Text typeLabel;

	public TMP_Dropdown typeDropdown;

	public Text summaryLabel;

	public InputField summaryInput;

	public Text summaryCountText;

	public Text descriptionLabel;

	public InputField descriptionInput;

	public Text descriptionCountText;

	[Header("Attach save")]
	public Text attachSaveLabel;

	public Toggle attachSaveToggle;

	public GameObject saveSelectionContainer;

	public TMP_Dropdown saveDropdown;

	[Header("Attach images")]
	public Text attachImagesLabel;

	public Toggle attachImagesToggle;

	public Button addImageButton;

	public TMP_Text addImageButtonText;

	public GameObject imagesContainer;

	public Transform imagesPreviewParent;

	public GameObject imagePreviewItemPrefab;

	[Header("Actions")]
	public TMP_Text sendButtonText;

	public Button sendButton;

	public Button closeButton;

	public GameObject debugButtonsContainer;

	private List<string> saveFilePaths = new List<string>();

	private List<string> attachedImagePaths = new List<string>();

	private List<GameObject> imagePreviewItems = new List<GameObject>();

	private List<Texture2D> imagePreviewTextures = new List<Texture2D>();

	private string lastZipPath;

	public void Initialize()
	{
		ResetView();
	}

	public override void ResetView()
	{
		base.ResetView();
		BugReportZipper.Cleanup();
		lastZipPath = null;
		DestroyAllImagePreviews();
		LanguageController instance = LanguageController.instance;
		titleText.text = instance.Get_Translation("BUGREPORT_TITLE");
		nameLabel.text = instance.Get_Translation("GEN_NAME");
		emailLabel.text = instance.Get_Translation("GEN_EMAIL");
		rememberMeLabel.text = instance.Get_Translation("BUGREPORT_REMEMBER_ME");
		typeLabel.text = instance.Get_Translation("BUGREPORT_TYPE");
		summaryLabel.text = instance.Get_Translation("BUGREPORT_SUMMARY");
		descriptionLabel.text = instance.Get_Translation("BUGREPORT_DESCRIPTION");
		attachSaveLabel.text = instance.Get_Translation("BUGREPORT_ATTACH_SAVE");
		attachImagesLabel.text = instance.Get_Translation("BUGREPORT_ATTACH_IMAGES");
		addImageButtonText.text = instance.Get_Translation("BUGREPORT_ADD_IMAGE");
		sendButtonText.text = instance.Get_Translation("BUGREPORT_SEND");
		nameInput.placeholder.GetComponent<Text>().text = instance.Get_Translation("BUGREPORT_PLACEHOLDER_NAME");
		emailInput.placeholder.GetComponent<Text>().text = instance.Get_Translation("BUGREPORT_PLACEHOLDER_EMAIL");
		summaryInput.placeholder.GetComponent<Text>().text = instance.Get_Translation("BUGREPORT_PLACEHOLDER_SUMMARY");
		descriptionInput.placeholder.GetComponent<Text>().text = instance.Get_Translation("BUGREPORT_PLACEHOLDER_DESCRIPTION");
		nameInput.characterLimit = 50;
		emailInput.characterLimit = 100;
		summaryInput.characterLimit = 50;
		descriptionInput.characterLimit = 800;
		descriptionInput.lineType = InputField.LineType.MultiLineNewline;
		nameInput.text = PlayerPrefs.GetString("BugReport.Name", "");
		emailInput.text = PlayerPrefs.GetString("BugReport.Email", "");
		rememberMeToggle.isOn = true;
		summaryInput.onValueChanged.RemoveAllListeners();
		summaryInput.onValueChanged.AddListener(delegate
		{
			RefreshSummaryCount();
		});
		descriptionInput.onValueChanged.RemoveAllListeners();
		descriptionInput.onValueChanged.AddListener(delegate
		{
			RefreshDescriptionCount();
		});
		RefreshSummaryCount();
		RefreshDescriptionCount();
		PopulateTypeDropdown();
		PopulateSaves();
		attachSaveToggle.isOn = false;
		saveSelectionContainer.SetActive(value: false);
		attachSaveToggle.onValueChanged.RemoveAllListeners();
		attachSaveToggle.onValueChanged.AddListener(delegate(bool on)
		{
			if (on && saveFilePaths.Count == 0)
			{
				attachSaveToggle.isOn = false;
				ScreenController.instance.ShowToastMessage("BUGREPORT_NO_SAVES", 240f, 4f);
			}
			else
			{
				saveSelectionContainer.SetActive(on);
			}
		});
		attachImagesToggle.gameObject.SetActive(value: false);
		addImageButton.gameObject.SetActive(value: false);
		imagesContainer.SetActive(value: false);
		sendButton.onClick.RemoveAllListeners();
		sendButton.onClick.AddListener(OnSendPressed);
		closeButton.onClick.RemoveAllListeners();
		closeButton.onClick.AddListener(ClosePressed);
		debugButtonsContainer.SetActive(value: false);
	}

	private void PopulateTypeDropdown()
	{
		LanguageController instance = LanguageController.instance;
		typeDropdown.ClearOptions();
		typeDropdown.AddOptions(new List<string>
		{
			instance.Get_Translation("BUGREPORT_TYPE_SUGGESTION"),
			instance.Get_Translation("BUGREPORT_TYPE_CRASH"),
			instance.Get_Translation("GEN_ERROR"),
			instance.Get_Translation("BUGREPORT_TYPE_VISUAL"),
			instance.Get_Translation("BUGREPORT_TYPE_COMPLAINT")
		});
		typeDropdown.value = 0;
		typeDropdown.RefreshShownValue();
	}

	private void PopulateSaves()
	{
		saveFilePaths.Clear();
		if (Directory.Exists(DataManager.SAVELOAD_PATH))
		{
			saveFilePaths.AddRange(Directory.GetFiles(DataManager.SAVELOAD_PATH, "*.bin"));
		}
		saveDropdown.ClearOptions();
		List<string> list = new List<string>();
		foreach (string saveFilePath in saveFilePaths)
		{
			list.Add(Path.GetFileNameWithoutExtension(saveFilePath));
		}
		if (list.Count <= 0)
		{
			list.Add(LanguageController.instance.Get_Translation("BUGREPORT_NO_SAVES"));
		}
		saveDropdown.AddOptions(list);
		saveDropdown.value = 0;
		saveDropdown.RefreshShownValue();
	}

	private void OnAddImagePressed()
	{
		if (attachedImagePaths.Count >= 5)
		{
			ScreenController.instance.ShowToastMessage("BUGREPORT_IMAGES_MAX", 240f, 4f, 5);
		}
		else if (NativeGallery.GetImageFromGallery(delegate(string path)
		{
			if (!string.IsNullOrEmpty(path) && File.Exists(path) && !attachedImagePaths.Contains(path) && attachedImagePaths.Count < 5)
			{
				AddImagePreview(path);
			}
		}) == NativeGallery.Permission.Denied)
		{
			ScreenController.instance.ShowToastMessage("BUGREPORT_IMAGE_PERMISSION_DENIED", 240f, 4f);
		}
	}

	private void AddImagePreview(string path)
	{
		Texture2D texture2D = NativeGallery.LoadImageAtPath(path, 256);
		if (texture2D == null)
		{
			Debug.LogWarning("[BugReportView] Failed to load image at " + path);
			return;
		}
		Sprite sprite = Sprite.Create(texture2D, new Rect(0f, 0f, texture2D.width, texture2D.height), new Vector2(0.5f, 0.5f));
		GameObject gameObject = Object.Instantiate(imagePreviewItemPrefab, imagesPreviewParent);
		gameObject.SetActive(value: true);
		Image componentInChildren = gameObject.GetComponentInChildren<Image>();
		componentInChildren.sprite = sprite;
		componentInChildren.preserveAspect = true;
		Button componentInChildren2 = gameObject.GetComponentInChildren<Button>();
		componentInChildren2.onClick.RemoveAllListeners();
		componentInChildren2.onClick.AddListener(delegate
		{
			RemoveImageAt(path);
		});
		attachedImagePaths.Add(path);
		imagePreviewItems.Add(gameObject);
		imagePreviewTextures.Add(texture2D);
		RefreshImagesContainerVisibility();
	}

	private void RemoveImageAt(string path)
	{
		int num = attachedImagePaths.IndexOf(path);
		if (num >= 0)
		{
			DestroyPreviewAt(num);
			attachedImagePaths.RemoveAt(num);
			imagePreviewItems.RemoveAt(num);
			imagePreviewTextures.RemoveAt(num);
			RefreshImagesContainerVisibility();
		}
	}

	private void DestroyPreviewAt(int idx)
	{
		Object.Destroy(imagePreviewItems[idx]);
		Object.Destroy(imagePreviewTextures[idx]);
	}

	private void DestroyAllImagePreviews()
	{
		for (int i = 0; i < imagePreviewItems.Count; i++)
		{
			DestroyPreviewAt(i);
		}
		attachedImagePaths.Clear();
		imagePreviewItems.Clear();
		imagePreviewTextures.Clear();
	}

	private void RefreshImagesContainerVisibility()
	{
		imagesContainer.SetActive(attachImagesToggle.isOn && attachedImagePaths.Count > 0);
	}

	private void RefreshSummaryCount()
	{
		summaryCountText.text = $"{summaryInput.text.Length}/{summaryInput.characterLimit}";
	}

	private void RefreshDescriptionCount()
	{
		descriptionCountText.text = $"{descriptionInput.text.Length}/{descriptionInput.characterLimit}";
	}

	private bool ValidateForm()
	{
		if (nameInput.text.Trim().Length == 0)
		{
			ScreenController.instance.ShowToastMessage("BUGREPORT_NAME_REQUIRED", 240f, 4f);
			return false;
		}
		if (!Util.IsValidEmail(emailInput.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("EMAIL_NOT_VALID", 240f, 4f);
			return false;
		}
		if (summaryInput.text.Trim().Length == 0)
		{
			ScreenController.instance.ShowToastMessage("BUGREPORT_SUMMARY_REQUIRED", 240f, 4f);
			return false;
		}
		if (descriptionInput.text.Trim().Length == 0)
		{
			ScreenController.instance.ShowToastMessage("BUGREPORT_DESCRIPTION_REQUIRED", 240f, 4f);
			return false;
		}
		return true;
	}

	private void PersistRememberMe()
	{
		if (rememberMeToggle.isOn)
		{
			PlayerPrefs.SetString("BugReport.Name", nameInput.text);
			PlayerPrefs.SetString("BugReport.Email", emailInput.text);
		}
		else
		{
			PlayerPrefs.DeleteKey("BugReport.Name");
			PlayerPrefs.DeleteKey("BugReport.Email");
		}
		PlayerPrefs.Save();
	}

	private void OnSendPressed()
	{
		if (!ValidateForm())
		{
			return;
		}
		PersistRememberMe();
		string zipPath = lastZipPath;
		if (attachSaveToggle.isOn && saveFilePaths.Count > 0 && string.IsNullOrEmpty(zipPath))
		{
			if (!BugReportZipper.ZipSave(saveFilePaths[saveDropdown.value], out zipPath, out var error))
			{
				ScreenController.instance.ShowToastMessage("BUGREPORT_ZIP_FAIL", 240f, 4f, error);
				return;
			}
			lastZipPath = zipPath;
		}
		else if (!attachSaveToggle.isOn)
		{
			zipPath = null;
		}
		List<string> list = new List<string>();
		if (!string.IsNullOrEmpty(zipPath))
		{
			list.Add(zipPath);
		}
		if (attachImagesToggle.isOn)
		{
			list.AddRange(attachedImagePaths);
		}
		string text = typeDropdown.options[typeDropdown.value].text;
		string text2 = summaryInput.text.Trim();
		string subject = "Bug Report: " + text + " / " + text2;
		string body = "Nome: " + nameInput.text.Trim() + "\nEmail: " + emailInput.text.Trim() + "\nTipo: " + text + "\nSumário: " + text2 + "\n\nDescrição:\n" + descriptionInput.text.Trim() + "\n\n---\n" + SystemInfoHelper.BuildPlainText();
		BugReportSender.Send(subject, body, list);
	}

	public void ClosePressed()
	{
		PersistRememberMe();
		BugReportZipper.Cleanup();
		DestroyAllImagePreviews();
		Close();
	}
}
