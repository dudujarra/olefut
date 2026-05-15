using System;
using UnityEngine.UI;

public class ScrollableTextView : EliView
{
	public Text title;

	public Text description;

	public Button backButton;

	public Button yesButton;

	public Button noButton;

	public void Initialize(string _title, string _description)
	{
		title.text = _title;
		description.text = _description;
		backButton.gameObject.SetActive(value: true);
		yesButton.gameObject.SetActive(value: false);
		noButton.gameObject.SetActive(value: false);
	}

	public void Initialize(string _title, string _description, Action yesAction, Action noAction)
	{
		title.text = _title;
		description.text = _description;
		backButton.gameObject.SetActive(value: false);
		yesButton.gameObject.SetActive(value: true);
		if (yesAction != null)
		{
			yesButton.onClick.AddListener(yesAction.Invoke);
		}
		noButton.gameObject.SetActive(value: true);
		if (noAction != null)
		{
			noButton.onClick.AddListener(noAction.Invoke);
		}
	}
}
