using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Text))]
public class EliLabel : EliComponent
{
	public enum BestFit
	{
		ForceEnable,
		UseStyleValue,
		ForceDisabled
	}

	[Header("EliLabel")]
	public string labelStyle = "";

	public bool overrideColor = true;

	public bool useOutline;

	[Header("Text size")]
	public bool overrideFontSize = true;

	public BestFit forceBestFit = BestFit.UseStyleValue;

	public bool dynamicTextSize;

	public int dynamicScale = 10;

	public GameObject dynamicSizeSource;

	private Text label;

	private void Awake()
	{
		label = GetComponent<Text>();
	}

	private void Start()
	{
		ReloadElementConfig();
	}

	public override void ReloadElementConfig()
	{
		if (label == null)
		{
			Awake();
			if (label == null)
			{
				return;
			}
		}
		if (string.IsNullOrEmpty(baseStyle))
		{
			baseStyle = "LabelStyle";
		}
		string styleValue = GetStyleValue(baseStyle + ".{0}.Font", labelStyle);
		if (styleValue != null)
		{
			Font font = Util.LoadFont(styleValue);
			if (font != null)
			{
				label.font = font;
			}
		}
		if (overrideFontSize)
		{
			string styleValue2 = GetStyleValue(baseStyle + ".{0}.FontSize", labelStyle);
			if (styleValue2 != null)
			{
				label.fontSize = int.Parse(styleValue2.Trim());
			}
		}
		if (dynamicTextSize)
		{
			RectTransform rectTransform = ((dynamicSizeSource == null) ? GetComponentInParent<RectTransform>() : dynamicSizeSource.GetComponent<RectTransform>());
			if (rectTransform != null)
			{
				float width = rectTransform.rect.width;
				label.fontSize = (int)(width * (float)dynamicScale / 100f);
			}
		}
		if (overrideColor)
		{
			string styleValue3 = GetStyleValue(baseStyle + ".{0}.TextColor", labelStyle);
			if (styleValue3 != null)
			{
				label.color = Util.ParseColor(styleValue3);
			}
		}
		if (forceBestFit == BestFit.ForceEnable)
		{
			label.resizeTextForBestFit = true;
		}
		else if (forceBestFit == BestFit.ForceDisabled)
		{
			label.resizeTextForBestFit = false;
		}
		else
		{
			label.resizeTextForBestFit = GetStyleValue(baseStyle + ".{0}.BestFit", labelStyle, label.resizeTextForBestFit);
		}
		label.resizeTextMaxSize = label.fontSize;
		if (useOutline)
		{
			AddOutline();
			return;
		}
		Outline component = label.gameObject.GetComponent<Outline>();
		if (component != null)
		{
			component.enabled = false;
		}
	}

	public void AddOutline()
	{
		string styleValue = GetStyleValue(baseStyle + ".{0}.OutlineEnabled", labelStyle);
		string styleValue2 = GetStyleValue(baseStyle + ".{0}.OutlineEffectColor", labelStyle);
		string styleValue3 = GetStyleValue(baseStyle + ".{0}.OutlineEffectDistanceX", labelStyle);
		string styleValue4 = GetStyleValue(baseStyle + ".{0}.OutlineEffectDistanceY", labelStyle);
		if (!int.TryParse(styleValue, out var result))
		{
			return;
		}
		if (result == 1)
		{
			Outline outline = label.gameObject.GetComponent<Outline>();
			if (outline == null)
			{
				outline = label.gameObject.AddComponent<Outline>();
			}
			outline.enabled = true;
			if (styleValue2 != null)
			{
				outline.effectColor = Util.ParseColor(styleValue2);
			}
			if (styleValue3 != null)
			{
				outline.effectDistance = new Vector2(float.Parse(styleValue3), outline.effectDistance.y);
			}
			if (styleValue4 != null)
			{
				outline.effectDistance = new Vector2(outline.effectDistance.y, float.Parse(styleValue4));
			}
		}
		else
		{
			Outline component = label.gameObject.GetComponent<Outline>();
			if (component != null)
			{
				component.enabled = false;
			}
		}
	}

	public void SetupByGroup(string baseStyle, string labelStyle, bool overrideColor, bool overrideFontSize, BestFit forceBestFit, bool useOutline)
	{
		base.baseStyle = baseStyle;
		this.labelStyle = labelStyle;
		this.overrideColor = overrideColor;
		this.overrideFontSize = overrideFontSize;
		this.forceBestFit = forceBestFit;
		this.useOutline = useOutline;
	}
}
