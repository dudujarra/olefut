using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[DisallowMultipleComponent]
public class Picker<ItemComponent, ItemParamType, ItemListType> : MonoBehaviour where ItemComponent : PickerItem where ItemListType : ItemList<ItemParamType>, new()
{
	[SerializeField]
	public Vector2 itemSize;

	[SerializeField]
	public Transform columnList;

	[SerializeField]
	protected List<ItemListType> itemList = new List<ItemListType>();

	public PickerScrollRect[] columns
	{
		get
		{
			if (columnList == null)
			{
				return null;
			}
			return columnList.GetComponentsInChildren<PickerScrollRect>();
		}
	}

	public RectTransform.Axis layout
	{
		get
		{
			PickerScrollRect[] array = columns;
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
			PickerScrollRect[] array = columns;
			if (array != null && !(columnList == null))
			{
				PickerScrollRect[] array2 = array;
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

	public void SetColumns(int num)
	{
		PickerScrollRect[] array = columns;
		if (array == null || itemList == null || num < 1 || (array.Length == num && itemList.Count == num) || columnList == null)
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
			bool flag = columnList.GetComponentInChildren<ZoomPickerLayoutGroup>() != null;
			PickerScrollRect componentInChildren = columnList.GetComponentInChildren<PickerScrollRect>();
			PickerLayoutGroup src = null;
			PickerLayoutGroup src2 = null;
			if (!flag)
			{
				src = columnList.GetComponentInChildren<PickerLayoutGroup>();
			}
			else
			{
				src2 = columnList.GetComponentInChildren<ZoomPickerLayoutGroup>();
			}
			Image componentInChildren2 = columnList.GetComponentInChildren<Image>();
			for (int j = array.Length; j < num; j++)
			{
				GameObject gameObject = new GameObject("Column");
				PickerScrollRect pickerScrollRect = gameObject.AddComponent<PickerScrollRect>();
				Image dst = gameObject.AddComponent<Image>();
				gameObject.AddComponent<Mask>().showMaskGraphic = true;
				gameObject.transform.SetParent(columnList.transform);
				gameObject.transform.localScale = Vector3.one;
				GameObject gameObject2 = new GameObject("Content");
				gameObject2.transform.SetParent(gameObject.transform);
				if (!flag)
				{
					PickerLayoutGroup pickerLayoutGroup = gameObject2.AddComponent<PickerLayoutGroup>();
					CopyField(src, pickerLayoutGroup);
					pickerLayoutGroup.scrollRect = pickerScrollRect;
				}
				else
				{
					ZoomPickerLayoutGroup zoomPickerLayoutGroup = gameObject2.AddComponent<ZoomPickerLayoutGroup>();
					CopyField(src2, zoomPickerLayoutGroup);
					zoomPickerLayoutGroup.scrollRect = pickerScrollRect;
				}
				pickerScrollRect.content = (RectTransform)gameObject2.transform;
				CopyField(componentInChildren, pickerScrollRect);
				CopyField(componentInChildren2, dst);
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
		PickerScrollRect[] array = columns;
		if (itemList != null && array != null)
		{
			SetColumns(itemList.Count);
			for (int i = 0; i < itemList.Count; i++)
			{
				SetItems(i, itemList[i].items, fromInspector);
			}
		}
	}

	protected virtual void SetParameter(ItemComponent item, ItemParamType param)
	{
	}

	protected void UpdateItem(ItemComponent item, ItemParamType param)
	{
		if (param != null)
		{
			item.name = param.ToString();
		}
		RectTransform component = item.GetComponent<RectTransform>();
		Vector2 sizeDelta = Vector3.zero;
		for (int i = 0; i < 2; i++)
		{
			sizeDelta[i] = itemSize[i];
			if (itemSize[i] == 0f)
			{
				component.anchorMin = component.anchorMin.Assign(0f, i);
				component.anchorMax = component.anchorMax.Assign(1f, i);
			}
			else
			{
				component.anchorMin = component.anchorMin.Assign(0.5f, i);
				component.anchorMax = component.anchorMax.Assign(0.5f, i);
			}
		}
		component.sizeDelta = sizeDelta;
		item.userData = param;
		SetParameter(item, param);
	}

	protected GameObject CreateItem(ItemParamType param)
	{
		GameObject obj = new GameObject();
		ItemComponent item = obj.AddComponent<ItemComponent>();
		RectTransform component = obj.GetComponent<RectTransform>();
		component.sizeDelta = itemSize;
		Vector2 anchorMin = (component.anchorMax = new Vector2(0.5f, 0.5f));
		component.anchorMin = anchorMin;
		UpdateItem(item, param);
		return obj;
	}

	public PickerItem GetSelectedItem()
	{
		PickerScrollRect[] array = columns;
		if (array == null)
		{
			return null;
		}
		return array[0].GetSelectedPickerItem();
	}

	public PickerItem[] GetSelectedItems()
	{
		PickerScrollRect[] array = columns;
		if (array == null)
		{
			return new PickerItem[0];
		}
		PickerItem[] array2 = new PickerItem[array.Length];
		for (int i = 0; i < array2.Length; i++)
		{
			if (array[i] != null)
			{
				array2[i] = array[i].GetSelectedPickerItem();
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
				throw new ArgumentException();
			}
			GameObject gameObject = CreateItem(param);
			if (gameObject != null && _AddItem(columnIndex, gameObject))
			{
				itemList[columnIndex].items.Add(param);
			}
		}
	}

	public void RemoveItem(int itemIndex)
	{
		RemoveItem(0, itemIndex);
	}

	public void RemoveItem(int columnIndex, int itemIndex)
	{
		PickerScrollRect pickerScrollRect = GetPickerScrollRect(columnIndex);
		if (!(pickerScrollRect == null))
		{
			Transform transform = pickerScrollRect.transform;
			if (itemIndex >= 0 && transform.childCount > itemIndex)
			{
				Util.DestroyObject(transform.GetChild(itemIndex).gameObject);
				itemList[columnIndex].items.RemoveAt(itemIndex);
			}
		}
	}

	public void SetItems(IList<ItemParamType> itemParams, bool fromInspector = false)
	{
		SetItems(0, itemParams, fromInspector);
	}

	public void SetItems(int columnIndex, IList<ItemParamType> itemParams, bool fromInspector = false)
	{
		PickerScrollRect pickerScrollRect = GetPickerScrollRect(columnIndex);
		if (pickerScrollRect == null)
		{
			return;
		}
		RectTransform content = pickerScrollRect.content;
		if (content == null)
		{
			return;
		}
		if (!fromInspector)
		{
			itemList[columnIndex].items = itemParams.ToList();
		}
		int num = content.childCount;
		if (itemParams.Count < num)
		{
			for (int num2 = num - 1; num2 >= itemParams.Count; num2--)
			{
				Util.DestroyObject(content.GetChild(num2).gameObject);
			}
			num = itemParams.Count;
		}
		int i = 0;
		for (int num3 = Mathf.Min(itemParams.Count, num); i < num3; i++)
		{
			ItemComponent component = content.GetChild(i).GetComponent<ItemComponent>();
			UpdateItem(component, itemParams[i]);
		}
		int index = i;
		for (; i < itemParams.Count; i++)
		{
			GameObject gameObject = CreateItem(itemParams[index]);
			if (gameObject != null)
			{
				_AddItem(columnIndex, gameObject);
			}
		}
	}

	protected bool _AddItem(int columnIndex, GameObject item)
	{
		if (item == null)
		{
			return false;
		}
		PickerScrollRect pickerScrollRect = GetPickerScrollRect(columnIndex);
		if (pickerScrollRect == null)
		{
			return false;
		}
		item.transform.SetParent(pickerScrollRect.content.transform);
		EffectBase componentInParent = GetComponentInParent<EffectBase>();
		if (componentInParent != null)
		{
			componentInParent.SetEffectComponentToAllChildGraphics(item.transform);
		}
		return true;
	}

	public PickerScrollRect GetPickerScrollRect(int columnIndex)
	{
		PickerScrollRect[] array = columns;
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
