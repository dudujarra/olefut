using System;
using System.Collections;
using System.IO;
using System.Net;
using UnityEngine;

public class ElifootUrlManager : UrlManager
{
	public new static ElifootUrlManager instance;

	private void Awake()
	{
		if (instance != null)
		{
			UnityEngine.Object.Destroy(base.gameObject);
			return;
		}
		UnityEngine.Object.DontDestroyOnLoad(base.gameObject);
		instance = this;
	}

	private static void AddParameter(ref string url, string paramName, string paramValue)
	{
		url += $"&{paramName}={paramValue}";
	}

	private static void AddParameter(ref string url, string paramName, int paramValue)
	{
		AddParameter(ref url, paramName, paramValue.ToString());
	}

	private static string GetUrlStandardParameters(bool singleStaticRequest = false)
	{
		string url = "filler=0";
		AddParameter(ref url, "lang", LanguageController.activeLanguage);
		if (!string.IsNullOrEmpty(Registration.RegName))
		{
			AddParameter(ref url, "regname", Registration.RegName);
		}
		if (!string.IsNullOrEmpty(Registration.RegCode))
		{
			AddParameter(ref url, "regkey", Registration.RegCode);
		}
		AddParameter(ref url, "rl", (int)GamePermissions.GetCurRegLevel());
		AddParameter(ref url, "version", DataManager.instance.GetGameVersion());
		AddParameter(ref url, "did", GamePermissions.myDeviceID);
		AddParameter(ref url, "os", SystemInfo.operatingSystem);
		if (singleStaticRequest)
		{
			AddParameter(ref url, "nocs", 1);
			AddParameter(ref url, "norid", 1);
			AddParameter(ref url, "nocrypt", 1);
		}
		return url.Replace(" ", "%20");
	}

	public static string GetServerURL(string pageUrl)
	{
		string arg = ElifootOptions.serverRoot[ElifootOptions.elifootServer];
		return $"{arg}/{pageUrl}";
	}

	public static string GetServerApplUrl(string url)
	{
		string arg = $"appl.asp?loc={url}";
		return GetServerURL($"{arg}&{GetUrlStandardParameters()}");
	}

	public static void OpenUrl(string url)
	{
		Application.OpenURL(url);
	}

	public static string GetCommandUrl(string myCommand, bool singleStaticRequest, string extension = "asp")
	{
		string serverURL = GetServerURL($"commands/{myCommand}.{extension}");
		return $"{serverURL}?{GetUrlStandardParameters(singleStaticRequest)}";
	}

	public static string GetCommandUrl(string myCommand, string extension = "asp")
	{
		return GetCommandUrl(myCommand, singleStaticRequest: false, extension);
	}

	public override IEnumerator CheckConnectionToMasterServer(BooleanObj canConnect)
	{
		string[] array = new string[6] { "8.8.8.8", "8.8.4.4", "139.130.4.5", "208.67.222.222", "208.67.220.220", "74.84.145.58" };
		canConnect.Value = false;
		string[] array2 = array;
		foreach (string address in array2)
		{
			Ping pingMasterServer = new Ping(address);
			_ = Time.time;
			int counter = 50;
			while (!pingMasterServer.isDone && counter-- > 0)
			{
				yield return StartCoroutine(Util.Wait(0.1f));
			}
			if (pingMasterServer.isDone)
			{
				canConnect.Value = true;
				break;
			}
			if (TestConnection())
			{
				canConnect.Value = true;
				break;
			}
		}
	}

	public static bool TestConnection()
	{
		string text = string.Empty;
		HttpWebRequest httpWebRequest = (HttpWebRequest)WebRequest.Create("http://google.com");
		try
		{
			using HttpWebResponse httpWebResponse = (HttpWebResponse)httpWebRequest.GetResponse();
			if (httpWebResponse.StatusCode < (HttpStatusCode)299 && httpWebResponse.StatusCode >= HttpStatusCode.OK)
			{
				using StreamReader streamReader = new StreamReader(httpWebResponse.GetResponseStream());
				char[] array = new char[80];
				streamReader.Read(array, 0, array.Length);
				char[] array2 = array;
				foreach (char c in array2)
				{
					text += c;
				}
			}
		}
		catch (Exception ex)
		{
			Debug.LogWarning("TestConnection failed: " + ex.Message);
			text = "";
		}
		if (text == "")
		{
			return false;
		}
		if (!text.Contains("schema.org/WebPage"))
		{
			return false;
		}
		return true;
	}
}
