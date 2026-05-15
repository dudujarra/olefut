using System;
using UnityEngine;
using UnityEngine.UI;

public class AccountView : EliView
{
	public enum ViewMode
	{
		Login,
		Register,
		OnlyRegister,
		RecoverPassword,
		UpdatePassword,
		CreateAccountForExistingCoach,
		ForceCreateAccountForExistingCoach,
		PlayerWantsToCreateAccount
	}

	private struct LoginForm
	{
		public string email;

		public string pwd;
	}

	private struct LoginCallback
	{
		public int errorCode;

		public string errorMsg;

		public string timeStamp;

		public string coachName;

		public string coachGuid;
	}

	private struct RegisterForm
	{
		public string coachGuid;

		public string coachName;

		public string email;

		public string pwd;
	}

	private struct RegisterCallback
	{
		public int errorCode;

		public string errorMsg;

		public string timeStamp;
	}

	private struct RecoverPasswordForm
	{
		public string coachEmail;
	}

	private struct RecoverPasswordCallback
	{
		public int errorCode;

		public string errorMsg;

		public string timeStamp;
	}

	private struct UpdatePasswordForm
	{
		public string email;

		public string pwd;

		public string code;
	}

	private struct UpdatePasswordCallback
	{
		public int errorCode;

		public string errorMsg;

		public string timeStamp;
	}

	private struct CoachHasAccountForm
	{
		public string coachGuid;

		public string coachName;
	}

	private struct CoachHasAccountCallback
	{
		public string hiddenEmail;

		public int errorCode;

		public string errorMsg;

		public string timeStamp;
	}

	[Header("View Variables")]
	public GameObject mainObject;

	public Text headerText;

	public GameObject loginRegisterToggle;

	public Toggle loginToggle;

	public AddOnValueChangedGraphics loginToggleAddOn;

	public Toggle registerToggle;

	public AddOnValueChangedGraphics registerToggleAddOn;

	[Header("Login Variables")]
	public GameObject loginObj;

	public InputField emailLogin;

	public InputField passwordLogin;

	public Toggle saveCredentialsLogin;

	[Header("Register Variables")]
	public GameObject registerObj;

	public InputField coachName;

	public Toggle createAccountToggle;

	public InputField emailRegister;

	public InputField passwordRegister;

	public InputField repeatPasswordRegister;

	public Toggle saveCredentialsRegister;

	public AddTargetGraphics saveCredentialsRegisterAddOn;

	public Toggle acceptTerms;

	public AddTargetGraphics acceptTermsAddOn;

	[Header("Update Password Variables")]
	public GameObject updatePasswordObj;

	public Text emailUpdatePassword;

	public InputField codeUpdatePassword;

	public InputField passwordUpdatePassword;

	public InputField repeatPasswordUpdatePassword;

	public Toggle saveCredentialsUpdatePassword;

	public AddTargetGraphics saveCredentialsUpdatePasswordAddOn;

	private string emailRecover;

	private ViewMode currentMode;

	private Account coachAccount;

	private Action<Account> onCoachComplete;

	private Action ignoreAccountCreation;

	private bool forceCreateAccount;

	private bool playerWantsToCreateAccount;

	private readonly int NO_ERROR_CODE;

	private string tempEncryptedPassword;

	public void Initialize(ViewMode startingMode, Account coachAccount, Action<Account> onCoachComplete)
	{
		this.coachAccount = GetCoachAccount(coachAccount);
		this.onCoachComplete = onCoachComplete;
		currentMode = startingMode;
		bool active = coachAccount == null || (coachAccount.email == "" && startingMode != ViewMode.OnlyRegister);
		loginRegisterToggle.SetActive(active);
		if (startingMode == ViewMode.Register || startingMode == ViewMode.OnlyRegister)
		{
			ShowRegister();
		}
		else
		{
			ShowLogin();
		}
		coachName.text = this.coachAccount.coachName;
		UpdateCharactersLimits();
		GoToStartingPanel();
		CreateAccountToggle();
	}

