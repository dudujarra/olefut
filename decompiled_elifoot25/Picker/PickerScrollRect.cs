using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;
using UnityEngine.UI;

namespace Picker;

[ExecuteInEditMode]
[AddComponentMenu("UI/Picker/PickerScrollRect", 1000)]
[DisallowMultipleComponent]
public class PickerScrollRect : ScrollRect
{
	[Serializable]
	public class ItemSelectEvent : UnityEvent<GameObject>
	{
	}

	[SerializeField]
	public float autoScrollSeconds = 0.65f;

	[SerializeField]
	public float slipVelocityRate = 0.25f;

	[SerializeField]
	protected bool m_wheelEffect;

	[SerializeField]
	protected float m_perspective = 0.25f;

	public ItemSelectEvent onSelectItem = new ItemSelectEvent();

	protected PickerItem beforeSelectedItem;

	protected DrivenRectTransformTracker m_tracker;

	private RectTransform m_beforeContent;

	protected PickerLayoutGroup m_pickerLayoutGroup;

	protected RectTransform m_selfRect;

	public InitialPosition initialPosition;

	public int initialPositionItemIndex;

	protected Vector2 beforeScrollPosition;

	protected bool m_dragging;

	protected bool m_autoScroll;

	protected bool m_slip;

	protected float m_autoScrollTimeCount;

	protected Vector2 m_targetPosition;

	protected Vector2 m_fromPosition;

	protected float m_stopAutoScroll;

	private bool m_setInitialPosition;

	public float firstItemPosition
	{
		get
		{
			Transform transform = m_pickerLayoutGroup.transform;
			if (transform.childCount <= 0)
			{
				return 0f;
			}
			PickerItem component = transform.GetChild(0).GetComponent<PickerItem>();
			if (component == null)
			{
				return 0f;
			}
			return component.position;
		}
	}

	public float lastItemPosition
	{
		get
		{
			Transform transform = m_pickerLayoutGroup.transform;
			int childCount = transform.childCount;
			if (childCount <= 0)
			{
				return 0f;
			}
			PickerItem component = transform.GetChild(childCount - 1).GetComponent<PickerItem>();
			if (component == null)
			{
				return 0f;
			}
			return component.position;
		}
	}

	public RectTransform.Axis layout
	{
		get
		{
			if (!base.horizontal)
			{
				return RectTransform.Axis.Vertical;
			}
			return RectTransform.Axis.Horizontal;
		}
		set
		{
			bool flag = value == RectTransform.Axis.Horizontal;
			if (base.horizontal == flag && base.vertical == !flag)
			{
				return;
			}
			if (base.content != null)
			{
				Vector2 anchoredPosition = base.content.anchoredPosition;
				if (anchoredPosition[(int)(1 - value)] != 0f)
				{
					base.content.anchoredPosition = anchoredPosition.Assign(0f, (int)(1 - value));
				}
			}
			base.horizontal = flag;
			base.vertical = !flag;
			SetContentProperties();
			UpdateLayout();
		}
	}

	public bool wheelEffect
	{
		get
		{
			return m_wheelEffect;
		}
		set
		{
			if (m_wheelEffect != value)
			{
				m_wheelEffect = value;
				UpdateLayout();
			}
		}
	}

	public float wheelPerspective
	{
		get
		{
			return m_perspective;
		}
		set
		{
			if (m_perspective != value)
			{
				m_perspective = value;
				UpdateLayout();
			}
		}
	}

	public new MovementType movementType
	{
		get
		{
			return base.movementType;
		}
		set
		{
			if (base.movementType != value)
			{
				base.movementType = value;
				PickerItem nearItem = GetNearItem();
				UpdateLayout();
				if (nearItem != null)
				{
					ScrollTo(nearItem.position);
				}
			}
		}
	}

	public bool infiniteScroll => movementType == MovementType.Unrestricted;

	protected List<PickerItem> items
	{
		get
		{
			if (pickerLayoutGroup == null)
			{
				return null;
			}
			return pickerLayoutGroup.itemList;
		}
	}

	protected virtual PickerLayoutGroup pickerLayoutGroup
	{
		get
		{
			if (m_pickerLayoutGroup != null)
			{
				return m_pickerLayoutGroup;
			}
			if (base.content != null)
			{
				m_pickerLayoutGroup = base.content.GetComponent<PickerLayoutGroup>();
			}
			return m_pickerLayoutGroup;
		}
	}

