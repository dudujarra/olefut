using UnityEngine;

public class BannerAdSpacer : MonoBehaviour
{
	[Header("Settings")]
	[SerializeField]
	private float bannerHeight = 100f;

	[Header("Events")]
	[SerializeField]
	private GameEvent bannerAdToggle;

	private RectTransform panelRect;

	private Vector2 originalOffsetMin;

	private void Awake()
	{
		panelRect = GetComponent<RectTransform>();
		originalOffsetMin = panelRect.offsetMin;
		bannerAdToggle.Subscribe<bool>(AdjustForBanner);
	}

	private void AdjustForBanner(bool adShowing)
	{
		if (adShowing)
		{
			panelRect.offsetMin = new Vector2(originalOffsetMin.x, originalOffsetMin.y + bannerHeight);
		}
		else
		{
			panelRect.offsetMin = originalOffsetMin;
		}
	}

	private void OnDestroy()
	{
		if (bannerAdToggle != null)
		{
			bannerAdToggle.Unsubscribe<bool>(AdjustForBanner);
		}
	}
}
