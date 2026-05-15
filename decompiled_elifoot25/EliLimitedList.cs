using System;
using UnityEngine;

[Serializable]
public class EliLimitedList : EliList
{
	private int maxLength = 500;

	public int MaxLength => maxLength;

	public EliLimitedList(int maxLength)
	{
		this.maxLength = Mathf.Max(1, maxLength);
	}

	public new void Add(EliObject item)
	{
		ReviewNumberOfElements(leaveFreeItem: true);
		base.Add(item);
	}

	public void ChangeMaxLength(int maxLength)
	{
		this.maxLength = maxLength;
		ReviewNumberOfElements(leaveFreeItem: false);
	}

	private void ReviewNumberOfElements(bool leaveFreeItem)
	{
		if (leaveFreeItem)
		{
			while (base.Count > maxLength)
			{
				RemoveAt(0);
			}
		}
		else
		{
			while (base.Count >= maxLength)
			{
				RemoveAt(0);
			}
		}
		base.Capacity = maxLength;
	}
}