	protected RectTransform selfRect
	{
		get
		{
			if (m_selfRect != null)
			{
				return m_selfRect;
			}
			return m_selfRect = GetComponent<RectTransform>();
		}
	}

	public PickerItem GetSelectedPickerItem()
	{
		return beforeSelectedItem;
	}

	public GameObject GetSelectedItem()
	{
		if (!(beforeSelectedItem != null))
		{
			return null;
		}
		return beforeSelectedItem.gameObject;
	}

	public void ScrollTo(PickerItem item, bool immdiate = false)
	{
		if (item != null)
		{
			ScrollTo(item.position, immdiate);
		}
	}

	public void ScrollTo(float offset, bool immdiate = false)
	{
		if (!(base.content == null))
		{
			int num = (int)layout;
			Vector3 vector = base.content.anchoredPosition;
			m_fromPosition = vector;
			vector[num] = offset;
			vector[1 - num] = 0f;
			if (!immdiate)
			{
				m_autoScrollTimeCount = 0f;
				base.velocity = Vector2.zero;
				m_autoScroll = true;
				m_targetPosition = vector;
			}
			else
			{
				base.content.anchoredPosition = vector;
				m_autoScroll = false;
			}
			m_slip = false;
			m_dragging = false;
		}
	}

	public float GetScrollPosition()
	{
		if (base.content == null)
		{
			return 0f;
		}
		return base.content.anchoredPosition[(int)layout];
	}

	public void ScrollToNearItem(bool immdiate = false)
	{
		if (!(pickerLayoutGroup == null))
		{
			PickerItem nearItem = GetNearItem();
			if (nearItem != null)
			{
				ScrollTo(nearItem.position, immdiate);
			}
		}
	}

	protected override void LateUpdate()
	{
		try
		{
			if (pickerLayoutGroup != null)
			{
				pickerLayoutGroup.LockSetLayout();
			}
			if (m_setInitialPosition)
			{
				base.LateUpdate();
			}
			AutoScroll();
			NotifySelectItem();
			if (m_beforeContent != base.content)
			{
				m_beforeContent = base.content;
				SetContentProperties();
			}
			if (pickerLayoutGroup != null && base.content != null && beforeScrollPosition != base.content.anchoredPosition)
			{
				pickerLayoutGroup.SetLayoutVertical();
				pickerLayoutGroup.SetLayoutHorizontal();
			}
		}
		finally
		{
			if (pickerLayoutGroup != null)
			{
				pickerLayoutGroup.UnlockSetLayoutAndUpdateIfDirty();
			}
		}
		if (base.content != null)
		{
			beforeScrollPosition = base.content.anchoredPosition;
		}
	}

	public void SetInitialPosition(int infiniteScrollOffset)
	{
		if (!m_setInitialPosition && items != null && items.Count > 0)
		{
			m_setInitialPosition = true;
			int num = -1;
			switch (initialPosition)
			{
			case InitialPosition.FirstItem:
				num = 0;
				break;
			case InitialPosition.MiddleItem:
				num = items.Count / 2;
				break;
			case InitialPosition.LastItem:
				num = items.Count - 1;
				break;
			case InitialPosition.SelectItemIndex:
				num = Mathf.Clamp(initialPositionItemIndex, 0, items.Count - 1);
				break;
			case InitialPosition.NearItem:
				ScrollToNearItem(immdiate: true);
				base.onValueChanged.Invoke(base.normalizedPosition);
				return;
			}
			if (base.vertical)
			{
				num = items.Count - 1 - num;
			}
			if (infiniteScroll)
			{
				num = (num - infiniteScrollOffset + items.Count) % items.Count;
			}
			ScrollTo(items[num], immdiate: true);
			NotifySelectItem(items[num]);
			base.onValueChanged.Invoke(base.normalizedPosition);
		}
	}

	protected virtual void NotifySelectItem()
	{
		if (!(pickerLayoutGroup == null) && !(base.content == null) && pickerLayoutGroup.itemOffsetList.Count > 0)
		{
			PickerItem nearItem = GetNearItem();
			NotifySelectItem(nearItem);
		}
	}

