using System;
using System.Collections;
using System.Diagnostics;
using UnityEngine;
using UnityEngine.UI;

public class SplashscreenManager : MonoBehaviour
{
	public Sprite[] splashcreenList;

	public Image currentSplashscreen;

	public float splashFadeTime = 1.5f;

	private void Start()
	{
		string languagesArray = GetLanguagesArray();
		if (string.IsNullOrEmpty(LanguageController.activeLanguage) || languagesArray != ElifootOptions.savedLanguages)
		{
			StartCoroutine(CallLanguageView(languagesArray));
		}
		else
		{
			StartCoroutine(Start2());
		}
	}

	private string GetLanguagesArray()
	{
		string text = "";
		foreach (string item in LanguageController.instance.languagesSupported)
		{
			text = text + item + ";";
		}
		return text;
	}

	private IEnumerator CallLanguageView(string languagesArray)
	{
		string title = LanguageController.instance.Get_Translation("OPTIONS_SELECTLANGUAGETITLE");
		yield return StartCoroutine(ScreenController.instance.ISelectLanguage(title, SetLanguage, LanguageController.instance.languagesSupported.ToArray()));
		ElifootOptions.savedLanguages = languagesArray;
		ElifootOptions.SaveOptions();
	}

	private IEnumerator Start2()
	{
		Stopwatch sw = new Stopwatch();
		sw.Start();
		while (Application.isShowingSplashScreen && !(sw.Elapsed > TimeSpan.FromSeconds(6.0)))
		{
			yield return 0;
		}
		while (LanguageController.activeLanguage == null)
		{
			yield return 0;
		}
		yield return StartCoroutine(PlaySplashscreens());
		ScreenController.instance.ShowMainMenu();
	}

	private void SetLanguage(string langCode)
	{
		LanguageController.instance.SetLanguage(langCode);
		Util.UpdateLanguage();
		StartCoroutine(Start2());
	}

	private IEnumerator PlaySplashscreens()
	{
		ScreenController.instance.SetAlpha(1f);
		currentSplashscreen.color = Color.white;
		for (int i = 0; i < splashcreenList.Length; i++)
		{
			currentSplashscreen.sprite = splashcreenList[i];
			yield return StartCoroutine(ScreenController.instance.FadeBlack(0f));
			yield return new WaitForSeconds(splashFadeTime);
			yield return StartCoroutine(ScreenController.instance.FadeBlack(1f));
		}
		currentSplashscreen.color = Color.clear;
	}
}
