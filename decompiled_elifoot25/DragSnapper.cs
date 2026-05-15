using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

[RequireComponent(typeof(ScrollRect))]
public class DragSnapper : UIBehaviour, IEndDragHandler, IEventSystemHandler, IBeginDragHandler
{
	public enum SnapDirection
	{
		Horizontal,
		Vertical
	}

	public SnapDirection direction;

	public AnimationCurve decelerationCurve = AnimationCurve.Linear(0f, 0f, 1f, 1f);

	public float speed = 0.5f;

	public float snapPercentage = 0.2f;

	public int startItem;

	private ScrollRect scrollRect;

	private int itemCount;

	private float value;

	private int target;

	private new void Start()
	{
		itemCount = base.transform.Find("Container").childCount;
		scrollRect = base.gameObject.GetComponent<ScrollRect>();
		target = startItem;
		scrollRect.normalizedPosition = new Vector2((float)startItem / (float)itemCount, 0f);
		value = scrollRect.normalizedPosition.x;
		if (direction == SnapDirection.Horizontal)
		{
			scrollRect.horizontal = true;
			scrollRect.vertical = false;
		}
		else if (direction == SnapDirection.Vertical)
		{
			scrollRect.horizontal = false;
			scrollRect.vertical = true;
		}
	}

	public void OnBeginDrag(PointerEventData eventData)
	{
		StopCoroutine(SnapRect());
	}

	public void OnEndDrag(PointerEventData eventData)
	{
		StartCoroutine(SnapRect());
	}

	private IEnumerator SnapRect()
	{
		if (itemCount < 2)
		{
			MonoBehaviour.print("Item count must be 2 or more");
		}
		float num = 1f / (float)(itemCount - 1);
		float startNormal = ((direction == SnapDirection.Horizontal) ? scrollRect.horizontalNormalizedPosition : scrollRect.verticalNormalizedPosition);
		float num2 = (startNormal - value) / num;
		target = Mathf.RoundToInt(value / num);
		if (num2 > snapPercentage)
		{
			target++;
		}
		else if (num2 < 0f - snapPercentage)
		{
			target--;
		}
		target = Mathf.Clamp(target, 0, itemCount - 1);
		float endNormal = num * (float)target;
		float duration = Mathf.Abs((endNormal - startNormal) / speed);
		float timer = 0f;
		while (timer < 1f)
		{
			timer = Mathf.Min(1f, timer + Time.deltaTime / duration);
			value = Mathf.Lerp(startNormal, endNormal, decelerationCurve.Evaluate(timer));
			if (direction == SnapDirection.Horizontal)
			{
				scrollRect.horizontalNormalizedPosition = value;
			}
			else
			{
				scrollRect.verticalNormalizedPosition = value;
			}
			yield return new WaitForEndOfFrame();
		}
	}
}
