using System;
using System.Collections;
using System.IO;
using System.Text;
using UnityEngine;

public class LevelUploader : MonoBehaviour
{
	private void StartUpload()
	{
		StartCoroutine("UploadLevel");
	}

	private IEnumerator UploadLevel()
	{
		string s = "id;newname" + Environment.NewLine + "32;Ronaldo" + Environment.NewLine + "380;Eusébio" + Environment.NewLine + "420;Casillas" + Environment.NewLine + "1337;Benfica";
		byte[] bytes = Encoding.UTF8.GetBytes(s);
		string fileName = Path.GetRandomFileName();
		fileName = fileName.Replace(".", "");
		fileName = fileName.ToUpper();
		fileName += ".csv";
		WWWForm wWWForm = new WWWForm();
		MonoBehaviour.print("form created ");
		wWWForm.AddField("action", "level upload");
		wWWForm.AddField("file", "file");
		wWWForm.AddBinaryData("file", bytes, fileName, "text/xml");
		MonoBehaviour.print("binary data added ");
		WWW w = new WWW("https://dev1987.elifoot.net/commands/upload_player_names.php", wWWForm);
		MonoBehaviour.print("www created");
		yield return w;
		MonoBehaviour.print("after yield w");
		if (w.error != null)
		{
			MonoBehaviour.print("error");
			MonoBehaviour.print(w.error);
		}
		else if (w.uploadProgress == 1f && w.isDone)
		{
			Debug.Log(w.text);
			yield return new WaitForSeconds(5f);
			WWW w2 = new WWW("https://dev1987.elifoot.net/commands/getplayernames.asp?file=" + WWW.EscapeURL(fileName));
			yield return w2;
			if (w2.error != null)
			{
				MonoBehaviour.print("error 2");
				MonoBehaviour.print(w2.error);
			}
			else
			{
				Debug.Log("Contents are: \n\n" + w2.text);
			}
		}
	}

	private void OnGUI()
	{
		if (GUILayout.Button("Click me!"))
		{
			StartUpload();
		}
	}
}
