using System;
using UnityEngine;

[Serializable]
public class LayoutObject
{
	public RectTransform rectTransform;

	public float width = 100f;

	[HideInInspector]
	public float actualWidth;

	public LayoutObject()
	{
	}

	public LayoutObject(RectTransform rect)
	{
		rectTransform = rect;
		if (rect != null)
		{
			actualWidth = width;
		}
	}
}
