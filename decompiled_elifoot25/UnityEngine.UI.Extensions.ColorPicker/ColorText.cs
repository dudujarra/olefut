namespace UnityEngine.UI.Extensions.ColorPicker;

[RequireComponent(typeof(Text))]
public class ColorText : MonoBehaviour
{
	public ColorPickerControl picker;

	private Text text;

	private void Awake()
	{
		text = GetComponent<Text>();
		picker.onValueChanged.AddListener(ColorChanged);
	}

	private void OnDestroy()
	{
		picker.onValueChanged.RemoveListener(ColorChanged);
	}

	private void ColorChanged(Color newColor)
	{
		text.color = newColor;
	}
}
