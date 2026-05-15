using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Picker;

[ExecuteInEditMode]
[RequireComponent(typeof(RectTransform))]
[AddComponentMenu("UI/Picker/MassivePickerLayoutGroup", 1006)]
[DisallowMultipleComponent]
public class MassivePickerLayoutGroup : UIBehaviour, ILayoutGroup, ILayoutController
{
	protected DrivenRectTransformTracker m_Tracker;

	[SerializeField]
	protected float m_Spacing;

	[SerializeField]
	protected float m_ChildPivot = 0.5f;

	private List<int> m_RemovedItemIndex = new List<int>();

	private Dictionary<int, MassivePickerItem> m_Items = new Dictionary<int, MassivePickerItem>();

	private Stack<MassivePickerItem> m_ItemPool = new Stack<MassivePickerItem>();

	protected MassivePickerScrollRect m_ScrollRect;

	protected RectTransform m_RectTransform;

	protected bool m_LockSetLayout;

	protected bool m_DirtyLayout;

	protected bool m_ChangedItemSource;

	protected Vector2 m_ItemSize
	{
		get
		{
			if (scrollRect == null)
			{
				return Vector2.zero;
			}
			return scrollRect.itemSize;
		}
	}

	public int itemCount
	{
		get
		{
			if (scrollRect == null)
			{
				return 0;
			}
			return scrollRect.itemCount;
		}
	}

	public float spacing
	{
		get
		{
			return m_Spacing;
		}
		set
		{
			SetProperty(ref m_Spacing, value);
		}
	}

	public float childPivot
	{
		get
		{
			return m_ChildPivot;
		}
		set
		{
			SetProperty(ref m_ChildPivot, value);
		}
	}

	public MassivePickerScrollRect scrollRect
	{
		get
		{
			if (m_ScrollRect != null)
			{
				return m_ScrollRect;
			}
			return m_ScrollRect = GetComponentInParent<MassivePickerScrollRect>();
		}
		set
		{
			m_ScrollRect = value;
		}
	}

	protected RectTransform rectTransform
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

	public void SetLayoutHorizontal()
	{
		SetLayout(0);
	}

	public void SetLayoutVertical()
	{
		SetLayout(1);
	}

	public void UpdateItemContent(int itemIndex)
	{
		if (itemIndex < 0 || itemCount <= itemIndex)
		{
			throw new ArgumentOutOfRangeException("index " + itemIndex + " itemCount " + itemCount);
		}
		if (m_Items.TryGetValue(itemIndex, out var value))
		{
			value.SetItemContents(scrollRect, itemIndex);
		}
	}

	public void UpdateAllItemContent()
	{
		foreach (KeyValuePair<int, MassivePickerItem> item in m_Items)
		{
			int key = item.Key;
			MassivePickerItem value = item.Value;
			if (value != null)
			{
				value.SetItemContents(scrollRect, key);
			}
		}
	}

