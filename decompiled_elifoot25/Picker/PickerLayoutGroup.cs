using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[ExecuteInEditMode]
[RequireComponent(typeof(RectTransform))]
[AddComponentMenu("UI/Picker/PickerLayoutGroup", 1001)]
[DisallowMultipleComponent]
public class PickerLayoutGroup : LayoutGroup
{
	protected struct ItemComponent
	{
		public PickerItem item;

		public RectTransform rectTransform;
	}

	[SerializeField]
	protected PickerScrollRect m_ScrollRect;

	[SerializeField]
	protected float m_Spacing;

	[SerializeField]
	protected float m_ChildPivot = 0.5f;

	private List<float> m_itemOffsetList = new List<float>();

	private List<PickerItem> m_pickerItemList = new List<PickerItem>();

	private List<RectTransform> m_childTransformList = new List<RectTransform>();

	protected bool m_LockSetLayout;

	protected bool m_DirtyLayout;

	private static List<Rect> cacheRect = new List<Rect>();

	private static float[] swapBufferOffset;

	private static PickerItem[] swapBufferItem;

	protected Dictionary<Transform, ItemComponent> m_ChildItemTable = new Dictionary<Transform, ItemComponent>();

	public PickerScrollRect scrollRect
	{
		get
		{
			return m_ScrollRect;
		}
		set
		{
			SetProperty(ref m_ScrollRect, value);
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

	public List<float> itemOffsetList => m_itemOffsetList;

	public List<PickerItem> itemList => m_pickerItemList;

	public void RebuildLayout()
	{
		SetDirty();
	}

	protected int GetAxisIndex()
	{
		return (int)scrollRect.layout;
	}

	public override void CalculateLayoutInputHorizontal()
	{
		CalculateLayoutInput(0);
	}

	public override void CalculateLayoutInputVertical()
	{
		CalculateLayoutInput(1);
	}

	protected void CalculateLayoutInput(int axis)
	{
		float num = GetScrollAreaSize()[axis];
		SetLayoutInputForAxis(num, num, num, axis);
	}

	public override void SetLayoutHorizontal()
	{
		SetLayout(0);
	}

	public override void SetLayoutVertical()
	{
		SetLayout(1);
	}

	protected virtual void SetContentRectSize(int axis, float scrollSize)
	{
		Vector2 zero = Vector2.zero;
		zero[axis] = scrollSize;
		if (base.rectTransform.sizeDelta != zero)
		{
			base.rectTransform.sizeDelta = zero;
		}
		Vector2 anchoredPosition = base.rectTransform.anchoredPosition;
		if (anchoredPosition[1 - axis] != 0f)
		{
			base.rectTransform.anchoredPosition = anchoredPosition;
		}
	}

	protected virtual Vector2 GetScrollAreaSize()
	{
		if (scrollRect == null)
		{
			return Vector2.zero;
		}
		return scrollRect.GetComponent<RectTransform>().rect.size;
	}

	protected DrivenTransformProperties GetChildPropertyDriven(int axis, bool wheelEffect)
	{
		DrivenTransformProperties drivenTransformProperties = DrivenTransformProperties.AnchoredPosition3D | DrivenTransformProperties.Rotation;
		drivenTransformProperties = ((axis != 0) ? (drivenTransformProperties | (DrivenTransformProperties.AnchorMinY | DrivenTransformProperties.AnchorMaxY)) : (drivenTransformProperties | (DrivenTransformProperties.AnchorMinX | DrivenTransformProperties.AnchorMaxX)));
		if (wheelEffect)
		{
			drivenTransformProperties |= DrivenTransformProperties.ScaleX | DrivenTransformProperties.ScaleY;
		}
		return drivenTransformProperties;
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

	protected virtual void SetLayout(int axis)
	{
		if (scrollRect == null || axis != GetAxisIndex())
		{
			return;
		}
		if (m_LockSetLayout)
		{
			m_DirtyLayout = true;
			return;
		}
		Vector2 scrollAreaSize = GetScrollAreaSize();
		m_Tracker.Clear();
		base.rectChildren.Clear();
		m_itemOffsetList.Clear();
		m_pickerItemList.Clear();
		m_childTransformList.Clear();
		cacheRect.Clear();
		bool infiniteScroll = m_ScrollRect.infiniteScroll;
		bool flag = m_ScrollRect.wheelEffect;
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
		DrivenTransformProperties childPropertyDriven = GetChildPropertyDriven(axis, flag);
		float num = ((!infiniteScroll) ? (scrollAreaSize[axis] * 0.5f) : 0f);
		float num2 = num;
		for (int i = 0; i < base.rectTransform.childCount; i++)
		{
			Transform child = base.rectTransform.GetChild(i);
			RectTransform rectTransform;
			PickerItem pickerItem;
			if (!m_ChildItemTable.TryGetValue(child, out var value))
			{
				rectTransform = child as RectTransform;
				pickerItem = rectTransform.GetComponent<PickerItem>();
				m_ChildItemTable[child] = new ItemComponent
				{
					item = pickerItem,
					rectTransform = rectTransform
				};
			}
			else
			{
				rectTransform = value.rectTransform;
				pickerItem = value.item;
			}
			if (!(pickerItem == null) && pickerItem.enabled && rectTransform.gameObject.activeInHierarchy)
			{
				base.rectChildren.Add(rectTransform);
				m_pickerItemList.Add(pickerItem);
				m_itemOffsetList.Add(0f);
				m_childTransformList.Add(rectTransform);
				m_Tracker.Add(this, rectTransform, childPropertyDriven);
				Vector2 anchorMin = rectTransform.anchorMin;
				if (anchorMin[axis] != 0.5f)
				{
					anchorMin[axis] = 0.5f;
					rectTransform.anchorMin = anchorMin;
				}
				Vector2 anchorMax = rectTransform.anchorMax;
				if (anchorMax[axis] != 0.5f)
				{
					anchorMax[axis] = 0.5f;
					rectTransform.anchorMax = anchorMax;
				}
				Rect rect = rectTransform.rect;
				cacheRect.Add(rect);
				float num3 = rect.size[axis];
				num2 += spacing + num3;
			}
		}
		if (m_childTransformList.Count > 0 && !infiniteScroll)
		{
			float num4 = m_childTransformList[0].rect.size[axis];
			num -= num4 * 0.5f;
			num2 -= num4 * 0.5f;
			num4 = m_childTransformList[m_childTransformList.Count - 1].rect.size[axis];
			num2 -= num4 * 0.5f;
			num2 -= spacing;
		}
		if (!infiniteScroll)
		{
			float num5 = Mathf.Min(num2 * 0.002f, 0.1f);
			num2 += scrollAreaSize[axis] * 0.5f + num5 + num5;
			num += num5;
		}
		SetContentRectSize(axis, num2);
		num += num2 * -0.5f;
		float num6 = m_ChildPivot - 0.5f;
		float num7 = ((axis == 0) ? 1f : (-1f));
		float num8 = scrollRect.content.localPosition[axis] * (0f - num7);
		float num9 = 0f;
		if (infiniteScroll)
		{
			num9 = Mathf.Floor(num8 / num2) * num2;
		}
		if (flag)
		{
			float wheelPerspective = m_ScrollRect.wheelPerspective;
			float num10 = ((wheelEffect3D != null) ? wheelEffect3D.radius : (scrollAreaSize[axis] * 0.5f));
			float num11 = (num10 + num10) * MathF.PI;
			float num12 = MathF.PI * 2f / num11 * num7;
			for (int j = 0; j < m_childTransformList.Count; j++)
			{
				RectTransform rectTransform2 = m_childTransformList[j];
				float num13 = cacheRect[j].size[axis];
				float num14;
				if (!infiniteScroll)
				{
					num14 = num + num13 * 0.5f;
				}
				else
				{
					num14 = num9 + num + num13 * 0.5f;
					if (Mathf.Abs(num14 - num8) > Mathf.Abs(num14 + num2 - num8))
					{
						num14 += num2;
					}
				}
				num += num13 + spacing;
				float num15 = (num14 - num8) * num12;
				float num16 = num14 * num7;
				m_itemOffsetList[j] = num16;
				m_pickerItemList[j].position = 0f - num16;
				if (Mathf.Abs(num15) < MathF.PI / 2f)
				{
					if (wheelEffect3D == null)
					{
						float num17 = Mathf.Cos(num15);
						Vector3 localScale = rectTransform2.localScale;
						localScale[axis] = num17;
						float num18 = (localScale[1 - axis] = 1f - wheelPerspective + num17 * wheelPerspective);
						rectTransform2.localScale = localScale;
						Vector2 center = cacheRect[j].center;
						Vector3 localPosition = Vector2.zero;
						localPosition[axis] = Mathf.Sin(num15) * num10 + num8 * num7 - center[axis] * num17;
						float num20 = rectTransform2.pivot[1 - axis] - 0.5f;
						float num21 = rectTransform2.anchorMin[1 - axis];
						float num22 = rectTransform2.anchorMax[1 - axis];
						float num23 = (num20 * (num22 - num21) + (num22 + num21 - 1f) * 0.5f) * scrollAreaSize[1 - axis];
						localPosition[1 - axis] = (scrollAreaSize[1 - axis] - cacheRect[j].size[1 - axis] * num18) * num6 - center[1 - axis] * num18 - num23;
						localPosition.z = 0f;
						rectTransform2.localPosition = localPosition;
						if (rectTransform2.localRotation != Quaternion.identity)
						{
							rectTransform2.localRotation = Quaternion.identity;
						}
					}
					else
					{
						Vector2 center2 = cacheRect[j].center;
						Vector3 zero = Vector3.zero;
						zero[axis] = Mathf.Sin(num15) * num10 + num8 * num7 - center2[axis];
						Vector3 eulerAngles = rectTransform2.localRotation.eulerAngles;
						eulerAngles[1 - axis] = num15 * -57.29578f * num7;
						rectTransform2.localRotation = Quaternion.Euler(eulerAngles);
						float num24 = rectTransform2.pivot[1 - axis] - 0.5f;
						float num25 = rectTransform2.anchorMin[1 - axis];
						float num26 = rectTransform2.anchorMax[1 - axis];
						float num27 = (num24 * (num26 - num25) + (num26 + num25 - 1f) * 0.5f) * scrollAreaSize[1 - axis];
						zero[1 - axis] = (scrollAreaSize[1 - axis] - cacheRect[j].size[1 - axis]) * num6 - center2[1 - axis] - num27;
						zero.z = num10 - Mathf.Cos(num15) * num10;
						if (rectTransform2.localScale != Vector3.one)
						{
							rectTransform2.localScale = Vector3.one;
						}
						rectTransform2.localPosition = zero;
					}
				}
				else
				{
					Vector3 localScale2 = rectTransform2.localScale;
					if (localScale2.x != 0f || localScale2.y != 0f)
					{
						localScale2.x = 0f;
						localScale2.y = 0f;
						rectTransform2.localScale = localScale2;
					}
				}
			}
		}
		else
		{
			for (int k = 0; k < m_childTransformList.Count; k++)
			{
				RectTransform rectTransform3 = m_childTransformList[k];
				PickerItem pickerItem2 = m_pickerItemList[k];
				Rect rect2 = rectTransform3.rect;
				float num28 = rect2.size[axis];
				float num29;
				if (!infiniteScroll)
				{
					num29 = num + num28 * 0.5f;
				}
				else
				{
					num29 = num9 + num + num28 * 0.5f;
					if (Mathf.Abs(num29 - num8) > Mathf.Abs(num29 + num2 - num8))
					{
						num29 += num2;
					}
				}
				float num30 = num29 * num7;
				m_itemOffsetList[k] = num30;
				pickerItem2.position = 0f - num30;
				num += num28 + spacing;
				Vector3 localPosition2 = rectTransform3.anchoredPosition;
				localPosition2[axis] = num29 * num7 - rect2.center[axis];
				float num31 = rectTransform3.pivot[1 - axis] - 0.5f;
				float num32 = rectTransform3.anchorMin[1 - axis];
				float num33 = rectTransform3.anchorMax[1 - axis];
				float num34 = (num31 * (num33 - num32) + (num33 + num32 - 1f) * 0.5f) * scrollAreaSize[1 - axis];
				localPosition2[1 - axis] = (scrollAreaSize[1 - axis] - rect2.size[1 - axis]) * num6 - rect2.center[1 - axis] - num34;
				localPosition2.z = 0f;
				rectTransform3.localPosition = localPosition2;
				if (rectTransform3.localRotation != Quaternion.identity)
				{
					rectTransform3.localRotation = Quaternion.identity;
				}
				if (rectTransform3.localScale != Vector3.one)
				{
					rectTransform3.localScale = Vector3.one;
				}
			}
		}
		if (num7 < 0f)
		{
			m_itemOffsetList.Reverse();
			m_pickerItemList.Reverse();
		}
		int initialPosition = 0;
		if (infiniteScroll)
		{
			int count = m_itemOffsetList.Count;
			if (count > 1)
			{
				int l;
				for (l = 1; l < count && !(m_itemOffsetList[l - 1] >= m_itemOffsetList[l]); l++)
				{
				}
				initialPosition = l;
				if (l < count)
				{
					if (swapBufferOffset == null || l > swapBufferOffset.Length)
					{
						swapBufferOffset = new float[l];
						swapBufferItem = new PickerItem[l];
					}
					m_itemOffsetList.CopyTo(0, swapBufferOffset, 0, l);
					m_pickerItemList.CopyTo(0, swapBufferItem, 0, l);
					int m;
					for (m = 0; m + l < count; m++)
					{
						m_itemOffsetList[m] = m_itemOffsetList[m + l];
						m_pickerItemList[m] = m_pickerItemList[m + l];
					}
					for (int n = 0; n + m < count; n++)
					{
						m_itemOffsetList[n + m] = swapBufferOffset[n];
						m_pickerItemList[n + m] = swapBufferItem[n];
					}
				}
			}
		}
		if (scrollRect != null && Application.isPlaying)
		{
			scrollRect.SetInitialPosition(initialPosition);
		}
	}

	protected override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
	}

	public void RegisterItem(PickerItem item)
	{
		if (Application.isPlaying)
		{
			Transform key = item.transform;
			if (!m_ChildItemTable.ContainsKey(key))
			{
				m_ChildItemTable[key] = new ItemComponent
				{
					item = item,
					rectTransform = item.GetComponent<RectTransform>()
				};
			}
		}
	}

	public void UnregisterItem(PickerItem item)
	{
		if (Application.isPlaying)
		{
			m_ChildItemTable.Remove(item.transform);
		}
	}

	protected override void Awake()
	{
		base.Awake();
	}
}
