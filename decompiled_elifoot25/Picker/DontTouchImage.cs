using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[AddComponentMenu("UI/Picker/DontTouchImage", 1030)]
[DisallowMultipleComponent]
public class DontTouchImage : Image
{
	public override bool IsRaycastLocationValid(Vector2 screenPoint, Camera eventCamera)
	{
		return false;
	}
}
