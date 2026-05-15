using UnityEngine;
using UnityEngine.EventSystems;

public class DragSensitivity : MonoBehaviour
{
	public float screenPercent = 1.5f;

	private void Start()
	{
		GameObject.Find("EventSystem").GetComponent<EventSystem>().pixelDragThreshold = Mathf.CeilToInt((float)Screen.width * (screenPercent / 100f));
	}
}
