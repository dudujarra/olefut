using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[DisallowMultipleComponent]
public class MassivePicker<ItemComponent, ItemParamType, ItemListType> : MonoBehaviour where ItemComponent : MassivePickerItem where ItemListType : ItemList<ItemParamType>, new()
{
	[SerializeField]
	public Vector2 itemSize;

	[SerializeField]
	public Transform columnList;

	[SerializeField]
	protected GameObject m_ItemSource;

	[SerializeField]
	protected List<ItemListType> itemList = new List<ItemListType>();

	public GameObject itemSource
	{
		get
		{
			return m_ItemSource;
		}
		set
		{
			m_ItemSource = value;
			if (columns != null)
			{
				MassivePickerScrollRect[] array = columns;
				foreach (MassivePickerScrollRect massivePickerScrollRect in array)
				{
					massivePickerScrollRect.itemSource = m_ItemSource;
					massivePickerScrollRect.deactiveItemOnAwake = IsItemChild(massivePickerScrollRect);
				}
			}
		}
	}

	public MassivePickerScrollRect[] columns
	{
		get
		{
			if (columnList == null)
			{
				return null;
			}
			return columnList.GetComponentsInChildren<MassivePickerScrollRect>();
		}
	}

	public RectTransform.Axis layout
	{
		get
		{
			MassivePickerScrollRect[] array = columns;
			if (array != null)
			{
				int num = 0;
				int num2 = 0;
				for (int i = 0; i < array.Length; i++)
				{
					RectTransform.Axis num3 = array[i].layout;
					if (num3 == RectTransform.Axis.Horizontal)
					{
						num++;
					}
					if (num3 == RectTransform.Axis.Vertical)
					{
						num2++;
					}
				}
				if (num == array.Length)
				{
					return RectTransform.Axis.Horizontal;
				}
				if (num2 == array.Length)
				{
					return RectTransform.Axis.Vertical;
				}
			}
			return (RectTransform.Axis)(-1);
		}
		set
		{
			MassivePickerScrollRect[] array = columns;
			if (array != null && !(columnList == null))
			{
				MassivePickerScrollRect[] array2 = array;
				for (int i = 0; i < array2.Length; i++)
				{
					array2[i].layout = value;
				}
				if (value == RectTransform.Axis.Horizontal)
				{
					ChangeLayoutGroup<HorizontalLayoutGroup, VerticalLayoutGroup>();
				}
				if (value == RectTransform.Axis.Vertical)
				{
					ChangeLayoutGroup<VerticalLayoutGroup, HorizontalLayoutGroup>();
				}
			}
		}
	}

	public List<ItemListType> items => itemList;

	protected bool IsItemChild(MassivePickerScrollRect rect)
	{
		GameObject gameObject = rect.itemSource;
		if (gameObject == null)
		{
			return false;
		}
		Transform parent = gameObject.transform;
		while (parent != null)
		{
			parent = parent.parent;
			if (parent == base.transform)
			{
				return true;
			}
		}
		return false;
	}

	public void SetColumns(int num)
	{
		MassivePickerScrollRect[] array = columns;
		if (array == null || itemList == null || num <= 0 || (array.Length == num && itemList.Count == num) || columnList == null)
		{
			return;
		}
		if (itemList.Count < num)
		{
			for (int i = itemList.Count; i < num; i++)
			{
				itemList.Add(new ItemListType());
			}
		}
		else if (itemList.Count > num)
		{
			itemList.RemoveRange(num, itemList.Count - num);
		}
		if (array.Length < num)
		{
			bool flag = columnList.GetComponentInChildren<MassiveZoomPickerLayoutGroup>() != null;
			MassivePickerScrollRect componentInChildren = columnList.GetComponentInChildren<MassivePickerScrollRect>();
			MassivePickerLayoutGroup src = null;
			MassivePickerLayoutGroup src2 = null;
			if (!flag)
			{
				src = columnList.GetComponentInChildren<MassivePickerLayoutGroup>();
			}
			else
			{
				src2 = columnList.GetComponentInChildren<MassiveZoomPickerLayoutGroup>();
			}
			Image componentInChildren2 = columnList.GetComponentInChildren<Image>();
			for (int j = array.Length; j < num; j++)
			{
				GameObject gameObject = new GameObject("Column");
				MassivePickerScrollRect massivePickerScrollRect = gameObject.AddComponent<MassivePickerScrollRect>();
				Image dst = gameObject.AddComponent<Image>();
				gameObject.AddComponent<Mask>().showMaskGraphic = true;
				gameObject.transform.SetParent(columnList.transform);
				gameObject.transform.localScale = Vector3.one;
				GameObject gameObject2 = new GameObject("Content");
				gameObject2.transform.SetParent(gameObject.transform);
				if (!flag)
				{
					MassivePickerLayoutGroup massivePickerLayoutGroup = gameObject2.AddComponent<MassivePickerLayoutGroup>();
					CopyField(src, massivePickerLayoutGroup);
					massivePickerLayoutGroup.scrollRect = massivePickerScrollRect;
				}
				else
				{
					MassiveZoomPickerLayoutGroup massiveZoomPickerLayoutGroup = gameObject2.AddComponent<MassiveZoomPickerLayoutGroup>();
					CopyField(src2, massiveZoomPickerLayoutGroup);
					massiveZoomPickerLayoutGroup.scrollRect = massivePickerScrollRect;
				}
				massivePickerScrollRect.content = (RectTransform)gameObject2.transform;
				CopyField(componentInChildren, massivePickerScrollRect);
				CopyField(componentInChildren2, dst);
				massivePickerScrollRect.deactiveItemOnAwake = IsItemChild(massivePickerScrollRect);
				itemList[j] = new ItemListType();
			}
		}
		else if (array.Length > num)
		{
			for (int num2 = array.Length - 1; num2 >= num; num2--)
			{
				Util.DestroyObject(columnList.GetChild(num2).gameObject);
			}
		}
	}

