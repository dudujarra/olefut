using UnityEngine;
using UnityEngine.UI;

public class SaveVector3Data : MonoBehaviour
{
	private Toggle toggleEnc0;

	private InputField inputX;

	private InputField inputY;

	private InputField inputZ;

	private Text labelOut;

	private void Start()
	{
		inputX = base.transform.Find("InputX").GetComponent<InputField>();
		inputY = base.transform.Find("InputY").GetComponent<InputField>();
		inputZ = base.transform.Find("InputZ").GetComponent<InputField>();
		toggleEnc0 = base.transform.Find("ToggleEnc (0)").GetComponent<Toggle>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
	}

	public void SaveData()
	{
		float x = ((inputX.text != "") ? float.Parse(inputX.text) : 0f);
		float y = ((inputY.text != "") ? float.Parse(inputY.text) : 0f);
		float z = ((inputZ.text != "") ? float.Parse(inputZ.text) : 0f);
		bool isOn = toggleEnc0.isOn;
		Vector3 content = new Vector3(x, y, z);
		FileManagement.SaveFile("v3Data", content, isOn);
	}

	public void ReadData()
	{
		bool isOn = toggleEnc0.isOn;
		Vector3 vector = FileManagement.ReadFile<Vector3>("v3Data", isOn);
		labelOut.text = vector.ToString();
	}
}
