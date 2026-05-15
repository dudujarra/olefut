using System;
using UnityEngine.UI;

public class DialogInputfieldView : EliView
{
	public Text header;

	public Text title;

	public Text placeholder;

	public InputField inputfield;

	public Button noButton;

	public Button yesButton;

	private Action<string> yesButtonAction;

	public void Initialize(string header, string title, string placeholder, Action<string> onYesPressed, Action onNoPressed)
	{
		this.header.text = LanguageController.instance.Get_Translation(header);
		this.title.text = LanguageController.instance.Get_Translation(title);
		this.placeholder.text = LanguageController.instance.Get_Translation(placeholder);
		onNoPressed = (Action)Delegate.Combine(onNoPressed, new Action(Close));
		noButton.onClick.AddListener(delegate
		{
			onNoPressed();
		});
		yesButtonAction = onYesPressed;
		ResetView();
	}

	public void YesButton()
	{
		if (string.IsNullOrWhiteSpace(inputfield.text))
		{
			ScreenController.instance.ShowDialogPopUp("GEN_ERROR", "RANKING_ERROR_INVALID_NAME", null);
		}
		else
		{
			yesButtonAction(inputfield.text);
		}
		Close();
	}
}
