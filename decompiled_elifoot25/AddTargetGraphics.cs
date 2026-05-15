using System;
using UnityEngine;
using UnityEngine.UI;

public class AddTargetGraphics : MonoBehaviour
{
	[Serializable]
	public struct TargetGraphic
	{
		public Graphic graphic;

		[HideInInspector]
		public Color normalColor;

		public Color pressedColor;

		public Color32 disabledColor;
	}

	public TargetGraphic[] targetGraphics;

	private Button button;

	private Toggle toggle;

	private void Awake()
	{
		button = GetComponent<Button>();
		toggle = GetComponent<Toggle>();
		if ((!(button == null) || !(toggle == null)) && targetGraphics.Length >= 0)
		{
			for (int i = 0; i < targetGraphics.Length; i++)
			{
				targetGraphics[i].normalColor = targetGraphics[i].graphic.color;
			}
		}
	}

	public void ChangeToNormalState()
	{
		for (int i = 0; i < targetGraphics.Length; i++)
		{
			targetGraphics[i].graphic.color = targetGraphics[i].normalColor;
		}
	}

	public void ChangeToPressedState()
	{
		for (int i = 0; i < targetGraphics.Length; i++)
		{
			targetGraphics[i].graphic.color = targetGraphics[i].pressedColor;
		}
	}

	public void ChangeToDisabledState(bool includeEliComponents = true)
	{
		for (int i = 0; i < targetGraphics.Length; i++)
		{
			targetGraphics[i].graphic.color = targetGraphics[i].disabledColor;
		}
	}
}
