using System;
using UnityEngine;
using UnityEngine.UI;

public class AboutView : EliView
{
	public Text versionText;

	public Text lowerText;

	public Text titleText;

	private bool isPressing;

	private float pressedTimer;

	public void Initialize()
	{
		ResetView();
	}

	public override void ResetView()
	{
		base.ResetView();
		if (LanguageController.instance != null)
		{
			titleText.text = DataManager.instance.applicationTitle;
			lowerText.text = LanguageController.instance.Get_Translation("ABOUT_LOWERTEXT", DateTime.Now.Year.ToString());
			string gameVersion = DataManager.instance.GetGameVersion();
			versionText.text = LanguageController.instance.Get_Translation("ABOUT_VERSION", gameVersion);
		}
	}

	public void BackPressed()
	{
		Close();
	}

	public void OfficialSitePressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("efm-spl"));
	}

	public void CommentsPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("efm-full"));
	}

	public void PrivacyPolicyPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("efm-ppol"));
	}

	public void EulaPressed()
	{
		StartCoroutine(DataManager.instance.OpenPageAppl("efm-eula"));
	}

	public void IconPressing()
	{
		isPressing = true;
		pressedTimer = 0f;
	}

	public void IconExit()
	{
		isPressing = false;
	}

	public void IconPressed()
	{
		IconExit();
		if (!(pressedTimer >= 1f))
		{
			ListOfParameters listOfParameters = new ListOfParameters();
			SystemInfoHelper.AppendToParameters(listOfParameters);
			ScreenController.instance.ShowParameterEditor("SYSTEM_INFO", listOfParameters, null, showLoadingView: false, ParametersView.GridViewMode.Enlarged);
		}
	}

	private void IconLongPress()
	{
		if (!ElifootOptions.wonPromoCoins)
		{
			ElifootOptions.totalCoins += 200;
			ElifootOptions.wonPromoCoins = true;
			ElifootOptions.SaveOptions();
			string description = LanguageController.instance.Get_Translation("ID:PRIZE_COINS_WON", 200);
			ScreenController.instance.ShowDialogPopUp("ID:PRIZE_CONGRATS", description, null);
		}
		else
		{
			ScreenController.instance.ShowDialogPopUp("ID:PRIZE_SORRY", "ID:PRIZE_COINS_NOT_AVAILABLE", null);
		}
	}

	public override void Update()
	{
		if (isPressing)
		{
			pressedTimer += Time.deltaTime;
			if (pressedTimer >= 3f)
			{
				isPressing = false;
				IconLongPress();
			}
		}
		base.Update();
	}
}
