using UnityEngine;
using UnityEngine.UI;

public class ParameterViewSubtitle25 : MonoBehaviour
{
	[SerializeField]
	private RectTransform rectTransform;

	[SerializeField]
	private Text text;

	internal void Initialize(string title)
	{
		rectTransform.rect.Set(0f, 0f, 0f, 0f);
		text.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		text.text = title;
	}
}
