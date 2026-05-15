using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[AddComponentMenu("UI/Picker/ImagePicker", 1031)]
public class ImagePicker : Picker<PickerItem, Sprite, ImageList>
{
	protected override void SetParameter(PickerItem item, Sprite param)
	{
		Image image = item.GetComponent<Image>();
		if (image == null)
		{
			image = item.gameObject.AddComponent<Image>();
		}
		image.sprite = param;
	}
}
