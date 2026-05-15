using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class FlexibleGridLayout : LayoutGroup
{
	public enum FitType
	{
		Uniform,
		Width,
		Height,
		FixedRows,
		FixedColumns
	}

	public FitType fitType;

	public int rows;

	public int columns;

	public Vector2 cellSize;

	public Vector2 spacing;

	public bool fitX;

	public bool fitY;

	public bool buttons;

	public bool useLayoutXConstraints;

	public bool useLayoutYConstraints;

	[SerializeField]
	private RectTransform canvas;

	protected override void OnRectTransformDimensionsChange()
	{
		CalculateLayoutInputHorizontal();
	}

	public override void CalculateLayoutInputHorizontal()
	{
		base.CalculateLayoutInputHorizontal();
		List<RectTransform> list = base.rectChildren.FindAll((RectTransform q) => q.gameObject.activeSelf);
		List<FlexibleGridLayoutConstraints> list2 = new List<FlexibleGridLayoutConstraints>();
		int num = 0;
		if (useLayoutXConstraints)
		{
			for (int num2 = 0; num2 < list.Count; num2++)
			{
				FlexibleGridLayoutConstraints component = list[num2].gameObject.GetComponent<FlexibleGridLayoutConstraints>();
				list2.Add(component);
				num += ((component == null) ? 1 : list2[num2].xSize);
			}
		}
		else if (useLayoutYConstraints)
		{
			for (int num3 = 0; num3 < list.Count; num3++)
			{
				FlexibleGridLayoutConstraints component2 = list[num3].gameObject.GetComponent<FlexibleGridLayoutConstraints>();
				list2.Add(component2);
				num += ((component2 == null) ? 1 : list2[num3].ySize);
			}
		}
		else
		{
			num = list.Count;
		}
		if (buttons)
		{
			if (canvas.rect.width / canvas.rect.height < 1f)
			{
				fitType = FitType.FixedColumns;
				columns = 1;
			}
			else
			{
				fitType = FitType.FixedColumns;
				columns = ((num < 2) ? 1 : 2);
			}
		}
		if (fitType == FitType.Width || fitType == FitType.Height || fitType == FitType.Uniform)
		{
			fitX = true;
			fitY = true;
			float f = Mathf.Sqrt(num);
			int num4 = Mathf.FloorToInt(f);
			int num5 = Mathf.CeilToInt(f);
			if (num4 * num5 >= num)
			{
				if (canvas.rect.width / canvas.rect.height < 1f)
				{
					rows = num5;
					columns = num4;
				}
				else
				{
					rows = num4;
					columns = num5;
				}
			}
			else
			{
				rows = num5;
				columns = num5;
			}
		}
		if (fitType == FitType.Width || fitType == FitType.FixedColumns)
		{
			rows = Mathf.CeilToInt((float)num / (float)columns);
		}
		else if (fitType == FitType.Height || fitType == FitType.FixedRows)
		{
			columns = Mathf.CeilToInt((float)num / (float)rows);
		}
		float num6 = base.rectTransform.rect.width - spacing.x * (float)(columns - 1) - (float)base.padding.left - (float)base.padding.right;
		float num7 = base.rectTransform.rect.height - spacing.y * (float)(rows - 1) - (float)base.padding.top - (float)base.padding.bottom;
		float num8 = num6 / (float)columns;
		float num9 = num7 / (float)rows;
		cellSize.x = (fitX ? num8 : cellSize.x);
		cellSize.y = (fitY ? num9 : cellSize.y);
		int num10 = 0;
		int num11 = 0;
		int num12 = 0;
		for (int num13 = 0; num13 < num; num13++)
		{
			int index = num13 - num12;
			num11 = num13 / columns;
			num10 = num13 % columns;
			RectTransform rect = list[index];
			float pos = cellSize.x * (float)num10 + spacing.x * (float)num10 + (float)base.padding.left;
			float pos2 = cellSize.y * (float)num11 + spacing.y * (float)num11 + (float)base.padding.top;
			SetChildAlongAxis(rect, 0, pos, (!useLayoutXConstraints) ? cellSize.x : ((list2[index] == null) ? cellSize.x : (cellSize.x * (float)list2[index].xSize)));
			SetChildAlongAxis(rect, 1, pos2, (!useLayoutYConstraints) ? cellSize.y : ((list2[index] == null) ? cellSize.y : (cellSize.y * (float)list2[index].ySize)));
			if ((useLayoutXConstraints || useLayoutYConstraints) && list2[index] != null)
			{
				if (list2[index].xSize > 1)
				{
					num13 += list2[index].xSize - 1;
					num12 += list2[index].xSize - 1;
				}
				else if (list2[index].ySize > 1)
				{
					num13 += list2[index].ySize - 1;
					num12 += list2[index].ySize - 1;
				}
			}
		}
	}

	public override void CalculateLayoutInputVertical()
	{
	}

	public override void SetLayoutHorizontal()
	{
	}

	public override void SetLayoutVertical()
	{
	}
}
