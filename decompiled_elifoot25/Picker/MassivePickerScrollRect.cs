using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;
using UnityEngine.UI;

namespace Picker;

[RequireComponent(typeof(RectTransform))]
[ExecuteInEditMode]
[AddComponentMenu("UI/Picker/MassivePickerScrollRect", 1005)]
[DisallowMultipleComponent]
public class MassivePickerScrollRect : ScrollRect
{
	[Serializable]
	public class ItemSelectEvent : UnityEvent<int>
	{
	}

	protected RectTransform m_RectTransform;

	[SerializeField]
	protected bool m_WheelEffect;

	[SerializeField]
	protected Vector2 m_ItemSize;

	[SerializeField]
	protected bool m_DeactiveItemOnAwake;

	[SerializeField]
	protected GameObject m_ItemSource;

	[SerializeField]
	protected int m_ItemCount;

	[SerializeField]
	public float autoScrollSeconds = 0.65f;

	[SerializeField]
	public float slipVelocityRate = 0.25f;

	[SerializeField]
	protected float m_Perspective = 0.25f;

	public ItemSelectEvent onSelectItem = new ItemSelectEvent();

	protected int beforeSelectedItemIndex = -1;

	protected DrivenRectTransformTracker m_Tracker;

	private RectTransform m_BeforeContent;

	protected MassivePickerLayoutGroup m_PickerLayoutGroup;

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

	public bool wheelEffect
	{
		get
		{
			return m_WheelEffect;
		}
		set
		{
			if (m_WheelEffect != value)
			{
				m_WheelEffect = value;
				UpdateLayout();
			}
		}
	}

	public bool infiniteScroll => movementType == MovementType.Unrestricted;

	public Vector2 windowSize => rectTransform.rect.size;

	public Vector2 itemSize
	{
		get
		{
			return m_ItemSize;
		}
		set
		{
			if (!(m_ItemSize == value))
			{
				m_ItemSize = value;
				UpdateLayout();
			}
		}
	}

	public bool deactiveItemOnAwake
	{
		get
		{
			return m_DeactiveItemOnAwake;
		}
		set
		{
			if (m_DeactiveItemOnAwake != value)
			{
				m_DeactiveItemOnAwake = value;
			}
		}
	}

	public GameObject itemSource
	{
		get
		{
			return m_ItemSource;
		}
		set
		{
			if (!(m_ItemSource == value))
			{
				m_ItemSource = value;
				if (pickerLayoutGroup != null)
				{
					pickerLayoutGroup.OnChangeItemSource();
				}
			}
		}
	}

	public int itemCount
	{
		get
		{
			return m_ItemCount;
		}
		set
		{
			if (m_ItemCount != value)
			{
				if (value < 0)
				{
					throw new ArgumentOutOfRangeException();
				}
				m_ItemCount = value;
				UpdateLayout();
			}
		}
	}

	public float firstItemPosition
	{
		get
		{
			if (pickerLayoutGroup == null)
			{
				return 0f;
			}
			return 0f - pickerLayoutGroup.IndexToPosition(0);
		}
	}

