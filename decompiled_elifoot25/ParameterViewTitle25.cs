using System;
using UnityEngine;
using UnityEngine.UI;

public class ParameterViewTitle25 : MonoBehaviour
{
	[SerializeField]
	private RectTransform rectTransform;

	[SerializeField]
	private Text text;

	[SerializeField]
	private Button button;

	internal string Title => text.text;

	internal void Initialize(string title, Action foldoutAction = null)
	{
		rectTransform.rect.Set(0f, 0f, 0f, 0f);
		text.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		text.text = title;
		if (foldoutAction != null)
		{
			button.onClick.AddListener(delegate
			{
				foldoutAction();
			});
		}
	}
}
