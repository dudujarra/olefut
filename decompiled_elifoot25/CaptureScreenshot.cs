using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class CaptureScreenshot : MonoBehaviour
{
	private RawImage rImage;

	private Texture2D capture;

	private Toggle enc;

	private void Start()
	{
		rImage = base.transform.Find("RawImage").GetComponent<RawImage>();
		capture = new Texture2D(Screen.width, Screen.height);
		enc = base.transform.Find("ToggleEnc").GetComponent<Toggle>();
	}

	public void Capture()
	{
		StartCoroutine(TakeScreenshot());
	}

	private IEnumerator TakeScreenshot()
	{
		yield return new WaitForEndOfFrame();
		capture.ReadPixels(new Rect(0f, 0f, Screen.width, Screen.height), 0, 0);
		capture.Apply();
		rImage.texture = capture;
		FileManagement.SaveJpgTexture("capture.jpg", rImage.texture, 100, enc.isOn);
	}

	public void Delete()
	{
		rImage.texture = null;
		FileManagement.DeleteFile("capture.jpg");
	}
}
