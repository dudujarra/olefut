using System;
using UnityEngine;

[Serializable]
public class PromotionBase : EliObject
{
	public string promotionId;

	private int promotionValue;

	private int period;

	public int PromotionValue
	{
		get
		{
			return promotionValue;
		}
		set
		{
			promotionValue = Mathf.Clamp(value, 0, 1000);
		}
	}

	public int Period
	{
		get
		{
			return period;
		}
		set
		{
			period = Mathf.Clamp(value, 1, 1000);
		}
	}

	public PromotionBase()
		: base(generateID: false)
	{
	}
}
