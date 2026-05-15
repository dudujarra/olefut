using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

public class LanguageController : MonoBehaviour
{
	public static string activeLanguage = "";

	public List<string> languagesSupported = new List<string>();

	public List<string> languagesDesc = new List<string>();

	public TextAsset translationMainFile;

	public TextAsset translationTempFile;

	private List<LocalizationObject> translation_list = new List<LocalizationObject>();

	public static LanguageController instance;

	private void Awake()
	{
		instance = this;
	}

	public void StartController()
	{
		ReadActiveAndSupportedLanguages();
		Fill_Translation();
	}

	private string ReadActiveAndSupportedLanguages()
	{
		ManageActiveLanguage(Util.ManageOption.ReadFromCache);
		if (string.IsNullOrEmpty(activeLanguage))
		{
			SetActiveAsDefaultLanguage();
		}
		int i = 0;
		string text = null;
		languagesSupported.Clear();
		languagesDesc.Clear();
		try
		{
			using (StringReader stringReader = new StringReader(translationMainFile.text))
			{
				string text2 = stringReader.ReadLine();
				string text3 = stringReader.ReadLine();
				if (text2 != null && text3 != null)
				{
					string[] array = text2.Split(';');
					string[] array2 = text3.Split(';');
					for (i = 1; i < array.Length; i++)
					{
						languagesSupported.Add(array[i].Trim());
						languagesDesc.Add(array2[i].Trim());
						if (array[i].Trim() == activeLanguage)
						{
							text = array[i].Trim();
						}
					}
				}
			}
			if (text == null)
			{
				SetActiveAsDefaultLanguage();
				text = ReadActiveAndSupportedLanguages();
			}
		}
		catch (Exception ex)
		{
			Debug.Log($"ReadSupportedLanguages() Exception. Line={i + 1}\n{ex.Message}\n{ex.StackTrace}");
		}
		return text;
	}

	private void ManageActiveLanguage(Util.ManageOption mode)
	{
		ListOfParameters listOfParameters = null;
		ManageActiveLanguage(mode, ref listOfParameters);
	}

