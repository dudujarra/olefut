using UnityEngine;
using UnityEngine.UI;

public class SaveVector4Data : MonoBehaviour
{
	private Toggle toggleEnc0;

	private InputField inputX;

	private InputField inputY;

	private InputField inputZ;

	private InputField inputW;

	private Text labelOut;

	private void Start()
	{
		inputX = base.transform.Find("InputX").GetComponent<InputField>();
		inputY = base.transform.Find("InputY").GetComponent<InputField>();
		inputZ = base.transform.Find("InputZ").GetComponent<InputField>();
		inputW = base.transform.Find("InputW").GetComponent<InputField>();
		toggleEnc0 = base.transform.Find("ToggleEnc (0)").GetComponent<Toggle>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
	}

	public void SaveData()
	{
		float x = ((inputX.text != "") ? float.Parse(inputX.text) : 0f);
		float y = ((inputY.text != "") ? float.Parse(inputY.text) : 0f);
		float z = ((inputZ.text != "") ? float.Parse(inputZ.text) : 0f);
		float w = ((inputW.text != "") ? float.Parse(inputW.text) : 0f);
		bool isOn = toggleEnc0.isOn;
		Vector4 content = new Vector4(x, y, z, w);
		FileManagement.SaveFile("v4Data", content, isOn);
	}

	public void ReadData()
	{
		bool isOn = toggleEnc0.isOn;
		Vector4 vector = FileManagement.ReadFile<Vector4>("v4Data", isOn);
		labelOut.text = vector.ToString();
	}
}
