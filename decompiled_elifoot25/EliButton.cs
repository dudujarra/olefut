using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class EliButton : EliComponent
{
	public GameObject buttonNotificationPrefab;

	private Button button;

	private GameObject instantiatedNotificationPrefab;

	private void Awake()
	{
		button = GetComponent<Button>();
	}

	private void Start()
	{
		ReloadElementConfig();
	}

	public override void ReloadElementConfig()
	{
		if (button == null)
		{
			Awake();
		}
		button.onClick.RemoveListener(PlayButtonClick);
		button.onClick.AddListener(PlayButtonClick);
	}

	private void PlayButtonClick()
	{
		SoundManager.instance.PlaySound(DataManager.instance.soundDefaultClick);
	}

	public void ShowButtonNotification(string number, int size = 50)
	{
		instantiatedNotificationPrefab = Object.Instantiate(buttonNotificationPrefab, base.transform);
		instantiatedNotificationPrefab.GetComponent<RectTransform>().sizeDelta = new Vector2(size, size);
		Util.GetGameObjectText(instantiatedNotificationPrefab, "Text").text = number;
	}

	public void HideButtonNotification()
	{
		if (instantiatedNotificationPrefab != null)
		{
			Object.Destroy(instantiatedNotificationPrefab);
		}
	}
}
