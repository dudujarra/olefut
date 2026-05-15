using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;

namespace Picker;

[RequireComponent(typeof(RectTransform))]
[ExecuteInEditMode]
[AddComponentMenu("UI/Picker/MassivePickerItem", 1007)]
[DisallowMultipleComponent]
public class MassivePickerItem : UIBehaviour, IPointerClickHandler, IEventSystemHandler
{
	public object userData;

	public UnityEvent onClick = new UnityEvent();

	[NonSerialized]
	public int itemIndex = -1;

	protected RectTransform m_RectTransform;

	protected MassivePickerLayoutGroup parentLayoutGroup;

	public RectTransform rectTransform
	{
		get
		{
			if (m_RectTransform != null)
			{
				return m_RectTransform;
			}
			return m_RectTransform = GetComponent<RectTransform>();
		}
	}

	public virtual void SetItemContents(MassivePickerScrollRect scrollRect, int itemIndex)
	{
		Debug.LogWarning("SetItemContens() is not overrided. It's necessary to attach the script which expanded MassivePickerItem to an item.");
	}

	protected override void Start()
	{
		base.Start();
		FixedAnchor();
	}

	private void FixedAnchor()
	{
		RectTransform obj = rectTransform;
		Vector2 anchorMin = (rectTransform.anchorMax = new Vector2(0.5f, 0.5f));
		obj.anchorMin = anchorMin;
	}

	public void OnPointerClick(PointerEventData eventData)
	{
		ScrollToSelf();
		onClick.Invoke();
	}

	protected void ScrollToSelf()
	{
		MassivePickerLayoutGroup componentInParent = GetComponentInParent<MassivePickerLayoutGroup>();
		if (!(componentInParent == null))
		{
			MassivePickerScrollRect scrollRect = componentInParent.scrollRect;
			if (!(scrollRect == null))
			{
				scrollRect.ScrollTo(this);
			}
		}
	}
}
