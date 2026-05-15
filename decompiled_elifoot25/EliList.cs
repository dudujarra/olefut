using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

[Serializable]
public class EliList : List<EliObject>
{
	private bool exclusive;

	public EliList(bool exclusive = false)
	{
		this.exclusive = exclusive;
	}

	public new void Clear()
	{
		base.Clear();
	}

	public new void Add(EliObject item)
	{
		if (!exclusive || !Contains(item))
		{
			base.Add(item);
		}
	}

	public void Shuffle()
	{
		int num = base.Count;
		while (num > 1)
		{
			num--;
			int randomInt = Util.GetRandomInt(num + 1);
			EliObject value = base[randomInt];
			base[randomInt] = base[num];
			base[num] = value;
		}
	}

	public List<EliObject> CreateShuffledClone()
	{
		return this.OrderBy((EliObject x) => UnityEngine.Random.value).ToList();
	}

	public virtual void PostLoad()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			enumerator.Current.PostLoad();
		}
	}

	public virtual EliObject GetRandomItem()
	{
		if (base.Count == 0)
		{
			return null;
		}
		int randomInt = Util.GetRandomInt(base.Count);
		return base[randomInt];
	}

	public EliObject GetRandomItem(int weightCriteria)
	{
		int num = 0;
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				EliObject current = enumerator.Current;
				num += current.GetSelectionWeight(weightCriteria);
			}
		}
		int randomInt = Util.GetRandomInt(num);
		num = 0;
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				EliObject current2 = enumerator.Current;
				num += current2.GetSelectionWeight(weightCriteria);
				if (num >= randomInt)
				{
					return current2;
				}
			}
		}
		return null;
	}

	public EliObject First()
	{
		if (base.Count == 0)
		{
			return null;
		}
		return base[0];
	}

	public EliObject Last()
	{
		if (base.Count == 0)
		{
			return null;
		}
		return base[base.Count - 1];
	}

	public int NumberOfOccurences(EliObject thisObj)
	{
		int num = 0;
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			if (enumerator.Current == thisObj)
			{
				num++;
			}
		}
		return num;
	}

	public void ApplyAll(Action action)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			_ = enumerator.Current;
			action();
		}
	}

	public EliObject Next(EliObject myObj, bool rotate)
	{
		int num = IndexOf(myObj);
		if (num == -1)
		{
			return null;
		}
		if (num == base.Count - 1)
		{
			if (rotate)
			{
				return base[0];
			}
			return null;
		}
		return base[num + 1];
	}

	public EliObject Previous(EliObject myObj, bool rotate)
	{
		int num = IndexOf(myObj);
		switch (num)
		{
		case -1:
			return null;
		case 0:
			if (rotate)
			{
				return base[base.Count - 1];
			}
			return null;
		default:
			return base[num - 1];
		}
	}

	public void LanguageChanged()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			enumerator.Current.LanguageChanged();
		}
	}
}
