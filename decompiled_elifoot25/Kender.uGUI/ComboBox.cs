using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace Kender.uGUI;

[RequireComponent(typeof(RectTransform))]
public class ComboBox : MonoBehaviour
{
	public Sprite Sprite_UISprite;

	public Sprite Sprite_Background;

	public Action<int> OnSelectionChanged;

	public Action<int> OnItemSelected;

	[SerializeField]
	private bool _interactable = true;

	[SerializeField]
	private int _itemsToDisplay = 4;

	[SerializeField]
	private bool _hideFirstItem;

	[SerializeField]
	private int _selectedIndex;

	[SerializeField]
	private ComboBoxItem[] _items;

	private GameObject overlayGO;

	private GameObject scrollPanelGO;

	private Vector2 lastScreenSize;

	private int scrollOffset;

	private float _scrollbarWidth = 20f;

	private Transform _canvasTransform;

	private RectTransform _rectTransform;

	private RectTransform _buttonRectTransform;

	private RectTransform _comboButtonRectTransform;

	private RectTransform _comboImageRectTransform;

	private RectTransform _comboTextRectTransform;

	private RectTransform _comboArrowRectTransform;

	private RectTransform _scrollPanelRectTransfrom;

	private RectTransform _itemsRectTransfrom;

	private RectTransform _scrollbarRectTransfrom;

	private RectTransform _slidingAreaRectTransform;

	private RectTransform _handleRectTransfrom;

	public bool Interactable
	{
		get
		{
			return _interactable;
		}
		set
		{
			_interactable = value;
			Button component = comboButtonRectTransform.GetComponent<Button>();
			component.interactable = _interactable;
			Image component2 = comboImageRectTransform.GetComponent<Image>();
			component2.color = ((component2.sprite == null) ? new Color(1f, 1f, 1f, 0f) : (_interactable ? component.colors.normalColor : component.colors.disabledColor));
			if (Application.isPlaying && !_interactable && overlayGO.activeSelf)
			{
				ToggleComboBox(directClick: false);
			}
		}
	}

	public int ItemsToDisplay
	{
		get
		{
			return _itemsToDisplay;
		}
		set
		{
			if (_itemsToDisplay != value)
			{
				_itemsToDisplay = value;
				Refresh();
			}
		}
	}

	public bool HideFirstItem
	{
		get
		{
			return _hideFirstItem;
		}
		set
		{
			if (value)
			{
				scrollOffset--;
			}
			else
			{
				scrollOffset++;
			}
			_hideFirstItem = value;
			Refresh();
		}
	}

	public int SelectedIndex
	{
		get
		{
			return _selectedIndex;
		}
		set
		{
			if (_selectedIndex != value && value > -1 && value < Items.Length)
			{
				_selectedIndex = value;
				RefreshSelected();
			}
		}
	}

	public ComboBoxItem[] Items
	{
		get
		{
			if (_items == null)
			{
				_items = new ComboBoxItem[0];
			}
			return _items;
		}
		set
		{
			_items = value;
			Refresh();
		}
	}

	private Transform canvasTransform
	{
		get
		{
			if (_canvasTransform == null)
			{
				_canvasTransform = base.transform;
				while (_canvasTransform.GetComponent<Canvas>() == null)
				{
					_canvasTransform = _canvasTransform.parent;
				}
			}
			return _canvasTransform;
		}
	}

	private RectTransform rectTransform
	{
		get
		{
			if (_rectTransform == null)
			{
				_rectTransform = GetComponent<RectTransform>();
			}
			return _rectTransform;
		}
		set
		{
			_rectTransform = value;
		}
	}

	private RectTransform buttonRectTransform
	{
		get
		{
			if (_buttonRectTransform == null)
			{
				_buttonRectTransform = rectTransform.Find("Button").GetComponent<RectTransform>();
			}
			return _buttonRectTransform;
		}
		set
		{
			_buttonRectTransform = value;
		}
	}

	private RectTransform comboButtonRectTransform
	{
		get
		{
			if (_comboButtonRectTransform == null)
			{
				_comboButtonRectTransform = buttonRectTransform.Find("ComboButton").GetComponent<RectTransform>();
			}
			return _comboButtonRectTransform;
		}
		set
		{
			_comboButtonRectTransform = value;
		}
	}

