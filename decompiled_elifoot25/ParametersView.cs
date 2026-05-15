using System;
using System.Collections;
using System.Collections.Generic;
using Kender.uGUI;
using UnityEngine;
using UnityEngine.UI;

public class ParametersView : EliView
{
	public enum ButtonAction
	{
		Close,
		Previous,
		Next
	}

	public enum GridViewMode
	{
		Enlarged,
		Normal,
		Reduced,
		Compact
	}

	public static readonly Dictionary<GridViewMode, int> prefabSize = new Dictionary<GridViewMode, int>
	{
		{
			GridViewMode.Enlarged,
			160
		},
		{
			GridViewMode.Normal,
			100
		},
		{
			GridViewMode.Reduced,
			89
		},
		{
			GridViewMode.Compact,
			80
		}
	};

	public Text titleText;

	public RectTransform parameterViewport;

	public RectTransform parameterGroupParent;

	public GameObject backButton;

	public GameObject nextButton;

	public GameObject previousButton;

	protected internal GridViewMode viewMode = GridViewMode.Normal;

	public GameObject parameterPrefab;

	public GameObject sectionTitlePrefab;

	public GameObject sectionSubTitlePrefab;

	public Transform titlePrefabPool;

	public Transform subTitlePrefabPool;

	public Transform parameterPrefabPool;

	protected Action<ListOfParameters> onSaveParameters;

	private Dictionary<string, GameObject> listOfParameters = new Dictionary<string, GameObject>();

	private ListOfParameters allParameters = new ListOfParameters();

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private bool backPressed;

	private bool inCoachRanking;

	private bool showLoadingView;

	private bool hasFoldout;

	private bool firstTime = true;

	private int currentSelected;

	private const float FOLDOUT_ANIMATION_STEP_DURATION = 0.02f;

	private ScrollRect scrollRect;

	private int titleCounter;

	public GridViewMode ViewMode
	{
		get
		{
			return viewMode;
		}
		set
		{
			viewMode = value;
		}
	}

	public void Initialize(string title, ListOfParameters allParameters, Action<ListOfParameters> onSaveParameters, bool showLoadingView, GridViewMode viewMode, bool inCoachRanking = false, bool hasFoldout = false)
	{
		ViewMode = viewMode;
		this.onSaveParameters = onSaveParameters;
		this.allParameters = allParameters;
		this.showLoadingView = showLoadingView;
		this.inCoachRanking = inCoachRanking;
		this.hasFoldout = hasFoldout;
		Debug.Log("hasFoldout: " + hasFoldout);
		titleText.text = LanguageController.instance.Get_Translation(title);
		scrollRect = parameterViewport.GetComponent<ScrollRect>();
		FillParameterList(fullRedraw: true);
	}

	public void ReInitialize(string title, ListOfParameters allParameters)
	{
		titleText.text = LanguageController.instance.Get_Translation(title);
		FillParameterList(fullRedraw: false);
	}

	public void DisablePrefab(Transform child)
	{
		child.SetParent(child.name.Contains("SubTitle") ? subTitlePrefabPool : (child.name.Contains("Title") ? titlePrefabPool : parameterPrefabPool));
		child.gameObject.SetActive(value: false);
	}

	private void FillParameterList(bool fullRedraw)
	{
		if (!(this == null) && base.gameObject.activeSelf)
		{
			StartCoroutine(PopulateParameters(fullRedraw));
		}
	}

