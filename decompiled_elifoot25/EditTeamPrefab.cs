using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.UI.Extensions.ColorPicker;

public class EditTeamPrefab : EliView
{
	[Header("Header")]
	public Text headerText;

	[Header("Top")]
	public InputField fullNameField;

	public InputField coachField;

	[Header("Logo & Shirt")]
	public GameObject teamLogoGameObject;

	public GameObject removeLogoButton;

	public Image teamLogo;

	public GameObject noLogoGameOject;

	public Image teamShirt;

	public ColorImage teamShirtColorImage;

	public Sprite defaultShirt;

	public GameObject fileBrowserPrefab;

	[Header("Team colors")]
	public InputField shortNameField;

	public Image backColor;

	public Text textColor;

	public ColorPickerControl leftBackColor;

	public ColorPickerControl rightTextColor;

	[Header("Slider")]
	public Text levelText;

	public Slider levelSlider;

	[Header("Flags")]
	public RectTransform countryTransform;

	public Image countryFlag;

	public Text countryText;

	public GameObject regionGameObject;

	public Image regionFlag;

	public Text regionText;

	public Sprite DefaultFlag;

	[Header("Footer")]
	public Button deleteButton;

	public AddTargetGraphics deleteButtonAddedGraphics;

	public Button vButton;

	public AddTargetGraphics vButtonAddedGraphics;

	[Header("Add on PopUps")]
	public GameObject areYouSure;

	public GameObject countryRegionTeamPopUp;

	public GameObject errorLoadingPhoto;

	[Header("Scripts")]
	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbCountries countries;

	[HideInInspector]
	public CountryRegionTeamPopUp countryRegionTeamInstantiated;

	[HideInInspector]
	public MyFileBrowserController myFileBrowserControllerInstantiated;

	private Action onClose;

	private Action onTeamUpdate;

	private Action onTeamDeleted;

	private int teamIndex;

	private int countryIndex;

	private int regionIndex;

	private bool alreadyAskedGalleryAccess;

	private bool logoPhotoWasLoaded;

	public void Initialize(int teamIndex, Action onClose, Action onTeamUpdate, Action onTeamDeleted, int countryIndex = -1, int regionIndex = -1)
	{
		if (DataManager.instance.dbTeamsMode == DataManager.DbTeamsMode.PackageMode)
		{
			teams = teamsPackage;
		}
		this.teamIndex = teamIndex;
		this.onClose = onClose;
		this.onTeamUpdate = onTeamUpdate;
		this.onTeamDeleted = onTeamDeleted;
		levelSlider.maxValue = DataManager.TEAM_INIT_SKILL_MAX;
		levelSlider.minValue = DataManager.TEAM_INIT_SKILL_MIN;
		fullNameField.characterLimit = DataManager.TEAM_FULL_NAME_LENGTH_MAX;
		coachField.characterLimit = DataManager.COACH_NAME_LENGTH_MAX;
		shortNameField.characterLimit = DataManager.TEAM_SHORT_NAME_LENGTH_MAX;
		if (teamIndex != -1)
		{
			headerText.text = LanguageController.instance.Get_Translation("EDITOR_EDIT_TEAM_TITLE");
			DbTeams.DbTeam dbTeam = teams.AllTeams[this.teamIndex];
			this.countryIndex = dbTeam.CountryIndex;
			this.regionIndex = dbTeam.RegionIndex;
			PutTeamInfo(dbTeam.longName, dbTeam.coach, dbTeam.Logo, dbTeam.Shirt, dbTeam.usesStandardShirt, dbTeam.shortName, dbTeam.backColor, dbTeam.textColor, dbTeam.level);
		}
		else
		{
			headerText.text = LanguageController.instance.Get_Translation("EDITOR_NEW_TEAM");
			deleteButton.interactable = false;
			vButton.interactable = false;
			Invoke("DisableButtons", 0.01f);
			this.countryIndex = countryIndex;
			this.regionIndex = regionIndex;
			PutTeamInfo("", "", null, defaultShirt, usesstandardshirt: true, "", Color.white, Color.white, 50);
		}
		ResetView();
	}

	private void DisableButtons()
	{
		deleteButtonAddedGraphics.ChangeToDisabledState();
		vButtonAddedGraphics.ChangeToDisabledState();
	}

	public override void ResetView()
	{
		base.ResetView();
		SelectedCountryAndRegion(countryIndex, regionIndex);
	}

	private void PutTeamInfo(string longname, string coach, Sprite logo, Sprite shirt, bool usesstandardshirt, string shortname, Color backcolor, Color textcolor, int level)
	{
		fullNameField.text = longname;
		coachField.text = coach;
		teamLogo.sprite = logo;
		if (teamLogo.sprite == null)
		{
			RemoveLogo();
		}
		teamShirt.sprite = shirt;
		teamShirt.color = (usesstandardshirt ? backcolor : Color.white);
		if (!usesstandardshirt)
		{
			teamShirtColorImage.OnDestroy();
		}
		shortNameField.text = shortname;
		backColor.color = backcolor;
		textColor.color = textcolor;
		leftBackColor.CurrentColor = backColor.color;
		rightTextColor.CurrentColor = textColor.color;
		levelSlider.value = level;
		levelText.text = LanguageController.instance.Get_Translation("TEAM_INIT_LEVEL_X", level);
	}

