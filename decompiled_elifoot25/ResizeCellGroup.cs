using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class ResizeCellGroup : MonoBehaviour
{
	private GridLayoutGroup group;

	private RectTransform parentRectTransform;

	public bool autoResizeHeight = true;

	public bool useParentRectForResize = true;

	public int maxElementsInView = 16;

	public UnityEvent onChange;

	private Vector2 lastSize;

	private void Awake()
	{
		group = base.gameObject.GetComponent<GridLayoutGroup>();
		if (useParentRectForResize)
		{
			parentRectTransform = base.transform.parent.GetComponent<RectTransform>();
		}
		else
		{
			parentRectTransform = base.transform.GetComponent<RectTransform>();
		}
		lastSize = group.cellSize;
	}

	private void Update()
	{
		if (group != null && parentRectTransform != null)
		{
			if (autoResizeHeight)
			{
				group.cellSize = new Vector2(parentRectTransform.rect.width, parentRectTransform.rect.height / (float)maxElementsInView);
			}
			else
			{
				group.cellSize = new Vector2(parentRectTransform.rect.width, group.cellSize.y);
			}
			if (group.cellSize != lastSize)
			{
				onChange.Invoke();
				lastSize = group.cellSize;
			}
		}
	}
}