	public float lastItemPosition
	{
		get
		{
			if (pickerLayoutGroup == null)
			{
				return 0f;
			}
			return 0f - pickerLayoutGroup.IndexToPosition(m_ItemCount - 1);
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

	public float wheelPerspective
	{
		get
		{
			return m_Perspective;
		}
		set
		{
			if (m_Perspective != value)
			{
				m_Perspective = value;
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
				int nearItemIndex = GetNearItemIndex();
				UpdateLayout();
				if (nearItemIndex >= 0)
				{
					ScrollAt(nearItemIndex, immdiate: true);
				}
			}
		}
	}

	protected virtual MassivePickerLayoutGroup pickerLayoutGroup
	{
		get
		{
			if (m_PickerLayoutGroup != null)
			{
				return m_PickerLayoutGroup;
			}
			if (base.content != null)
			{
				m_PickerLayoutGroup = base.content.GetComponent<MassivePickerLayoutGroup>();
			}
			return m_PickerLayoutGroup;
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

	public int GetSelectedItemIndex()
	{
		return beforeSelectedItemIndex;
	}

	public void ScrollAt(int index, bool immdiate = false)
	{
		if (pickerLayoutGroup != null)
		{
			float offset = pickerLayoutGroup.IndexToPosition(index);
			ScrollTo(offset, immdiate);
		}
	}

	public void ScrollTo(MassivePickerItem item, bool immdiate = false)
	{
		if (item != null && pickerLayoutGroup != null)
		{
			float offset = pickerLayoutGroup.IndexToPosition(item.itemIndex);
			ScrollTo(offset, immdiate);
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
			int nearItemIndex = GetNearItemIndex();
			if (nearItemIndex >= 0)
			{
				ScrollAt(nearItemIndex, immdiate);
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
			if (m_BeforeContent != base.content)
			{
				m_BeforeContent = base.content;
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

	public void SetInitialPosition()
	{
		if (!m_setInitialPosition && itemCount > 0)
		{
			m_setInitialPosition = true;
			int num = -1;
			switch (initialPosition)
			{
			case InitialPosition.FirstItem:
				num = 0;
				break;
			case InitialPosition.MiddleItem:
				num = itemCount / 2;
				break;
			case InitialPosition.LastItem:
				num = itemCount - 1;
				break;
			case InitialPosition.SelectItemIndex:
				num = Mathf.Clamp(initialPositionItemIndex, 0, itemCount - 1);
				break;
			case InitialPosition.NearItem:
				ScrollToNearItem(immdiate: true);
				base.onValueChanged.Invoke(base.normalizedPosition);
				return;
			}
			if (infiniteScroll)
			{
				num = (num + itemCount) % itemCount;
			}
			ScrollAt(num, immdiate: true);
			NotifySelectItem(num);
			base.onValueChanged.Invoke(base.normalizedPosition);
		}
	}

	protected virtual void NotifySelectItem()
	{
		if (!(pickerLayoutGroup == null) && !(base.content == null))
		{
			NotifySelectItem(GetNearItemIndex());
		}
	}

	protected void NotifySelectItem(int selectIndex)
	{
		if (selectIndex >= 0 && itemCount > selectIndex && beforeSelectedItemIndex != selectIndex)
		{
			beforeSelectedItemIndex = selectIndex;
			onSelectItem.Invoke(selectIndex);
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
		m_Tracker.Clear();
		if (base.content != null)
		{
			m_Tracker.Add(this, base.content, (DrivenTransformProperties)(0xCF00 | ((layout == RectTransform.Axis.Horizontal) ? 4 : 2) | 0xE0 | 0x3000 | 0x10));
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
				UpdateLayout();
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
				if (!(Mathf.Abs(base.velocity[num2]) <= slipVelocity) || !(pickerLayoutGroup != null) || itemCount <= 0)
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
					float num5 = pickerLayoutGroup.IndexToPosition(nearItemIndex2);
					if ((num3 - num5) * (num4 - num5) <= 0f || num3 == num4)
					{
						if (Mathf.Abs(num5 - num4) < itemSize[num2] * 0.1f)
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
					else if (base.velocity[num2] * (num4 - num5) < 0f || (nearItemIndex2 != 0 && nearItemIndex2 != itemCount - 1))
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
				if (!(base.content != null) || !(pickerLayoutGroup != null))
				{
					return;
				}
				int nearItemIndex3 = GetNearItemIndex();
				float num6 = 0f - base.content.anchoredPosition[num2];
				if (0 <= nearItemIndex3 && nearItemIndex3 < itemCount)
				{
					float num7 = pickerLayoutGroup.IndexToPosition(nearItemIndex3);
					if (Mathf.Abs(num6 + num7) > itemSize[num2] * 0.05f)
					{
						ScrollTo(num7);
					}
				}
			}
		}
	}

	public void UpdateItemContent(int itemIndex)
	{
		if (pickerLayoutGroup != null)
		{
			pickerLayoutGroup.UpdateItemContent(itemIndex);
		}
	}

	public void UpdateAllItemContent()
	{
		if (pickerLayoutGroup != null)
		{
			pickerLayoutGroup.UpdateAllItemContent();
		}
	}

	protected int GetNearItemIndex()
	{
		return GetNearItemIndex(0f - base.content.anchoredPosition[(int)layout]);
	}

	protected int GetNearItemIndex(float scrollPosition)
	{
		if (pickerLayoutGroup == null)
		{
			return -1;
		}
		return pickerLayoutGroup.PositionToNearItemIndex(scrollPosition);
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
		if (m_ItemSource != null && m_DeactiveItemOnAwake && Application.isPlaying)
		{
			m_ItemSource.SetActive(value: false);
		}
	}

	public virtual void UpdateLayout()
	{
		ILayoutGroup layoutGroup = pickerLayoutGroup;
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
