using UnityEngine;
using UnityEngine.UI;

public class LoadSprite : MonoBehaviour
{
	private InputField inputF;

	private Image image;

	private Toggle enc;

	private void Start()
	{
		inputF = base.transform.Find("InputField").GetComponent<InputField>();
		image = base.transform.Find("Image").GetComponent<Image>();
		enc = base.transform.Find("ToggleEnc").GetComponent<Toggle>();
	}

	public void Load()
	{
		image.sprite = FileManagement.ImportSprite(inputF.text, enc.isOn);
	}
}
