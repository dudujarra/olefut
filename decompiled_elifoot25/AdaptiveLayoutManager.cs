using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class AdaptiveLayoutManager : MonoBehaviour
{
	[Header("Container Configuration")]
	[SerializeField]
	private RectTransform parentContainer;

	[SerializeField]
	private float objectHeight = 50f;

	[SerializeField]
	private float horizontalSpacing = 10f;

	[SerializeField]
	private float verticalSpacing = 10f;

	[SerializeField]
	private float padding = 20f;

	[SerializeField]
	private bool adjustParentSize = true;

	[Header("First Line Layout Rules")]
	[SerializeField]
	private List<AutoLayoutObject> startObjects = new List<AutoLayoutObject>();

	[SerializeField]
	private AutoLayoutObject endObject = new AutoLayoutObject();

	[SerializeField]
	private List<AutoLayoutObject> middleObjects = new List<AutoLayoutObject>();

	[Header("Layout Behavior")]
	[SerializeField]
	private bool autoCalculateObjectWidths = true;

	[SerializeField]
	private float minObjectWidth = 50f;

	private float calculatedHeight;

	private void Start()
	{
		if (parentContainer == null)
		{
			parentContainer = GetComponent<RectTransform>();
		}
		RefreshLayoutObjects();
		ArrangeObjects();
	}

	private void Update()
	{
		ArrangeObjects();
	}

	public void RefreshLayoutObjects()
	{
		foreach (AutoLayoutObject startObject in startObjects)
		{
			if (startObject != null && startObject.GameObject != null && (startObject.LayoutObject == null || startObject.LayoutObject.rectTransform == null))
			{
				startObject.RefreshLayoutObject();
			}
		}
		foreach (AutoLayoutObject middleObject in middleObjects)
		{
			if (middleObject != null && middleObject.GameObject != null && (middleObject.LayoutObject == null || middleObject.LayoutObject.rectTransform == null))
			{
				middleObject.RefreshLayoutObject();
			}
		}
		if (endObject != null && endObject.GameObject != null && (endObject.LayoutObject == null || endObject.LayoutObject.rectTransform == null))
		{
			endObject.RefreshLayoutObject();
		}
		startObjects.RemoveAll((AutoLayoutObject obj) => obj == null || !obj.IsValid);
		middleObjects.RemoveAll((AutoLayoutObject obj) => obj == null || !obj.IsValid);
		if (endObject != null && !endObject.IsValid)
		{
			endObject = new AutoLayoutObject();
		}
	}

	public void ArrangeObjects()
	{
		if (!(parentContainer == null))
		{
			RefreshLayoutObjects();
			float availableWidth = parentContainer.rect.width - padding * 2f;
			if (autoCalculateObjectWidths)
			{
				CalculateOptimalWidths(availableWidth);
			}
			PositionAllObjects(availableWidth);
			if (adjustParentSize)
			{
				AdjustParentSize();
			}
		}
	}

	private void CalculateOptimalWidths(float availableWidth)
	{
		foreach (List<LayoutObject> item in DistributeObjectsAcrossLines(availableWidth))
		{
			CalculateLineWidths(item, availableWidth);
		}
	}

	private void CalculateLineWidths(List<LayoutObject> lineObjects, float availableWidth)
	{
		if (lineObjects.Count == 0)
		{
			return;
		}
		float num = (float)(lineObjects.Count - 1) * horizontalSpacing;
		float num2 = availableWidth - num;
		float num3 = lineObjects.Sum((LayoutObject obj) => obj.width);
		if (num3 <= num2 || !autoCalculateObjectWidths)
		{
			foreach (LayoutObject lineObject in lineObjects)
			{
				lineObject.actualWidth = lineObject.width;
			}
			return;
		}
		float num4 = num2 / num3;
		foreach (LayoutObject lineObject2 in lineObjects)
		{
			lineObject2.actualWidth = Mathf.Max(minObjectWidth, lineObject2.width * num4);
		}
		float num5 = lineObjects.Sum((LayoutObject obj) => obj.actualWidth);
		if (!(num5 > num2))
		{
			return;
		}
		float num6 = num2 / num5;
		foreach (LayoutObject lineObject3 in lineObjects)
		{
			lineObject3.actualWidth = Mathf.Max(minObjectWidth, lineObject3.actualWidth * num6);
		}
	}

	private List<List<LayoutObject>> DistributeObjectsAcrossLines(float availableWidth)
	{
		List<LayoutObject> list = new List<LayoutObject>();
		List<LayoutObject> list2 = new List<LayoutObject>();
		LayoutObject layoutObject = null;
		foreach (AutoLayoutObject startObject in startObjects)
		{
			if (startObject.IsValid)
			{
				list.Add(startObject.LayoutObject);
			}
		}
		foreach (AutoLayoutObject middleObject in middleObjects)
		{
			if (middleObject.IsValid)
			{
				list2.Add(middleObject.LayoutObject);
			}
		}
		if (endObject.IsValid)
		{
			layoutObject = endObject.LayoutObject;
		}
		if (list.Count == 0 && list2.Count == 0 && layoutObject == null)
		{
			return new List<List<LayoutObject>>();
		}
		List<LayoutObject> list3 = new List<LayoutObject>();
		list3.AddRange(list);
		list3.AddRange(list2);
		if (layoutObject != null)
		{
			list3.Add(layoutObject);
		}
		if (list3.Sum((LayoutObject obj) => obj.width) + (float)(list3.Count - 1) * horizontalSpacing <= availableWidth)
		{
			return new List<List<LayoutObject>> { list3 };
		}
		return DistributeMultipleLines(list, list2, layoutObject, availableWidth);
	}

	private List<List<LayoutObject>> DistributeMultipleLines(List<LayoutObject> startObjs, List<LayoutObject> middleObjs, LayoutObject endObj, float availableWidth)
	{
		List<List<LayoutObject>> list = new List<List<LayoutObject>>();
		List<LayoutObject> list2 = new List<LayoutObject>();
		List<LayoutObject> list3 = new List<LayoutObject>(middleObjs);
		list2.AddRange(startObjs);
		float num = 0f;
		int num2 = startObjs.Count;
		if (startObjs.Count > 0)
		{
			num += startObjs.Sum((LayoutObject obj) => obj.width);
		}
		if (endObj != null)
		{
			num += endObj.width;
			num2++;
		}
		List<LayoutObject> list4 = new List<LayoutObject>();
		for (int num3 = 0; num3 < list3.Count; num3++)
		{
			LayoutObject layoutObject = list3[num3];
			float num4 = num + layoutObject.width;
			float num5 = (float)(num2 + 1 - 1) * horizontalSpacing;
			if (!(num4 + num5 <= availableWidth))
			{
				break;
			}
			list4.Add(layoutObject);
			num += layoutObject.width;
			num2++;
		}
		list2.AddRange(list4);
		foreach (LayoutObject item in list4)
		{
			list3.Remove(item);
		}
		if (endObj != null)
		{
			list2.Add(endObj);
		}
		list.Add(list2);
		if (list3.Count > 0)
		{
			List<List<LayoutObject>> collection = DistributeRemainingObjects(list3, availableWidth);
			list.AddRange(collection);
		}
		return list;
	}

	private List<List<LayoutObject>> DistributeRemainingObjects(List<LayoutObject> objects, float availableWidth)
	{
		if (objects.Count == 0)
		{
			return new List<List<LayoutObject>>();
		}
		return FindBestDistribution(objects, availableWidth);
	}

	private List<List<LayoutObject>> FindBestDistribution(List<LayoutObject> objects, float availableWidth)
	{
		if (objects.Count == 0)
		{
			return new List<List<LayoutObject>>();
		}
		if (objects.Sum((LayoutObject obj) => obj.width) + (float)(objects.Count - 1) * horizontalSpacing <= availableWidth)
		{
			return new List<List<LayoutObject>> { objects };
		}
		for (int num = 2; num <= Mathf.Min(4, objects.Count); num++)
		{
			List<List<LayoutObject>> list = CreateBalancedDistribution(objects, num, availableWidth);
			bool flag = true;
			foreach (List<LayoutObject> item in list)
			{
				if (item.Sum((LayoutObject obj) => obj.width) + (float)(item.Count - 1) * horizontalSpacing > availableWidth)
				{
					flag = false;
					break;
				}
			}
			if (flag)
			{
				return list;
			}
		}
		return CreateGreedyDistribution(objects, availableWidth);
	}

	private List<List<LayoutObject>> CreateBalancedDistribution(List<LayoutObject> objects, int numLines, float availableWidth)
	{
		List<List<LayoutObject>> list = null;
		float num = float.MaxValue;
		foreach (List<List<LayoutObject>> item in new List<List<List<LayoutObject>>>
		{
			CreateEvenCountDistribution(objects, numLines),
			CreateWidthBalancedDistribution(objects, numLines, availableWidth)
		})
		{
			float num2 = ScoreDistribution(item, availableWidth);
			if (num2 < num)
			{
				num = num2;
				list = item;
			}
		}
		return list ?? CreateEvenCountDistribution(objects, numLines);
	}

	private List<List<LayoutObject>> CreateEvenCountDistribution(List<LayoutObject> objects, int numLines)
	{
		List<List<LayoutObject>> list = new List<List<LayoutObject>>();
		int num = objects.Count / numLines;
		int num2 = objects.Count % numLines;
		int num3 = 0;
		for (int i = 0; i < numLines; i++)
		{
			List<LayoutObject> list2 = new List<LayoutObject>();
			int num4 = num + ((i < num2) ? 1 : 0);
			for (int j = 0; j < num4; j++)
			{
				if (num3 >= objects.Count)
				{
					break;
				}
				list2.Add(objects[num3]);
				num3++;
			}
			if (list2.Count > 0)
			{
				list.Add(list2);
			}
		}
		return list;
	}

	private List<List<LayoutObject>> CreateWidthBalancedDistribution(List<LayoutObject> objects, int numLines, float availableWidth)
	{
		List<List<LayoutObject>> list = new List<List<LayoutObject>>();
		float num = objects.Sum((LayoutObject obj) => obj.width) / (float)numLines;
		List<LayoutObject> list2 = new List<LayoutObject>(objects);
		for (int num2 = 0; num2 < numLines; num2++)
		{
			if (list2.Count <= 0)
			{
				break;
			}
			List<LayoutObject> list3 = new List<LayoutObject>();
			float num3 = 0f;
			for (int num4 = 0; num4 < list2.Count; num4++)
			{
				LayoutObject layoutObject = list2[num4];
				float width = layoutObject.width;
				float num5 = ((list3.Count > 0) ? horizontalSpacing : 0f);
				float num6 = num3 + num5 + width;
				bool flag = false;
				if (list3.Count == 0)
				{
					flag = true;
				}
				else if (num2 == numLines - 1)
				{
					flag = num6 <= availableWidth;
				}
				else
				{
					float num7 = Mathf.Abs(num3 - num);
					flag = Mathf.Abs(num6 - num) <= num7 && num6 <= availableWidth;
				}
				if (flag)
				{
					list3.Add(layoutObject);
					num3 = num6;
					list2.RemoveAt(num4);
					num4--;
				}
			}
			if (list3.Count > 0)
			{
				list.Add(list3);
			}
		}
		if (list2.Count > 0 && list.Count > 0)
		{
			list[list.Count - 1].AddRange(list2);
		}
		return list;
	}

	private float ScoreDistribution(List<List<LayoutObject>> distribution, float availableWidth)
	{
		if (distribution.Count == 0)
		{
			return float.MaxValue;
		}
		float num = 0f;
		foreach (List<LayoutObject> item in distribution)
		{
			if (item.Count != 0)
			{
				float num2 = item.Sum((LayoutObject obj) => obj.width) + (float)(item.Count - 1) * horizontalSpacing;
				if (num2 > availableWidth)
				{
					num += (num2 - availableWidth) * 10f;
				}
				float num3 = num2 / availableWidth;
				num += (1f - num3) * (1f - num3);
			}
		}
		return num + (float)distribution.Count * 0.1f;
	}

	private List<List<LayoutObject>> CreateGreedyDistribution(List<LayoutObject> objects, float availableWidth)
	{
		List<List<LayoutObject>> list = new List<List<LayoutObject>>();
		int i = 0;
		while (i < objects.Count)
		{
			List<LayoutObject> list2 = new List<LayoutObject>();
			float num = 0f;
			for (; i < objects.Count; i++)
			{
				LayoutObject layoutObject = objects[i];
				float width = layoutObject.width;
				float num2 = ((list2.Count > 0) ? horizontalSpacing : 0f);
				if (num + num2 + width <= availableWidth)
				{
					list2.Add(layoutObject);
					num += num2 + width;
					continue;
				}
				if (list2.Count == 0)
				{
					list2.Add(layoutObject);
					i++;
				}
				break;
			}
			if (list2.Count > 0)
			{
				list.Add(list2);
			}
		}
		return list;
	}

	private void PositionAllObjects(float availableWidth)
	{
		List<List<LayoutObject>> list = DistributeObjectsAcrossLines(availableWidth);
		calculatedHeight = padding;
		for (int i = 0; i < list.Count; i++)
		{
			List<LayoutObject> list2 = list[i];
			if (list2.Count > 0)
			{
				float yPosition = 0f - padding - (float)i * (objectHeight + verticalSpacing);
				JustifyObjectsInLine(list2, availableWidth, yPosition);
				calculatedHeight += objectHeight + verticalSpacing;
			}
		}
		calculatedHeight += padding;
	}

	private void JustifyObjectsInLine(List<LayoutObject> objects, float availableWidth, float yPosition)
	{
		if (objects.Count == 0)
		{
			return;
		}
		float num = objects.Sum((LayoutObject obj) => obj.actualWidth);
		if (objects.Count == 1)
		{
			float x = padding + (availableWidth - num) / 2f;
			SetObjectPosition(objects[0], x, yPosition);
			return;
		}
		if (DistributeObjectsAcrossLines(availableWidth).Count == 1)
		{
			float num2 = horizontalSpacing;
			float num3 = num + (float)(objects.Count - 1) * num2;
			float num4 = padding + (availableWidth - num3) / 2f;
			for (int num5 = 0; num5 < objects.Count; num5++)
			{
				LayoutObject layoutObject = objects[num5];
				SetObjectPosition(layoutObject, num4, yPosition);
				if (num5 < objects.Count - 1)
				{
					num4 += layoutObject.actualWidth + num2;
				}
			}
			return;
		}
		if (num >= availableWidth)
		{
			float num6 = availableWidth / num;
			float num7 = padding;
			{
				foreach (LayoutObject @object in objects)
				{
					float num8 = @object.actualWidth * num6;
					SetObjectPosition(@object, num7, yPosition);
					@object.rectTransform.sizeDelta = new Vector2(num8, objectHeight);
					num7 += num8;
				}
				return;
			}
		}
		float num9 = (availableWidth - num) / (float)(objects.Count - 1);
		float num10 = padding;
		for (int num11 = 0; num11 < objects.Count; num11++)
		{
			LayoutObject layoutObject2 = objects[num11];
			SetObjectPosition(layoutObject2, num10, yPosition);
			if (num11 < objects.Count - 1)
			{
				num10 += layoutObject2.actualWidth + num9;
			}
		}
	}

	private void SetObjectPosition(LayoutObject layoutObj, float x, float y)
	{
		RectTransform rectTransform = layoutObj.rectTransform;
		rectTransform.anchorMin = new Vector2(0f, 1f);
		rectTransform.anchorMax = new Vector2(0f, 1f);
		rectTransform.pivot = new Vector2(0f, 1f);
		rectTransform.sizeDelta = new Vector2(layoutObj.actualWidth, objectHeight);
		rectTransform.anchoredPosition = new Vector2(x, y);
	}

	private void AdjustParentSize()
	{
		if (parentContainer != null && calculatedHeight > 0f)
		{
			Vector2 sizeDelta = parentContainer.sizeDelta;
			parentContainer.sizeDelta = new Vector2(sizeDelta.x, calculatedHeight);
		}
	}

	public void AddStartObject(GameObject obj)
	{
		startObjects.Add(new AutoLayoutObject(obj));
		ArrangeObjects();
	}

	public void AddMiddleObject(GameObject obj)
	{
		middleObjects.Add(new AutoLayoutObject(obj));
		ArrangeObjects();
	}

	public void SetEndObject(GameObject obj)
	{
		endObject = new AutoLayoutObject(obj);
		ArrangeObjects();
	}

	public void RemoveObject(GameObject objToRemove)
	{
		startObjects.RemoveAll((AutoLayoutObject obj) => obj.GameObject == objToRemove);
		middleObjects.RemoveAll((AutoLayoutObject obj) => obj.GameObject == objToRemove);
		if (endObject.GameObject == objToRemove)
		{
			endObject = new AutoLayoutObject();
		}
		ArrangeObjects();
	}

	[ContextMenu("Update All Widths from Objects")]
	public void UpdateAllWidthsFromObjects()
	{
		foreach (AutoLayoutObject startObject in startObjects)
		{
			startObject?.UpdateWidthFromObject();
		}
		foreach (AutoLayoutObject middleObject in middleObjects)
		{
			middleObject?.UpdateWidthFromObject();
		}
		endObject?.UpdateWidthFromObject();
		Debug.Log("Updated all object widths from their RectTransforms");
		ArrangeObjects();
	}

	[ContextMenu("Update Start Objects Widths")]
	public void UpdateStartObjectsWidths()
	{
		foreach (AutoLayoutObject startObject in startObjects)
		{
			startObject?.UpdateWidthFromObject();
		}
		Debug.Log("Updated start objects widths");
		ArrangeObjects();
	}

	[ContextMenu("Update Middle Objects Widths")]
	public void UpdateMiddleObjectsWidths()
	{
		foreach (AutoLayoutObject middleObject in middleObjects)
		{
			middleObject?.UpdateWidthFromObject();
		}
		Debug.Log("Updated middle objects widths");
		ArrangeObjects();
	}

	[ContextMenu("Update End Object Width")]
	public void UpdateEndObjectWidth()
	{
		endObject?.UpdateWidthFromObject();
		Debug.Log("Updated end object width");
		ArrangeObjects();
	}

	[ContextMenu("Auto-Setup from Children")]
	public void AutoSetupFromChildren()
	{
		RectTransform[] componentsInChildren = GetComponentsInChildren<RectTransform>();
		List<GameObject> list = new List<GameObject>();
		for (int i = 1; i < componentsInChildren.Length; i++)
		{
			list.Add(componentsInChildren[i].gameObject);
		}
		startObjects.Clear();
		middleObjects.Clear();
		endObject = new AutoLayoutObject();
		for (int j = 0; j < Mathf.Min(3, list.Count); j++)
		{
			startObjects.Add(new AutoLayoutObject(list[j]));
		}
		for (int k = 3; k < list.Count - 1; k++)
		{
			middleObjects.Add(new AutoLayoutObject(list[k]));
		}
		if (list.Count > 3)
		{
			endObject = new AutoLayoutObject(list[list.Count - 1]);
		}
		ArrangeObjects();
	}
}
