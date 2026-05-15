using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Analytics;
using UnityEngine.Networking;
using UnityEngine.UI;

public class MenuManager : EliView
{
	private struct ExtrasAvailable(Button button, bool available)
	{
		public Button button = button;

		public bool mayUpgrade = available;
	}

	[Header("Logo")]
	public Image menuLogo;

	[Header("Control texts")]
	public Text registerText;

	public Text impersonationText;

	public Text versionText;

	public Text betaVersionText;

	[Header("Purchase Images")]
	public Image premiumIcon;

	public Image unionIcon;

	public Image sponsorshipIcon;

	public Image vipIcon;

	[Header("Main Buttons")]
	public GameObject registerButton;

	public GameObject storeButton;

	public EliButton editorButton;

	public GameObject exitButton;

	[Header("Link Button")]
	public Button retrieveInfoButton;

	[Header("Register Panel")]
	public GameObject registerPanel;

	public GameObject registerInfo;

	public GameObject webStoreButton;

	public Text curLevelLabel;

	public InputField registerNameField;

	public InputField registerCodeField;

	[Header("Data")]
	public DbTeams teamsFactory;

	public DbTeams teamsLocal;

	public DbCountries countriesFactory;

	public DbConfederations confederationsFactory;

	public static bool alreadyCheckedAppUpdate;

	private string quitConfirmText = "#>Are you sure?";

	private string impersonatingTextTemplate = "#>Impersonating";

	private string playText = "#>Start a new game?";

	private string registerFoundMsg = "#>Register found.";

	private string registerNotFoundMsg = "#>Not found.";

	private string leagueTeamNumberErrorMsg = "#>League must have X teams per division";

	private BooleanObj confirmQuit = new BooleanObj(value: false);

	private static bool isFirstShow = true;

	private bool isPressingLogoImage;

	private float pressedTimerLogoImage;

	private int logoPressedCount;

	private void Start()
	{
		SoundManager.instance.PlayMusic(DataManager.instance.musicMenu);
		StartCoroutine(ScreenController.instance.FadeBlack(0f, immediatelly: true));
		if (DataManager.instance.imgMenuLogo != null)
		{
			menuLogo.sprite = DataManager.instance.imgMenuLogo;
		}
		betaVersionText.text = "";
		versionText.text = "";
		versionText.gameObject.SetActive(value: false);
		impersonationText.text = "";
		impersonationText.gameObject.SetActive(value: false);
		ResetView();
		DataManager.instance.properties.Reset();
		UpdateVisualComponents();
		StartCoroutine(RetrieveInfo(forced: false));
		ResetView();
		if (DatabaseIsOk())
		{
			teamsLocal.UpdateMissingLogos();
			if (!IntentReceiver.instance.CheckFileOpen() && !alreadyCheckedAppUpdate && LoadAndSavingTeams.instance != null)
			{
				alreadyCheckedAppUpdate = true;
			}
			DataManager.instance.myUnblockTeams.ReadFromFile();
			if (isFirstShow)
			{
				ShowStartupWarnings();
			}
			isFirstShow = false;
		}
	}

	private void ShowStartupWarnings()
	{
		string title = LanguageController.instance.Get_Translation("STARTUP_WARNING_TITLE");
		string strB = "STARTUP_WARNING_TEXT_" + DataManager.instance.version;
		string text = LanguageController.instance.Get_Translation(strB);
		if (text.CompareTo(strB) != 0)
		{
			ScreenController.instance.ShowScrollableTextView(title, text);
		}
	}

	private bool DatabaseIsOk()
	{
		bool flag = true;
		if (teamsFactory.AllTeams.Count == 0 || countriesFactory.allCountries.Count == 0 || confederationsFactory.allConfederations.Count == 0 || !teamsFactory.saved || !countriesFactory.saved || !confederationsFactory.saved)
		{
			flag = false;
		}
		if (!flag)
		{
			string description = LanguageController.instance.Get_Translation("ERROR_DATABASE");
			ScreenController.instance.ShowInfoPopUp(description, Util.QuitApplication);
		}
		return flag;
	}

