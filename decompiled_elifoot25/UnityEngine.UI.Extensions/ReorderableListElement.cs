using System;
using System.Collections.Generic;
using UnityEngine.EventSystems;

namespace UnityEngine.UI.Extensions;

[RequireComponent(typeof(RectTransform), typeof(LayoutElement))]
public class ReorderableListElement : MonoBehaviour, IDragHandler, IEventSystemHandler, IBeginDragHandler, IEndDragHandler
{
	[Tooltip("Can this element be dragged?")]
	public bool IsGrabbable = true;

	[Tooltip("Can this element be transfered to another list")]
	public bool IsTransferable = true;

	[Tooltip("Can this element be dropped in space?")]
	public bool isDroppableInSpace;

	private readonly List<RaycastResult> _raycastResults = new List<RaycastResult>();

	private ReorderableList _currentReorderableListRaycasted;

	private int _fromIndex;

	private RectTransform _draggingObject;

	private LayoutElement _draggingObjectLE;

	private Vector2 _draggingObjectOriginalSize;

	private RectTransform _fakeElement;

	private LayoutElement _fakeElementLE;

	private int _displacedFromIndex;

	private RectTransform _displacedObject;

	private LayoutElement _displacedObjectLE;

	private Vector2 _displacedObjectOriginalSize;

	private ReorderableList _displacedObjectOriginList;

	private bool _isDragging;

	private RectTransform _rect;

	private ReorderableList _reorderableList;

	private CanvasGroup _canvasGroup;

	internal bool isValid;

	private float fixedX;

	public void OnBeginDrag(PointerEventData eventData)
	{
		_canvasGroup.blocksRaycasts = false;
		isValid = true;
		if (_reorderableList == null)
		{
			return;
		}
		if (!_reorderableList.IsDraggable || !IsGrabbable)
		{
			_draggingObject = null;
			return;
		}
		if (!_reorderableList.CloneDraggedObject)
		{
			_draggingObject = _rect;
			_fromIndex = _rect.GetSiblingIndex();
			_displacedFromIndex = -1;
			if (_reorderableList.OnElementRemoved != null)
			{
				_reorderableList.OnElementRemoved.Invoke(new ReorderableList.ReorderableListEventStruct
				{
					DroppedObject = _draggingObject.gameObject,
					IsAClone = _reorderableList.CloneDraggedObject,
					SourceObject = (_reorderableList.CloneDraggedObject ? base.gameObject : _draggingObject.gameObject),
					FromList = _reorderableList,
					FromIndex = _fromIndex
				});
			}
			if (!isValid)
			{
				_draggingObject = null;
				return;
			}
		}
		else
		{
			GameObject gameObject = Object.Instantiate(base.gameObject);
			_draggingObject = gameObject.GetComponent<RectTransform>();
		}
		_draggingObjectOriginalSize = base.gameObject.GetComponent<RectTransform>().rect.size;
		_draggingObjectLE = _draggingObject.GetComponent<LayoutElement>();
		_draggingObject.SetParent(_reorderableList.DraggableArea, worldPositionStays: true);
		_draggingObject.SetAsLastSibling();
		_reorderableList.Refresh();
		_fakeElement = new GameObject("Fake").AddComponent<RectTransform>();
		_fakeElementLE = _fakeElement.gameObject.AddComponent<LayoutElement>();
		RefreshSizes();
		if (_reorderableList.OnElementGrabbed != null)
		{
			_reorderableList.OnElementGrabbed.Invoke(new ReorderableList.ReorderableListEventStruct
			{
				DroppedObject = _draggingObject.gameObject,
				IsAClone = _reorderableList.CloneDraggedObject,
				SourceObject = (_reorderableList.CloneDraggedObject ? base.gameObject : _draggingObject.gameObject),
				FromList = _reorderableList,
				FromIndex = _fromIndex
			});
			if (!isValid)
			{
				CancelDrag();
				return;
			}
		}
		_isDragging = true;
	}