	protected void NotifySelectItem(PickerItem item)
	{
		if (beforeSelectedItem != item)
		{
			beforeSelectedItem = item;
			GameObject arg = ((item != null) ? item.gameObject : null);
			onSelectItem.Invoke(arg);
		}
	}

	public override void OnBeginDrag(PointerEventData eventData)
	{
		base.OnBeginDrag(eventData);
		m_dragging = true;
		m_autoScroll = false;
		m_slip = false;
		m_stopAutoScroll = 0f;
	}

	public override void OnEndDrag(PointerEventData eventData)
	{
		m_dragging = false;
		base.OnEndDrag(eventData);
		if (base.inertia && Mathf.Abs(base.velocity[(int)layout]) >= GetSlipVelocity())
		{
			m_slip = true;
			m_stopAutoScroll = 0f;
		}
		else
		{
			ScrollToNearItem();
		}
	}

	protected void SetContentProperties()
	{
		m_tracker.Clear();
		if (base.content != null)
		{
			m_tracker.Add(this, base.content, (DrivenTransformProperties)(0xCF00 | ((layout == RectTransform.Axis.Horizontal) ? 4 : 2) | 0xE0 | 0x3000 | 0x10));
			if (layout == RectTransform.Axis.Horizontal)
			{
				base.content.anchorMin = new Vector2(0.5f, 0f);
				base.content.anchorMax = new Vector2(0.5f, 1f);
			}
			else
			{
				base.content.anchorMin = new Vector2(0f, 0.5f);
				base.content.anchorMax = new Vector2(1f, 0.5f);
			}
			int index = (int)layout;
			Vector2 sizeDelta = base.content.sizeDelta;
			sizeDelta[index] = GetComponent<RectTransform>().sizeDelta[index];
			base.content.sizeDelta = sizeDelta;
			base.content.pivot = new Vector2(0.5f, 0.5f);
			base.content.localScale = Vector3.one;
		}
	}

	protected float GetSlipVelocity()
	{
		return slipVelocityRate * selfRect.rect.size[(int)layout];
	}

	protected virtual void AutoScroll()
	{
		if (m_stopAutoScroll > 0f)
		{
			m_stopAutoScroll -= Time.deltaTime;
		}
		else if (m_autoScroll)
		{
			if (base.content.anchoredPosition != m_targetPosition)
			{
				m_autoScrollTimeCount += Time.deltaTime;
				if (m_autoScrollTimeCount < autoScrollSeconds)
				{
					float num = m_autoScrollTimeCount / autoScrollSeconds - 1f;
					num *= num;
					num *= num;
					num -= 1f;
					base.content.anchoredPosition = (m_fromPosition - m_targetPosition) * num + m_fromPosition;
				}
				else
				{
					base.content.anchoredPosition = m_targetPosition;
					base.velocity = Vector2.zero;
					m_autoScroll = false;
				}
				if (wheelEffect || infiniteScroll)
				{
					UpdateLayout();
				}
			}
			else
			{
				base.velocity = Vector2.zero;
				m_autoScroll = false;
			}
		}
		else
		{
			if (m_dragging)
			{
				return;
			}
			int num2 = (int)layout;
			if (m_slip)
			{
				float slipVelocity = GetSlipVelocity();
				if (!(Mathf.Abs(base.velocity[num2]) <= slipVelocity) || !(pickerLayoutGroup != null))
				{
					return;
				}
				List<float> itemOffsetList = pickerLayoutGroup.itemOffsetList;
				if (itemOffsetList == null || itemOffsetList.Count <= 0)
				{
					return;
				}
				Vector2 anchoredPosition = base.content.anchoredPosition;
				anchoredPosition[1 - num2] = 0f;
				float num3 = beforeScrollPosition[num2];
				float num4 = anchoredPosition[num2];
				int nearItemIndex = GetNearItemIndex(0f - num3);
				int nearItemIndex2 = GetNearItemIndex(0f - num4);
				if (nearItemIndex == nearItemIndex2 && 0 <= nearItemIndex2)
				{
					float num5 = 0f - itemOffsetList[nearItemIndex2];
					if ((num3 - num5) * (num4 - num5) <= 0f || num3 == num4)
					{
						if (Mathf.Abs(num5 - num4) < base.content.rect.size[num2] * 0.001f)
						{
							base.velocity = Vector2.zero;
							m_slip = false;
							base.content.anchoredPosition = anchoredPosition.Assign(num5, num2);
						}
						else
						{
							ScrollTo(num5);
						}
					}
					else if (base.velocity[num2] * (num4 - num5) < 0f || (nearItemIndex2 != 0 && nearItemIndex2 != itemOffsetList.Count - 1))
					{
						base.velocity = base.velocity.Assign(slipVelocity * Mathf.Sign(base.velocity[num2]), num2);
					}
				}
				else
				{
					base.velocity = base.velocity.Assign(slipVelocity * Mathf.Sign(base.velocity[num2]), num2);
				}
			}
			else
			{
				if (!(base.content != null))
				{
					return;
				}
				PickerItem nearItem = GetNearItem();
				float num6 = 0f - base.content.anchoredPosition[num2];
				if (nearItem != null)
				{
					float position = nearItem.position;
					if (Mathf.Abs(num6 + position) > base.content.rect.size[num2] * 0.001f)
					{
						ScrollTo(position);
					}
				}
			}
		}
	}