	public void PlayPressed()
	{
		if (HasPlayPermission())
		{
			Analytics.CustomEvent("PlayPressed", new Dictionary<string, object>
			{
				{
					"Version",
					DataManager.instance.GetGameVersion()
				},
				{
					"ActiveLanguage",
					LanguageController.activeLanguage
				},
				{
					"RegLevel",
					GamePermissions.GetCurRegLevel()
				}
			});
			if (DataManager.instance.HasSavedGames())
			{
				ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("MENU_PLAYBUTTON"), playText, ContinuePressed, NewGamePressed);
			}
			else
			{
				NewGamePressed();
			}
			if (DataManager.instance.eliCrash != null && !DataManager.instance.eliCrash.HasAskedSendPermission)
			{
				ListOfParameters listOfParameters = new ListOfParameters();
				DataManager.instance.eliCrash.ManageOptions(Util.ManageOption.CreateParameter, ref listOfParameters);
				ScreenController.instance.ShowParameterEditor("ID:OPTIONS_TITLE", listOfParameters, ParameterEditorDefaultReturn, showLoadingView: true, ParametersView.GridViewMode.Normal, hasFoldout: true);
			}
		}
	}

	private void ParameterEditorDefaultReturn(ListOfParameters listOfParameters)
	{
		DataManager.instance.eliCrash.HasAskedSendPermission = true;
		DataManager.instance.eliCrash.ManageOptions(Util.ManageOption.WriteToCache, ref listOfParameters);
	}

	private void NewGamePressed()
	{
		if (HasPlayPermission())
		{
			ScreenController.instance.ShowLeaguesPopUp(this);
		}
	}

	private void ContinuePressed()
	{
		if (HasPlayPermission())
		{
			ScreenController.instance.ShowSaveLoadView(isSaveMode: false);
		}
	}

	private bool HasPlayPermission()
	{
		if (GamePermissions.needsDeviceAuthorization != DeviceAuthorization.None && !GamePermissions.inWhitelist && !(GamePermissions.retrieveInfoAuthorizationPermission == "1"))
		{
			string description = LanguageController.instance.Get_Translation("ERROR_DEVICE_NOT_ALLOWED", "DNA", GamePermissions.myDeviceID, DataManager.instance.GetGameVersion());
			ScreenController.instance.ShowInfoPopUp(description, delegate
			{
				Util.QuitApplication();
			});
			return false;
		}
		bool flag = GamePermissions.allowed[(int)GamePermissions.Permissions.allowPlay];
		if (!flag)
		{
			string description = LanguageController.instance.Get_Translation("ERROR_DEVICE_NOT_ALLOWED", "APL", GamePermissions.myDeviceID, DataManager.instance.GetGameVersion());
			ScreenController.instance.ShowInfoPopUp(description, delegate
			{
				Util.QuitApplication();
			});
			return false;
		}
		if (flag && GamePermissions.hasTimeBomb)
		{
			DateTime utcNow = DateTime.UtcNow;
			try
			{
				DateTime value = Convert.ToDateTime(DataManager.instance.timeBomb);
				if (utcNow.CompareTo(value) >= 0)
				{
					flag = false;
					string description = LanguageController.instance.Get_Translation("ERROR_DEVICE_NOT_ALLOWED", "TBX", GamePermissions.myDeviceID, DataManager.instance.GetGameVersion());
					ScreenController.instance.ShowInfoPopUp(description, delegate
					{
						Util.QuitApplication();
					});
					return false;
				}
			}
			catch (Exception)
			{
				flag = false;
				string description = LanguageController.instance.Get_Translation("ERROR_DEVICE_NOT_ALLOWED", "TBE", GamePermissions.myDeviceID, DataManager.instance.GetGameVersion());
				ScreenController.instance.ShowInfoPopUp(description, delegate
				{
					Util.QuitApplication();
				});
				return false;
			}
		}
		return flag;
	}

	public void RegisterPressed()
	{
		webStoreButton.SetActive(value: true);
		registerPanel.SetActive(value: true);
		if (Registration.RegLevel > PermissionLevel.L0_None)
		{
			registerInfo.SetActive(value: true);
			curLevelLabel.text = Registration.GetRegistrationDescription();
		}
		else
		{
			registerInfo.SetActive(value: false);
		}
	}

	public void StorePressed()
	{
		ScreenController.instance.ShowStoreView(null, UpdateVisualComponents, InAppPurchases.GameItemType.None);
	}

	public void RankingPressed()
	{
		bool key = Input.GetKey(KeyCode.LeftShift);
		ScreenController.instance.ShowRankingView(showLoadingView: true, showWarningMessages: true, key);
	}

	public void OptionsPressed()
	{
		ScreenController.instance.ShowOptionsView(OptionsReturn);
	}

	private void OptionsReturn()
	{
		UpdateVisualComponents();
	}

	public void LanguagePressed()
	{
		string title = LanguageController.instance.Get_Translation("OPTIONS_SELECTLANGUAGETITLE");
		ScreenController.instance.SelectLanguage(title, SetLanguage, LanguageController.instance.languagesSupported.ToArray());
	}

	private void SetLanguage(string language)
	{
		DataManager.instance.SetLanguage(language);
	}

	public void EditorPressed()
	{
		DataManager.instance.ClearData();
		ScreenController.instance.ShowEditTeamsView();
	}

	public void UpdatesPressed()
	{
		ScreenController.instance.ShowUpdatesView();
	}

	public void AboutPressed()
	{
		ScreenController.instance.ShowAboutView();
	}

	public void AdButtonPressed()
	{
		if (!string.IsNullOrEmpty(ElifootOptions.mainMenuAdUrl))
		{
			StartCoroutine(DataManager.instance.OpenPage(ElifootOptions.mainMenuAdUrl));
		}
	}

	public void ExitPressed()
	{
		confirmQuit.Value = ElifootOptions.GetFlag(ElifootOptions.Flags.confirmQuit, defautValue: true);
		if (confirmQuit.Value)
		{
			ScreenController.instance.ShowDialogPopUpCheckBox(LanguageController.instance.Get_Translation("MENU_EXIT"), quitConfirmText, ElifootOptions.GetFlagText(ElifootOptions.Flags.confirmQuit), ExitConfirmed, null, confirmQuit);
		}
		else
		{
			ExitConfirmed();
		}
	}

	private void ExitConfirmed()
	{
		ElifootOptions.SetFlag(ElifootOptions.Flags.confirmQuit, confirmQuit.Value);
		Util.QuitApplication();
	}

	public void OnPremiumIconPressed()
	{
		string text = LanguageController.instance.Get_Translation("INTERNAL_ITEM_PREMIUM_DESCRIPTION");
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("INTERNAL_ITEM_PREMIUM_TITLE"), LanguageController.instance.Get_Translation("MENU_EXTRA_ACTIVE", text), null);
	}

	public void OnUnionIconPressed()
	{
		string text = LanguageController.instance.Get_Translation("INTERNAL_ITEM_UNION_DESCRIPTION");
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("INTERNAL_ITEM_UNION_TITLE"), LanguageController.instance.Get_Translation("MENU_EXTRA_ACTIVE", text), null);
	}

	public void OnSponsorshipIconPressed()
	{
		string text = LanguageController.instance.Get_Translation("INTERNAL_ITEM_SPONSORSHIP_DESCRIPTION");
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("INTERNAL_ITEM_SPONSORSHIP_TITLE"), LanguageController.instance.Get_Translation("MENU_EXTRA_ACTIVE", text), null);
	}

	public void OnVIPIconPressed()
	{
		string text = LanguageController.instance.Get_Translation("INTERNAL_ITEM_VIP_DESCRIPTION");
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("INTERNAL_ITEM_VIP_TITLE"), LanguageController.instance.Get_Translation("MENU_EXTRA_ACTIVE", text), null);
	}

	public void RegisterDonePressed()
	{
		string text = registerNameField.text.Trim();
		string code = registerCodeField.text.Trim();
		PermissionLevel permissionLevel = Registration.VerifyRegistrationLevel(text, code);
		if (permissionLevel > PermissionLevel.L0_None && permissionLevel <= DataManager.instance.buildLevel)
		{
			Registration.SaveRegistrationInfo(text, code);
			Registration.CheckRegistrationInfo();
			UpdateRegistrationInfoText();
			string text2 = $"REG_LEVEL_{(int)permissionLevel}";
			string arg = LanguageController.instance.Get_Translation(text2);
			ScreenController.instance.ShowInfoPopUp(string.Format(registerFoundMsg, arg), null);
			registerNameField.text = "";
			registerCodeField.text = "";
			registerPanel.SetActive(value: false);
			GamePermissions.ComputeRegLevel();
		}
		else
		{
			ScreenController.instance.ShowInfoPopUp(registerNotFoundMsg, null);
		}
	}

	public void RegisterBackPressed()
	{
		registerPanel.SetActive(value: false);
	}

	public void BuyRegisterPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("register"));
	}

	public override void ResetView()
	{
		base.ResetView();
		quitConfirmText = LanguageController.instance.Get_Translation("MENU_QUITCONFIRM");
		impersonatingTextTemplate = LanguageController.instance.Get_Translation("MENU_IMPERSONATING");
		playText = LanguageController.instance.Get_Translation("MENU_PLAYTEXT");
		registerFoundMsg = LanguageController.instance.Get_Translation("MENU_REGISTERFOUNDMSG");
		registerNotFoundMsg = LanguageController.instance.Get_Translation("MENU_REGISTERNOTFOUNDMSG");
		leagueTeamNumberErrorMsg = LanguageController.instance.Get_Translation("MENU_LEAGUETEAMPERDIVISIONERROR");
		UpdateVisualComponents();
		UpdateRetrieveInfoText();
		UpdateRegistrationInfoText();
		logoPressedCount = 0;
	}

	private void UpdateVisualComponents()
	{
		premiumIcon.gameObject.SetActive(ElifootOptions.extras.premiumVersion);
		unionIcon.gameObject.SetActive(ElifootOptions.extras.coachUnion);
		sponsorshipIcon.gameObject.SetActive(ElifootOptions.extras.sponsorship);
		vipIcon.gameObject.SetActive(ElifootOptions.extras.vipVersion);
		registerButton.SetActive(Registration.MayRegisterVersion());
		if (LoadAndSavingTeams.instance != null && LoadAndSavingTeams.instance.ShowAppUpdateButtonNotification())
		{
			editorButton.ShowButtonNotification("1");
		}
		else
		{
			editorButton.HideButtonNotification();
		}
		storeButton.SetActive(value: false);
		exitButton.SetActive(GamePermissions.allowed[(int)GamePermissions.Permissions.showExitButton]);
		UpdateImpersonationText();
	}

	private void UpdateImpersonationText()
	{
		string text = null;
		if (GamePermissions.AllowsImpersonation() && GamePermissions.impersonationLevel.CompareTo(Registration.RegLevel) < 0)
		{
			string arg = string.Format(impersonatingTextTemplate, GamePermissions.GetLevelString(GamePermissions.impersonationLevel));
			text = $"{GamePermissions.myDeviceID} {arg}";
		}
		impersonationText.text = text;
		impersonationText.gameObject.SetActive(value: true);
	}

	private void UpdateRegistrationInfoText()
	{
		if (Registration.MayRegisterVersion())
		{
			registerText.text = Registration.GetRegistrationDescription();
			registerText.gameObject.SetActive(value: true);
		}
		else
		{
			registerText.text = "";
			registerText.gameObject.SetActive(value: false);
		}
	}

	private void UpdateRetrieveInfoText()
	{
		if (string.IsNullOrEmpty(ElifootOptions.mainMenuInfoTextCaption))
		{
			retrieveInfoButton.gameObject.SetActive(value: false);
			return;
		}
		retrieveInfoButton.gameObject.SetActive(value: true);
		retrieveInfoButton.GetComponentInChildren<Text>().text = ElifootOptions.mainMenuInfoTextCaption;
		retrieveInfoButton.onClick.RemoveAllListeners();
		if (!string.IsNullOrEmpty(ElifootOptions.mainMenuInfoTextLink))
		{
			retrieveInfoButton.onClick.AddListener(delegate
			{
				StartCoroutine(DataManager.instance.OpenPageAppl(ElifootOptions.mainMenuInfoTextLink));
			});
		}
	}

	private IEnumerator RetrieveInfo(bool forced)
	{
		int currentTimeInMinutes = (int)(DateTime.Now.ToUniversalTime() - new DateTime(2015, 1, 1)).TotalMinutes;
		DataManager.instance.myPromotions.ReadFromFile();
		DataManager.instance.myPromotions.ApplyPromotions(showDialogs: true);
		DataManager.instance.myUnblockTeams.ReadFromFile();
		if (!forced && (!GamePermissions.allowed[(int)GamePermissions.Permissions.retrieveInfo] || currentTimeInMinutes - ElifootOptions.retrieveInfoLastTimestamp < ElifootOptions.retrieveInfoInterval))
		{
			yield break;
		}
		BooleanObj canConnect = new BooleanObj(value: false);
		yield return StartCoroutine(ElifootUrlManager.instance.CheckConnectionToMasterServer(canConnect));
		if (!canConnect.Value)
		{
			yield break;
		}
		string commandUrl = ElifootUrlManager.GetCommandUrl("retrieveinfo", singleStaticRequest: true);
		using (UnityWebRequest loaded = new UnityWebRequest(commandUrl))
		{
			loaded.timeout = 30;
			loaded.downloadHandler = new DownloadHandlerBuffer();
			yield return loaded.SendWebRequest();
			if (this == null)
			{
				yield break;
			}
			if (string.IsNullOrEmpty(loaded.error))
			{
				string text = loaded.downloadHandler.text;
				string mainMenuInfoTextCaption = null;
				string mainMenuInfoTextLink = null;
				string retrieveInfoAuthorizationPermission = null;
				TinyXmlReader tinyXmlReader = new TinyXmlReader(text);
				while (tinyXmlReader.Read())
				{
					if (tinyXmlReader.tagName == "info" && tinyXmlReader.isOpeningTag)
					{
						while (tinyXmlReader.Read("info"))
						{
							if (!(tinyXmlReader.tagName == "infotext") || !tinyXmlReader.isOpeningTag)
							{
								continue;
							}
							while (tinyXmlReader.Read("infotext"))
							{
								if (tinyXmlReader.tagName == "caption" && tinyXmlReader.isOpeningTag)
								{
									mainMenuInfoTextCaption = tinyXmlReader.content;
								}
								if (tinyXmlReader.tagName == "link" && tinyXmlReader.isOpeningTag)
								{
									mainMenuInfoTextLink = tinyXmlReader.content;
								}
							}
							while (tinyXmlReader.Read("authorization"))
							{
								if (tinyXmlReader.tagName == "permission" && tinyXmlReader.isOpeningTag)
								{
									retrieveInfoAuthorizationPermission = tinyXmlReader.content;
								}
								if (tinyXmlReader.tagName == "code" && tinyXmlReader.isOpeningTag)
								{
									_ = tinyXmlReader.content;
								}
							}
						}
					}
					if (tinyXmlReader.tagName == "promotion" && tinyXmlReader.isOpeningTag)
					{
						Promotion promotion = new Promotion();
						while (tinyXmlReader.Read("promotion"))
						{
							if (tinyXmlReader.tagName.ToLower() == "type")
							{
								promotion.type = tinyXmlReader.content;
							}
							if (tinyXmlReader.tagName.ToLower() == "promotionid")
							{
								promotion.promotionId = tinyXmlReader.content;
							}
							if (tinyXmlReader.tagName.ToLower() == "validation")
							{
								promotion.validationCode = tinyXmlReader.content;
							}
							if (tinyXmlReader.tagName.ToLower() == "caption")
							{
								promotion.caption = tinyXmlReader.content;
							}
							if (tinyXmlReader.tagName.ToLower() == "bodytext")
							{
								promotion.bodyText = tinyXmlReader.content;
							}
							if (tinyXmlReader.tagName.ToLower() == "gameitemtype")
							{
								Enum.TryParse<InAppPurchases.GameItemType>(tinyXmlReader.content, out promotion.gameItemType);
							}
							if (tinyXmlReader.tagName.ToLower() == "gamevalue")
							{
								promotion.gameValue = Util.StrToIntDef(tinyXmlReader.content, 0);
							}
							if (tinyXmlReader.tagName.ToLower() == "promotionvalue")
							{
								promotion.PromotionValue = Util.StrToIntDef(tinyXmlReader.content, 0);
							}
							if (tinyXmlReader.tagName.ToLower() == "period")
							{
								promotion.Period = Util.StrToIntDef(tinyXmlReader.content, 0);
							}
							if (tinyXmlReader.tagName.ToLower() == "persistent")
							{
								promotion.persistent = tinyXmlReader.content == "1";
							}
						}
						DataManager.instance.myPromotions.Add(promotion);
					}
					if (!(tinyXmlReader.tagName == "unblockteams") || !tinyXmlReader.isOpeningTag)
					{
						continue;
					}
					UnblockTeam unblockTeam = new UnblockTeam();
					while (tinyXmlReader.Read("unblockteams"))
					{
						if (tinyXmlReader.tagName.ToLower() == "country")
						{
							unblockTeam.CountryCode3 = tinyXmlReader.content;
						}
						if (tinyXmlReader.tagName.ToLower() == "region")
						{
							unblockTeam.RegionCode = tinyXmlReader.content;
						}
						if (tinyXmlReader.tagName.ToLower() == "shortname")
						{
							unblockTeam.TeamShortName = tinyXmlReader.content;
						}
						if (tinyXmlReader.tagName.ToLower() == "teamid")
						{
							unblockTeam.DbTeamID = tinyXmlReader.content;
						}
					}
					DataManager.instance.myUnblockTeams.Add(unblockTeam);
				}
				ElifootOptions.mainMenuInfoTextLink = mainMenuInfoTextLink;
				GamePermissions.retrieveInfoAuthorizationPermission = retrieveInfoAuthorizationPermission;
				ElifootOptions.retrieveInfoLastTimestamp = currentTimeInMinutes;
				ElifootOptions.mainMenuInfoTextCaption = mainMenuInfoTextCaption;
				UpdateRetrieveInfoText();
			}
		}
		DataManager.instance.myPromotions.SaveToFile();
		DataManager.instance.myPromotions.ApplyPromotions(showDialogs: true);
		DataManager.instance.myUnblockTeams.SaveToFile();
		UpdateVisualComponents();
	}

	public void LogoImagePressing()
	{
		isPressingLogoImage = true;
		pressedTimerLogoImage = 0f;
	}

	public void LogoImageExit()
	{
		isPressingLogoImage = false;
	}

	public void LogoImagePressed()
	{
		LogoImageExit();
		if (!(pressedTimerLogoImage >= 1f))
		{
			logoPressedCount++;
			if (logoPressedCount >= 5)
			{
				Debug.Log($"logopressedCount={logoPressedCount}. Calling RetrieveInfo.");
				StartCoroutine(RetrieveInfo(forced: true));
				logoPressedCount = 0;
			}
		}
	}

	private void LogoImageLongPress()
	{
		Debug.Log("Logo image long press.");
		Debug.Log("Logo image long press.");
		StartCoroutine(RetrieveInfo(forced: true));
	}

	public override void Update()
	{
		if (isPressingLogoImage)
		{
			pressedTimerLogoImage += Time.deltaTime;
			if (pressedTimerLogoImage >= 3f)
			{
				isPressingLogoImage = false;
				LogoImageLongPress();
			}
		}
		base.Update();
	}
}