	private IEnumerator PopulateParameters(bool fullRedraw)
	{
		if (showLoadingView)
		{
			ScreenController.instance.ShowLoadingView();
		}
		yield return null;
		if (this == null)
		{
			yield break;
		}
		if (fullRedraw)
		{
			for (int num = parameterGroupParent.childCount - 1; num >= 0; num--)
			{
				Transform child = parameterGroupParent.GetChild(num);
				DisablePrefab(child);
			}
			yield return null;
			if (this == null)
			{
				yield break;
			}
		}
		int firstHumanCoach = 0;
		int lastHumanCoach = 0;
		bool darkenNext = false;
		bool darkenThis = false;
		float height = prefabSize[ViewMode];
		titleCounter = 0;
		for (int i = 0; i < allParameters.Count; i++)
		{
			EliParameter parameter = allParameters.EliParameter(i);
			GameObject obj = FillParameterObj(parameter, height, fullRedraw, ref darkenThis, ref darkenNext);
			if (inCoachRanking && Util.GetGameObjectText(obj, "ParameterReadOnly/Desc").text.StartsWith("<color=yellow>", StringComparison.Ordinal))
			{
				float y = parameterPrefab.GetComponent<RectTransform>().sizeDelta.y;
				int num2 = Mathf.FloorToInt(parameterViewport.rect.height / y);
				if (firstHumanCoach == 0)
				{
					firstHumanCoach = i;
				}
				else if (i - firstHumanCoach < num2)
				{
					lastHumanCoach = i;
				}
			}
			if (i % 10 == 0)
			{
				yield return null;
				if (this == null)
				{
					yield break;
				}
			}
		}
		if (inCoachRanking)
		{
			GoToPosition();
		}
		base.gameObject.SetActive(value: true);
		yield return OpenLastFoldout();
		if (!(this == null) && showLoadingView)
		{
			ScreenController.instance.HideLoadingView();
		}
		void GoToPosition()
		{
			float y2 = parameterPrefab.GetComponent<RectTransform>().sizeDelta.y;
			int num3 = Mathf.FloorToInt(parameterViewport.rect.height / y2);
			if (firstHumanCoach != 0 && (firstHumanCoach > num3 || lastHumanCoach > num3))
			{
				float y3 = ((lastHumanCoach != 0) ? (y2 * (float)(lastHumanCoach + 1 - num3)) : (y2 * (float)(firstHumanCoach + 1 - num3)));
				parameterGroupParent.anchoredPosition = new Vector2(0f, y3);
			}
		}
	}

	public GameObject FillParameterObj(EliParameter parameter, float height, bool fullRedraw, ref bool darkenThis, ref bool darkenNext)
	{
		GameObject parameterObj;
		if (fullRedraw)
		{
			switch (parameter.type)
			{
			case EliParameterType.SectionTitle:
				parameterObj = GetTitleFromPool();
				darkenThis = false;
				darkenNext = false;
				break;
			case EliParameterType.SectionSubTitle:
				parameterObj = GetSubTitleFromPool();
				darkenThis = false;
				darkenNext = false;
				break;
			default:
				parameterObj = GetParameterFromPool();
				darkenThis = darkenNext;
				darkenNext = !darkenNext;
				break;
			}
			RectTransform component = parameterObj.GetComponent<RectTransform>();
			component.sizeDelta = new Vector3(component.sizeDelta.x, height);
			DarkenListBackgroundObj(parameterObj, darkenThis);
			parameter.MyGameObject = parameterObj;
			parameterObj.transform.SetParent(parameterGroupParent, worldPositionStays: false);
		}
		else
		{
			parameterObj = listOfParameters[parameter.id];
		}
		parameterObj.SetActive(value: false);
		switch (parameter.type)
		{
		case EliParameterType.SectionTitle:
			if (hasFoldout)
			{
				int ID = titleCounter;
				parameterObj.GetComponent<ParameterViewTitle25>().Initialize(parameter.displayName, delegate
				{
					StartCoroutine(OnFoldoutClick(parameterObj, ID));
				});
			}
			else
			{
				parameterObj.GetComponent<ParameterViewTitle25>().Initialize(parameter.displayName);
			}
			titleCounter++;
			break;
		case EliParameterType.SectionSubTitle:
			parameterObj.GetComponent<ParameterViewSubtitle25>().Initialize(parameter.displayName);
			break;
		case EliParameterType.Button:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeButton(parameter);
			break;
		case EliParameterType.Icon:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeIcon(parameter);
			break;
		case EliParameterType.Bool:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeBool(parameter);
			break;
		case EliParameterType.RadioButton:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeRadioButton(parameter, allParameters);
			break;
		case EliParameterType.Slider:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeSlider(parameter);
			break;
		case EliParameterType.ReadOnly:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeReadOnly(parameter);
			break;
		case EliParameterType.DropDownList:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeDropDownList(parameter);
			break;
		default:
			parameterObj.GetComponent<ParameterViewParameter25>().InitializeInputField(parameter);
			break;
		}
		if (fullRedraw)
		{
			listOfParameters.Add(parameter.id, parameterObj);
		}
		parameterObj.SetActive(value: true);
		return parameterObj;
	}