	public void OnDrag(PointerEventData eventData)
	{
		if (!_isDragging)
		{
			return;
		}
		if (!isValid)
		{
			CancelDrag();
			return;
		}
		Canvas componentInParent = _draggingObject.GetComponentInParent<Canvas>();
		Vector3 vector = new Vector2(fixedX, eventData.position.y);
		RectTransformUtility.ScreenPointToWorldPointInRectangle(componentInParent.GetComponent<RectTransform>(), vector, (componentInParent.renderMode != RenderMode.ScreenSpaceOverlay) ? componentInParent.worldCamera : null, out var worldPoint);
		_draggingObject.position = worldPoint;
		ReorderableList currentReorderableListRaycasted = _currentReorderableListRaycasted;
		EventSystem.current.RaycastAll(eventData, _raycastResults);
		for (int i = 0; i < _raycastResults.Count; i++)
		{
			_currentReorderableListRaycasted = _raycastResults[i].gameObject.GetComponent<ReorderableList>();
			if (_currentReorderableListRaycasted != null)
			{
				break;
			}
		}
		if (_currentReorderableListRaycasted == null || !_currentReorderableListRaycasted.IsDropable || (currentReorderableListRaycasted != _reorderableList && !IsTransferable) || (((_fakeElement.parent == _currentReorderableListRaycasted.Content) ? (_currentReorderableListRaycasted.Content.childCount - 1) : _currentReorderableListRaycasted.Content.childCount) >= _currentReorderableListRaycasted.maxItems && !_currentReorderableListRaycasted.IsDisplacable) || _currentReorderableListRaycasted.maxItems <= 0)
		{
			RefreshSizes();
			_fakeElement.transform.SetParent(_reorderableList.DraggableArea, worldPositionStays: false);
			if (_displacedObject != null)
			{
				revertDisplacedElement();
			}
			return;
		}
		if (_currentReorderableListRaycasted.Content.childCount < _currentReorderableListRaycasted.maxItems && _fakeElement.parent != _currentReorderableListRaycasted.Content)
		{
			_fakeElement.SetParent(_currentReorderableListRaycasted.Content, worldPositionStays: false);
		}
		float num = float.PositiveInfinity;
		int num2 = 0;
		float num3 = 0f;
		for (int j = 0; j < _currentReorderableListRaycasted.Content.childCount; j++)
		{
			RectTransform component = _currentReorderableListRaycasted.Content.GetChild(j).GetComponent<RectTransform>();
			if (_currentReorderableListRaycasted.ContentLayout is VerticalLayoutGroup)
			{
				num3 = Mathf.Abs(component.position.y - worldPoint.y);
			}
			else if (_currentReorderableListRaycasted.ContentLayout is HorizontalLayoutGroup)
			{
				num3 = Mathf.Abs(component.position.x - worldPoint.x);
			}
			else if (_currentReorderableListRaycasted.ContentLayout is GridLayoutGroup)
			{
				num3 = Mathf.Abs(component.position.x - worldPoint.x) + Mathf.Abs(component.position.y - worldPoint.y);
			}
			if (num3 < num)
			{
				num = num3;
				num2 = j;
			}
		}
		if ((_currentReorderableListRaycasted != currentReorderableListRaycasted || num2 != _displacedFromIndex) && _currentReorderableListRaycasted.Content.childCount == _currentReorderableListRaycasted.maxItems)
		{
			Transform child = _currentReorderableListRaycasted.Content.GetChild(num2);
			if (_displacedObject != null)
			{
				revertDisplacedElement();
				if (_currentReorderableListRaycasted.Content.childCount > _currentReorderableListRaycasted.maxItems)
				{
					displaceElement(num2, child);
				}
			}
			else if (_fakeElement.parent != _currentReorderableListRaycasted.Content)
			{
				_fakeElement.SetParent(_currentReorderableListRaycasted.Content, worldPositionStays: false);
				displaceElement(num2, child);
			}
		}
		RefreshSizes();
		_fakeElement.SetSiblingIndex(num2);
		_fakeElement.gameObject.SetActive(value: true);
	}

	private void displaceElement(int targetIndex, Transform displaced)
	{
		_displacedFromIndex = targetIndex;
		_displacedObjectOriginList = _currentReorderableListRaycasted;
		_displacedObject = displaced.GetComponent<RectTransform>();
		_displacedObjectLE = _displacedObject.GetComponent<LayoutElement>();
		_displacedObjectOriginalSize = _displacedObject.rect.size;
		ReorderableList.ReorderableListEventStruct arg = new ReorderableList.ReorderableListEventStruct
		{
			DroppedObject = _displacedObject.gameObject,
			FromList = _currentReorderableListRaycasted,
			FromIndex = targetIndex
		};
		int num = ((_fakeElement.parent == _reorderableList.Content) ? (_reorderableList.Content.childCount - 1) : _reorderableList.Content.childCount);
		if (_reorderableList.IsDropable && num < _reorderableList.maxItems && _displacedObject.GetComponent<ReorderableListElement>().IsTransferable)
		{
			_displacedObjectLE.preferredWidth = _draggingObjectOriginalSize.x;
			_displacedObjectLE.preferredHeight = _draggingObjectOriginalSize.y;
			_displacedObject.SetParent(_reorderableList.Content, worldPositionStays: false);
			_displacedObject.rotation = _reorderableList.transform.rotation;
			_displacedObject.SetSiblingIndex(_fromIndex);
			_reorderableList.Refresh();
			_currentReorderableListRaycasted.Refresh();
			arg.ToList = _reorderableList;
			arg.ToIndex = _fromIndex;
			_reorderableList.OnElementDisplacedTo.Invoke(arg);
			_reorderableList.OnElementAdded.Invoke(arg);
		}
		else if (_displacedObject.GetComponent<ReorderableListElement>().isDroppableInSpace)
		{
			_displacedObject.SetParent(_currentReorderableListRaycasted.DraggableArea, worldPositionStays: true);
			_currentReorderableListRaycasted.Refresh();
			_displacedObject.position += new Vector3(_draggingObjectOriginalSize.x / 2f, _draggingObjectOriginalSize.y / 2f, 0f);
		}
		else
		{
			_displacedObject.SetParent(null, worldPositionStays: true);
			_displacedObjectOriginList.Refresh();
			_displacedObject.gameObject.SetActive(value: false);
		}
		_displacedObjectOriginList.OnElementDisplacedFrom.Invoke(arg);
		_reorderableList.OnElementRemoved.Invoke(arg);
	}