	public void Initialize(ViewMode startingMode, Account coachAccount, Action<Account> onCoachComplete, Action ignoreAccountCreation)
	{
		this.coachAccount = GetCoachAccount(coachAccount);
		this.onCoachComplete = onCoachComplete;
		this.ignoreAccountCreation = ignoreAccountCreation;
		currentMode = startingMode;
		forceCreateAccount = currentMode == ViewMode.ForceCreateAccountForExistingCoach;
		playerWantsToCreateAccount = currentMode == ViewMode.PlayerWantsToCreateAccount;
		CoachHasAccount();
		DefineMode(currentMode, null);
		CreateAccountToggle();
	}

	private Account GetCoachAccount(Account coachAccount)
	{
		if (coachAccount == null)
		{
			return new Account(Guid.NewGuid().ToString());
		}
		return new Account(coachAccount.guid, coachAccount.coachName, coachAccount.email, coachAccount.password);
	}

	private void GoToStartingPanel()
	{
		switch (currentMode)
		{
		case ViewMode.Login:
			loginToggle.isOn = true;
			loginToggleAddOn.OnToggle(active: true);
			break;
		case ViewMode.Register:
			registerToggle.isOn = true;
			registerToggleAddOn.OnToggle(active: true);
			break;
		default:
			throw new Exception("AccountView:GoToStartingPanel -> No ViewMode");
		}
	}

	public void BotToggles()
	{
		if (loginToggle.isOn)
		{
			ShowLogin();
		}
		else if (registerToggle.isOn)
		{
			ShowRegister();
		}
	}

	private void ShowLogin()
	{
		if (currentMode == ViewMode.Register)
		{
			emailLogin.text = emailRegister.text;
			passwordLogin.text = passwordRegister.text;
			saveCredentialsLogin.SetIsOnWithoutNotify(saveCredentialsRegister.isOn);
		}
		DefineMode(ViewMode.Login, "ACCOUNT_VIEW_LOGIN");
	}

	private void ShowRegister()
	{
		if (currentMode == ViewMode.Login)
		{
			emailRegister.text = emailLogin.text;
			passwordRegister.text = passwordLogin.text;
			saveCredentialsRegister.SetIsOnWithoutNotify(saveCredentialsLogin.isOn);
		}
		DefineMode(ViewMode.Register, "ACCOUNT_VIEW_SIGN_UP");
	}

	private void ShowUpdatePassword()
	{
		emailRecover = emailLogin.text;
		emailUpdatePassword.text = emailRecover;
		codeUpdatePassword.text = "";
		passwordUpdatePassword.text = "";
		repeatPasswordUpdatePassword.text = "";
		UpdateCharactersLimits();
		loginRegisterToggle.SetActive(value: false);
		DefineMode(ViewMode.UpdatePassword, "ACCOUNT_VIEW_RECOVER");
	}

	private void DefineMode(ViewMode mode, string title)
	{
		currentMode = mode;
		headerText.text = LanguageController.instance.Get_Translation(title);
		loginObj.SetActive(mode == ViewMode.Login);
		registerObj.SetActive(mode == ViewMode.Register);
		updatePasswordObj.SetActive(mode == ViewMode.UpdatePassword);
		mainObject.SetActive(mode != ViewMode.CreateAccountForExistingCoach && mode != ViewMode.ForceCreateAccountForExistingCoach);
		if (forceCreateAccount)
		{
			createAccountToggle.isOn = true;
		}
	}

	public void CreateAccountToggle()
	{
		if (forceCreateAccount || playerWantsToCreateAccount)
		{
			createAccountToggle.isOn = true;
		}
		emailRegister.interactable = createAccountToggle.isOn;
		passwordRegister.interactable = createAccountToggle.isOn;
		repeatPasswordRegister.interactable = createAccountToggle.isOn;
		acceptTerms.interactable = createAccountToggle.isOn;
		if (createAccountToggle.isOn)
		{
			acceptTermsAddOn.ChangeToNormalState();
		}
		else
		{
			acceptTermsAddOn.ChangeToDisabledState();
		}
	}

