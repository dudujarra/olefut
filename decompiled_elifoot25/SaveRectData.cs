using UnityEngine;
using UnityEngine.UI;

public class SaveRectData : MonoBehaviour
{
	private Toggle toggleEnc0;

	private InputField inputX;

	private InputField inputY;

	private InputField inputW;

	private InputField inputH;

	private Text labelOut;

	private void Start()
	{
		inputX = base.transform.Find("InputX").GetComponent<InputField>();
		inputY = base.transform.Find("InputY").GetComponent<InputField>();
		inputW = base.transform.Find("InputW").GetComponent<InputField>();
		inputH = base.transform.Find("InputH").GetComponent<InputField>();
		toggleEnc0 = base.transform.Find("ToggleEnc (0)").GetComponent<Toggle>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
	}

	public void SaveData()
	{
		float x = ((inputX.text != "") ? float.Parse(inputX.text) : 0f);
		float y = ((inputY.text != "") ? float.Parse(inputY.text) : 0f);
		float width = ((inputW.text != "") ? float.Parse(inputW.text) : 0f);
		float height = ((inputH.text != "") ? float.Parse(inputH.text) : 0f);
		bool isOn = toggleEnc0.isOn;
		Rect content = new Rect(x, y, width, height);
		FileManagement.SaveFile("rData", content, isOn);
	}

	public void ReadData()
	{
		bool isOn = toggleEnc0.isOn;
		Rect rect = FileManagement.ReadFile<Rect>("rData", isOn);
		labelOut.text = rect.ToString();
	}
}
