using System;
using System.Linq;
using System.Text.RegularExpressions;

public static class Extensions
{
	public static void InitArray<T>(this T[] array, T defaultVaue)
	{
		if (array != null)
		{
			for (int i = 0; i < array.Length; i++)
			{
				array[i] = defaultVaue;
			}
		}
	}

	public static void AddItemInArray<T>(ref T[] toArray, T itemToAdd)
	{
		if (toArray == null)
		{
			toArray = new T[1];
		}
		else
		{
			Array.Resize(ref toArray, toArray.Length + 1);
		}
		toArray[toArray.Length - 1] = itemToAdd;
	}

	public static T[] RemoveItemFromArray<T>(this T[] original, T itemToRemove)
	{
		if (!original.Contains(itemToRemove))
		{
			return original;
		}
		T[] array = new T[Math.Max(0, original.Length - 1)];
		int num = 0;
		bool flag = false;
		for (int i = 0; i < original.Length; i++)
		{
			if (original[i].Equals(itemToRemove) && !flag)
			{
				flag = true;
			}
			else
			{
				array[num++] = original[i];
			}
		}
		return array;
	}

	public static bool IsLike(this string @this, string pattern)
	{
		string text = "^" + Regex.Escape(pattern) + "$";
		text = text.Replace("\\[!", "[^").Replace("\\[", "[").Replace("\\]", "]")
			.Replace("\\?", ".")
			.Replace("\\*", ".*")
			.Replace("\\#", "\\d");
		return Regex.IsMatch(@this, text);
	}
}