	public void SelectedCountryAndRegion(int countryIndex, int regionIndex = -1)
	{
		this.countryIndex = countryIndex;
		this.regionIndex = regionIndex;
		if (countryIndex != -1)
		{
			DbCountries.DbCountry dbCountry = countries.allCountries[countryIndex];
			int num = ((dbCountry.regions.Count > 0) ? (-190) : 0);
			ChangeCountryAndPosition(countryIndex, num);
			regionGameObject.SetActive(dbCountry.regions.Count > 0);
			if (dbCountry.regions.Count > 0)
			{
				regionFlag.sprite = countries.GetRegionFlag(countryIndex, regionIndex);
				if (this.regionIndex == -1)
				{
					regionText.text = "...";
				}
				else
				{
					DbCountries.DbRegion dbRegion = countries.allCountries[countryIndex].regions[regionIndex];
					regionText.text = dbRegion.fullName;
				}
			}
		}
		else
		{
			int num2 = 0;
			ChangeCountryAndPosition(countryIndex, num2);
			regionGameObject.SetActive(value: false);
		}
		CheckValidChoices();
	}

	private void ChangeCountryAndPosition(int countryIndex, float position)
	{
		if (countryIndex != -1)
		{
			countryTransform.localPosition = new Vector2(position, countryTransform.localPosition.y);
			countryFlag.sprite = countries.GetCountryFlag(countryIndex);
			countryText.text = countries.allCountries[countryIndex].Name;
		}
		else
		{
			countryTransform.localPosition = new Vector2(position, countryTransform.localPosition.y);
			countryFlag.sprite = DefaultFlag;
			countryText.text = LanguageController.instance.Get_Translation("Select country");
		}
	}

	public void CheckValidChoices()
	{
		if (fullNameField.text != "" && coachField.text != "" && shortNameField.text != "" && countryIndex != -1)
		{
			vButton.interactable = true;
			vButtonAddedGraphics.ChangeToNormalState();
		}
		else
		{
			vButton.interactable = false;
			vButtonAddedGraphics.ChangeToDisabledState();
		}
	}

	public void RemoveLogo()
	{
		teamLogo.sprite = null;
		teamLogoGameObject.SetActive(value: false);
		removeLogoButton.SetActive(value: false);
		noLogoGameOject.SetActive(value: true);
	}

	public void ChangeLogo()
	{
		try
		{
			alreadyAskedGalleryAccess = false;
			LoadGallery();
		}
		catch (Exception ex)
		{
			Debug.LogError(ex.Message);
		}
	}

	public void LoadGallery()
	{
		try
		{
			NativeGallery.GetImageFromGallery(delegate(string path)
			{
				if (path != null)
				{
					Texture2D texture2D = NativeGallery.LoadImageAtPath(path);
					if (texture2D == null)
					{
						Debug.LogError("Couldn't load texture from " + path);
					}
					else
					{
						Sprite sprite = Sprite.Create(texture2D, new Rect(0f, 0f, texture2D.width, texture2D.height), new Vector2(0.5f, 0.5f));
						PhotoLoaded(sprite);
					}
				}
			});
			if (NativeGallery.RequestPermission(NativeGallery.PermissionType.Read, NativeGallery.MediaType.Image) != NativeGallery.Permission.Granted)
			{
				ScreenController.instance.ShowDialogPopUp("Permission not granted", "##Please give permissions to Elifoot to read media library!", null);
			}
		}
		catch (Exception ex)
		{
			Debug.LogError(ex.Message);
		}
	}

	public void PhotoLoaded(Sprite sprite)
	{
		logoPhotoWasLoaded = true;
		teamLogo.sprite = sprite;
		if (teamLogo.sprite != null)
		{
			teamLogoGameObject.SetActive(value: true);
			removeLogoButton.SetActive(value: true);
			noLogoGameOject.SetActive(value: false);
		}
	}

	public void ErrorLoadingPhoto()
	{
		errorLoadingPhoto.SetActive(value: true);
	}

	public void CloseErrorLoadingPhotoPopUp()
	{
		errorLoadingPhoto.SetActive(value: false);
	}

	public void RevertColors()
	{
		Color currentColor = leftBackColor.CurrentColor;
		leftBackColor.CurrentColor = rightTextColor.CurrentColor;
		rightTextColor.CurrentColor = currentColor;
	}

	public void ChangeLevel()
	{
		levelText.text = LanguageController.instance.Get_Translation("TEAM_INIT_LEVEL_X", levelSlider.value.ToString("0"));
	}

