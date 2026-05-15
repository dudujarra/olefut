using UnityEngine;
using UnityEngine.UI;

public class SaveIntPP : MonoBehaviour
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
			int value = int.Parse(text);
			FileManagement.SetInt("intDataPP", value);
		}
	}

	public void ReadData()
	{
		int num = FileManagement.GetInt("intDataPP");
		labelOut.text = num.ToString();
	}
}
