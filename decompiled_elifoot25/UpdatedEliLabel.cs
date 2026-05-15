using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class UpdatedEliLabel : EliComponent
{
	[Header("EliLabel")]
	public string labelStyle = "";

	public bool overrideColor = true;

	[SerializeField]
	internal string labelID = "";

	private EliView parentView;

	private TMP_Text label;

	public TMP_Text Label => label;

	private void Awake()
	{
		parentView = GetComponentInParent<EliView>();
		label = GetComponent<TMP_Text>();
	}

	private void Start()
	{
		ReloadElementConfig();
	}

	public override void ReloadElementConfig()
	{
		Debug.Log("Using TextMeshPro for label '" + base.name + "'");
		string styleValue = GetStyleValue(baseStyle + ".{0}.Font", labelStyle);
		if (!string.IsNullOrEmpty(styleValue))
		{
			TMP_FontAsset tMP_FontAsset = Resources.Load<TMP_FontAsset>("Fonts/" + styleValue);
			if (tMP_FontAsset != null)
			{
				label.font = tMP_FontAsset;
			}
		}
		if (overrideColor)
		{
			string styleValue2 = GetStyleValue(baseStyle + ".{0}.TextColor", labelStyle);
			if (styleValue2 != null)
			{
				label.color = Util.ParseColor(styleValue2);
			}
		}
		if (parentView == null)
		{
			parentView = GetComponentInParent<EliView>();
		}
		if (parentView != null)
		{
			parentView.ConnectUpdatedElilabel(this);
		}
	}
}