	protected void SetLayout(int axis)
	{
		if (scrollRect == null || scrollRect.layout != (RectTransform.Axis)axis || !Application.isPlaying)
		{
			return;
		}
		int num = itemCount;
		if (num <= 0 || scrollRect.itemSource == null)
		{
			foreach (MassivePickerItem value in m_Items.Values)
			{
				ReleaseItemObject(value);
			}
			m_Items.Clear();
			return;
		}
		if (m_ChangedItemSource)
		{
			ClearAlreadyItems();
			m_ChangedItemSource = false;
		}
		RectTransform rectTransform = this.rectTransform;
		Vector2 anchoredPosition = rectTransform.anchoredPosition;
		float num2 = m_ItemSize[axis];
		float num3 = spacing;
		Vector2 windowSize = scrollRect.windowSize;
		bool flag = scrollRect.wheelEffect;
		float num4 = ((axis == 0) ? 1f : (-1f));
		WheelEffect3D wheelEffect3D = GetComponentInParent<WheelEffect3D>();
		if (wheelEffect3D != null)
		{
			if (wheelEffect3D.IsActive() && wheelEffect3D.layout == (RectTransform.Axis)axis)
			{
				flag = true;
			}
			else
			{
				wheelEffect3D = null;
			}
		}
		Vector2 sizeDelta = rectTransform.sizeDelta;
		sizeDelta[axis] = scrollRect.windowSize[axis] + (num2 + num3) * (float)(num - 1);
		if (rectTransform.sizeDelta != sizeDelta)
		{
			rectTransform.sizeDelta = sizeDelta;
		}
		int num5 = 0;
		int num6 = num - 1;
		if (num >= 3)
		{
			float num7 = ((!flag) ? (windowSize[axis] * 0.5f) : (windowSize[axis] * 0.25f * MathF.PI));
			int num8 = PositionToNearItemIndex(0f - anchoredPosition[axis]);
			int a = Mathf.CeilToInt(num7 / (num2 + num3));
			a = Mathf.Min(a, num / 2);
			if (a + a + 1 >= num)
			{
				num5 = 0;
				num6 = num - 1;
			}
			else
			{
				num5 = (num8 - a + num) % num;
				num6 = (num8 + a + num) % num;
			}
		}
		else
		{
			num5 = 0;
			num6 = num - 1;
		}
		ShrinkItem(num5, num6);
		float num9 = anchoredPosition[axis];
		float num10 = m_ChildPivot - 0.5f;
		if (!flag)
		{
			while (true)
			{
				RectTransform rectTransform2 = GetItem(num5).rectTransform;
				Vector3 localPosition = rectTransform2.localPosition;
				localPosition[axis] = 0f - IndexToPosition(num5);
				Vector2 center = rectTransform2.rect.center;
				float num11 = rectTransform2.pivot[1 - axis] - 0.5f;
				float num12 = rectTransform2.anchorMin[1 - axis];
				float num13 = rectTransform2.anchorMax[1 - axis];
				float num14 = (num11 * (num13 - num12) + (num13 + num12 - 1f) * 0.5f) * windowSize[1 - axis];
				localPosition[1 - axis] = (windowSize[1 - axis] - rectTransform2.rect.size[1 - axis]) * num10 - center[1 - axis] - num14;
				localPosition.z = 0f;
				rectTransform2.localPosition = localPosition;
				if (rectTransform2.localScale != Vector3.one)
				{
					rectTransform2.localScale = Vector3.one;
				}
				if (rectTransform2.localRotation != Quaternion.identity)
				{
					rectTransform2.localRotation = Quaternion.identity;
				}
				if (num5 == num6)
				{
					break;
				}
				num5 = (num5 + 1) % num;
			}
		}
		else
		{
			float wheelPerspective = m_ScrollRect.wheelPerspective;
			float num15 = windowSize[axis] * 0.5f;
			float num16 = (num15 + num15) * MathF.PI;
			float num17 = MathF.PI * 2f / num16 * (0f - num4);
			while (true)
			{
				RectTransform rectTransform3 = GetItem(num5).rectTransform;
				float num18 = (IndexToPosition(num5) - num9) * num17;
				if (Mathf.Abs(num18) < MathF.PI / 2f)
				{
					if (wheelEffect3D == null)
					{
						float num19 = Mathf.Cos(num18);
						float num20 = 1f - wheelPerspective + num19 * wheelPerspective;
						Vector3 localScale = rectTransform3.localScale;
						localScale[axis] = num19;
						localScale[1 - axis] = num20;
						rectTransform3.localScale = localScale;
						Vector3 localPosition2 = rectTransform3.anchoredPosition;
						Vector2 center2 = rectTransform3.rect.center;
						localPosition2[axis] = Mathf.Sin(0f - num18) * num15 * (0f - num4) - num9 - center2[axis] * num19;
						float num21 = rectTransform3.pivot[1 - axis] - 0.5f;
						float num22 = rectTransform3.anchorMin[1 - axis];
						float num23 = rectTransform3.anchorMax[1 - axis];
						float num24 = (num21 * (num23 - num22) + (num23 + num22 - 1f) * 0.5f) * windowSize[1 - axis];
						localPosition2[1 - axis] = (windowSize[1 - axis] - rectTransform3.rect.size[1 - axis] * num20) * num10 - center2[1 - axis] * num20 - num24;
						localPosition2.z = 0f;
						rectTransform3.localPosition = localPosition2;
						if (rectTransform3.localRotation != Quaternion.identity)
						{
							rectTransform3.localRotation = Quaternion.identity;
						}
					}
					else
					{
						Vector3 localPosition3 = rectTransform3.anchoredPosition;
						Vector2 center3 = rectTransform3.rect.center;
						localPosition3[axis] = Mathf.Sin(0f - num18) * num15 * (0f - num4) - num9 - center3[axis];
						Vector3 eulerAngles = rectTransform3.localRotation.eulerAngles;
						eulerAngles[1 - axis] = num18 * -57.29578f * num4;
						rectTransform3.localRotation = Quaternion.Euler(eulerAngles);
						float num25 = rectTransform3.pivot[1 - axis] - 0.5f;
						float num26 = rectTransform3.anchorMin[1 - axis];
						float num27 = rectTransform3.anchorMax[1 - axis];
						float num28 = (num25 * (num27 - num26) + (num27 + num26 - 1f) * 0.5f) * windowSize[1 - axis];
						localPosition3[1 - axis] = (windowSize[1 - axis] - rectTransform3.rect.size[1 - axis]) * num10 - center3[1 - axis] - num28;
						localPosition3.z = num15 - Mathf.Cos(num18) * num15;
						rectTransform3.localPosition = localPosition3;
						if (rectTransform3.localScale != Vector3.one)
						{
							rectTransform3.localScale = Vector3.one;
						}
					}
				}
				else
				{
					Vector3 localScale2 = rectTransform3.localScale;
					if (localScale2.x != 0f || localScale2.y != 0f)
					{
						localScale2.x = 0f;
						localScale2.y = 0f;
						rectTransform3.localScale = localScale2;
					}
				}
				if (num5 == num6)
				{
					break;
				}
				num5 = (num5 + 1) % num;
			}
		}
		if (scrollRect != null && Application.isPlaying)
		{
			scrollRect.SetInitialPosition();
		}
	}

