using System;
using UnityEngine;
using UnityEngine.UI;

public class DialogPopUpView : EliView
{
	public GameObject titleObj;

	public Text titleText;

	public Text description;

	public Text checkBoxText;

	public Button yesButton;

	public Button noButton;

	public Button okButton;

	public Button cancelButton;

	public GameObject moreInfoButton;

	public Toggle checkBoxButton;

	private Action yesAction;

	private Action noAction;

	private Action okAction;

	private Action cancelAction;

	private Action moreInfoAction;

	private BooleanObj cbChecked;

	private bool isChecked;

	public bool IsChecked
	{
		get
		{
			return checkBoxButton.isOn;
		}
		set
		{
			checkBoxButton.isOn = value;
		}
	}

	public void Initialize(string title, string description, Action yesAction, Action noAction)
	{
		if (titleText != null)
		{
			if (string.IsNullOrEmpty(title))
			{
				titleObj.SetActive(value: false);
			}
			else
			{
				titleText.text = LanguageController.instance.Get_Translation(title);
			}
		}
		this.description.text = LanguageController.instance.Get_Translation(description);
		yesButton.gameObject.SetActive(value: true);
		noButton.gameObject.SetActive(value: true);
		okButton.gameObject.SetActive(value: false);
		if (moreInfoButton != null)
		{
			moreInfoButton.gameObject.SetActive(value: false);
		}
		this.yesAction = yesAction;
		this.noAction = noAction;
		PlayOpenAnimation();
	}

	public void Initialize(string title, string description, Action okAction)
	{
		if (titleText != null)
		{
			if (string.IsNullOrEmpty(title))
			{
				titleObj.SetActive(value: false);
			}
			else
			{
				titleText.text = LanguageController.instance.Get_Translation(title);
			}
		}
		this.description.text = LanguageController.instance.Get_Translation(description);
		yesButton.gameObject.SetActive(value: false);
		noButton.gameObject.SetActive(value: false);
		if (moreInfoButton != null)
		{
			moreInfoButton.gameObject.SetActive(value: false);
		}
		okButton.gameObject.SetActive(value: true);
		this.okAction = okAction;
		this.okAction = (Action)Delegate.Combine(this.okAction, new Action(Close));
		PlayOpenAnimation();
	}

	public void Initialize(string title, string description, Action yesAction, Action noAction, Action cancelAction)
	{
		if (titleText != null)
		{
			if (string.IsNullOrEmpty(title))
			{
				if (titleObj != null)
				{
					titleObj.SetActive(value: false);
				}
			}
			else
			{
				titleText.text = title;
			}
		}
		this.description.text = description;
		this.yesAction = yesAction;
		this.noAction = noAction;
		this.cancelAction = cancelAction;
		if (cancelButton != null)
		{
			cancelButton.onClick.AddListener(delegate
			{
				CancelPressed();
			});
		}
		if (moreInfoButton != null)
		{
			moreInfoButton.gameObject.SetActive(value: false);
		}
		PlayOpenAnimation();
	}

	public void InitializeWithMoreInfo(string title, string description, Action yesAction, Action moreInfoAction, Action noAction)
	{
		ResetView();
		Update();
		if (titleText != null)
		{
			if (string.IsNullOrEmpty(title))
			{
				if (titleObj != null)
				{
					titleObj.SetActive(value: false);
				}
			}
			else
			{
				titleText.text = title;
			}
		}
		this.description.text = description;
		this.yesAction = yesAction;
		this.noAction = noAction;
		this.moreInfoAction = moreInfoAction;
		moreInfoButton.SetActive(value: true);
		cancelButton.gameObject.SetActive(value: false);
		PlayOpenAnimation();
	}

	public void Initialize(string title, string description, string checkBoxText, Action yesAction, Action noAction, BooleanObj isChecked)
	{
		yesButton.gameObject.SetActive(value: true);
		noButton.gameObject.SetActive(value: true);
		okButton.gameObject.SetActive(value: false);
		if (moreInfoButton != null)
		{
			moreInfoButton.gameObject.SetActive(value: false);
		}
		if (titleText != null)
		{
			if (string.IsNullOrEmpty(title))
			{
				titleObj.SetActive(value: false);
			}
			else
			{
				titleText.text = title;
			}
		}
		this.description.text = description;
		this.checkBoxText.text = checkBoxText;
		IsChecked = isChecked.Value;
		this.yesAction = yesAction;
		this.noAction = noAction;
		cbChecked = isChecked;
		PlayOpenAnimation();
	}

	public void Initialize(string title, string description, string checkBoxText, Action okAction, BooleanObj isChecked)
	{
		yesButton.gameObject.SetActive(value: false);
		noButton.gameObject.SetActive(value: false);
		if (moreInfoButton != null)
		{
			moreInfoButton.gameObject.SetActive(value: false);
		}
		okButton.gameObject.SetActive(value: true);
		if (titleText != null)
		{
			if (string.IsNullOrEmpty(title))
			{
				titleObj.SetActive(value: false);
			}
			else
			{
				titleText.text = title;
			}
		}
		this.description.text = description;
		this.checkBoxText.text = checkBoxText;
		IsChecked = isChecked.Value;
		this.okAction = okAction;
		cbChecked = isChecked;
		PlayOpenAnimation();
	}

	public void YesPressed()
	{
		ReadCheckBox();
		yesAction?.Invoke();
		Exit();
	}

	public void NoPressed()
	{
		ReadCheckBox();
		noAction?.Invoke();
		Exit();
	}

	public void OkPressed()
	{
		ReadCheckBox();
		if (okAction != null)
		{
			okAction();
		}
	}

	public void CancelPressed()
	{
		cancelAction?.Invoke();
		Exit();
	}

	public void MoreInfoPressed()
	{
		moreInfoAction?.Invoke();
	}

	public void CheckBoxPressed()
	{
		_ = checkBoxButton.isOn;
	}

	private void ReadCheckBox()
	{
		if (checkBoxButton != null)
		{
			cbChecked.Value = checkBoxButton.isOn;
		}
	}

	private void Exit()
	{
		PlayCloseAnimation(destroyGameObject: true);
	}
}
