using UnityEngine;
using UnityEngine.UI;

public class SaveFloatData : MonoBehaviour
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
			float content = float.Parse(text);
			FileManagement.SaveFile("floatData", content, isOn);
		}
	}

	public void ReadData()
	{
		bool isOn = toggleEnc1.isOn;
		float num = FileManagement.ReadFile<float>("floatData", isOn);
		labelOut.text = num.ToString();
	}
}
