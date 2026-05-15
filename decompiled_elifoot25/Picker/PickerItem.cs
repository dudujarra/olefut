using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;

namespace Picker;

[RequireComponent(typeof(RectTransform))]
[ExecuteInEditMode]
[AddComponentMenu("UI/Picker/PickerItem", 1002)]
[DisallowMultipleComponent]
public class PickerItem : UIBehaviour, IPointerClickHandler, IEventSystemHandler
{
	public object userData;

	public UnityEvent onClick = new UnityEvent();

	[NonSerialized]
	public float position;

	protected PickerLayoutGroup parentLayoutGroup;

	public void OnPointerClick(PointerEventData eventData)
	{
		ScrollToSelf();
		onClick.Invoke();
	}

	protected void ScrollToSelf()
	{
		PickerLayoutGroup componentInParent = GetComponentInParent<PickerLayoutGroup>();
		if (!(componentInParent == null))
		{
			PickerScrollRect scrollRect = componentInParent.scrollRect;
			if (!(scrollRect == null))
			{
				scrollRect.ScrollTo(this);
			}
		}
	}

	protected virtual void RebuildLayout()
	{
		PickerLayoutGroup componentInParent = GetComponentInParent<PickerLayoutGroup>();
		if (componentInParent != null)
		{
			componentInParent.RebuildLayout();
		}
	}

	protected override void OnBeforeTransformParentChanged()
	{
		base.OnBeforeTransformParentChanged();
		if (base.transform.parent != null)
		{
			PickerLayoutGroup component = base.transform.parent.GetComponent<PickerLayoutGroup>();
			if (component != null)
			{
				component.UnregisterItem(this);
			}
		}
	}

	protected override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
	}
}