	public void YesButton()
	{
		switch (currentMode)
		{
		case ViewMode.Login:
			TryLogin();
			break;
		case ViewMode.Register:
			TryRegister();
			break;
		case ViewMode.UpdatePassword:
			TryUpdatePassword();
			break;
		default:
			throw new Exception("AccountView:YesButton -> No ViewMode");
		}
	}

	public override void Close()
	{
		if (playerWantsToCreateAccount)
		{
			ignoreAccountCreation?.Invoke();
			ignoreAccountCreation = null;
		}
		switch (currentMode)
		{
		case ViewMode.Login:
		case ViewMode.Register:
		case ViewMode.RecoverPassword:
		case ViewMode.CreateAccountForExistingCoach:
		case ViewMode.ForceCreateAccountForExistingCoach:
			UnityEngine.Object.Destroy(base.gameObject);
			break;
		case ViewMode.UpdatePassword:
			ShowLogin();
			break;
		default:
			Debug.LogError($"ViewMode {currentMode} is not assigned at AccountView Close()");
			break;
		}
		forceCreateAccount = false;
	}

	private void CoachHasAccount()
	{
		ScreenController.instance.ShowLoadingView();
		string text = passwordLogin.text;
		tempEncryptedPassword = Util.Encrypt(text, "123qwe");
		CoachHasAccountForm formStruct = new CoachHasAccountForm
		{
			coachGuid = coachAccount.guid,
			coachName = coachName.text.Trim()
		};
		string url = ElifootUrlManager.GetCommandUrl("coachhasaccount") + "&nocrypt=1&nocs=1&json=1";
		StartCoroutine(Util.Call<CoachHasAccountForm, CoachHasAccountCallback>(this, url, formStruct, CheckCoachHasAccountErrors, ConnectionFailed));
	}

	private void CheckCoachHasAccountErrors(CoachHasAccountCallback[] callback)
	{
		if (callback == null || callback.Length == 0)
		{
			ConnectionFailed(Util.serverErrorCode);
			return;
		}
		ScreenController.instance.HideLoadingView();
		if (callback[0].errorCode == NO_ERROR_CODE)
		{
			emailLogin.text = callback[0].hiddenEmail;
			Initialize(ViewMode.Login, coachAccount, onCoachComplete);
			return;
		}
		Debug.LogWarning($"Error code: {callback[0].errorCode} -- Error Message: {callback[0].errorMsg} -- [{base.gameObject.name}] -- Current Mode: {currentMode}");
		Initialize(ViewMode.Register, coachAccount, onCoachComplete);
		loginRegisterToggle.SetActive(value: false);
	}

	private void TryLogin()
	{
		if (LoginCredentialsAreOk())
		{
			Login();
		}
	}