	public void ManageActiveLanguage(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		activeLanguage = (string)Util.ManageOneOption(mode, "activeLanguage", null, null, null, activeLanguage, activeLanguage, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
	}

	private void SetActiveAsDefaultLanguage()
	{
		switch (Application.systemLanguage)
		{
		case SystemLanguage.English:
			activeLanguage = "EN";
			break;
		case SystemLanguage.Spanish:
			activeLanguage = "ES";
			break;
		case SystemLanguage.Portuguese:
			activeLanguage = "PT-BR";
			break;
		default:
			activeLanguage = "EN";
			break;
		}
		ManageActiveLanguage(Util.ManageOption.WriteToCache);
	}

	public void Fill_Translation()
	{
		int i = 0;
		string text = null;
		translation_list.Clear();
		try
		{
			string[] array = translationMainFile.text.Split(new string[2] { "\n", "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
			List<string> list = array[0].Split(';').ToList();
			string text2 = "";
			if (array.Length <= 1)
			{
				Debug.LogError("Translation Main File empty!");
				return;
			}
			for (int j = 1; j <= 2; j++)
			{
				for (i = 1; i < array.Length; i++)
				{
					Dictionary<string, string> dictionary = new Dictionary<string, string>();
					switch (j)
					{
					case 1:
					{
						string[] array3 = array[i].Split(new char[1] { ';' }, StringSplitOptions.RemoveEmptyEntries);
						if (array3 == null || array3.Length <= 1 || !((text = array3[0]) != "") || array3[1].StartsWith("*", StringComparison.InvariantCulture))
						{
							break;
						}
						for (int k = 1; k < list.Count; k++)
						{
							if (k >= array3.Length || array3[k] == null)
							{
								Debug.LogWarning("There is no translation for " + text + " for the language " + list[k]);
							}
							else
							{
								dictionary.Add(list[k], array3[k]);
							}
						}
						AddTranslation(text, dictionary);
						break;
					}
					case 2:
					{
						string[] array2 = array[i].Split(new char[1] { ';' }, StringSplitOptions.RemoveEmptyEntries);
						if (array2 != null && array2.Length > 1 && (text = array2[0]) != "" && array2[1].StartsWith("*", StringComparison.InvariantCulture))
						{
							string key = array2[1].TrimStart(new char[1] { '*' });
							AddTranslation(text, GetReferenceTranslation(key));
						}
						break;
					}
					}
				}
			}
			if (translationTempFile == null)
			{
				Debug.LogWarning("translationTempFile is not assigned. Skipping temp file translations.");
				return;
			}
			array = translationTempFile.text.Split(new string[2] { "\n", "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
			string[] array4 = array[0].Split(';');
			for (int l = 1; l <= 2; l++)
			{
				for (i = 1; i < array.Length; i++)
				{
					Dictionary<string, string> dictionary = new Dictionary<string, string>();
					switch (l)
					{
					case 1:
					{
						string[] array6 = array[i].Split(new char[1] { ';' }, StringSplitOptions.RemoveEmptyEntries);
						if (array6 == null || array6.Length <= 1 || !((text = array6[0]) != "") || array6[1].StartsWith("*", StringComparison.InvariantCulture))
						{
							break;
						}
						for (int m = 1; m < array4.Length; m++)
						{
							if (m >= array6.Length)
							{
								Debug.LogWarning("There is no translation for " + text + " for the language " + array4[m]);
							}
							else if (list.Contains(array4[m]))
							{
								text2 = array6[m];
								if (text2 == null)
								{
									Debug.LogWarning("There is no translation for " + text + " for the language " + array4[m]);
								}
								else
								{
									dictionary.Add(array4[m], text2);
								}
							}
							else
							{
								Debug.LogError("The language " + array4[m] + " is not on the Main File");
							}
						}
						AddTranslation(text, dictionary);
						break;
					}
					case 2:
					{
						string[] array5 = array[i].Split(new char[1] { ';' }, StringSplitOptions.RemoveEmptyEntries);
						if (array5 != null && array5.Length > 1 && (text = array5[0]) != "" && array5[1].StartsWith("*", StringComparison.InvariantCulture))
						{
							string key2 = array5[1].TrimStart(new char[1] { '*' });
							AddTranslation(text, GetReferenceTranslation(key2));
						}
						break;
					}
					}
				}
			}
		}
		catch (Exception ex)
		{
			Debug.LogErrorFormat("Fill_Translation() Exception. Line={0}\nKey={1}\n{2}\n{3}", i + 1, text, ex.Message, ex.StackTrace);
		}
	}

	public void SetLanguage(string language)
	{
		activeLanguage = language;
		ManageActiveLanguage(Util.ManageOption.WriteToCache);
		Fill_Translation();
		ForceLanguageChangeInAllViews();
	}

	private void ForceLanguageChangeInAllViews()
	{
		EliView[] array = UnityEngine.Object.FindObjectsOfType<EliView>();
		for (int i = 0; i < array.Length; i++)
		{
			array[i].ForceLanguageChange();
		}
	}

	public string SingularOrPlural(int x, string labelSingular, string labelPlural, params object[] args)
	{
		return instance.Get_Translation((x == 1) ? labelSingular : labelPlural, args);
	}

	public string Get_Translation(string tag, params object[] list)
	{
		if (tag == null)
		{
			return null;
		}
		if (tag.StartsWith("ID:") && tag.Length > 3)
		{
			tag = tag.Substring(3);
		}
		LocalizationObject localizationObject = translation_list.Find((LocalizationObject q) => q.key == tag.ToUpper());
		if (localizationObject == null)
		{
			return tag;
		}
		try
		{
			string text = localizationObject.translation[activeLanguage];
			if (text == null)
			{
				return tag;
			}
			if (list.Length != 0)
			{
				text = string.Format(text, list);
			}
			return text.Replace("\\n", Environment.NewLine);
		}
		catch (Exception ex)
		{
			Debug.LogError("Get_Translation error: " + ex.Message);
		}
		return tag;
	}

	private void AddTranslation(string key, Dictionary<string, string> translation)
	{
		if (translation_list.Find((LocalizationObject q) => q.key == key) == null)
		{
			translation_list.Add(new LocalizationObject(key, translation));
		}
		else
		{
			Debug.LogWarning("The translation for " + key + " already exists!");
		}
	}

	private Dictionary<string, string> GetReferenceTranslation(string key)
	{
		LocalizationObject localizationObject = translation_list.Find((LocalizationObject q) => q.key == key);
		if (localizationObject == null)
		{
			Debug.LogError("The key reference '" + key + "' does not exist!");
			return null;
		}
		return localizationObject.translation;
	}
}
