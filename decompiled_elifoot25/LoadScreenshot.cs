using UnityEngine;
using UnityEngine.UI;

public class LoadScreenshot : MonoBehaviour
{
	private RawImage rImage;

	private Toggle enc;

	private void Start()
	{
		rImage = base.transform.Find("RawImage").GetComponent<RawImage>();
		enc = base.transform.Find("ToggleEnc").GetComponent<Toggle>();
	}

	public void Load()
	{
		rImage.texture = FileManagement.ImportTexture("capture.jpg", enc.isOn);
	}
}
