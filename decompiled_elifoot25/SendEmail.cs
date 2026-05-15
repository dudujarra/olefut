using UnityEngine;

public class SendEmail : MonoBehaviour
{
	[SerializeField]
	private string email = "jmonsuarez@gmail.com";

	[SerializeField]
	private string subject = "[auto] FileManagementAsset - eToile";

	[SerializeField]
	private string body = "";

	public void SendAutoEmail()
	{
		Application.OpenURL("mailto:" + email + "?subject=" + subject + "&body=" + body);
	}
}
