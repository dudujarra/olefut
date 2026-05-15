using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ListOfParameters : EliList
{
	private const TextAnchor DEFAULT_ALIGNMENT = TextAnchor.MiddleCenter;

	private int lastSectionId = -1;

	private int lastSubSectionId = -1;

	private int lastParameterNumber;

	private string lastSectionName;

	private string lastSectionSubName;

	private string parameterPrefix;

	public int LastSectionId => lastSectionId;

	public string LastSectionName => lastSectionName;

	public int LastSubSectionId => lastSubSectionId;

	public string LastSubSectionName => lastSectionSubName;

	public ListOfParameters(string parameterPrefix = null)
	{
		if (parameterPrefix != null)
		{
			this.parameterPrefix = parameterPrefix + "-";
		}
	}

	public EliParameter EliParameter(int index)
	{
		return (EliParameter)base[index];
	}

	public EliParameter FindParameterById(string id)
	{
		return this.OfType<EliParameter>().FirstOrDefault((EliParameter p) => p.id == id);
	}

	public EliParameter FindParameterByDisplayName(string name)
	{
		return this.OfType<EliParameter>().FirstOrDefault((EliParameter p) => p.displayName == name);
	}

	public bool GetParameterValue(string id, bool defaultValue)
	{
		EliParameter eliParameter = FindParameterById(id);
		if (eliParameter == null)
		{
			return defaultValue;
		}
		return (bool)eliParameter.value;
	}

	public string GetParameterValue(string id, string defaultValue)
	{
		EliParameter eliParameter = FindParameterById(id);
		if (eliParameter == null)
		{
			return defaultValue;
		}
		return (string)eliParameter.value;
	}

	public int GetParameterValue(string id, int defaultValue)
	{
		EliParameter eliParameter = FindParameterById(id);
		if (eliParameter == null)
		{
			return defaultValue;
		}
		return (int)eliParameter.value;
	}

	public float GetParameterValue(string id, float defaultValue)
	{
		EliParameter eliParameter = FindParameterById(id);
		if (eliParameter == null)
		{
			return defaultValue;
		}
		return (float)eliParameter.value;
	}

	public KeyValuePair<int, string[]> GetParameterValue(string id)
	{
		EliParameter eliParameter = FindParameterById(id);
		if (eliParameter == null)
		{
			return new KeyValuePair<int, string[]>(-1, null);
		}
		return (KeyValuePair<int, string[]>)eliParameter.value;
	}

	public void RegisterParameter(string id, string displayName, bool value, bool radioButton)
	{
		if (radioButton)
		{
			RegisterParameter(id, displayName, value, EliParameterType.RadioButton);
		}
		else
		{
			RegisterParameter(id, displayName, value, EliParameterType.Bool);
		}
	}

	public void RegisterParameter(string id, string displayName, bool value, bool radioButton, Func<object, bool> OnValueChanged)
	{
		if (radioButton)
		{
			RegisterParameter(id, displayName, value, EliParameterType.RadioButton, OnValueChanged);
		}
		else
		{
			RegisterParameter(id, displayName, value, EliParameterType.Bool, OnValueChanged);
		}
	}

	public void RegisterParameter(string id, string displayName, string value)
	{
		RegisterParameter(id, displayName, value, EliParameterType.String, TextAnchor.MiddleLeft);
	}

	public void RegisterParameter(string id, string displayName, string value, TextAnchor alignment)
	{
		RegisterParameter(id, displayName, value, EliParameterType.String, alignment);
	}

	public void RegisterParameter(string id, string displayName, float value)
	{
		RegisterParameter(id, displayName, value, EliParameterType.Float);
	}

	public void RegisterParameter(string id, string displayName, int value)
	{
		RegisterParameter(id, displayName, value, EliParameterType.Int);
	}

	public void RegisterParameter(string id, string displayName, int value, int minValue, int maxValue)
	{
		RegisterParameter(id, displayName, value, EliParameterType.Slider, minValue, maxValue);
	}

	public void RegisterParameter(string id, string displayName, int value, int minValue, int maxValue, Func<object, bool> OnValueChanged)
	{
		RegisterParameter(id, displayName, value, EliParameterType.Slider, minValue, maxValue, OnValueChanged);
	}

	public void RegisterParameter(string id, string displayName, KeyValuePair<int, string[]> value)
	{
		RegisterParameter(id, displayName, value, EliParameterType.DropDownList);
	}

	private void RegisterParameter(string id, string displayName, object value, EliParameterType type, TextAnchor alignment)
	{
		RegisterParameter(id, displayName, value, type, -1, -1, alignment, null);
	}

	public void RegisterParameter(string id, string displayName, object value, EliParameterType type)
	{
		RegisterParameter(id, displayName, value, type, -1, -1);
	}

	private void RegisterParameter(string id, string displayName, object value, EliParameterType type, Func<object, bool> OnValueChanged)
	{
		RegisterParameter(id, displayName, value, type, -1, -1, OnValueChanged);
	}

	public void RegisterButtonParameter(string displayName, EliParameter.ButtonConfig buttonConfig)
	{
		string id = $"Button{base.Count:0000}";
		RegisterParameter(id, displayName, buttonConfig, EliParameterType.Button);
	}

	public void RegisterReadOnlyParameter(string displayName, object value)
	{
		RegisterReadOnlyParameter(displayName, value, TextAnchor.MiddleCenter);
	}

	public void RegisterReadOnlyParameter(string displayName, object value, TextAnchor alignment)
	{
		string id = $"ReadOnly{base.Count:0000}";
		RegisterParameter(id, displayName, value, EliParameterType.ReadOnly, alignment);
	}

	private void RegisterParameter(string id, string displayName, object value, EliParameterType type, int minValue, int maxValue)
	{
		RegisterParameter(id, displayName, value, type, minValue, maxValue, TextAnchor.MiddleCenter, null);
	}

	private void RegisterParameter(string id, string displayName, object value, EliParameterType type, int minValue, int maxValue, Func<object, bool> OnValueChanged)
	{
		RegisterParameter(id, displayName, value, type, minValue, maxValue, TextAnchor.MiddleCenter, OnValueChanged);
	}

	private void RegisterParameter(string id, string displayName, object value, EliParameterType type, int minValue, int maxValue, TextAnchor alignment, Func<object, bool> OnValueChanged)
	{
		EliParameter eliParameter = FindParameterById(id);
		displayName = LanguageController.instance.Get_Translation(displayName);
		if (id == null || eliParameter == null)
		{
			if (id == null)
			{
				id = $"Parameter{base.Count:0000}";
			}
			eliParameter = new EliParameter(id, displayName, value, type, minValue, maxValue, alignment, OnValueChanged);
			Add(eliParameter);
			eliParameter.sectionId = LastSectionId;
			eliParameter.subSectionId = LastSubSectionId;
			eliParameter.number = lastParameterNumber++;
		}
		else
		{
			eliParameter.value = value;
		}
	}

	public void AddRange(ListOfParameters thisList)
	{
		foreach (EliParameter @this in thisList)
		{
			string newId = @this.id;
			int num = 0;
			bool flag = false;
			while (Find((EliObject x) => ((EliParameter)x).id == newId) != null)
			{
				num++;
				newId = @this.id + "-" + num;
				flag = true;
			}
			if (flag)
			{
				@this.id = newId;
			}
		}
		AddRange((IEnumerable<EliObject>)thisList);
	}

	public void StartSection(string displayName)
	{
		EndSection();
		lastSectionId++;
		RegisterParameter(null, displayName, null, EliParameterType.SectionTitle);
		lastSectionName = displayName;
		lastSectionSubName = null;
		lastParameterNumber = 0;
	}

	public void StartSubSection(string displayName)
	{
		lastSubSectionId++;
		RegisterParameter(null, displayName, null, EliParameterType.SectionSubTitle);
		lastSectionSubName = displayName;
	}

	public void EndSection()
	{
		if (base.Count > 0 && EliParameter(base.Count - 1).type == EliParameterType.SectionTitle)
		{
			RemoveAt(base.Count - 1);
		}
	}
}
