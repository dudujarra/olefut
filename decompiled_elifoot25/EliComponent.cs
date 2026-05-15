using System;
using UnityEngine;
using UnityEngine.UI;

public class EliComponent : MonoBehaviour
{
	public string baseStyle;

	public virtual void ReloadElementConfig()
	{
	}

	protected bool GetStyleValue(string keyTemplate, string value, bool defaultValue)
	{
		string defaultValue2 = defaultValue.ToString();
		return GetStyleValue(keyTemplate, value, defaultValue2).ToLower() == "true";
	}

	protected Image.Type GetStyleValue(string keyTemplate, string value, Image.Type defaultValue)
	{
		string defaultValue2 = defaultValue.ToString();
		string styleValue = GetStyleValue(keyTemplate, value, defaultValue2);
		return (Image.Type)Enum.Parse(typeof(Image.Type), styleValue, ignoreCase: true);
	}

	protected string GetStyleValue(string keyTemplate, string value, string defaultValue = null)
	{
		string text = null;
		string text2 = string.Format(keyTemplate, value);
		string key = text2;
		if (ConfigManager.configDictionary.ContainsKey(text2))
		{
			text = ConfigManager.configDictionary[text2];
			if (text == null)
			{
				return text;
			}
			if (!text.StartsWith("#"))
			{
				return text;
			}
		}
		else
		{
			text2 = string.Format(keyTemplate, "*");
			if (ConfigManager.configDictionary.ContainsKey(text2))
			{
				text = ConfigManager.configDictionary[text2];
			}
		}
		if (text == null && !keyTemplate.StartsWith("*"))
		{
			int num = keyTemplate.IndexOf(".");
			if (num >= 0)
			{
				string keyTemplate2 = "*" + keyTemplate.Substring(num);
				text = GetStyleValue(keyTemplate2, value);
			}
		}
		if (text != null)
		{
			text = Util.TrimEndCrLf(text);
			if (text.StartsWith("#"))
			{
				text = GetStyleValue(text, value);
			}
			if (text != null && text.ToLower() == "null")
			{
				text = null;
			}
		}
		if (text == null)
		{
			text = defaultValue;
		}
		else if (text.ToLower() == "null")
		{
			text = null;
		}
		if (ConfigManager.configDictionary.ContainsKey(key))
		{
			ConfigManager.configDictionary[key] = text;
		}
		else
		{
			ConfigManager.configDictionary.Add(key, text);
		}
		return text;
	}
}