	private IEnumerator OpenLastFoldout()
	{
		if (listOfParameters.Count == 0)
		{
			yield break;
		}
		string text = PlayerPrefs.GetString("FoldoutTitle", string.Empty);
		int num = 0;
		foreach (var (_, gameObject2) in listOfParameters)
		{
			if (gameObject2.GetComponent<ParameterViewTitle25>() != null)
			{
				if (gameObject2.GetComponent<ParameterViewTitle25>().Title == text)
				{
					currentSelected = num;
					yield return StartCoroutine(OnFoldoutClick(gameObject2));
					break;
				}
				num++;
			}
		}
	}

	private IEnumerator OnFoldoutClick(GameObject clickedTitle, int ID = -1)
	{
		if (currentSelected == ID)
		{
			yield break;
		}
		bool isOnSelected = false;
		int foldoutId = 0;
		string key;
		GameObject value;
		foreach (KeyValuePair<string, GameObject> listOfParameter in listOfParameters)
		{
			listOfParameter.Deconstruct(out key, out value);
			GameObject parameter = value;
			if (parameter.GetComponent<ParameterViewTitle25>() == null)
			{
				if (!firstTime && parameter.activeSelf)
				{
					yield return new WaitForSeconds(0.02f);
				}
				parameter.SetActive(value: false);
			}
		}
		firstTime = false;
		RectTransform target = null;
		foreach (KeyValuePair<string, GameObject> listOfParameter2 in listOfParameters)
		{
			listOfParameter2.Deconstruct(out key, out value);
			GameObject parameter = value;
			if (parameter.GetComponent<ParameterViewTitle25>() != null)
			{
				if (parameter == clickedTitle)
				{
					currentSelected = foldoutId;
					PlayerPrefs.SetString("FoldoutTitle", parameter.GetComponent<ParameterViewTitle25>().Title);
					isOnSelected = true;
					target = parameter.GetComponent<RectTransform>();
					ScrollToTarget(target);
				}
				else if (isOnSelected)
				{
					isOnSelected = false;
				}
				foldoutId++;
			}
			else
			{
				if (parameter.activeSelf != isOnSelected)
				{
					yield return new WaitForSeconds(0.02f);
				}
				parameter.SetActive(isOnSelected);
				ScrollToTarget(target);
			}
		}
	}

	private void ScrollToTarget(RectTransform target)
	{
		if (!(target == null))
		{
			Vector2 vector = scrollRect.viewport.localPosition;
			Vector2 vector2 = target.localPosition;
			Vector2 vector3 = new Vector2(0f - (vector.x + vector2.x), 0f - (vector.y + vector2.y) + scrollRect.viewport.rect.height / 2f - target.rect.height / 2f);
			scrollRect.content.localPosition = vector3;
		}
	}

	private GameObject GetTitleFromPool()
	{
		if (titlePrefabPool.childCount > 0)
		{
			return titlePrefabPool.transform.GetChild(0).gameObject;
		}
		return UnityEngine.Object.Instantiate(sectionTitlePrefab);
	}

