using UnityEngine;
using UnityEngine.UI;

public class LoadTexture : MonoBehaviour
{
	private InputField inputF;

	private RawImage rImage;

	private Toggle enc;

	private void Start()
	{
		inputF = base.transform.Find("InputField").GetComponent<InputField>();
		rImage = base.transform.Find("RawImage").GetComponent<RawImage>();
		enc = base.transform.Find("ToggleEnc").GetComponent<Toggle>();
	}

	public void Load()
	{
		rImage.texture = FileManagement.ImportTexture(inputF.text, enc.isOn);
	}
}
