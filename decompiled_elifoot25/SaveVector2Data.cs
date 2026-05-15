using UnityEngine;
using UnityEngine.UI;

public class SaveVector2Data : MonoBehaviour
{
	private Toggle toggleEnc0;

	private InputField inputX;

	private InputField inputY;

	private Text labelOut;

	private void Start()
	{
		inputX = base.transform.Find("InputX").GetComponent<InputField>();
		inputY = base.transform.Find("InputY").GetComponent<InputField>();
		toggleEnc0 = base.transform.Find("ToggleEnc (0)").GetComponent<Toggle>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
	}

	public void SaveData()
	{
		float x = ((inputX.text != "") ? float.Parse(inputX.text) : 0f);
		float y = ((inputY.text != "") ? float.Parse(inputY.text) : 0f);
		bool isOn = toggleEnc0.isOn;
		Vector2 content = new Vector2(x, y);
		FileManagement.SaveFile("v2Data", content, isOn);
	}

	public void ReadData()
	{
		bool isOn = toggleEnc0.isOn;
		Vector2 vector = FileManagement.ReadFile<Vector2>("v2Data", isOn);
		labelOut.text = vector.ToString();
	}
}
