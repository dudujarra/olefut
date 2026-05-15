using System;
using UnityEngine;
using UnityEngine.UI;

public class TranslateText : MonoBehaviour
{
	[Serializable]
	public struct Texts
	{
		public Text Text;

		public string Translation;
	}

	public Texts[] AllTexts;

	private void Awake()
	{
		Debug.LogWarning("REMOVE THIS SCRIPT");
		for (int i = 0; i < AllTexts.Length; i++)
		{
			if (AllTexts[i].Translation == "")
			{
				AllTexts[i].Text.text = LanguageController.instance.Get_Translation(AllTexts[i].Text.text);
			}
			else
			{
				AllTexts[i].Text.text = LanguageController.instance.Get_Translation(AllTexts[i].Translation);
			}
		}
	}
}