	private GameObject GetSubTitleFromPool()
	{
		if (subTitlePrefabPool.childCount > 0)
		{
			return subTitlePrefabPool.transform.GetChild(0).gameObject;
		}
		return UnityEngine.Object.Instantiate(sectionSubTitlePrefab);
	}

	private GameObject GetParameterFromPool()
	{
		if (parameterPrefabPool.childCount > 0)
		{
			return parameterPrefabPool.transform.GetChild(0).gameObject;
		}
		return UnityEngine.Object.Instantiate(parameterPrefab);
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}

	public void StartTimeToClose(float seconds)
	{
		secondsToClose = seconds;
		secondsTimer = secondsToClose;
		if (secondsToClose > 0f)
		{
			StartCoroutine(TimeToClose());
		}
	}

	private IEnumerator TimeToClose()
	{
		while (secondsTimer > 0f)
		{
			if (!pauseTimer)
			{
				secondsTimer -= Time.deltaTime;
			}
			yield return 0;
		}
		OnBackPressed();
	}

	public virtual void OnBackPressed()
	{
		if (backButton.activeSelf)
		{
			SaveParameters();
			Close();
			backPressed = true;
		}
	}

	public virtual void OnPreviousPressed()
	{
	}

	public virtual void OnNextPressed()
	{
	}

	public void ClearListOfParameters()
	{
		listOfParameters.Clear();
	}

	private void SaveParameters()
	{
		foreach (KeyValuePair<string, GameObject> listOfParameter in listOfParameters)
		{
			GameObject value = listOfParameter.Value;
			string key = listOfParameter.Key;
			EliParameter eliParameter = allParameters.FindParameterById(key);
			if (!eliParameter.MaySave())
			{
				continue;
			}
			Transform transform = value.transform.Find("ParameterInput");
			if (transform != null)
			{
				InputField component = transform.GetComponent<InputField>();
				if (component != null && component.gameObject.activeSelf)
				{
					string text = component.text;
					if (eliParameter.type == EliParameterType.Int)
					{
						if (int.TryParse(text, out var result))
						{
							eliParameter.value = result;
						}
					}
					else if (eliParameter.type == EliParameterType.Float)
					{
						if (float.TryParse(text, out var result2))
						{
							eliParameter.value = result2;
						}
					}
					else if (eliParameter.type == EliParameterType.String)
					{
						eliParameter.value = text;
					}
					continue;
				}
			}
			transform = value.transform.Find("ParameterCheckbox");
			if (transform != null)
			{
				Toggle component2 = transform.GetComponent<Toggle>();
				if (component2 != null && component2.gameObject.activeSelf)
				{
					eliParameter.value = component2.isOn;
					continue;
				}
			}
			transform = value.transform.Find("ParameterRadioButton");
			if (transform != null)
			{
				Toggle component3 = transform.GetComponent<Toggle>();
				if (component3 != null && component3.gameObject.activeSelf)
				{
					eliParameter.value = component3.isOn;
					continue;
				}
			}
			transform = value.transform.Find("ParameterSlider");
			if (transform != null)
			{
				Slider component4 = transform.GetComponent<Slider>();
				if (component4 != null && component4.gameObject.activeSelf)
				{
					eliParameter.value = (int)component4.value;
					continue;
				}
			}
			transform = value.transform.Find("ParameterList");
			if (!(transform != null))
			{
				continue;
			}
			ComboBox component5 = transform.GetComponent<ComboBox>();
			if (component5.gameObject.activeSelf)
			{
				string[] array = new string[component5.Items.Length];
				for (int i = 0; i < array.Length; i++)
				{
					array[i] = component5.Items[i].Caption;
				}
				eliParameter.value = new KeyValuePair<int, string[]>(component5.SelectedIndex, array);
			}
		}
		if (onSaveParameters != null)
		{
			onSaveParameters(allParameters);
		}
	}

	public override void Update()
	{
		if (Input.GetMouseButtonDown(0))
		{
			secondsTimer = secondsToClose;
		}
		base.Update();
	}
}
