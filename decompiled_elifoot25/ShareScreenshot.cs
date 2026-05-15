using System;
using System.Collections;
using UnityEngine;

public class ShareScreenshot : MonoBehaviour
{
	public MyFileBrowserController MYFileBrowserPrefab;

	[HideInInspector]
	public Texture2D screenshotImage;

	[HideInInspector]
	public Action afterShareCallback;

	public void Share(string subject, string description, Action afterShareCallback)
	{
		this.afterShareCallback = afterShareCallback;
		StartCoroutine(TakeSSAndShare(subject, description));
	}

	private IEnumerator TakeSSAndShare(string subject, string description)
	{
		yield return new WaitForEndOfFrame();
		try
		{
			screenshotImage = new Texture2D(Screen.width, Screen.height, TextureFormat.RGB24, mipChain: false);
			screenshotImage.ReadPixels(new Rect(0f, 0f, Screen.width, Screen.height), 0, 0);
			screenshotImage.Apply();
			UnityEngine.Object.Instantiate(MYFileBrowserPrefab, base.transform.parent).InitializeShareScreenshot(this);
		}
		catch (Exception ex)
		{
			ScreenController.instance.ShowDialogPopUp("ERROR", ex.ToString(), null);
			afterShareCallback?.Invoke();
		}
	}
}
