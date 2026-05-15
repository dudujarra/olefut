using System;
using System.Collections.Generic;
using UnityEngine;

public class FM_IniFile
{
	private Dictionary<string, string> _iniFile = new Dictionary<string, string>();

	private char _separator = '\u0001';

	public FM_IniFile()
	{
	}

	public FM_IniFile(string name, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		LoadNewIniFile(name, enc, checkSA, fullPath);
	}

	public void LoadNewIniFile(string name, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		string[] array = FileManagement.ReadAllLines(name, enc, checkSA, fullPath);
		if (array != null && array.Length != 0)
		{
			string text = "";
			for (int i = 0; i < array.Length; i++)
			{
				string text2 = array[i].Trim();
				if (string.IsNullOrEmpty(text2))
				{
					continue;
				}
				switch (text2[0])
				{
				case '[':
					text = text2.Trim('[', ']');
					continue;
				case ';':
					continue;
				}
				string[] array2 = text2.Split(new char[1] { '=' }, 2);
				string text3 = array2[0].Trim();
				if (!string.IsNullOrEmpty(text))
				{
					text3 = text + _separator + text3;
				}
				string text4 = array2[1].Split(new char[1] { ';' }, 2)[0];
				text4 = text4.Trim().Trim(new char[1] { '"' });
				if (_iniFile.ContainsKey(text3))
				{
					_iniFile[text3] = text4;
				}
				else
				{
					_iniFile.Add(text3, text4);
				}
			}
		}
		else
		{
			Debug.LogWarning("[FM_IniFile.LoadNewIniFile] The requested INI file wouldn't be parsed.");
		}
	}

	public T GetKey<T>(string key, T defaultValue, string section = "")
	{
		string key2 = key;
		if (!string.IsNullOrEmpty(section))
		{
			key2 = section + _separator + key;
		}
		if (_iniFile.ContainsKey(key2))
		{
			return FileManagement.CustomParser<T>(_iniFile[key2]);
		}
		return defaultValue;
	}

	public void SetKey<T>(string key, T value, string section = "")
	{
		if (KeyExists(key, section))
		{
			AddKey(key, value, section);
		}
		else
		{
			Debug.LogWarning("[FM_IniFile.SetKey] Key not found.");
		}
	}

	public void AddKey<T>(string key, T value, string section = "")
	{
		string key2 = key;
		if (!string.IsNullOrEmpty(section))
		{
			key2 = section + _separator + key;
		}
		if (!_iniFile.ContainsKey(key2))
		{
			_iniFile.Add(key2, value.ToString());
		}
		else
		{
			_iniFile[key2] = value.ToString();
		}
	}

	public void RemoveKey(string key, string section = "")
	{
		string key2 = key;
		if (!string.IsNullOrEmpty(section))
		{
			key2 = section + _separator + key;
		}
		if (_iniFile.ContainsKey(key2))
		{
			_iniFile.Remove(key2);
		}
		else
		{
			Debug.LogWarning("[FM_IniFile.RemoveKey] Key not found.");
		}
	}

	public void RemoveSection(string section = "")
	{
		List<string> list = new List<string>(_iniFile.Keys);
		for (int i = 0; i < list.Count; i++)
		{
			int num = list[i].LastIndexOf(_separator);
			string text = "";
			if (num > 0)
			{
				text = list[i].Substring(0, num);
			}
			if (section == text)
			{
				_iniFile.Remove(list[i]);
			}
		}
	}

	public bool KeyExists(string key, string section = "")
	{
		string key2 = key;
		if (!string.IsNullOrEmpty(section))
		{
			key2 = section + _separator + key;
		}
		return _iniFile.ContainsKey(key2);
	}

	public string[] GetSectionList(bool sort = false)
	{
		List<string> list = new List<string>();
		List<string> list2 = new List<string>(_iniFile.Keys);
		for (int i = 0; i < list2.Count; i++)
		{
			int num = list2[i].LastIndexOf(_separator);
			string item = "";
			if (num > 0)
			{
				item = list2[i].Substring(0, num);
			}
			if (!list.Contains(item))
			{
				list.Add(item);
			}
		}
		if (sort)
		{
			list.Sort();
		}
		return list.ToArray();
	}

	public string[] GetKeyList(string section = "", bool sort = false)
	{
		List<string> list = new List<string>();
		List<string> list2 = new List<string>(_iniFile.Keys);
		for (int i = 0; i < list2.Count; i++)
		{
			string text = "";
			int num = list2[i].LastIndexOf(_separator);
			if (num > 0)
			{
				text = list2[i].Substring(0, num);
			}
			if (section == text)
			{
				list.Add(list2[i].Substring(num + 1));
			}
		}
		if (sort)
		{
			list.Sort();
		}
		return list.ToArray();
	}

	public void Save(string name, bool sort = false, bool enc = false, bool fullPath = false)
	{
		string text = "";
		string text2 = "";
		string[] sectionList = GetSectionList(sort);
		for (int i = 0; i < sectionList.Length; i++)
		{
			text2 = sectionList[i];
			string[] keyList = GetKeyList(text2, sort);
			if (text2 != "")
			{
				text = text + "[" + text2 + "]" + Environment.NewLine;
			}
			for (int j = 0; j < keyList.Length; j++)
			{
				string key = GetKey(keyList[j], "", text2);
				text = ((!(key != "") || (key[0] != ' ' && key[key.Length - 1] != ' ')) ? (text + keyList[j] + " = " + key + Environment.NewLine) : (text + keyList[j] + " = \"" + key + "\"" + Environment.NewLine));
			}
		}
		FileManagement.SaveFile(name, text, enc, fullPath);
	}

	public void Merge(FM_IniFile source)
	{
		string[] sectionList = source.GetSectionList();
		for (int i = 0; i < sectionList.Length; i++)
		{
			string[] keyList = source.GetKeyList(sectionList[i]);
			for (int j = 0; j < keyList.Length; j++)
			{
				string key = source.GetKey(keyList[j], "", sectionList[i]);
				AddKey(keyList[j], key, sectionList[i]);
			}
		}
	}
}
