using System;
using UnityEngine;
using UnityEngine.UI;

public class DialogSelectionView : EliView
{
	[Serializable]
	public struct Option
	{
		public GameObject obj;

		public Toggle toggle;

		public Text description;
	}

	public Text header;

	public Option[] options;

	public Button cancelButton;

	private Action<int> okButtonAction;

	[Header("References")]
	[SerializeField]
	private ContentSizeFitter popUpContentSizeFitter;

	public void Initialize(string header, string[] optionDescriptions, Action<int> onOkPressed, bool noCancelButton = false, Action onCancelPressed = null)
	{
		this.header.text = LanguageController.instance.Get_Translation(header);
		for (int i = 0; i < options.Length; i++)
		{
			options[i].obj.SetActive(i < optionDescriptions.Length);
			options[i].toggle.isOn = false;
			options[i].description.text = ((i < optionDescriptions.Length) ? optionDescriptions[i] : "");
		}
		if (noCancelButton)
		{
			cancelButton.gameObject.SetActive(value: false);
		}
		else
		{
			cancelButton.gameObject.SetActive(value: true);
			onCancelPressed = (Action)Delegate.Combine(onCancelPressed, new Action(Close));
			cancelButton.onClick.AddListener(delegate
			{
				onCancelPressed();
			});
		}
		okButtonAction = onOkPressed;
		ResetView();
	}

	public void OkButton()
	{
		int num = Array.FindIndex(options, (Option x) => x.toggle.isOn);
		if (num != -1)
		{
			okButtonAction(num);
			Close();
		}
		else
		{
			ScreenController.instance.ShowInfoPopUp("GEN_SELECT_ONE_OPTION", null);
		}
	}

	internal override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		popUpContentSizeFitter.horizontalFit = ((EliView.currentOrientation != EliOrientation.Portrait) ? ContentSizeFitter.FitMode.PreferredSize : ContentSizeFitter.FitMode.Unconstrained);
		popUpRectTransform.offsetMin = new Vector2(0f, 0f);
		popUpRectTransform.offsetMax = new Vector2(0f, 0f);
	}
}
