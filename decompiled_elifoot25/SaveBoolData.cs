using UnityEngine;
using UnityEngine.UI;

public class SaveBoolData : MonoBehaviour
{
	private Toggle toggleEnc0;

	private Dropdown dDown;

	private Text labelOut;

	private Toggle toggleEnc1;

	private void Start()
	{
		MonoBehaviour.print(Application.persistentDataPath);
		toggleEnc0 = base.transform.Find("ToggleEnc (0)").GetComponent<Toggle>();
		dDown = base.transform.Find("Dropdown").GetComponent<Dropdown>();
		labelOut = base.transform.Find("LabelOutput").Find("Text").GetComponent<Text>();
		toggleEnc1 = base.transform.Find("ToggleEnc (1)").GetComponent<Toggle>();
	}

	public void SaveData()
	{
		bool isOn = toggleEnc0.isOn;
		bool content = ((dDown.value != 0) ? true : false);
		FileManagement.SaveFile("boolData", content, isOn);
	}

	public void ReadData()
	{
		bool isOn = toggleEnc1.isOn;
		bool flag = FileManagement.ReadFile<bool>("boolData", isOn);
		labelOut.text = flag.ToString();
	}
}