	private RectTransform comboImageRectTransform
	{
		get
		{
			if (_comboImageRectTransform == null)
			{
				_comboImageRectTransform = comboButtonRectTransform.Find("Image").GetComponent<RectTransform>();
			}
			return _comboImageRectTransform;
		}
		set
		{
			_comboImageRectTransform = value;
		}
	}

	private RectTransform comboTextRectTransform
	{
		get
		{
			if (_comboTextRectTransform == null)
			{
				_comboTextRectTransform = comboButtonRectTransform.Find("Text").GetComponent<RectTransform>();
			}
			return _comboTextRectTransform;
		}
		set
		{
			_comboTextRectTransform = value;
		}
	}

	private RectTransform comboArrowRectTransform
	{
		get
		{
			if (_comboArrowRectTransform == null)
			{
				_comboArrowRectTransform = buttonRectTransform.Find("Arrow").GetComponent<RectTransform>();
			}
			return _comboArrowRectTransform;
		}
		set
		{
			_comboArrowRectTransform = value;
		}
	}

	private RectTransform scrollPanelRectTransfrom
	{
		get
		{
			if (_scrollPanelRectTransfrom == null && overlayGO != null)
			{
				_scrollPanelRectTransfrom = overlayGO.transform.Find("ScrollPanel").GetComponent<RectTransform>();
			}
			return _scrollPanelRectTransfrom;
		}
		set
		{
			_scrollPanelRectTransfrom = value;
		}
	}

	private RectTransform itemsRectTransfrom
	{
		get
		{
			if (_itemsRectTransfrom == null && scrollPanelRectTransfrom != null)
			{
				_itemsRectTransfrom = scrollPanelRectTransfrom.Find("Items").GetComponent<RectTransform>();
			}
			return _itemsRectTransfrom;
		}
		set
		{
			_itemsRectTransfrom = value;
		}
	}

	private RectTransform scrollbarRectTransfrom
	{
		get
		{
			if (_scrollbarRectTransfrom == null)
			{
				_scrollbarRectTransfrom = scrollPanelRectTransfrom.Find("Scrollbar").GetComponent<RectTransform>();
			}
			return _scrollbarRectTransfrom;
		}
		set
		{
			_scrollbarRectTransfrom = value;
		}
	}

	private RectTransform slidingAreaRectTransform
	{
		get
		{
			if (_slidingAreaRectTransform == null)
			{
				_slidingAreaRectTransform = scrollbarRectTransfrom.Find("SlidingArea").GetComponent<RectTransform>();
			}
			return _slidingAreaRectTransform;
		}
		set
		{
			_slidingAreaRectTransform = value;
		}
	}

	private RectTransform handleRectTransfrom
	{
		get
		{
			if (_handleRectTransfrom == null)
			{
				_handleRectTransfrom = slidingAreaRectTransform.Find("Handle").GetComponent<RectTransform>();
			}
			return _handleRectTransfrom;
		}
		set
		{
			_handleRectTransfrom = value;
		}
	}

	private void Awake()
	{
		InitControl();
	}

	private void Start()
	{
		lastScreenSize = new Vector2(Screen.width, Screen.height);
		scrollPanelGO.transform.SetParent(overlayGO.transform, worldPositionStays: true);
	}

	public void OnItemClicked(int index)
	{
		bool num = index != SelectedIndex;
		SelectItem(index);
		ToggleComboBox(directClick: true);
		if (num && OnSelectionChanged != null)
		{
			OnSelectionChanged(index);
		}
	}

	public void SelectItem(int index)
	{
		SelectedIndex = index;
		if (OnItemSelected != null)
		{
			OnItemSelected(index);
		}
	}

