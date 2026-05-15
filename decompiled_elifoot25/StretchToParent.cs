using UnityEngine;

[RequireComponent(typeof(RectTransform))]
public class StretchToParent : MonoBehaviour
{
	private void Awake()
	{
		RectTransform component = GetComponent<RectTransform>();
		component.anchorMin = Vector2.zero;
		component.anchorMax = Vector2.one;
		component.offsetMin = Vector2.zero;
		component.offsetMax = Vector2.zero;
	}
}
