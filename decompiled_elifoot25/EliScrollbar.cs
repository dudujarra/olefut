using UnityEngine;
using UnityEngine.UI;

[DisallowMultipleComponent]
[RequireComponent(typeof(Scrollbar), typeof(Image))]
public class EliScrollbar : EliComponent
{
	[Header("EliScrollbar")]
	public string scrollbarStyle = "";

	public Image Handle;

	private Image image;

	private void Awake()
	{
		image = GetComponent<Image>();
	}

	private void Start()
	{
		ReloadElementConfig();
	}

	public override void ReloadElementConfig()
	{
		if (image == null)
		{
			Awake();
		}
		if (string.IsNullOrEmpty(baseStyle))
		{
			baseStyle = "Scrollbar";
		}
		string styleValue = GetStyleValue(baseStyle + ".{0}.BaseColor", scrollbarStyle);
		if (styleValue != null)
		{
			image.color = Util.ParseColor(styleValue);
		}
		if (Handle != null)
		{
			styleValue = GetStyleValue(baseStyle + ".{0}.SliderColor", scrollbarStyle);
			if (styleValue != null)
			{
				Handle.color = Util.ParseColor(styleValue);
			}
		}
	}
}