	private void revertDisplacedElement()
	{
		ReorderableList.ReorderableListEventStruct arg = new ReorderableList.ReorderableListEventStruct
		{
			DroppedObject = _displacedObject.gameObject,
			FromList = _displacedObjectOriginList,
			FromIndex = _displacedFromIndex
		};
		if (_displacedObject.parent != null)
		{
			arg.ToList = _reorderableList;
			arg.ToIndex = _fromIndex;
		}
		_displacedObjectLE.preferredWidth = _displacedObjectOriginalSize.x;
		_displacedObjectLE.preferredHeight = _displacedObjectOriginalSize.y;
		_displacedObject.SetParent(_displacedObjectOriginList.Content, worldPositionStays: false);
		_displacedObject.rotation = _displacedObjectOriginList.transform.rotation;
		_displacedObject.SetSiblingIndex(_displacedFromIndex);
		_displacedObject.gameObject.SetActive(value: true);
		_reorderableList.Refresh();
		_displacedObjectOriginList.Refresh();
		if (arg.ToList != null)
		{
			_reorderableList.OnElementDisplacedToReturned.Invoke(arg);
			_reorderableList.OnElementRemoved.Invoke(arg);
		}
		_displacedObjectOriginList.OnElementDisplacedFromReturned.Invoke(arg);
		_displacedObjectOriginList.OnElementAdded.Invoke(arg);
		_displacedFromIndex = -1;
		_displacedObjectOriginList = null;
		_displacedObject = null;
		_displacedObjectLE = null;
	}

	public void finishDisplacingElement()
	{
		if (_displacedObject.parent == null)
		{
			Object.Destroy(_displacedObject.gameObject);
		}
		_displacedFromIndex = -1;
		_displacedObjectOriginList = null;
		_displacedObject = null;
		_displacedObjectLE = null;
	}

	public void OnEndDrag(PointerEventData eventData)
	{
		_isDragging = false;
		if (_draggingObject != null)
		{
			if (_currentReorderableListRaycasted != null && _fakeElement.parent == _currentReorderableListRaycasted.Content)
			{
				ReorderableList.ReorderableListEventStruct arg = new ReorderableList.ReorderableListEventStruct
				{
					DroppedObject = _draggingObject.gameObject,
					IsAClone = _reorderableList.CloneDraggedObject,
					SourceObject = (_reorderableList.CloneDraggedObject ? base.gameObject : _draggingObject.gameObject),
					FromList = _reorderableList,
					FromIndex = _fromIndex,
					ToList = _currentReorderableListRaycasted,
					ToIndex = _fakeElement.GetSiblingIndex()
				};
				if ((bool)_reorderableList && _reorderableList.OnElementDropped != null)
				{
					_reorderableList.OnElementDropped.Invoke(arg);
				}
				if (!isValid)
				{
					CancelDrag();
					return;
				}
				RefreshSizes();
				_draggingObject.SetParent(_currentReorderableListRaycasted.Content, worldPositionStays: false);
				_draggingObject.rotation = _currentReorderableListRaycasted.transform.rotation;
				_draggingObject.SetSiblingIndex(_fakeElement.GetSiblingIndex());
				_reorderableList.Refresh();
				_currentReorderableListRaycasted.Refresh();
				_reorderableList.OnElementAdded.Invoke(arg);
				if (_displacedObject != null)
				{
					finishDisplacingElement();
				}
				if (!isValid)
				{
					throw new Exception("It's too late to cancel the Transfer! Do so in OnElementDropped!");
				}
			}
			else
			{
				if (isDroppableInSpace)
				{
					_reorderableList.OnElementDropped.Invoke(new ReorderableList.ReorderableListEventStruct
					{
						DroppedObject = _draggingObject.gameObject,
						IsAClone = _reorderableList.CloneDraggedObject,
						SourceObject = (_reorderableList.CloneDraggedObject ? base.gameObject : _draggingObject.gameObject),
						FromList = _reorderableList,
						FromIndex = _fromIndex
					});
				}
				else
				{
					CancelDrag();
				}
				if (_currentReorderableListRaycasted != null && ((_currentReorderableListRaycasted.Content.childCount >= _currentReorderableListRaycasted.maxItems && !_currentReorderableListRaycasted.IsDisplacable) || _currentReorderableListRaycasted.maxItems <= 0))
				{
					GameObject gameObject = _draggingObject.gameObject;
					_reorderableList.OnElementDroppedWithMaxItems.Invoke(new ReorderableList.ReorderableListEventStruct
					{
						DroppedObject = gameObject,
						IsAClone = _reorderableList.CloneDraggedObject,
						SourceObject = (_reorderableList.CloneDraggedObject ? base.gameObject : gameObject),
						FromList = _reorderableList,
						ToList = _currentReorderableListRaycasted,
						FromIndex = _fromIndex
					});
				}
			}
		}
		if (_fakeElement != null)
		{
			Object.Destroy(_fakeElement.gameObject);
			_fakeElement = null;
		}
		_canvasGroup.blocksRaycasts = true;
	}

