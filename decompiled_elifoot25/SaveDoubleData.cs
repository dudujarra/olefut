using UnityEngine;
using UnityEngine.UI;

public class SaveDoubleData : MonoBehaviour
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
			double content = double.Parse(text);
			FileManagement.SaveFile("doubleData", content, isOn);
		}
	}

	public void ReadData()
	{
		bool isOn = toggleEnc1.isOn;
		double num = FileManagement.ReadFile<double>("doubleData", isOn);
		labelOut.text = num.ToString();
	}
}
