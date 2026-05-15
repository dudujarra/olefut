using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Image))]
public class EliImage : EliComponent
{
	[Header("EliImage")]
	public string imageStyle = "";

	public bool useConfigColor = true;

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
		if (string.IsNullOrEmpty(baseStyle))
		{
			return;
		}
		if (image == null)
		{
			Awake();
		}
		string styleValue;
		if (useConfigColor)
		{
			styleValue = GetStyleValue(baseStyle + ".{0}.BackgroundColor", imageStyle);
			if (styleValue != null)
			{
				image.color = Util.ParseColor(styleValue);
			}
		}
		string styleValue2 = GetStyleValue(baseStyle + ".{0}.Texture", imageStyle);
		if (styleValue2 == null)
		{
			image.sprite = null;
		}
		else
		{
			image.sprite = Util.LoadSprite(styleValue2);
			image.type = GetStyleValue(baseStyle + ".{0}.ImageType", imageStyle, image.type);
			if (image.type == Image.Type.Simple)
			{
				image.preserveAspect = GetStyleValue(baseStyle + ".{0}.Image.PreserveAspect", imageStyle, image.preserveAspect);
			}
			else if (image.type == Image.Type.Sliced || image.type == Image.Type.Tiled)
			{
				image.fillCenter = GetStyleValue(baseStyle + ".{0}.Image.FillCenter", imageStyle, image.fillCenter);
			}
		}
		styleValue = GetStyleValue(baseStyle + ".{0}.RaycastTarget", imageStyle);
		if (styleValue != null)
		{
			image.raycastTarget = bool.Parse(styleValue);
		}
	}
}