	protected void ShrinkItem(int begin, int end)
	{
		m_RemovedItemIndex.Clear();
		foreach (int key in m_Items.Keys)
		{
			if (key < begin || end < key)
			{
				m_RemovedItemIndex.Add(key);
			}
		}
		foreach (int item in m_RemovedItemIndex)
		{
			ReleaseItemObject(m_Items[item]);
			m_Items.Remove(item);
		}
	}

	protected MassivePickerItem GetItem(int index)
	{
		if (m_Items.TryGetValue(index, out var value) && value != null)
		{
			return value;
		}
		value = AcquireItemObject();
		value.SetItemContents(scrollRect, index);
		value.itemIndex = index;
		m_Items[index] = value;
		m_Tracker.Add(this, value.rectTransform, DrivenTransformProperties.All);
		return value;
	}

	protected MassivePickerItem AcquireItemObject()
	{
		if (m_ItemPool.Count > 0)
		{
			MassivePickerItem massivePickerItem = m_ItemPool.Pop();
			if (massivePickerItem != null)
			{
				return massivePickerItem;
			}
		}
		GameObject obj = UnityEngine.Object.Instantiate(scrollRect.itemSource);
		obj.SetActive(value: true);
		MassivePickerItem component = obj.GetComponent<MassivePickerItem>();
		RectTransform obj2 = component.rectTransform;
		obj2.SetParent(rectTransform);
		obj2.localPosition = Vector3.zero;
		obj2.localRotation = Quaternion.identity;
		obj2.localScale = Vector3.one;
		return component;
	}

	protected void ReleaseItemObject(MassivePickerItem item)
	{
		m_ItemPool.Push(item);
		item.rectTransform.localScale = Vector3.zero;
	}

	protected override void OnTransformParentChanged()
	{
		base.OnTransformParentChanged();
		m_ScrollRect = GetComponentInParent<MassivePickerScrollRect>();
	}

