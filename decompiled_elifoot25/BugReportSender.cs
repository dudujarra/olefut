using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

public static class BugReportSender
{
	private const string RECIPIENT = "bugs@elifoot.com";

	public static void Send(string subject, string body, IReadOnlyList<string> attachments)
	{
		bool num = attachments != null && attachments.Count > 0;
		string text = DateTime.Now.ToString("yyyyMMdd_HHmmss");
		string text2 = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
		if (string.IsNullOrEmpty(text2))
		{
			text2 = Application.persistentDataPath;
		}
		string text3 = Path.Combine(text2, "Elifoot_BugReport_" + text);
		Directory.CreateDirectory(text3);
		int num2 = 0;
		if (num)
		{
			foreach (string attachment in attachments)
			{
				if (!string.IsNullOrEmpty(attachment) && File.Exists(attachment))
				{
					string destFileName = Path.Combine(text3, Path.GetFileName(attachment));
					File.Copy(attachment, destFileName, overwrite: true);
					num2++;
				}
			}
		}
		string contents = "To: bugs@elifoot.com\nSubject: " + subject + "\n\n" + body + "\n\n" + ((num2 > 0) ? "ATTACH THE FILES IN THIS FOLDER TO THE EMAIL BEFORE SENDING." : "COPY THE TEXT ABOVE INTO AN EMAIL AND SEND IT.");
		File.WriteAllText(Path.Combine(text3, "README.txt"), contents);
		Application.OpenURL("file://" + text3.Replace("\\", "/"));
		Debug.Log($"[BugReportSender] PC flow: opened folder {text3} with {num2} attachment(s)");
	}
}