	public PickerItem GetPreviousItem()
	{
		int num = pickerLayoutGroup.itemList.Count - GetNearItemIndex(GetSelectedPickerItem().position) - 1;
		int index = ((num < pickerLayoutGroup.itemList.Count - 1) ? (++num) : 0);
		return pickerLayoutGroup.itemList[index];
	}

	public PickerItem GetNextItem()
	{
		int num = pickerLayoutGroup.itemList.Count - GetNearItemIndex(GetSelectedPickerItem().position) - 1;
		int index = ((num <= 0) ? (pickerLayoutGroup.itemList.Count - 1) : (--num));
		return pickerLayoutGroup.itemList[index];
	}

	protected int GetNearItemIndex()
	{
		return GetNearItemIndex(0f - base.content.anchoredPosition[(int)layout]);
	}

	protected PickerItem GetNearItem()
	{
		int nearItemIndex = GetNearItemIndex();
		if (nearItemIndex >= 0)
		{
			return pickerLayoutGroup.itemList[nearItemIndex];
		}
		return null;
	}

	protected int GetNearItemIndex(float scrollPosition)
	{
		if (pickerLayoutGroup == null)
		{
			return -1;
		}
		List<float> itemOffsetList = pickerLayoutGroup.itemOffsetList;
		if (itemOffsetList == null || itemOffsetList.Count <= 0)
		{
			return -1;
		}
		int num = itemOffsetList.BinarySearch(scrollPosition);
		if (num < 0)
		{
			num = ((num == -1) ? (~num) : (~num - 1));
		}
		if (num + 1 < itemOffsetList.Count && Mathf.Abs(itemOffsetList[num] - scrollPosition) > Mathf.Abs(itemOffsetList[num + 1] - scrollPosition))
		{
			num++;
		}
		if (0 > num || num >= itemOffsetList.Count)
		{
			return -1;
		}
		return num;
	}

	protected override void SetContentAnchoredPosition(Vector2 position)
	{
		Vector2 anchoredPosition = base.content.anchoredPosition;
		if (!base.horizontal)
		{
			position[0] = anchoredPosition.x;
		}
		if (!base.vertical)
		{
			position[1] = anchoredPosition.y;
		}
		base.SetContentAnchoredPosition(position);
		if (anchoredPosition != base.content.anchoredPosition && (wheelEffect || infiniteScroll))
		{
			UpdateLayout();
		}
	}

	public override void OnScroll(PointerEventData data)
	{
		m_stopAutoScroll = 0.4f;
		StopMovement();
		base.OnScroll(data);
	}

	public override void StopMovement()
	{
		base.StopMovement();
		m_autoScroll = false;
		m_slip = false;
	}

	protected override void Awake()
	{
		base.Awake();
		if (base.horizontal && base.vertical)
		{
			base.horizontal = false;
			base.vertical = true;
		}
		m_setInitialPosition = false;
	}

	public virtual void UpdateLayout()
	{
		LayoutGroup layoutGroup = pickerLayoutGroup;
		if (layoutGroup != null)
		{
			if (base.horizontal)
			{
				layoutGroup.SetLayoutHorizontal();
			}
			if (base.vertical)
			{
				layoutGroup.SetLayoutVertical();
			}
		}
	}
}
