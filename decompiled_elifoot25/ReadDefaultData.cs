using UnityEngine;
using UnityEngine.UI;

public class ReadDefaultData : MonoBehaviour
{
	private Text labelOut;

	private Toggle toggleEnc;

	private void Start()
	{
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
		toggleEnc = base.transform.Find("ToggleEnc").GetComponent<Toggle>();
	}

	public void ReadData()
	{
		labelOut.text = "";
		labelOut.text = FileManagement.ReadFile<string>("data.txt", toggleEnc.isOn);
	}
}
