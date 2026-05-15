using System.Collections.Generic;
using Kender.uGUI;
using UnityEngine;
using UnityEngine.UI;

public class ParameterViewParameter25 : MonoBehaviour
{
	[Header("Button")]
	[SerializeField]
	private Button button;

	[SerializeField]
	private RectTransform buttonRectTransform;

	[SerializeField]
	private Text buttonDescription;

	[SerializeField]
	private Text buttonSecondText;

	[SerializeField]
	private Image buttonImage;

	[Header("Icon")]
	[SerializeField]
	private RectTransform iconRectTransform;

	[SerializeField]
	private Text iconDescription;

	[SerializeField]
	private Image iconImage;

	[Header("Bool")]
	[SerializeField]
	private RectTransform boolRectTransform;

	[SerializeField]
	private Text boolDescription;

	[SerializeField]
	private Toggle boolToggle;

	[Header("Radio")]
	[SerializeField]
	private RectTransform radioButtonRectTransform;

	[SerializeField]
	private Text radioButtonDescription;

	[SerializeField]
	private Toggle radioButtonToggle;

	[Header("Slider")]
	[SerializeField]
	private RectTransform sliderRectTransform;

	[SerializeField]
	private Text sliderDescription;

	[SerializeField]
	private Slider slider;

	[SerializeField]
	private Text sliderText;

	[Header("Read Only")]
	[SerializeField]
	private RectTransform readOnlyRectTransform;

	[SerializeField]
	private Text readOnlyDescription;

	[SerializeField]
	private Text readOnlySecondText;

	[Header("Drop Down")]
	[SerializeField]
	private ComboBox dropDownComboBox;

	[SerializeField]
	private Text dropDownDescription;

	[Header("Input Field")]
	[SerializeField]
	private Text inputFieldDescription;

	[SerializeField]
	private InputField inputField;

	internal void InitializeButton(EliParameter parameter)
	{
		EliParameter.ButtonConfig buttonConfig = (EliParameter.ButtonConfig)parameter.value;
		buttonRectTransform.gameObject.SetActive(value: true);
		buttonDescription.text = parameter.displayName;
		buttonDescription.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		buttonSecondText.text = buttonConfig.secondText;
		buttonSecondText.alignment = buttonConfig.textAlignment;
		buttonImage.sprite = buttonConfig.icon;
		button.enabled = buttonConfig.active;
		buttonImage.enabled = buttonConfig.active;
		button.onClick.RemoveAllListeners();
		button.onClick.AddListener(delegate
		{
			buttonConfig.onButtonPressed();
		});
	}

	internal void InitializeIcon(EliParameter parameter)
	{
		iconRectTransform.gameObject.SetActive(value: true);
		iconDescription.text = parameter.displayName;
		iconDescription.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		if (!(iconRectTransform == null))
		{
			iconImage.sprite = (Sprite)parameter.value;
		}
	}

	internal void InitializeBool(EliParameter parameter)
	{
		boolDescription.text = parameter.displayName;
		boolDescription.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		boolToggle.isOn = (bool)parameter.value;
		boolToggle.gameObject.SetActive(value: true);
		boolRectTransform.rect.Set(0f, 0f, 0f, 0f);
		if (parameter.OnValueChanged != null)
		{
			boolToggle.onValueChanged.AddListener(delegate(bool value)
			{
				parameter.OnValueChanged(value);
			});
		}
	}

	internal void InitializeRadioButton(EliParameter parameter, ListOfParameters allParameters)
	{
		radioButtonDescription.text = parameter.displayName;
		radioButtonDescription.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		radioButtonToggle.isOn = (bool)parameter.value;
		radioButtonToggle.gameObject.SetActive(value: true);
		radioButtonRectTransform.rect.Set(0f, 0f, 0f, 0f);
		if (parameter.OnValueChanged != null)
		{
			radioButtonToggle.onValueChanged.AddListener(delegate(bool value)
			{
				parameter.OnValueChanged(value);
			});
		}
		if (parameter.type == EliParameterType.RadioButton)
		{
			radioButtonToggle.interactable = !radioButtonToggle.isOn;
			RadioButtonChanged(parameter, allParameters);
			radioButtonToggle.onValueChanged.AddListener(delegate
			{
				RadioButtonChanged(parameter, allParameters);
			});
		}
	}

	internal void InitializeSlider(EliParameter parameter)
	{
		sliderDescription.text = parameter.displayName;
		sliderDescription.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		sliderRectTransform.gameObject.SetActive(value: true);
		slider.minValue = parameter.minIntValue;
		slider.maxValue = parameter.maxIntValue;
		slider.value = (int)parameter.value;
		sliderText.text = slider.value.ToString();
		sliderText.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		slider.onValueChanged.AddListener(delegate(float value)
		{
			sliderText.text = value.ToString();
			if (parameter.OnValueChanged != null)
			{
				parameter.OnValueChanged((int)value);
			}
		});
	}

	internal void InitializeReadOnly(EliParameter parameter)
	{
		readOnlyDescription.text = parameter.displayName;
		readOnlyDescription.rectTransform.rect.Set(0f, 0f, 0f, 0f);
		readOnlyRectTransform.gameObject.SetActive(value: true);
		readOnlyRectTransform.rect.Set(0f, 0f, 0f, 0f);
		if (parameter.value != null)
		{
			readOnlySecondText.text = parameter.value.ToString();
			readOnlySecondText.alignment = parameter.alignment;
		}
		else
		{
			readOnlySecondText.text = "";
		}
	}

	internal void InitializeDropDownList(EliParameter parameter)
	{
		dropDownDescription.text = parameter.displayName;
		KeyValuePair<int, string[]> keyValuePair = (KeyValuePair<int, string[]>)parameter.value;
		ComboBox comboBox = dropDownComboBox;
		object[] value = keyValuePair.Value;
		comboBox.AddItems(value);
		dropDownComboBox.gameObject.SetActive(value: true);
		dropDownComboBox.SelectItem(keyValuePair.Key);
		dropDownComboBox.RefreshSelected();
	}

	internal void InitializeInputField(EliParameter parameter)
	{
		if (parameter.value != null)
		{
			inputField.text = parameter.value.ToString();
		}
		else
		{
			inputField.text = "";
		}
		inputField.gameObject.SetActive(value: true);
		inputFieldDescription.text = parameter.displayName;
	}

	private void RadioButtonChanged(EliParameter fromParameter, ListOfParameters allParameters)
	{
		bool isOn = radioButtonToggle.isOn;
		radioButtonToggle.interactable = !isOn;
		if (!isOn)
		{
			return;
		}
		foreach (EliParameter allParameter in allParameters)
		{
			if (allParameter.sectionId == fromParameter.sectionId && allParameter.subSectionId == fromParameter.subSectionId && allParameter.number != fromParameter.number && !(allParameter.MyGameObject == null))
			{
				Transform transform = allParameter.MyGameObject.transform.Find("ParameterRadioButton");
				if (!(transform == null))
				{
					transform.GetComponent<Toggle>().isOn = false;
				}
			}
		}
	}
}
