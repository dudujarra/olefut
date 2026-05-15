using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class Tuple<T1, T2>
{
	public T1 first;

	public T2 second;

	private static readonly IEqualityComparer Item1Comparer = EqualityComparer<T1>.Default;

	private static readonly IEqualityComparer Item2Comparer = EqualityComparer<T2>.Default;

	public Tuple(T1 first, T2 second)
	{
		this.first = first;
		this.second = second;
	}

	public override string ToString()
	{
		return $"<{first}, {second}>";
	}

	public static bool operator ==(Tuple<T1, T2> a, Tuple<T1, T2> b)
	{
		if (IsNull(a) && !IsNull(b))
		{
			return false;
		}
		if (!IsNull(a) && IsNull(b))
		{
			return false;
		}
		if (IsNull(a) && IsNull(b))
		{
			return true;
		}
		ref T1 reference = ref a.first;
		object obj = b.first;
		if (reference.Equals(obj))
		{
			ref T2 reference2 = ref a.second;
			object obj2 = b.second;
			return reference2.Equals(obj2);
		}
		return false;
	}

	public static bool operator !=(Tuple<T1, T2> a, Tuple<T1, T2> b)
	{
		return !(a == b);
	}

	public override int GetHashCode()
	{
		try
		{
			return (17 * 23 + first.GetHashCode()) * 23 + second.GetHashCode();
		}
		catch (Exception ex)
		{
			Debug.LogFormat("Tuple::GetHashCode error.\n{0}", ex.Message);
		}
		return 0;
	}

	public override bool Equals(object obj)
	{
		if (!(obj is Tuple<T1, T2> tuple))
		{
			return false;
		}
		if (Item1Comparer.Equals(first, tuple.first))
		{
			return Item2Comparer.Equals(second, tuple.second);
		}
		return false;
	}

	private static bool IsNull(object obj)
	{
		return obj == null;
	}
}
[Serializable]
public class Tuple<T1, T2, T3>
{
	public T1 first;

	public T2 second;

	public T3 third;

	private static readonly IEqualityComparer Item1Comparer = EqualityComparer<T1>.Default;

	private static readonly IEqualityComparer Item2Comparer = EqualityComparer<T2>.Default;

	private static readonly IEqualityComparer Item3Comparer = EqualityComparer<T3>.Default;

	public Tuple(T1 first, T2 second, T3 third)
	{
		this.first = first;
		this.second = second;
		this.third = third;
	}

	public override string ToString()
	{
		return $"<{first}, {second}, {third}>";
	}

	public static bool operator ==(Tuple<T1, T2, T3> a, Tuple<T1, T2, T3> b)
	{
		if (IsNull(a) && !IsNull(b))
		{
			return false;
		}
		if (!IsNull(a) && IsNull(b))
		{
			return false;
		}
		if (IsNull(a) && IsNull(b))
		{
			return true;
		}
		ref T1 reference = ref a.first;
		object obj = b.first;
		if (reference.Equals(obj))
		{
			ref T2 reference2 = ref a.second;
			object obj2 = b.second;
			if (reference2.Equals(obj2))
			{
				ref T3 reference3 = ref a.third;
				object obj3 = b.third;
				return reference3.Equals(obj3);
			}
		}
		return false;
	}

	public static bool operator !=(Tuple<T1, T2, T3> a, Tuple<T1, T2, T3> b)
	{
		return !(a == b);
	}

	public override int GetHashCode()
	{
		return ((17 * 23 + first.GetHashCode()) * 23 + second.GetHashCode()) * 23 + third.GetHashCode();
	}

	public override bool Equals(object obj)
	{
		if (!(obj is Tuple<T1, T2, T3> tuple))
		{
			return false;
		}
		if (Item1Comparer.Equals(first, tuple.first) && Item2Comparer.Equals(second, tuple.second))
		{
			return Item3Comparer.Equals(second, tuple.third);
		}
		return false;
	}

	private static bool IsNull(object obj)
	{
		return obj == null;
	}
}
