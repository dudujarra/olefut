using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

public class EliCrash
{
	private struct SendCrashForm
	{
		public string crashInfo;
	}

	private const string MY_KEY_BASE = "EliCrash";

	private const string MY_KEY_POINT = "EliCrashPoint";

	private List<string> flagStack = new List<string>();

	private SendCrashForm sendCrashForm;

	private bool hasSendPermission;

	private bool hasAskedSendPermission;

	public bool HasSendPermission => hasSendPermission;

	public bool HasAskedSendPermission
	{
		get
		{
			return hasAskedSendPermission;
		}
		set
		{
			hasAskedSendPermission = value;
		}
	}

	private string MyKeyBase()
	{
		return "EliCrash " + DataManager.instance.GetGameVersion();
	}

	private string MyKeyPoint()
	{
		return "EliCrashPoint " + DataManager.instance.GetGameVersion();
	}

	private void Save()
	{
		PlayerPrefs.SetString(MyKeyBase(), GetFlagStack());
	}

	private string Load()
	{
		return PlayerPrefs.GetString(MyKeyBase());
	}

	public void Clear()
	{
		flagStack.Clear();
		Save();
		SetPoint(null);
	}

	public string GetFlagStack()
	{
		if (flagStack.Count >= 100)
		{
			return "*** TOO LARGE *** " + string.Join(" | ", flagStack.GetRange(0, 99));
		}
		return string.Join(" | ", flagStack);
	}

	public void CreateFlag(string flagName)
	{
		if (flagStack.Count <= 100)
		{
			flagStack.Add(flagName);
		}
		Save();
	}

	public void DeleteFlag(string flagName)
	{
		int num = flagStack.LastIndexOf(flagName);
		if (num >= 0)
		{
			flagStack.RemoveRange(num, flagStack.Count - num);
			Save();
		}
	}

	public void SetPoint(string pointName)
	{
		if (string.IsNullOrEmpty(pointName))
		{
			PlayerPrefs.DeleteKey(MyKeyPoint());
		}
		else
		{
			PlayerPrefs.SetString(MyKeyPoint(), pointName);
		}
	}

	public IEnumerator SendCrashInfo(bool forceSend)
	{
		if (!hasSendPermission || !hasAskedSendPermission)
		{
			yield break;
		}
		string text = Load();
		if (forceSend || !string.IsNullOrEmpty(text))
		{
			string text2 = PlayerPrefs.GetString(MyKeyPoint());
			if (!string.IsNullOrEmpty(text2))
			{
				text = text + " | lastPoint: " + text2;
			}
			sendCrashForm.crashInfo = ((text == null) ? "NULL" : text);
			string url = ElifootUrlManager.GetCommandUrl("sendcrashinfo") + "&nocrypt=1&nocs=1&norid=1";
			url = Util.GetForm(url, sendCrashForm) ?? "";
			UnityWebRequest webRequest = UnityWebRequest.Get(url);
			yield return webRequest.SendWebRequest();
			Util.WebRequestCallback(webRequest, SendCrashSuccess, SendCrashFail);
		}
		yield return null;
	}

	public void SendCrashSuccess()
	{
		PlayerPrefs.DeleteKey(MyKeyBase());
	}

	public void SendCrashFail()
	{
		PlayerPrefs.DeleteKey(MyKeyBase());
	}

	public void ManageOptions(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		HasAskedSendPermission = (bool)Util.ManageOneSystemOption(mode, "hasAskedSendPermission", hasAskedSendPermission, false, ref listOfParameters);
		hasSendPermission = (bool)Util.ManageOneOption(mode, "hasSendPermission", "OPTIONS_SEND_USAGE_INFO_TITLE", "OPTIONS_USAGE_INFO_TITLE", null, hasSendPermission, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		Sprite icon = Util.LoadSprite(ConfigManager.configDictionary["#ICON_NEXT"]);
		listOfParameters?.RegisterButtonParameter("OPTIONS_CLICK_DETAILS", new EliParameter.ButtonConfig(null, active: true, icon, OnIconPressed));
	}

	private void OnIconPressed()
	{
		ScreenController.instance.ShowScrollableTextView("OPTIONS_SEND_USAGE_INFO_TITLE", "OPTIONS_SEND_USAGE_INFO_DESC");
	}
}
