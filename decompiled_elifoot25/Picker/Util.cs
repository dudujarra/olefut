using UnityEngine;

namespace Picker;

public static class Util
{
	public static Vector2 Assign(this Vector2 vec, float value, int axis)
	{
		vec[axis] = value;
		return vec;
	}

	public static Vector3 Assign(this Vector3 vec, float value, int axis)
	{
		vec[axis] = value;
		return vec;
	}

	public static void DestroyObject(Object obj)
	{
		if (Application.isPlaying)
		{
			Object.Destroy(obj);
		}
		else
		{
			Object.DestroyImmediate(obj);
		}
	}
}