	public void AddItems(params object[] list)
	{
		List<ComboBoxItem> list2 = new List<ComboBoxItem>();
		foreach (object obj in list)
		{
			if (obj is ComboBoxItem)
			{
				ComboBoxItem item = (ComboBoxItem)obj;
				list2.Add(item);
				continue;
			}
			if (obj is string)
			{
				ComboBoxItem item2 = new ComboBoxItem((string)obj, null, disabled: false, null);
				list2.Add(item2);
				continue;
			}
			if (obj is Sprite)
			{
				ComboBoxItem item3 = new ComboBoxItem(null, (Sprite)obj, disabled: false, null);
				list2.Add(item3);
				continue;
			}
			throw new Exception("Only ComboBoxItem, string and Sprite types are allowed");
		}
		ComboBoxItem[] array = new ComboBoxItem[Items.Length + list2.Count];
		Items.CopyTo(array, 0);
		list2.ToArray().CopyTo(array, Items.Length);
		Refresh();
		Items = array;
	}

	public void ClearItems()
	{
		Items = new ComboBoxItem[0];
	}

	public void CreateControl()
	{
		rectTransform = GetComponent<RectTransform>();
		GameObject gameObject = new GameObject("Button");
		gameObject.transform.SetParent(base.transform, worldPositionStays: false);
		buttonRectTransform = gameObject.AddComponent<RectTransform>();
		buttonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, rectTransform.sizeDelta.x);
		buttonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, rectTransform.sizeDelta.y);
		buttonRectTransform.anchoredPosition = Vector2.zero;
		GameObject gameObject2 = new GameObject("ComboButton");
		gameObject2.transform.SetParent(buttonRectTransform, worldPositionStays: false);
		comboButtonRectTransform = gameObject2.AddComponent<RectTransform>();
		comboButtonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, buttonRectTransform.sizeDelta.x);
		comboButtonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, buttonRectTransform.sizeDelta.y);
		comboButtonRectTransform.anchoredPosition = Vector2.zero;
		Image image = gameObject2.AddComponent<Image>();
		image.sprite = Sprite_UISprite;
		image.type = Image.Type.Sliced;
		Button button = gameObject2.AddComponent<Button>();
		button.targetGraphic = image;
		button.colors = new ColorBlock
		{
			normalColor = new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, byte.MaxValue),
			highlightedColor = new Color32(245, 245, 245, byte.MaxValue),
			pressedColor = new Color32(200, 200, 200, byte.MaxValue),
			disabledColor = new Color32(200, 200, 200, 128),
			colorMultiplier = 1f,
			fadeDuration = 0.1f
		};
		GameObject obj = new GameObject("Arrow");
		obj.transform.SetParent(buttonRectTransform, worldPositionStays: false);
		Text text = obj.AddComponent<Text>();
		text.color = new Color32(0, 0, 0, byte.MaxValue);
		text.alignment = TextAnchor.MiddleCenter;
		text.font = Resources.GetBuiltinResource(typeof(Font), "Arial.ttf") as Font;
		text.text = "▼";
		comboArrowRectTransform.localScale = new Vector3(1f, 0.5f, 1f);
		comboArrowRectTransform.pivot = new Vector2(1f, 0.5f);
		comboArrowRectTransform.anchorMin = Vector2.right;
		comboArrowRectTransform.anchorMax = Vector2.one;
		comboArrowRectTransform.anchoredPosition = Vector2.zero;
		comboArrowRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, comboButtonRectTransform.sizeDelta.y);
		comboArrowRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, comboButtonRectTransform.sizeDelta.y);
		CanvasGroup canvasGroup = obj.AddComponent<CanvasGroup>();
		canvasGroup.interactable = false;
		canvasGroup.blocksRaycasts = false;
		GameObject obj2 = new GameObject("Image");
		obj2.transform.SetParent(comboButtonRectTransform, worldPositionStays: false);
		obj2.AddComponent<Image>().color = new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, 0);
		comboImageRectTransform.pivot = Vector2.up;
		comboImageRectTransform.anchorMin = Vector2.zero;
		comboImageRectTransform.anchorMax = Vector2.up;
		comboImageRectTransform.anchoredPosition = new Vector2(4f, -4f);
		comboImageRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, comboButtonRectTransform.sizeDelta.y - 8f);
		comboImageRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, comboButtonRectTransform.sizeDelta.y - 8f);
		GameObject obj3 = new GameObject("Text");
		obj3.transform.SetParent(comboButtonRectTransform, worldPositionStays: false);
		Text text2 = obj3.AddComponent<Text>();
		text2.color = new Color32(0, 0, 0, byte.MaxValue);
		text2.alignment = TextAnchor.MiddleLeft;
		text2.lineSpacing = 1.2f;
		text2.font = Resources.GetBuiltinResource(typeof(Font), "Arial.ttf") as Font;
		text2.resizeTextForBestFit = true;
		comboTextRectTransform.pivot = Vector2.up;
		comboTextRectTransform.anchorMin = Vector2.zero;
		comboTextRectTransform.anchorMax = Vector2.one;
		comboTextRectTransform.anchoredPosition = new Vector2(10f, 0f);
		comboTextRectTransform.offsetMax = new Vector2(4f, 0f);
		comboTextRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, comboButtonRectTransform.sizeDelta.y);
	}

	public void OnDestroy()
	{
		if (overlayGO != null)
		{
			UnityEngine.Object.Destroy(overlayGO);
		}
	}

	private void InitControl()
	{
		Transform obj = base.transform.Find("Button/ComboButton/Image");
		Transform transform = base.transform.Find("Button/ComboButton/Text");
		Transform transform2 = base.transform.Find("Button/Arrow");
		if (obj == null || transform == null || transform2 == null)
		{
			foreach (Transform item in base.transform)
			{
				UnityEngine.Object.Destroy(item);
			}
			CreateControl();
		}
		comboButtonRectTransform.GetComponent<Button>().onClick.AddListener(delegate
		{
			ToggleComboBox(directClick: false);
		});
		float num = comboButtonRectTransform.sizeDelta.y * (float)Mathf.Min(ItemsToDisplay, Items.Length - (HideFirstItem ? 1 : 0));
		overlayGO = new GameObject("CBOverlay");
		overlayGO.SetActive(value: false);
		Image image = overlayGO.AddComponent<Image>();
		image.color = new Color32(0, 0, 0, 0);
		overlayGO.transform.SetParent(canvasTransform, worldPositionStays: false);
		RectTransform component = overlayGO.GetComponent<RectTransform>();
		component.anchorMin = Vector2.zero;
		component.anchorMax = Vector2.one;
		component.offsetMin = Vector2.zero;
		component.offsetMax = Vector2.zero;
		Button button = overlayGO.AddComponent<Button>();
		button.targetGraphic = image;
		button.onClick.AddListener(delegate
		{
			ToggleComboBox(directClick: false);
		});
		scrollPanelGO = new GameObject("ScrollPanel");
		Image image2 = scrollPanelGO.AddComponent<Image>();
		image2.sprite = Sprite_UISprite;
		image2.type = Image.Type.Sliced;
		scrollPanelGO.transform.SetParent(overlayGO.transform, worldPositionStays: false);
		scrollPanelRectTransfrom.anchorMin = new Vector2(0.5f, 0.635f);
		scrollPanelRectTransfrom.anchorMax = new Vector2(0.93f, 0.845f);
		scrollPanelRectTransfrom.sizeDelta = new Vector2(0f, 0f);
		scrollPanelGO.transform.SetParent(base.transform, worldPositionStays: false);
		ScrollRect scrollRect = scrollPanelGO.AddComponent<ScrollRect>();
		scrollRect.horizontal = false;
		scrollRect.elasticity = 0f;
		scrollRect.movementType = ScrollRect.MovementType.Clamped;
		scrollRect.inertia = false;
		scrollRect.scrollSensitivity = comboButtonRectTransform.sizeDelta.y;
		scrollPanelGO.AddComponent<Mask>();
		float num2 = ((Items.Length - (HideFirstItem ? 1 : 0) > _itemsToDisplay) ? _scrollbarWidth : 0f);
		GameObject gameObject = new GameObject("Items");
		gameObject.transform.SetParent(scrollPanelGO.transform, worldPositionStays: false);
		itemsRectTransfrom = gameObject.AddComponent<RectTransform>();
		itemsRectTransfrom.pivot = Vector2.up;
		itemsRectTransfrom.anchorMin = Vector2.up;
		itemsRectTransfrom.anchorMax = Vector2.one;
		itemsRectTransfrom.anchoredPosition = Vector2.right;
		itemsRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, scrollPanelRectTransfrom.sizeDelta.x - num2);
		ContentSizeFitter contentSizeFitter = gameObject.AddComponent<ContentSizeFitter>();
		contentSizeFitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
		contentSizeFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
		GridLayoutGroup gridLayoutGroup = gameObject.AddComponent<GridLayoutGroup>();
		gridLayoutGroup.cellSize = new Vector2(430f, 80f);
		gridLayoutGroup.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
		gridLayoutGroup.constraintCount = 1;
		scrollRect.content = itemsRectTransfrom;
		GameObject gameObject2 = new GameObject("Scrollbar");
		gameObject2.transform.SetParent(scrollPanelGO.transform, worldPositionStays: false);
		Image image3 = gameObject2.AddComponent<Image>();
		image3.sprite = Sprite_Background;
		image3.type = Image.Type.Sliced;
		Scrollbar scrollbar = gameObject2.AddComponent<Scrollbar>();
		scrollbar.colors = new ColorBlock
		{
			normalColor = new Color32(128, 128, 128, 128),
			highlightedColor = new Color32(128, 128, 128, 178),
			pressedColor = new Color32(88, 88, 88, 178),
			disabledColor = new Color32(64, 64, 64, 128),
			colorMultiplier = 2f,
			fadeDuration = 0.1f
		};
		scrollRect.verticalScrollbar = scrollbar;
		scrollbar.direction = Scrollbar.Direction.BottomToTop;
		scrollbarRectTransfrom.pivot = Vector2.one;
		scrollbarRectTransfrom.anchorMin = Vector2.one;
		scrollbarRectTransfrom.anchorMax = Vector2.one;
		scrollbarRectTransfrom.anchoredPosition = Vector2.zero;
		scrollbarRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, num2);
		scrollbarRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, num);
		GameObject gameObject3 = new GameObject("SlidingArea");
		gameObject3.transform.SetParent(gameObject2.transform, worldPositionStays: false);
		slidingAreaRectTransform = gameObject3.AddComponent<RectTransform>();
		slidingAreaRectTransform.anchoredPosition = Vector2.zero;
		slidingAreaRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, 0f);
		slidingAreaRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, num - scrollbarRectTransfrom.sizeDelta.x);
		GameObject obj2 = new GameObject("Handle");
		obj2.transform.SetParent(gameObject3.transform, worldPositionStays: false);
		Image image4 = obj2.AddComponent<Image>();
		image4.sprite = Sprite_UISprite;
		image4.type = Image.Type.Sliced;
		image4.color = new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, 150);
		scrollbar.targetGraphic = image4;
		scrollbar.handleRect = handleRectTransfrom;
		handleRectTransfrom.pivot = new Vector2(0.5f, 0.5f);
		handleRectTransfrom.anchorMin = new Vector2(0.5f, 0.5f);
		handleRectTransfrom.anchorMax = new Vector2(0.5f, 0.5f);
		handleRectTransfrom.anchoredPosition = Vector2.zero;
		handleRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, num2);
		handleRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, num2);
		Interactable = Interactable;
		if (Items.Length >= 1)
		{
			Refresh();
		}
	}

	private void Refresh()
	{
		if (itemsRectTransfrom == null)
		{
			return;
		}
		GridLayoutGroup component = itemsRectTransfrom.GetComponent<GridLayoutGroup>();
		int num = Items.Length - (HideFirstItem ? 1 : 0);
		float num2 = comboButtonRectTransform.sizeDelta.y * (float)Mathf.Min(_itemsToDisplay, num);
		float num3 = ((num > ItemsToDisplay) ? _scrollbarWidth : 0f);
		scrollPanelRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, num2);
		scrollPanelRectTransfrom.sizeDelta = new Vector2(0f, 0f);
		scrollbarRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, num3);
		scrollbarRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, num2);
		slidingAreaRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, num2 - scrollbarRectTransfrom.sizeDelta.x);
		itemsRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, scrollPanelRectTransfrom.sizeDelta.x - num3);
		component.cellSize = new Vector2(430f, 80f);
		for (int num4 = itemsRectTransfrom.childCount - 1; num4 > -1; num4--)
		{
			UnityEngine.Object.DestroyImmediate(itemsRectTransfrom.GetChild(0).gameObject);
		}
		for (int i = 0; i < Items.Length; i++)
		{
			if (HideFirstItem && i == 0)
			{
				continue;
			}
			ComboBoxItem item = Items[i];
			item.OnUpdate = Refresh;
			RectTransform obj = UnityEngine.Object.Instantiate(comboButtonRectTransform);
			obj.SetParent(itemsRectTransfrom, worldPositionStays: false);
			obj.GetComponent<Image>().sprite = null;
			Text component2 = obj.Find("Text").GetComponent<Text>();
			component2.text = item.Caption;
			if (item.IsDisabled)
			{
				component2.color = new Color32(174, 174, 174, byte.MaxValue);
			}
			Image component3 = obj.Find("Image").GetComponent<Image>();
			component3.sprite = item.Image;
			component3.color = ((item.Image == null) ? new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, 0) : (item.IsDisabled ? new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, 147) : new Color32(byte.MaxValue, byte.MaxValue, byte.MaxValue, byte.MaxValue)));
			Button component4 = obj.GetComponent<Button>();
			component4.interactable = !item.IsDisabled;
			int index = i;
			component4.onClick.AddListener(delegate
			{
				OnItemClicked(index);
				if (item.OnSelect != null)
				{
					item.OnSelect();
				}
			});
		}
		RefreshSelected();
		UpdateComboBoxImages();
		FixScrollOffset();
		UpdateHandle();
	}

	public void RefreshSelected()
	{
		Image component = comboImageRectTransform.GetComponent<Image>();
		ComboBoxItem comboBoxItem = ((SelectedIndex > -1 && SelectedIndex < Items.Length) ? Items[SelectedIndex] : null);
		bool flag = comboBoxItem != null && comboBoxItem.Image != null;
		component.sprite = (flag ? comboBoxItem.Image : null);
		Button component2 = comboButtonRectTransform.GetComponent<Button>();
		component.color = ((!flag) ? new Color(1f, 1f, 1f, 0f) : (Interactable ? component2.colors.normalColor : component2.colors.disabledColor));
		UpdateComboBoxImage(comboButtonRectTransform, flag);
		comboTextRectTransform.GetComponent<Text>().text = ((comboBoxItem != null) ? comboBoxItem.Caption : "");
		if (!Application.isPlaying)
		{
			return;
		}
		int num = 0;
		if (itemsRectTransfrom == null)
		{
			return;
		}
		foreach (Transform item in itemsRectTransfrom)
		{
			item.GetComponent<Image>().color = ((SelectedIndex == num + (HideFirstItem ? 1 : 0)) ? component2.colors.highlightedColor : component2.colors.normalColor);
			num++;
		}
	}

	private void UpdateComboBoxImages()
	{
		bool includeImage = false;
		ComboBoxItem[] items = Items;
		for (int i = 0; i < items.Length; i++)
		{
			if (items[i].Image != null)
			{
				includeImage = true;
				break;
			}
		}
		foreach (Transform item in itemsRectTransfrom)
		{
			UpdateComboBoxImage(item, includeImage);
		}
	}

	private void UpdateComboBoxImage(Transform comboButton, bool includeImage)
	{
		comboButton.Find("Text").GetComponent<RectTransform>().offsetMin = Vector2.right * (includeImage ? (comboImageRectTransform.rect.width + 8f) : 10f);
	}

	private void FixScrollOffset()
	{
		int num = SelectedIndex + (HideFirstItem ? 1 : 0);
		if (num < scrollOffset)
		{
			scrollOffset = num;
		}
		else if (num > scrollOffset + ItemsToDisplay - 1)
		{
			scrollOffset = num - ItemsToDisplay + 1;
		}
		int num2 = Items.Length - (HideFirstItem ? 1 : 0);
		if (scrollOffset > num2 - ItemsToDisplay)
		{
			scrollOffset = num2 - ItemsToDisplay;
		}
		if (scrollOffset < 0)
		{
			scrollOffset = 0;
		}
		itemsRectTransfrom.anchoredPosition = new Vector2(0f, (float)scrollOffset * rectTransform.sizeDelta.y);
	}

	public void ToggleComboBox(bool directClick)
	{
		overlayGO.SetActive(!overlayGO.activeSelf);
		if (overlayGO.activeSelf)
		{
			int num = Mathf.Min(_itemsToDisplay, Items.Length - (HideFirstItem ? 1 : 0));
			scrollPanelRectTransfrom.SetParent(base.transform, worldPositionStays: false);
			float size = comboButtonRectTransform.sizeDelta.y * (float)Mathf.Min(ItemsToDisplay, Items.Length - (HideFirstItem ? 1 : 0));
			scrollPanelRectTransfrom.anchoredPosition = new Vector2(0f, (0f - rectTransform.sizeDelta.y) * (float)num);
			scrollPanelRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, comboButtonRectTransform.sizeDelta.x);
			scrollPanelRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, size);
			scrollPanelRectTransfrom.SetParent(overlayGO.GetComponent<RectTransform>(), worldPositionStays: true);
			scrollPanelRectTransfrom.sizeDelta = new Vector2(0f, 0f);
			FixScrollOffset();
		}
		else if (directClick)
		{
			scrollOffset = (int)Mathf.Round(itemsRectTransfrom.anchoredPosition.y / rectTransform.sizeDelta.y);
		}
	}

	private void Update()
	{
		Vector2 vector = new Vector2(Screen.width, Screen.height);
		if (lastScreenSize != vector)
		{
			lastScreenSize = vector;
			if (overlayGO.activeSelf)
			{
				UpdateGraphics();
			}
		}
	}

	public void UpdateGraphics()
	{
		UpdateHandle();
		if (rectTransform.sizeDelta != buttonRectTransform.sizeDelta && buttonRectTransform.sizeDelta == comboButtonRectTransform.sizeDelta)
		{
			buttonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, rectTransform.sizeDelta.x);
			buttonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, rectTransform.sizeDelta.y);
			comboButtonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, rectTransform.sizeDelta.x);
			comboButtonRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, rectTransform.sizeDelta.y);
			comboArrowRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, rectTransform.sizeDelta.y);
			comboImageRectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, comboImageRectTransform.rect.height);
			comboTextRectTransform.offsetMax = new Vector2(4f, 0f);
			if (!(overlayGO == null))
			{
				scrollPanelRectTransfrom.SetParent(base.transform, worldPositionStays: true);
				scrollPanelRectTransfrom.anchoredPosition = new Vector2(0f, (0f - rectTransform.sizeDelta.y) * (float)_itemsToDisplay);
				RectTransform component = overlayGO.GetComponent<RectTransform>();
				component.SetParent(canvasTransform, worldPositionStays: false);
				component.offsetMin = Vector2.zero;
				component.offsetMax = Vector2.zero;
				scrollPanelRectTransfrom.SetParent(component, worldPositionStays: true);
				scrollPanelRectTransfrom.GetComponent<ScrollRect>().scrollSensitivity = comboButtonRectTransform.sizeDelta.y;
				scrollPanelRectTransfrom.sizeDelta = new Vector2(0f, 0f);
				UpdateComboBoxImage(comboButtonRectTransform, Items[SelectedIndex].Image != null);
				Refresh();
			}
		}
		else if (!(overlayGO == null))
		{
			scrollPanelRectTransfrom.SetParent(base.transform, worldPositionStays: false);
			float size = comboButtonRectTransform.sizeDelta.y * (float)Mathf.Min(ItemsToDisplay, Items.Length - (HideFirstItem ? 1 : 0));
			scrollPanelRectTransfrom.anchoredPosition = new Vector2(0f, (0f - rectTransform.sizeDelta.y) * (float)_itemsToDisplay);
			scrollPanelRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, comboButtonRectTransform.sizeDelta.x);
			scrollPanelRectTransfrom.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, size);
			scrollPanelRectTransfrom.SetParent(overlayGO.GetComponent<RectTransform>(), worldPositionStays: true);
			scrollPanelRectTransfrom.sizeDelta = new Vector2(0f, 0f);
		}
	}

	private void UpdateHandle()
	{
		if (!(overlayGO == null))
		{
			float num = ((Items.Length - (HideFirstItem ? 1 : 0) > ItemsToDisplay) ? _scrollbarWidth : 0f);
			handleRectTransfrom.offsetMin = (0f - num) / 2f * Vector2.one;
			handleRectTransfrom.offsetMax = num / 2f * Vector2.one;
		}
	}
}