	private bool LoginCredentialsAreOk()
	{
		if (string.IsNullOrEmpty(emailLogin.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("EMAIL_MISSING", 240f, 4f);
			return false;
		}
		if (!Util.IsValidEmail(emailLogin.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("EMAIL_NOT_VALID", 240f, 4f);
			return false;
		}
		if (string.IsNullOrEmpty(passwordLogin.text))
		{
			ScreenController.instance.ShowToastMessage("PASSWORD_MISSING", 240f, 4f);
			return false;
		}
		return true;
	}

	private void Login()
	{
		ScreenController.instance.ShowLoadingView();
		string text = passwordLogin.text;
		tempEncryptedPassword = Util.Encrypt(text, "123qwe");
		LoginForm formStruct = new LoginForm
		{
			email = emailLogin.text.Trim(),
			pwd = tempEncryptedPassword
		};
		string url = ElifootUrlManager.GetCommandUrl("coachlogin") + "&nocrypt=1&nocs=1&json=1";
		StartCoroutine(Util.Call<LoginForm, LoginCallback>(this, url, formStruct, LoginSuccess, ConnectionFailed));
	}

	private void LoginSuccess(LoginCallback[] callback)
	{
		if (!CheckLoginErrors(callback))
		{
			coachAccount.guid = callback[0].coachGuid;
			coachAccount.coachName = callback[0].coachName;
			coachAccount.email = emailLogin.text.Trim();
			coachAccount.password = tempEncryptedPassword;
			CompleteWithMessage("LOGIN_SUCCESSFUL");
		}
	}

	private bool CheckLoginErrors(LoginCallback[] callback)
	{
		if (callback == null || callback.Length == 0)
		{
			ConnectionFailed(Util.serverErrorCode);
			return true;
		}
		if (callback[0].errorCode != NO_ERROR_CODE)
		{
			ConnectionFailed(callback[0].errorMsg);
			return true;
		}
		return false;
	}

	private void ConnectionFailed(string errorMessage)
	{
		Debug.LogError($"Error message: {errorMessage} -- [{base.gameObject.name}] -- Current Mode: {currentMode}");
		if (currentMode == ViewMode.RecoverPassword)
		{
			currentMode = ViewMode.Login;
		}
		if (errorMessage.StartsWith("HTTP/1.1"))
		{
			errorMessage = Util.serverErrorCode;
		}
		ScreenController.instance.HideLoadingView();
		if (currentMode == ViewMode.CreateAccountForExistingCoach || currentMode == ViewMode.ForceCreateAccountForExistingCoach)
		{
			string title = LanguageController.instance.Get_Translation("CONNECTION_ERROR");
			string text = LanguageController.instance.Get_Translation("WANT_TO_TRY_AGAIN");
			string description = LanguageController.instance.Get_Translation(errorMessage) + "\n\n" + text;
			ScreenController.instance.ShowThreeDialogPopUp(title, description, CoachHasAccount, IgnoreAccountCreation, Close);
		}
		else
		{
			ScreenController.instance.ShowInfoPopUp(errorMessage, null);
		}
	}

	private void IgnoreAccountCreation()
	{
		ignoreAccountCreation?.Invoke();
		ignoreAccountCreation = null;
		Close();
	}

	public void RecoverPasswordPressed()
	{
		if (string.IsNullOrEmpty(emailLogin.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("EMAIL_MISSING", 240f, 4f);
		}
		else if (!Util.IsValidEmail(emailLogin.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("EMAIL_NOT_VALID", 240f, 4f);
		}
		else
		{
			RecoverPassword();
		}
	}

	private void RecoverPassword()
	{
		ScreenController.instance.ShowLoadingView();
		currentMode = ViewMode.RecoverPassword;
		RecoverPasswordForm formStruct = new RecoverPasswordForm
		{
			coachEmail = emailLogin.text
		};
		string url = ElifootUrlManager.GetCommandUrl("coachrecoverpwd") + "&nocrypt=1&nocs=1&json=1";
		StartCoroutine(Util.Call<RecoverPasswordForm, RecoverPasswordCallback>(this, url, formStruct, RecoverPasswordSuccess, ConnectionFailed));
	}

	private void RecoverPasswordSuccess(RecoverPasswordCallback[] callback)
	{
		if (!CheckRecoverPasswordErrors(callback))
		{
			ScreenController.instance.HideLoadingView();
			ScreenController.instance.ShowInfoPopUp("RECOVER_EMAIL_SENT", ShowUpdatePassword);
		}
	}

	private bool CheckRecoverPasswordErrors(RecoverPasswordCallback[] callback)
	{
		if (callback == null || callback.Length == 0)
		{
			ConnectionFailed(Util.serverErrorCode);
			return true;
		}
		if (callback[0].errorCode != NO_ERROR_CODE)
		{
			ConnectionFailed(callback[0].errorMsg);
			return true;
		}
		return false;
	}

	private void TryUpdatePassword()
	{
		if (UpdatePasswordCredentialsAreOk())
		{
			UpdatePassword();
		}
	}

	private bool UpdatePasswordCredentialsAreOk()
	{
		if (string.IsNullOrEmpty(codeUpdatePassword.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("RECOVER_CODE_MISSING", 240f, 4f);
			return false;
		}
		if (string.IsNullOrEmpty(passwordUpdatePassword.text))
		{
			ScreenController.instance.ShowToastMessage("PASSWORD_MISSING", 240f, 4f);
			return false;
		}
		if (string.IsNullOrEmpty(repeatPasswordUpdatePassword.text))
		{
			ScreenController.instance.ShowToastMessage("PASSWORD_REPEAT_MISSING", 240f, 4f);
			return false;
		}
		if (passwordUpdatePassword.text != repeatPasswordUpdatePassword.text)
		{
			ScreenController.instance.ShowToastMessage("PASSWORD_DONT_MATCH", 240f, 4f);
			return false;
		}
		return true;
	}

	private void UpdatePassword()
	{
		ScreenController.instance.ShowLoadingView();
		string text = passwordUpdatePassword.text;
		tempEncryptedPassword = Util.Encrypt(text, "123qwe");
		UpdatePasswordForm formStruct = new UpdatePasswordForm
		{
			email = emailRecover.Trim(),
			pwd = tempEncryptedPassword,
			code = codeUpdatePassword.text
		};
		string url = ElifootUrlManager.GetCommandUrl("coachupdatepwd") + "&nocrypt=1&nocs=1&json=1";
		StartCoroutine(Util.Call<UpdatePasswordForm, UpdatePasswordCallback>(this, url, formStruct, UpdatePasswordSuccess, ConnectionFailed));
	}

	private void UpdatePasswordSuccess(UpdatePasswordCallback[] callback)
	{
		if (!CheckUpdatePasswordErrors(callback))
		{
			ScreenController.instance.HideLoadingView();
			ScreenController.instance.ShowToastMessage("PASSWORD_UPDATE_SUCCESSFUL", 240f, 4f);
			TryRecordCoach();
			loginRegisterToggle.SetActive(value: true);
			ShowLogin();
		}
	}

	private bool CheckUpdatePasswordErrors(UpdatePasswordCallback[] callback)
	{
		if (callback == null || callback.Length == 0)
		{
			ConnectionFailed(Util.serverErrorCode);
			return true;
		}
		if (callback[0].errorCode != NO_ERROR_CODE)
		{
			ConnectionFailed(callback[0].errorMsg);
			return true;
		}
		return false;
	}

	public void TermsAndConditionsPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("efm-ppol"));
	}

	private void TryRegister()
	{
		if (RegisterCredentialsAreOk())
		{
			if (createAccountToggle.isOn)
			{
				Register();
				return;
			}
			coachAccount.coachName = coachName.text;
			CoachComplete();
		}
	}

	private bool RegisterCredentialsAreOk()
	{
		if (string.IsNullOrEmpty(coachName.text.Trim()))
		{
			ScreenController.instance.ShowToastMessage("LOGIN_INVALIDCOACHNAME", 240f, 4f);
			return false;
		}
		if (createAccountToggle.isOn)
		{
			if (string.IsNullOrEmpty(emailRegister.text.Trim()))
			{
				ScreenController.instance.ShowToastMessage("EMAIL_MISSING", 240f, 4f);
				return false;
			}
			if (!Util.IsValidEmail(emailRegister.text.Trim()))
			{
				ScreenController.instance.ShowToastMessage("EMAIL_NOT_VALID", 240f, 4f);
				return false;
			}
			if (string.IsNullOrEmpty(passwordRegister.text))
			{
				ScreenController.instance.ShowToastMessage("PASSWORD_MISSING", 240f, 4f);
				return false;
			}
			if (string.IsNullOrEmpty(repeatPasswordRegister.text))
			{
				ScreenController.instance.ShowToastMessage("PASSWORD_REPEAT_MISSING", 240f, 4f);
				return false;
			}
			if (passwordRegister.text != repeatPasswordRegister.text)
			{
				ScreenController.instance.ShowToastMessage("PASSWORD_DONT_MATCH", 240f, 4f);
				return false;
			}
			if (!acceptTerms.isOn)
			{
				ScreenController.instance.ShowToastMessage("TERMS_AND_CONDITIONS_NOT_ACCEPTED", 240f, 4f);
				return false;
			}
		}
		return true;
	}

	private void Register()
	{
		ScreenController.instance.ShowLoadingView();
		string text = passwordRegister.text;
		tempEncryptedPassword = Util.Encrypt(text, "123qwe");
		RegisterForm formStruct = new RegisterForm
		{
			coachGuid = coachAccount.guid,
			coachName = coachName.text.Trim(),
			email = emailRegister.text.Trim(),
			pwd = tempEncryptedPassword
		};
		string url = ElifootUrlManager.GetCommandUrl("coachregister") + "&nocrypt=1&nocs=1&json=1";
		StartCoroutine(Util.Call<RegisterForm, RegisterCallback>(this, url, formStruct, RegisterSuccess, ConnectionFailed));
	}

	private void RegisterSuccess(RegisterCallback[] callback)
	{
		if (!CheckRegisterErrors(callback))
		{
			coachAccount.coachName = coachName.text.Trim();
			coachAccount.email = emailRegister.text.Trim();
			coachAccount.password = tempEncryptedPassword;
			CompleteWithMessage("SIGN_UP_SUCESSFUL");
			forceCreateAccount = false;
		}
	}

	private bool CheckRegisterErrors(RegisterCallback[] callback)
	{
		if (callback == null || callback.Length == 0)
		{
			ConnectionFailed(Util.serverErrorCode);
			return true;
		}
		if (callback[0].errorCode != NO_ERROR_CODE)
		{
			ConnectionFailed(callback[0].errorMsg);
			return true;
		}
		return false;
	}

	private void CompleteWithMessage(string toastMessageTag)
	{
		TryRecordCoach();
		CoachComplete();
		ScreenController.instance.HideLoadingView();
		ScreenController.instance.ShowToastMessage(toastMessageTag, 240f, 4f);
	}

	private void TryRecordCoach()
	{
		if ((currentMode != ViewMode.Login || saveCredentialsLogin.isOn) && (currentMode != ViewMode.Register || saveCredentialsRegister.isOn) && (currentMode != ViewMode.UpdatePassword || saveCredentialsUpdatePassword.isOn))
		{
			DataManager.instance.EditOrAddRecordedCoach(coachAccount);
		}
	}

	private void CoachComplete()
	{
		TryRecordCoach();
		onCoachComplete?.Invoke(coachAccount);
		Close();
	}

	private void UpdateCharactersLimits()
	{
		emailLogin.characterLimit = DataManager.COACH_EMAIL_LENGTH_MAX;
		passwordLogin.characterLimit = DataManager.COACH_PASSWORD_LENGTH_MAX;
		coachName.characterLimit = DataManager.COACH_NAME_LENGTH_MAX;
		emailRegister.characterLimit = DataManager.COACH_EMAIL_LENGTH_MAX;
		passwordRegister.characterLimit = DataManager.COACH_PASSWORD_LENGTH_MAX;
		repeatPasswordRegister.characterLimit = DataManager.COACH_PASSWORD_LENGTH_MAX;
		codeUpdatePassword.characterLimit = DataManager.COACH_RECOVER_PASSWORD_CODE_LENGTH_MAX;
		passwordUpdatePassword.characterLimit = DataManager.COACH_PASSWORD_LENGTH_MAX;
		repeatPasswordUpdatePassword.characterLimit = DataManager.COACH_PASSWORD_LENGTH_MAX;
	}
}