	private void CancelDrag()
	{
		_isDragging = false;
		if (_reorderableList.CloneDraggedObject)
		{
			Object.Destroy(_draggingObject.gameObject);
		}
		else
		{
			RefreshSizes();
			_draggingObject.SetParent(_reorderableList.Content, worldPositionStays: false);
			_draggingObject.rotation = _reorderableList.Content.transform.rotation;
			_draggingObject.SetSiblingIndex(_fromIndex);
			ReorderableList.ReorderableListEventStruct arg = new ReorderableList.ReorderableListEventStruct
			{
				DroppedObject = _draggingObject.gameObject,
				IsAClone = _reorderableList.CloneDraggedObject,
				SourceObject = (_reorderableList.CloneDraggedObject ? base.gameObject : _draggingObject.gameObject),
				FromList = _reorderableList,
				FromIndex = _fromIndex,
				ToList = _reorderableList,
				ToIndex = _fromIndex
			};
			_reorderableList.Refresh();
			_reorderableList.OnElementAdded.Invoke(arg);
			if (!isValid)
			{
				throw new Exception("Transfer is already Cancelled.");
			}
		}
		if (_fakeElement != null)
		{
			Object.Destroy(_fakeElement.gameObject);
			_fakeElement = null;
		}
		if (_displacedObject != null)
		{
			revertDisplacedElement();
		}
		_canvasGroup.blocksRaycasts = true;
	}

	private void RefreshSizes()
	{
		Vector2 sizeDelta = _draggingObjectOriginalSize;
		if (_currentReorderableListRaycasted != null && _currentReorderableListRaycasted.IsDropable && _currentReorderableListRaycasted.Content.childCount > 0 && _currentReorderableListRaycasted.EqualizeSizesOnDrag)
		{
			Transform child = _currentReorderableListRaycasted.Content.GetChild(0);
			if (child != null)
			{
				sizeDelta = child.GetComponent<RectTransform>().rect.size;
			}
		}
		_draggingObject.sizeDelta = sizeDelta;
		LayoutElement fakeElementLE = _fakeElementLE;
		float preferredHeight = (_draggingObjectLE.preferredHeight = sizeDelta.y);
		fakeElementLE.preferredHeight = preferredHeight;
		LayoutElement fakeElementLE2 = _fakeElementLE;
		preferredHeight = (_draggingObjectLE.preferredWidth = sizeDelta.x);
		fakeElementLE2.preferredWidth = preferredHeight;
		_fakeElement.GetComponent<RectTransform>().sizeDelta = sizeDelta;
	}

	public void Init(ReorderableList reorderableList)
	{
		_reorderableList = reorderableList;
		_rect = GetComponent<RectTransform>();
		_canvasGroup = base.gameObject.GetComponent<CanvasGroup>();
		if (_canvasGroup == null)
		{
			_canvasGroup = base.gameObject.AddComponent<CanvasGroup>();
		}
		Invoke("InitInvoked", 0.01f);
	}

	private void InitInvoked()
	{
		fixedX = base.transform.position.x;
	}
}
