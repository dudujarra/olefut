using UnityEngine;
using UnityEngine.UI;

public class EliLabelGroup : MonoBehaviour
{
	public string baseStyle = "";

	public string labelStyle = "";

	public bool overrideColor = true;

	public bool overrideFontSize = true;

	public EliLabel.BestFit forceBestFit = EliLabel.BestFit.UseStyleValue;

	public bool useOutline;

	private void Start()
	{
		if (string.IsNullOrEmpty(baseStyle))
		{
			baseStyle = "LabelStyle";
		}
		Text[] componentsInChildren = base.gameObject.GetComponentsInChildren<Text>(includeInactive: true);
		foreach (Text text in componentsInChildren)
		{
			if (!(text.gameObject.GetComponent<EliLabel>() != null))
			{
				text.gameObject.AddComponent<EliLabel>().SetupByGroup(baseStyle, labelStyle, overrideColor, overrideFontSize, forceBestFit, useOutline);
			}
		}
	}
}