	public float IndexToPosition(int index)
	{
		if (index < 0 || itemCount <= index)
		{
			throw new ArgumentOutOfRangeException();
		}
		int layout = (int)scrollRect.layout;
		float num = m_ItemSize[layout];
		float num2 = ((layout == 0) ? 1f : (-1f));
		float num3 = num + spacing;
		float num4 = 0f;
		if (scrollRect.infiniteScroll)
		{
			float num5 = num3 * (float)itemCount;
			float num6 = rectTransform.anchoredPosition[layout];
			float num7 = ((layout != 0) ? Mathf.Ceil(num6 / num5) : Mathf.Floor(num6 / num5));
			num7 *= num5;
			float num8 = ((float)index * num3 - num5 * 0.5f) * num2 - num7;
			float num9 = num8 - num5 * num2;
			num4 = ((Mathf.Abs(num8 + num6) < Mathf.Abs(num9 + num6)) ? num8 : num9);
		}
		else
		{
			float num10 = scrollRect.windowSize[layout];
			float num11 = num10 + num3 * (float)(itemCount - 1);
			num4 = ((num10 - num11) * 0.5f + num3 * (float)index) * num2;
		}
		return 0f - num4;
	}

	public int PositionToNearItemIndex(float position)
	{
		int num = itemCount;
		if (num <= 1)
		{
			if (num != 1)
			{
				return -1;
			}
			return 0;
		}
		int axisIndex = GetAxisIndex();
		float num2 = m_ItemSize[axisIndex];
		float num3 = spacing;
		float num4 = num2 + num3;
		float num5 = ((axisIndex == 0) ? 1f : (-1f));
		int num11;
		if (scrollRect.infiniteScroll)
		{
			float num6 = num4 * (float)num;
			float num7 = rectTransform.anchoredPosition[axisIndex];
			float num8 = ((axisIndex != 0) ? Mathf.Ceil(num7 / num6) : Mathf.Floor(num7 / num6));
			num8 *= num6;
			float num9 = position + num8;
			float num10 = num9 + num6 * num5;
			position = ((!(Mathf.Abs(num9) < Mathf.Abs(num10))) ? num10 : num9);
			num11 = Mathf.RoundToInt((position * num5 + num6 * 0.5f) / num4);
			return num11 % num;
		}
		float num12 = scrollRect.windowSize[axisIndex];
		float num13 = (num12 - num2 - num3) * 0.5f;
		float num14 = num12 + num4 * (float)(num - 1);
		num11 = Mathf.FloorToInt((position * num5 + num14 * 0.5f - num13) / num4);
		return Mathf.Clamp(num11, 0, num - 1);
	}

	public void LockSetLayout()
	{
		m_LockSetLayout = true;
		m_DirtyLayout = false;
	}

	public void UnlockSetLayoutAndUpdateIfDirty()
	{
		if (m_LockSetLayout)
		{
			m_LockSetLayout = false;
			if (m_DirtyLayout)
			{
				m_DirtyLayout = false;
				SetLayout(GetAxisIndex());
			}
		}
	}

	protected int GetAxisIndex()
	{
		return (int)scrollRect.layout;
	}

	protected void SetProperty<T>(ref T currentValue, T newValue)
	{
		if ((currentValue != null || newValue != null) && (currentValue == null || !currentValue.Equals(newValue)))
		{
			currentValue = newValue;
			SetDirty();
		}
	}

	protected override void OnEnable()
	{
		base.OnEnable();
		SetDirty();
	}

	protected override void OnDisable()
	{
		m_Tracker.Clear();
		LayoutRebuilder.MarkLayoutForRebuild(rectTransform);
		base.OnDisable();
	}

	protected override void OnDidApplyAnimationProperties()
	{
		SetDirty();
	}

	protected void SetDirty()
	{
		if (IsActive())
		{
			LayoutRebuilder.MarkLayoutForRebuild(rectTransform);
		}
	}

	public void RebuildLayout()
	{
		SetDirty();
	}

	public void OnChangeItemSource()
	{
		if (!m_ChangedItemSource)
		{
			m_ChangedItemSource = true;
			RebuildLayout();
		}
	}

	protected void ClearAlreadyItems()
	{
		foreach (MassivePickerItem value in m_Items.Values)
		{
			UnityEngine.Object.Destroy(value.gameObject);
		}
		foreach (MassivePickerItem item in m_ItemPool)
		{
			UnityEngine.Object.Destroy(item.gameObject);
		}
		m_Items.Clear();
		m_ItemPool.Clear();
	}
}
