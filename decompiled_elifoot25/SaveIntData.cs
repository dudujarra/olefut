using UnityEngine;
using UnityEngine.UI;

public class SaveIntData : MonoBehaviour
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
		string text = inputF.text;
		bool isOn = toggleEnc0.isOn;
		if (text != "")
		{
			int content = int.Parse(text);
			FileManagement.SaveFile("intData", content, isOn);
		}
	}

	public void ReadData()
	{
		bool isOn = toggleEnc1.isOn;
		int num = FileManagement.ReadFile<int>("intData", isOn);
		labelOut.text = num.ToString();
	}
}
