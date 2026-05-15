using System;
using System.Collections;
using System.Collections.Generic;

[Serializable]
public class Dictionary2<TKey1, TKey2, TValue> : Dictionary<Tuple<TKey1, TKey2>, TValue>, IDictionary<Tuple<TKey1, TKey2>, TValue>, ICollection<KeyValuePair<Tuple<TKey1, TKey2>, TValue>>, IEnumerable<KeyValuePair<Tuple<TKey1, TKey2>, TValue>>, IEnumerable
{
	public TValue this[TKey1 key1, TKey2 key2]
	{
		get
		{
			return base[new Tuple<TKey1, TKey2>(key1, key2)];
		}
		set
		{
			base[new Tuple<TKey1, TKey2>(key1, key2)] = value;
		}
	}

	public void Add(TKey1 key1, TKey2 key2, TValue value)
	{
		if (ContainsKey(key1, key2))
		{
			base[new Tuple<TKey1, TKey2>(key1, key2)] = value;
		}
		else
		{
			Add(new Tuple<TKey1, TKey2>(key1, key2), value);
		}
	}

	public bool ContainsKey(TKey1 key1, TKey2 key2)
	{
		return ContainsKey(new Tuple<TKey1, TKey2>(key1, key2));
	}
}
