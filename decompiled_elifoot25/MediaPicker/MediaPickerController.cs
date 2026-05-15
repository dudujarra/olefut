using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace MediaPicker;

public class MediaPickerController : MonoBehaviour
{
	private static MediaPickerController _instance;

	[HideInInspector]
	public EditTeamPrefab editTeamPrefab;

	private ResizeTextures resizeTextures;

	public float DefaultMaxWidth;

	public float DefaultMaxHeight;

	private float MaxWidth;

	private float MaxHeight;

	[HideInInspector]
	public GameObject fullScreenPanel;

	[HideInInspector]
	public GameObject fullImage;

	[HideInInspector]
	public GameObject currentPlayMovieGo;

	[HideInInspector]
	public int m_maxMultipleSelectCount;

	[HideInInspector]
	public int totalImageCount;

	[HideInInspector]
	public int totalVideoCount;

	public static MediaPickerController Instance
	{
		get
		{
			if (_instance == null)
			{
				_instance = new MediaPickerController();
			}
			return _instance;
		}
	}

	private void Awake()
	{
		_instance = this;
		UnityEngine.Object.DontDestroyOnLoad(base.gameObject);
	}

	private void Start()
	{
		resizeTextures = GetComponent<ResizeTextures>();
		StartCoroutine(InitCoroutine(0.5f));
	}

	private IEnumerator InitCoroutine(float waitTime)
	{
		yield return new WaitForSeconds(waitTime);
	}

	public void SelectSingleImage(EditTeamPrefab _editTeamPrefab, float _Width = 0f, float _Height = 0f, Image _Image = null)
	{
		editTeamPrefab = _editTeamPrefab;
		if (_Width == 0f)
		{
			MaxWidth = DefaultMaxWidth;
		}
		else
		{
			MaxWidth = _Width;
		}
		if (_Height == 0f)
		{
			MaxHeight = DefaultMaxHeight;
		}
		else
		{
			MaxHeight = _Height;
		}
	}

	public void TakePicture(float _Width = 0f, float _Height = 0f, Image _Image = null)
	{
		if (_Width == 0f)
		{
			MaxWidth = DefaultMaxWidth;
		}
		else
		{
			MaxWidth = _Width;
		}
		if (_Height == 0f)
		{
			MaxHeight = DefaultMaxHeight;
		}
		else
		{
			MaxHeight = _Height;
		}
	}

	public void LoadPicture(string path)
	{
		StartCoroutine(LoadTexture(path, FinishedLoading));
	}

	private IEnumerator LoadTexture(string path, Action callBack = null)
	{
		string uri = "file://" + path;
		using (UnityWebRequest www = UnityWebRequestTexture.GetTexture(uri))
		{
			yield return www.SendWebRequest();
			if (!www.isNetworkError)
			{
				Texture2D content = DownloadHandlerTexture.GetContent(www);
				float num = MaxWidth / (float)content.width;
				float num2 = MaxHeight / (float)content.height;
				int newWidth;
				int newHeight;
				if (num > num2)
				{
					newWidth = (int)Mathf.Floor((float)content.width * num2);
					newHeight = (int)Mathf.Floor((float)content.height * num2);
				}
				else
				{
					newWidth = (int)Mathf.Floor((float)content.width * num);
					newHeight = (int)Mathf.Floor((float)content.height * num);
				}
				content = resizeTextures.ThreadedScale(content, newWidth, newHeight, useBilinear: false);
				Sprite sprite = Sprite.Create(content, new Rect(0f, 0f, content.width, content.height), Vector2.zero);
				editTeamPrefab.PhotoLoaded(sprite);
				www.Dispose();
			}
		}
		callBack?.Invoke();
		yield return null;
	}

	private void FinishedLoading()
	{
		Resources.UnloadUnusedAssets();
	}

	public void CancelPhotoAndPicker()
	{
		Resources.UnloadUnusedAssets();
	}

	public void SetFullScreenPanel(bool isShow)
	{
		fullScreenPanel.SetActive(isShow);
		fullImage.SetActive(isShow);
	}

	public IEnumerator LoadGifFile(string path)
	{
		yield return null;
	}

	public void LoadCaptureTexture(string path, Texture2D texture2D, int width, int height)
	{
	}

	public void LoadVideo(string path)
	{
	}

	public void AddVideo(string path, string fileType)
	{
	}
}
