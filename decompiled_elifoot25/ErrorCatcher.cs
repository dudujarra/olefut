using System.Collections;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class ErrorCatcher : MonoBehaviour
{
	private void Awake()
	{
		Object.DontDestroyOnLoad(this);
	}

	private void OnEnable()
	{
		Application.logMessageReceived += Log;
	}

	private void OnDisable()
	{
		Application.logMessageReceived -= Log;
	}

	public void Log(string logString, string stackTrace, LogType type)
	{
		if ((type == LogType.Error || type == LogType.Exception) && DataManager.instance.eliCrash.HasSendPermission)
		{
			_ = type.ToString() == "Log";
		}
	}

	private IEnumerator UploadFile(string filePath)
	{
		string text = "";
		StreamReader streamReader = File.OpenText(filePath);
		string text2;
		do
		{
			text2 = streamReader.ReadLine();
			if (text2 != null)
			{
				text += text2;
				text += "\n";
			}
		}
		while (text2 != null);
		streamReader.Close();
		byte[] bytes = Encoding.UTF8.GetBytes(text);
		string fileName = Path.GetFileName(filePath);
		WWWForm wWWForm = new WWWForm();
		wWWForm.AddField("action", "file upload");
		wWWForm.AddField("file", "file");
		wWWForm.AddBinaryData("file", bytes, fileName, "text/xml");
		string commandUrl = ElifootUrlManager.GetCommandUrl("upload_log_files", "php");
		UnityWebRequest www = UnityWebRequest.Post(commandUrl, wWWForm);
		www.timeout = 30;
		try
		{
			yield return www.SendWebRequest();
		}
		finally
		{
			if (www.isNetworkError || www.isHttpError)
			{
				Debug.LogWarning("Error sending log error file to server\n" + www.error);
			}
		}
	}
}
