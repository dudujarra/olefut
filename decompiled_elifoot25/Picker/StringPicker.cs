using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[AddComponentMenu("UI/Picker/StringPicker", 1030)]
public class StringPicker : Picker<PickerItem, string, StringList>
{
	protected override void SetParameter(PickerItem item, string param)
	{
		Text text = item.GetComponent<Text>();
		if (text == null)
		{
			text = item.gameObject.AddComponent<Text>();
			text.resizeTextForBestFit = true;
			text.color = Color.black;
			text.alignment = TextAnchor.MiddleCenter;
		}
		text.text = param;
	}
}
