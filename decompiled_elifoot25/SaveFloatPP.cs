using UnityEngine;
using UnityEngine.UI;

public class SaveFloatPP : MonoBehaviour
{
	private InputField inputF;

	private Text labelOut;

	private void Start()
	{
		inputF = base.transform.Find("InputField").GetComponent<InputField>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
	}

	public void SaveData()
	{
		string text = inputF.text;
		if (text != "")
		{
			float value = float.Parse(text);
			FileManagement.SetFloat("floatDataPP", value);
		}
	}

	public void ReadData()
	{
		float num = FileManagement.GetFloat("floatDataPP");
		labelOut.text = num.ToString();
	}
}
