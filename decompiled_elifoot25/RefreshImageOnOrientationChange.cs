using UnityEngine;

public class RefreshImageOnOrientationChange : MonoBehaviour
{
	private RectTransform rectTransform;

	private void OnRectTransformDimensionsChange()
	{
		if (rectTransform == null)
		{
			rectTransform = GetComponent<RectTransform>();
		}
		_ = rectTransform == null;
	}
}
