using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Animation))]
public class ToastMessage : MonoBehaviour
{
	public Text messageText;

	public LayoutElement maxTextLayout;

	private readonly int MAX_HORIZONTAL_CHARACTERS = 25;

	public static ToastMessage singleton;

	private Animation anim;

	private void Awake()
	{
		anim = GetComponent<Animation>();
		if (singleton != null && singleton.gameObject != null)
		{
			singleton.Hide();
		}
		singleton = this;
	}

	public void Initialize(string message, float positionYfromBottom = 240f, float timetoHide = 4f)
	{
		messageText.text = message;
		maxTextLayout.enabled = message.Length > MAX_HORIZONTAL_CHARACTERS;
		GetComponent<RectTransform>().anchoredPosition = new Vector2(0f, positionYfromBottom);
		Invoke("Hide", timetoHide);
	}

	private void Update()
	{
		if (Input.GetMouseButtonDown(0))
		{
			Hide();
			base.enabled = false;
		}
	}

	public void Hide()
	{
		if (!anim.IsPlaying("Hide"))
		{
			anim.Play("Hide");
			Object.Destroy(base.gameObject, 0.5f);
		}
	}
}
