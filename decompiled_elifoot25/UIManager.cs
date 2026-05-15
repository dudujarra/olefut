using System;
using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
	public enum SceneState
	{
		MainGridScene,
		MediaPopup
	}

	public static UIManager Instance;

	public GameObject showLogView;

	public GameObject mediaScrollView;

	public GameObject titleText;

	public GameObject buttons;

	public Text logText;

	public GameObject loadingCircle;

	public GameObject loadingPanel;

	private bool toggleLogView;

	private Vector3 titleTextOrgPos;

	public SceneState currentScene { get; private set; }

	private void Awake()
	{
		Instance = this;
		titleTextOrgPos = titleText.transform.position;
	}

	private void Start()
	{
		logText.text = "";
		showLogView.SetActive(value: false);
		ShowGrid(isShow: false);
		if (loadingPanel != null)
		{
			SetLoadingCircle(isLoading: false);
		}
	}

	public void SetSceneState(SceneState state)
	{
		currentScene = state;
	}

	public void ShowGrid(bool isShow)
	{
		if (isShow)
		{
			titleText.transform.position = titleTextOrgPos;
			mediaScrollView.SetActive(value: true);
		}
		else
		{
			mediaScrollView.SetActive(value: false);
			titleText.GetComponent<RectTransform>().anchoredPosition = new Vector3(0f, -Screen.height / 2 + 100, 0f);
		}
	}

	public void ToggleLogView()
	{
		toggleLogView = !toggleLogView;
		if (toggleLogView)
		{
			mediaScrollView.SetActive(value: false);
			buttons.SetActive(value: false);
			showLogView.SetActive(value: true);
		}
		else
		{
			showLogView.SetActive(value: false);
			buttons.SetActive(value: true);
			mediaScrollView.SetActive(value: true);
		}
	}

	public void AddLogText(string message)
	{
		Text text = logText;
		text.text = text.text + "\n[" + DateTime.Now.ToString() + "] " + message;
		Canvas.ForceUpdateCanvases();
		showLogView.GetComponentInChildren<ScrollRect>().verticalNormalizedPosition = 0f;
	}

	public void ClearLog()
	{
		logText.text = "";
		Canvas.ForceUpdateCanvases();
		showLogView.GetComponentInChildren<ScrollRect>().verticalNormalizedPosition = 0f;
	}

	public void CloseBtn()
	{
		ToggleLogView();
	}

	public void SetLoadingCircle(bool isLoading)
	{
		if (isLoading)
		{
			loadingPanel.SetActive(value: true);
			loadingCircle.SetActive(value: true);
			loadingCircle.GetComponentInChildren<LoadingCircle>().SetLoading(loading: true);
		}
		else
		{
			loadingCircle.GetComponentInChildren<LoadingCircle>().SetLoading(loading: false);
			loadingCircle.SetActive(value: false);
			loadingPanel.SetActive(value: false);
		}
	}
}
