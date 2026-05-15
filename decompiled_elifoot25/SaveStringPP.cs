using UnityEngine;
using UnityEngine.UI;

public class SaveStringPP : MonoBehaviour
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
		FileManagement.SetString("stringDataPP", text);
	}

	public void ReadData()
	{
		labelOut.text = FileManagement.GetString("stringDataPP");
	}
}
