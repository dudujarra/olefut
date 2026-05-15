using UnityEngine;
using UnityEngine.UI;

public class SaveDefaultData : MonoBehaviour
{
	private InputField inputF;

	private Toggle toggleEnc;

	private void Start()
	{
		inputF = base.transform.Find("InputField").GetComponent<InputField>();
		toggleEnc = base.transform.Find("ToggleEnc").GetComponent<Toggle>();
	}

	public void SaveData()
	{
		FileManagement.SaveFile("data.txt", inputF.text, toggleEnc.isOn);
	}
}
