using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class EliView : MonoBehaviour
{
	public enum EliOrientation
	{
		Portrait,
		PortraitTablet,
		Landscape
	}

	[SerializeField]
	protected GameEvent bannerAdToggle;

	public bool isFullScreenInLandscape;

	public bool ignoreSafeArea;

	public static EliOrientation currentOrientation;

	public static bool onAppEntryOrientationDefined;

	private readonly int MAX_WIDTH_IN_LANDSCAPE = 1536;

	[HideInInspector]
	public Rect simulatedSafeArea;

	private RectTransform background;

	private RectTransform parent;

	[HideInInspector]
	public bool firstTimeRefreshView = true;

	private RectTransform viewRectTransform;

	internal RectTransform popUpRectTransform;

	private float bannerHeight = 125f;

	private Vector2 originalOffsetMin;

	private Dictionary<string, List<UpdatedEliLabel>> textLabelIDsByLabelID = new Dictionary<string, List<UpdatedEliLabel>>();

	private Vector3 startScale;

	private Vector3 oversizeScale;

	private float animationDuration;

	private float elapsedTime;

	internal GameEvent BannerAdToggle => bannerAdToggle;

	private void Awake()
	{
		if (!onAppEntryOrientationDefined)
		{
			currentOrientation = GetCurrentOrientation();
			onAppEntryOrientationDefined = true;
		}
		GetBackgroundImage();
		CheckSafeArea();
		if (InAppPurchases.instance != null)
		{
			InAppPurchases instance = InAppPurchases.instance;
			instance.update_changes = (Action<string>)Delegate.Combine(instance.update_changes, new Action<string>(OnInAppUpdateChanges));
		}
		viewRectTransform = base.transform.Find("View")?.GetComponent<RectTransform>();
		popUpRectTransform = base.transform.Find("PopUp")?.GetComponent<RectTransform>();
		if (viewRectTransform == null)
		{
			return;
		}
		originalOffsetMin = viewRectTransform.offsetMin;
		if (bannerAdToggle == null)
		{
			bannerAdToggle = Resources.Load<GameEvent>("ScriptableObjects/Events/OnBannerAdToggle");
			if (bannerAdToggle == null)
			{
				Debug.LogError("BannerAdToggle not set in " + base.gameObject.name, base.gameObject);
				return;
			}
		}
		bannerAdToggle.Subscribe<bool>(AdjustForBanner);
	}

	private void OnValidate()
	{
		if (bannerAdToggle == null)
		{
			bannerAdToggle = Resources.Load<GameEvent>("ScriptableObjects/Events/OnBannerAdToggle");
			if (bannerAdToggle == null)
			{
				Debug.LogError("BannerAdToggle not set in " + base.gameObject.name, base.gameObject);
			}
		}
		else
		{
			bannerAdToggle.Subscribe<bool>(AdjustForBanner);
		}
	}

	internal void ConnectUpdatedElilabel(UpdatedEliLabel eliLabel)
	{
		if (!(eliLabel == null) && !string.IsNullOrEmpty(eliLabel.labelID) && !(eliLabel.Label == null))
		{
			if (!textLabelIDsByLabelID.ContainsKey(eliLabel.labelID))
			{
				textLabelIDsByLabelID[eliLabel.labelID] = new List<UpdatedEliLabel>();
			}
			if (!textLabelIDsByLabelID[eliLabel.labelID].Contains(eliLabel))
			{
				textLabelIDsByLabelID[eliLabel.labelID].Add(eliLabel);
			}
			float smallestFontSizeForLabelStyle = GetSmallestFontSizeForLabelStyle(eliLabel.labelID);
			UpdateFontSizesForLabelStyle(eliLabel.labelID, smallestFontSizeForLabelStyle);
		}
	}

	private void UpdateFontSizesForLabelStyle(string labelID, float minFont)
	{
		if (!textLabelIDsByLabelID.ContainsKey(labelID))
		{
			return;
		}
		foreach (UpdatedEliLabel item in textLabelIDsByLabelID[labelID])
		{
			if (item.Label != null && item.Label.fontSize != minFont)
			{
				item.Label.fontSize = minFont;
			}
		}
	}

	private float GetSmallestFontSizeForLabelStyle(string labelID)
	{
		if (!textLabelIDsByLabelID.ContainsKey(labelID))
		{
			return float.MaxValue;
		}
		float num = float.MaxValue;
		foreach (UpdatedEliLabel item in textLabelIDsByLabelID[labelID])
		{
			if (!(item.Label == null))
			{
				item.Label.enableAutoSizing = true;
				item.Label.ForceMeshUpdate();
				float fontSize = item.Label.fontSize;
				if (fontSize > 0f && fontSize < num)
				{
					num = fontSize;
				}
				item.Label.enableAutoSizing = false;
			}
		}
		return num;
	}

	private void AdjustForBanner(bool adShowing)
	{
		if (this == null)
		{
			return;
		}
		if (viewRectTransform == null)
		{
			viewRectTransform = base.transform.Find("View")?.GetComponent<RectTransform>();
			if (viewRectTransform == null)
			{
				return;
			}
		}
		if (adShowing)
		{
			viewRectTransform.offsetMin = new Vector2(originalOffsetMin.x, bannerHeight);
		}
		else
		{
			viewRectTransform.offsetMin = originalOffsetMin;
		}
	}

	private void Start()
	{
		if ((bool)bannerAdToggle && bannerAdToggle.TryGetLastValue<bool>(out var lastValue))
		{
			AdjustForBanner(lastValue);
		}
	}

	internal void PlayOpenAnimation()
	{
		StartCoroutine(OpenAnimationCoroutine());
	}

	private IEnumerator OpenAnimationCoroutine()
	{
		startScale = popUpRectTransform.localScale;
		oversizeScale = startScale * 1.2f;
		float duration = animationDuration * 0.9f;
		yield return AnimateScale(popUpRectTransform, Vector3.zero, oversizeScale, duration);
		float duration2 = animationDuration * 0.1f;
		yield return AnimateScale(popUpRectTransform, oversizeScale, startScale, duration2);
		popUpRectTransform.localScale = startScale;
	}

	internal void PlayCloseAnimation(bool destroyGameObject)
	{
		StartCoroutine(CloseAnimationCoroutine(destroyGameObject));
	}

	internal IEnumerator CloseAnimationCoroutine(bool destroyGameObject)
	{
		float duration = animationDuration * 0.1f;
		yield return AnimateScale(popUpRectTransform, startScale, oversizeScale, duration);
		float duration2 = animationDuration * 0.9f;
		yield return AnimateScale(popUpRectTransform, oversizeScale, Vector3.zero, duration2);
		popUpRectTransform.localScale = Vector3.zero;
		if (destroyGameObject)
		{
			UnityEngine.Object.Destroy(base.gameObject);
		}
	}

	private IEnumerator AnimateScale(RectTransform target, Vector3 fromScale, Vector3 toScale, float duration)
	{
		elapsedTime = 0f;
		while (elapsedTime < duration)
		{
			elapsedTime += Time.deltaTime;
			float t = Mathf.Clamp01(elapsedTime / duration);
			target.localScale = Vector3.Lerp(fromScale, toScale, t);
			yield return null;
		}
	}

	private EliOrientation GetCurrentOrientation()
	{
		if (Screen.height >= Screen.width)
		{
			if (Screen.width < 1500)
			{
				return EliOrientation.Portrait;
			}
			return EliOrientation.PortraitTablet;
		}
		if (Screen.height < Screen.width)
		{
			return EliOrientation.Landscape;
		}
		return EliOrientation.Portrait;
	}

	public void GetBackgroundImage()
	{
		if (!ignoreSafeArea)
		{
			Transform transform = base.transform.Find("Background");
			Transform transform2 = base.transform.Find("Obscure");
			if (transform != null)
			{
				background = transform.GetComponent<RectTransform>();
			}
			else if (transform2 != null)
			{
				background = transform2.GetComponent<RectTransform>();
			}
			Transform transform3 = base.transform.parent;
			if (transform3 != null)
			{
				parent = transform3.GetComponent<RectTransform>();
			}
		}
	}

	internal virtual void OnRectTransformDimensionsChange()
	{
		currentOrientation = GetCurrentOrientation();
		CheckSafeArea();
		ReloadEliScrollbarsConfig();
		if ((bool)bannerAdToggle && bannerAdToggle.TryGetLastValue<bool>(out var lastValue))
		{
			AdjustForBanner(lastValue);
		}
	}

	public void CheckSafeArea()
	{
		if (!ignoreSafeArea)
		{
			Rect safeArea = Screen.safeArea;
			Vector2 position = safeArea.position;
			Vector2 vector = safeArea.position + safeArea.size;
			ChangeAnchors(GetComponent<RectTransform>(), position.x / (float)Screen.width, vector.x / (float)Screen.width, position.y / (float)Screen.height, vector.y / (float)Screen.height);
			if (background != null && parent != null)
			{
				ChangeAnchors(background, 0.5f, 0.5f, 0.5f, 0.5f);
				background.position = parent.position;
				background.sizeDelta = parent.sizeDelta;
			}
		}
	}

	public virtual void Update()
	{
	}

	private void ReloadEliScrollbarsConfig()
	{
		EliScrollbar[] componentsInChildren = GetComponentsInChildren<EliScrollbar>(includeInactive: true);
		for (int i = 0; i < componentsInChildren.Length; i++)
		{
			componentsInChildren[i].ReloadElementConfig();
		}
	}

	private void ReloadTextLabelIDsConfig()
	{
		TextLabelID[] componentsInChildren = GetComponentsInChildren<TextLabelID>(includeInactive: true);
		for (int i = 0; i < componentsInChildren.Length; i++)
		{
			componentsInChildren[i].ReloadElementConfig();
		}
	}

	public virtual void OnInAppUpdateChanges(string callbackMsg)
	{
	}

	public virtual void ResetView()
	{
	}

	public IEnumerator GoToPositionInScroll(int first, int last, CanvasGroup canvasGroup, RectTransform viewport, RectTransform content, GameObject prefab, int difbetweenprefabs = 0)
	{
		yield return StartCoroutine(CheckBeforeFirstTime(canvasGroup));
		GoToPosition(first, last, viewport, content, prefab, difbetweenprefabs);
		CheckAfterFirstTime(canvasGroup);
	}

	public IEnumerator GoToPositionInScrollWithNoAlphaDisabling(int first, int last, CanvasGroup canvasGroup, RectTransform viewport, RectTransform content, GameObject prefab, int difbetweenprefabs = 0)
	{
		yield return StartCoroutine(CheckBeforeFirstTime(canvasGroup, disableAlpha: false));
		GoToPosition(first, last, viewport, content, prefab, difbetweenprefabs);
		CheckAfterFirstTime(canvasGroup);
	}

	private IEnumerator CheckBeforeFirstTime(CanvasGroup canvasGroup, bool disableAlpha = true)
	{
		if (firstTimeRefreshView)
		{
			if (disableAlpha)
			{
				canvasGroup.alpha = 0f;
			}
			yield return new WaitForEndOfFrame();
		}
	}

	private void GoToPosition(int first, int last, RectTransform viewport, RectTransform content, GameObject prefab, int difbetweenprefabs = 0)
	{
		float num = prefab.GetComponent<RectTransform>().sizeDelta.y + (float)difbetweenprefabs;
		float num2 = viewport.rect.height / num;
		if (first != 0 && ((float)first > num2 || (float)last > num2))
		{
			float num3 = ((last == 0) ? (num * ((float)(first + 1) - num2)) : (num * ((float)(last + 1) - num2)));
			if (num3 > content.rect.height - viewport.rect.height)
			{
				num3 = content.rect.height - viewport.rect.height;
			}
			else if (num3 < 0f)
			{
				num3 = 0f;
			}
			content.anchoredPosition = new Vector2(0f, num3);
		}
		else
		{
			content.anchoredPosition = Vector2.zero;
		}
	}

	private void CheckAfterFirstTime(CanvasGroup canvasGroup)
	{
		if (firstTimeRefreshView)
		{
			canvasGroup.alpha = 1f;
			firstTimeRefreshView = false;
		}
	}

	public void ForceOrientationChange(ScreenOrientation orientation)
	{
	}

	private EliOrientation GetEliOrientation(ScreenOrientation orientation)
	{
		switch (orientation)
		{
		case ScreenOrientation.Portrait:
		case ScreenOrientation.PortraitUpsideDown:
			if (Screen.width < 1500)
			{
				return EliOrientation.Portrait;
			}
			return EliOrientation.PortraitTablet;
		case ScreenOrientation.LandscapeLeft:
		case ScreenOrientation.LandscapeRight:
			return EliOrientation.Landscape;
		default:
			return EliOrientation.Portrait;
		}
	}

	public void ForceLanguageChange()
	{
		ResetView();
		ReloadTextLabelIDsConfig();
	}

	protected void ChangeAnchors(RectTransform rect, float X_min, float X_max, float Y_min, float Y_max)
	{
		rect.anchorMin = new Vector2(X_min, Y_min);
		rect.anchorMax = new Vector2(X_max, Y_max);
		rect.sizeDelta = new Vector2(0f, 0f);
	}

	protected GameObject GetFitPrefab(GameObject portraitPrefab, GameObject portraitTabletPrefab, GameObject landscapePrefab)
	{
		if (currentOrientation == EliOrientation.PortraitTablet)
		{
			return portraitTabletPrefab;
		}
		if (currentOrientation == EliOrientation.Landscape)
		{
			return landscapePrefab;
		}
		return portraitPrefab;
	}

	protected void DarkenListBackgroundObj(GameObject obj, ref bool darkenThis, ref bool darkenNext)
	{
		darkenThis = darkenNext;
		darkenNext = !darkenNext;
		DarkenListBackgroundObj(obj, darkenThis);
	}

	protected void DarkenListBackgroundObj(Transform transform, ref bool darkenThis, ref bool darkenNext)
	{
		darkenThis = darkenNext;
		darkenNext = !darkenNext;
		DarkenListBackgroundObj(transform, darkenThis);
	}

	protected void DarkenListBackgroundObj(GameObject obj, bool darken)
	{
		Transform meBackground = obj.transform.Find("DisplayBackground");
		DarkenListBackgroundObj(meBackground, darken);
	}

	protected void DarkenListBackgroundObj(Transform meBackground, bool darken)
	{
		if (meBackground != null)
		{
			Image component = meBackground.GetComponent<Image>();
			if (component != null)
			{
				Color color = (darken ? ConfigManager.instance.COLOR_OBSCURE_LIST_DARK : ConfigManager.instance.COLOR_OBSCURE_LIST_LIGHT);
				component.color = color;
			}
		}
	}

	public virtual void Close()
	{
		UnityEngine.Object.Destroy(base.gameObject);
	}

	private void OnDestroy()
	{
		if (InAppPurchases.instance != null)
		{
			InAppPurchases instance = InAppPurchases.instance;
			instance.update_changes = (Action<string>)Delegate.Remove(instance.update_changes, new Action<string>(OnInAppUpdateChanges));
		}
		if (bannerAdToggle != null)
		{
			bannerAdToggle.Unsubscribe<bool>(AdjustForBanner);
		}
	}
}
