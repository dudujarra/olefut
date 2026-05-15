using UnityEngine;
using UnityEngine.UI;

public class SaveStringData : MonoBehaviour
{
	private Toggle toggleEnc0;

	private InputField inputF;

	private Text labelOut;

	private Toggle toggleEnc1;

	private void Start()
	{
		toggleEnc0 = base.transform.Find("ToggleEnc (0)").GetComponent<Toggle>();
		inputF = base.transform.Find("InputField").GetComponent<InputField>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
		toggleEnc1 = base.transform.Find("ToggleEnc (1)").GetComponent<Toggle>();
	}

	public void SaveData()
	{
		bool isOn = toggleEnc0.isOn;
		string text = inputF.text;
		FileManagement.SaveFile("stringData", text, isOn);
	}

	public void ReadData()
	{
		bool isOn = toggleEnc1.isOn;
		labelOut.text = FileManagement.ReadFile<string>("stringData", isOn);
	}
}
