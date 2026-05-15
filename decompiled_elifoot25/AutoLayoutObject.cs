using System;
using UnityEngine;

[Serializable]
public class AutoLayoutObject
{
	[SerializeField]
	private GameObject gameObject;

	[SerializeField]
	private float width = 100f;

	[NonSerialized]
	private LayoutObject _layoutObject;

	[NonSerialized]
	private bool _needsRefresh = true;

	public GameObject GameObject
	{
		get
		{
			return gameObject;
		}
		set
		{
			if (gameObject != value)
			{
				gameObject = value;
				_needsRefresh = true;
				if (value != null && (width == 100f || width <= 0f))
				{
					RefreshLayoutObject();
				}
			}
		}
	}

	public float Width
	{
		get
		{
			return width;
		}
		set
		{
			if (width != value)
			{
				width = value;
				if (_layoutObject != null)
				{
					_layoutObject.width = value;
				}
			}
		}
	}

	public LayoutObject LayoutObject
	{
		get
		{
			if (_needsRefresh || _layoutObject == null)
			{
				RefreshLayoutObject();
			}
			return _layoutObject;
		}
	}

	public bool IsValid
	{
		get
		{
			if (gameObject != null && LayoutObject != null)
			{
				return LayoutObject.rectTransform != null;
			}
			return false;
		}
	}

	public void RefreshLayoutObject()
	{
		if (gameObject != null)
		{
			RectTransform component = gameObject.GetComponent<RectTransform>();
			if (component != null)
			{
				float num = width;
				_layoutObject = new LayoutObject(component);
				if (num == 100f || num <= 0f)
				{
					width = ((component.sizeDelta.x > 0f) ? component.sizeDelta.x : 100f);
				}
				else
				{
					width = num;
				}
				_layoutObject.width = width;
				_layoutObject.actualWidth = width;
			}
			else
			{
				_layoutObject = null;
			}
		}
		else
		{
			_layoutObject = null;
		}
		_needsRefresh = false;
	}

	public void UpdateWidthFromObject()
	{
		if (!(gameObject != null))
		{
			return;
		}
		RectTransform component = gameObject.GetComponent<RectTransform>();
		if (component != null)
		{
			width = ((component.sizeDelta.x > 0f) ? component.sizeDelta.x : 100f);
			if (_layoutObject != null)
			{
				_layoutObject.width = width;
				_layoutObject.actualWidth = width;
			}
		}
	}

	public AutoLayoutObject()
	{
	}

	public AutoLayoutObject(GameObject obj)
	{
		gameObject = obj;
		RefreshLayoutObject();
	}
}