	protected void ChangeLayoutGroup<BeforeLayoutGroup, AfterLayoutGroup>() where BeforeLayoutGroup : Component where AfterLayoutGroup : Component
	{
		if (!(columnList == null))
		{
			BeforeLayoutGroup component = columnList.GetComponent<BeforeLayoutGroup>();
			if (component != null)
			{
				UnityEngine.Object.DestroyImmediate(component);
			}
			columnList.gameObject.AddComponent<AfterLayoutGroup>();
		}
	}

	public virtual void SyncItemList(bool fromInspector = false)
	{
		MassivePickerScrollRect[] array = columns;
		if (itemList != null && array != null)
		{
			SetColumns(itemList.Count);
			for (int i = 0; i < itemList.Count; i++)
			{
				SetItems(i, itemList[i].items, fromInspector);
			}
		}
	}

	public int GetSelectedItemIndex()
	{
		MassivePickerScrollRect[] array = columns;
		if (array == null)
		{
			return -1;
		}
		return array[0].GetSelectedItemIndex();
	}

	public int GetColumnIndex(MassivePickerScrollRect scrollRect)
	{
		if (columns == null)
		{
			return -1;
		}
		return Array.IndexOf(columns, scrollRect);
	}

	public ItemParamType GetSelectedItem()
	{
		MassivePickerScrollRect[] array = columns;
		if (array == null || array.Length == 0)
		{
			return default(ItemParamType);
		}
		int selectedItemIndex = array[0].GetSelectedItemIndex();
		return items[0].items[selectedItemIndex];
	}

	public ItemParamType GetSelectedItem(int columnIndex)
	{
		MassivePickerScrollRect[] array = columns;
		if (array == null)
		{
			return default(ItemParamType);
		}
		int selectedItemIndex = array[columnIndex].GetSelectedItemIndex();
		if (selectedItemIndex >= 0)
		{
			return items[columnIndex].items[selectedItemIndex];
		}
		return default(ItemParamType);
	}

	public ItemParamType[] GetSelectedItems()
	{
		MassivePickerScrollRect[] array = columns;
		if (array == null)
		{
			return new ItemParamType[0];
		}
		ItemParamType[] array2 = new ItemParamType[array.Length];
		for (int i = 0; i < array2.Length; i++)
		{
			if (array[i] != null)
			{
				array2[i] = GetSelectedItem(i);
			}
		}
		return array2;
	}

	public void AddItem(ItemParamType param)
	{
		AddItem(0, param);
	}

	public void AddItem(int columnIndex, ItemParamType param)
	{
		if (itemList != null)
		{
			if (columnIndex < 0 || itemList.Count <= columnIndex)
			{
				throw new ArgumentOutOfRangeException();
			}
			itemList[columnIndex].items.Add(param);
			MassivePickerScrollRect pickerScrollRect = GetPickerScrollRect(columnIndex);
			int itemCount = pickerScrollRect.itemCount + 1;
			pickerScrollRect.itemCount = itemCount;
			pickerScrollRect.UpdateAllItemContent();
		}
	}

	public void RemoveItem(int itemIndex)
	{
		RemoveItem(0, itemIndex);
	}

	public void RemoveItem(int columnIndex, int itemIndex)
	{
		MassivePickerScrollRect pickerScrollRect = GetPickerScrollRect(columnIndex);
		if (!(pickerScrollRect == null))
		{
			itemList[columnIndex].items.RemoveAt(itemIndex);
			pickerScrollRect.UpdateAllItemContent();
		}
	}

	public ItemParamType GetItemParam(int columnIndex, int itemIndex)
	{
		if (GetPickerScrollRect(columnIndex) == null)
		{
			return default(ItemParamType);
		}
		return itemList[columnIndex].items[itemIndex];
	}

	public void SetItems(IList<ItemParamType> itemParams, bool fromInspector = false)
	{
		SetItems(0, itemParams, fromInspector);
	}

	public void SetItems(int columnIndex, IList<ItemParamType> itemParams, bool fromInspector = false)
	{
		MassivePickerScrollRect pickerScrollRect = GetPickerScrollRect(columnIndex);
		if (!(pickerScrollRect == null))
		{
			if (!fromInspector)
			{
				itemList[columnIndex].items = itemParams.ToList();
			}
			pickerScrollRect.itemSize = itemSize;
			pickerScrollRect.itemCount = itemList[columnIndex].items.Count;
			pickerScrollRect.UpdateAllItemContent();
		}
	}

	public MassivePickerScrollRect GetPickerScrollRect(int columnIndex)
	{
		MassivePickerScrollRect[] array = columns;
		if (array == null || columnIndex < 0 || array.Length <= columnIndex)
		{
			return null;
		}
		return array[columnIndex];
	}

	protected virtual void Awake()
	{
		SyncItemList();
	}

	protected static void CopyField(object src, object dst)
	{
		if (src != null && dst != null && !(src.GetType() != dst.GetType()))
		{
			FieldInfo[] fields = src.GetType().GetFields(BindingFlags.Instance | BindingFlags.NonPublic);
			foreach (FieldInfo fieldInfo in fields)
			{
				fieldInfo.SetValue(dst, fieldInfo.GetValue(src));
			}
		}
	}
}
