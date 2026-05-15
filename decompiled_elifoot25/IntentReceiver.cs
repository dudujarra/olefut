using System;
using System.IO;
using UnityEngine;
using UnityEngine.UI;

public class IntentReceiver : MonoBehaviour
{
	public Text debugText;

	private const string _actionView = "android.intent.action.VIEW";

	private const string temporaryFileName = "teamsImported.data";

	private string filePath;

	public static IntentReceiver instance;

	private void Awake()
	{
		instance = this;
		UnityEngine.Object.DontDestroyOnLoad(base.gameObject);
	}

	private void OnApplicationFocus(bool focus)
	{
		if (focus)
		{
			CheckFileOpen();
		}
	}

	public bool CheckFileOpen()
	{
		return false;
	}

	private bool CheckFileOpenIntent(out string filepath)
	{
		filepath = string.Empty;
		AndroidJavaClass androidJavaClass = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
		AndroidJavaObject androidJavaObject = androidJavaClass.GetStatic<AndroidJavaObject>("currentActivity");
		AndroidJavaObject androidJavaObject2 = androidJavaObject.Call<AndroidJavaObject>("getIntent", Array.Empty<object>());
		if (androidJavaObject2.Call<string>("getAction", Array.Empty<object>()) == "android.intent.action.VIEW")
		{
			try
			{
				AndroidJavaObject androidJavaObject3 = androidJavaObject2.Call<AndroidJavaObject>("getData", Array.Empty<object>());
				AndroidJavaObject androidJavaObject4 = androidJavaObject.Call<AndroidJavaObject>("getApplicationContext", Array.Empty<object>()).Call<AndroidJavaObject>("getContentResolver", Array.Empty<object>()).Call<AndroidJavaObject>("openInputStream", new object[1] { androidJavaObject3 });
				string text = Path.Combine(Application.temporaryCachePath, "teamsImported.data");
				if (File.Exists(text))
				{
					File.Delete(text);
				}
				File.Create(text).Close();
				AndroidJavaObject androidJavaObject5 = androidJavaObject4.Call<AndroidJavaObject>("getChannel", Array.Empty<object>());
				AndroidJavaObject androidJavaObject6 = new AndroidJavaObject("java.io.FileOutputStream", text, false);
				AndroidJavaObject androidJavaObject7 = androidJavaObject6.Call<AndroidJavaObject>("getChannel", Array.Empty<object>());
				long num = 0L;
				for (long num2 = androidJavaObject5.Call<long>("size", Array.Empty<object>()); num < num2; num += androidJavaObject5.Call<long>("transferTo", new object[3] { num, num2, androidJavaObject7 }))
				{
				}
				androidJavaObject4.Call("close");
				androidJavaObject6.Call("close");
				androidJavaObject2.Call<AndroidJavaObject>("setAction", new object[1] { "" });
				filepath = text;
			}
			catch (Exception ex)
			{
				Debug.LogError("CheckFileOpenIntent failed: " + ex.ToString());
				if (debugText != null)
				{
					debugText.text = "ERROR: " + ex.ToString();
				}
			}
		}
		androidJavaClass.Dispose();
		return !string.IsNullOrEmpty(filepath);
	}

	private bool CheckFileOpenIOS(out string filepath)
	{
		filepath = string.Empty;
		try
		{
			if (!Directory.Exists(Application.persistentDataPath + "/Imported"))
			{
				Directory.CreateDirectory(Application.persistentDataPath + "/Imported");
			}
			string[] files = Directory.GetFiles(Application.persistentDataPath, "*.ef20");
			foreach (string text in files)
			{
				string text2 = text.Substring(text.Length - 5);
				string text3 = Application.persistentDataPath + "/Imported/import" + text2;
				if (File.Exists(text3))
				{
					try
					{
						File.Delete(text3);
					}
					catch (Exception ex)
					{
						Debug.LogError("File operation failed: " + ex.Message);
					}
				}
				try
				{
					File.Move(text, text3);
					File.Delete(text);
					filepath = text3;
				}
				catch (Exception ex2)
				{
					Debug.LogError("CheckFileOpenIOS: error moving file '" + text + "':\n" + ex2.ToString());
					continue;
				}
				break;
			}
		}
		catch (Exception ex3)
		{
			Debug.LogError("CheckFileOpenIOS failed: " + ex3.ToString());
			if (debugText != null)
			{
				debugText.text = "- ERROR: " + ex3.ToString();
			}
		}
		return !string.IsNullOrEmpty(filepath);
	}

	private void CallPopUp()
	{
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("EDITOR_FILE_RECEIVED_TITLE"), LanguageController.instance.Get_Translation("EDITOR_FILE_RECEIVED_TEXT"), LoadFile, null);
	}

	private void LoadFile()
	{
		LoadAndSavingTeams.instance.LoadSharedFile(filePath);
		try
		{
			if (File.Exists(filePath))
			{
				File.Delete(filePath);
			}
		}
		catch (Exception ex)
		{
			Debug.LogError("LoadFile: failed to delete temp file '" + filePath + "': " + ex.Message);
		}
	}
}