	public void ChangeCountry()
	{
		countryRegionTeamInstantiated = UnityEngine.Object.Instantiate(countryRegionTeamPopUp, base.transform).GetComponent<CountryRegionTeamPopUp>();
		countryRegionTeamInstantiated.InitializedByEditTeam(CountryRegionTeamPopUp.Type.Country, this);
	}

	public void ChangeRegion()
	{
		if (countryIndex != -1)
		{
			countryRegionTeamInstantiated = UnityEngine.Object.Instantiate(countryRegionTeamPopUp, base.transform).GetComponent<CountryRegionTeamPopUp>();
			countryRegionTeamInstantiated.InitializedByEditTeam(CountryRegionTeamPopUp.Type.Region, this, countryIndex);
		}
	}

	public override void Close()
	{
		base.Close();
		onClose?.Invoke();
	}

	private void SaveAndClose(bool onUpdate = false, bool onDelete = false)
	{
		LoadAndSavingTeams.instance.RedoValidTeamFlags();
		LoadAndSavingTeams.instance.RedoNumberOfTeams(isUpdated: false);
		LoadAndSavingTeams.instance.SaveTeams();
		if (onUpdate)
		{
			onTeamUpdate?.Invoke();
		}
		if (onDelete)
		{
			onTeamDeleted?.Invoke();
		}
		Close();
	}

	public void ConfirmChanges()
	{
		SaveTeam();
		SaveAndClose(onUpdate: true);
	}

	private void SaveTeam()
	{
		if (teamIndex != -1)
		{
			DbTeams.DbTeam dbTeam = teams.AllTeams[teamIndex];
			DbTeams.DbTeam value = CreateTeam(dbTeam.teamID, dbTeam.PreviousTeamIDs, dbTeam.teamVersion, dbTeam.usesStandardShirt, dbTeam.players);
			teams.AllTeams[teamIndex] = value;
		}
		else
		{
			DbTeams.DbTeam item = CreateTeam(Guid.NewGuid().ToString(), new List<string>(), "", defaultShirt, new List<DbTeams.DbPlayer>());
			teams.AllTeams.Add(item);
			teamIndex = teams.AllTeams.Count - 1;
		}
	}

	private Texture2D DuplicateTexture(Texture2D source)
	{
		RenderTexture temporary = RenderTexture.GetTemporary(source.width, source.height, 0, RenderTextureFormat.Default, RenderTextureReadWrite.Linear);
		Graphics.Blit(source, temporary);
		RenderTexture active = RenderTexture.active;
		RenderTexture.active = temporary;
		Texture2D texture2D = new Texture2D(source.width, source.height);
		texture2D.ReadPixels(new Rect(0f, 0f, temporary.width, temporary.height), 0, 0);
		texture2D.Apply();
		RenderTexture.active = active;
		RenderTexture.ReleaseTemporary(temporary);
		return texture2D;
	}

	private DbTeams.DbTeam CreateTeam(string teamID, List<string> previousTeamIDs, string teamversion, bool usesStandardShirt, List<DbTeams.DbPlayer> players)
	{
		byte[] savedLogoBytes = null;
		if (logoPhotoWasLoaded && teamLogo.sprite != null)
		{
			Texture2D texture2D = DuplicateTexture(teamLogo.sprite.texture);
			savedLogoBytes = texture2D.EncodeToPNG();
			UnityEngine.Object.Destroy(texture2D);
		}
		return new DbTeams.DbTeam
		{
			teamVersion = teamversion,
			longName = fullNameField.text,
			shortName = shortNameField.text,
			teamID = teamID,
			PreviousTeamIDs = previousTeamIDs,
			CountryIndex = countryIndex,
			countryCode = countries.allCountries[countryIndex].code,
			RegionIndex = regionIndex,
			regionCode = ((regionIndex != -1) ? countries.allCountries[countryIndex].regions[regionIndex].code : ""),
			level = (int)levelSlider.value,
			coach = coachField.text,
			textColor = textColor.color,
			backColor = backColor.color,
			Logo = teamLogo.sprite,
			savedLogoBytes = savedLogoBytes,
			Shirt = teamShirt.sprite,
			usesStandardShirt = usesStandardShirt,
			players = players,
			wasEdited = true
		};
	}

	public void DeleteTeam()
	{
		areYouSure.SetActive(value: true);
	}

	public void CloseDeleteTeam()
	{
		areYouSure.SetActive(value: false);
	}

	public void ConfirmDeleteTeam()
	{
		teams.AllTeams.RemoveAt(teamIndex);
		SaveAndClose(onUpdate: false, onDelete: true);
	}

	public override void Update()
	{
		base.Update();
		if (Input.GetKeyDown(KeyCode.Escape))
		{
			Back();
		}
	}

	private void Back()
	{
		if (areYouSure.activeSelf)
		{
			CloseDeleteTeam();
		}
		else if (countryRegionTeamInstantiated != null)
		{
			countryRegionTeamInstantiated.Back();
		}
		else if (myFileBrowserControllerInstantiated != null)
		{
			myFileBrowserControllerInstantiated.fileBrowser.CloseFileBrowser();
		}
		else
		{
			Close();
		}
	}
}
