using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading;
using MediaPicker;
using UnityEngine;
using UnityEngine.UI;

public class UniGifImage : MonoBehaviour
{
	public enum State
	{
		None,
		Loading,
		Ready,
		Playing,
		Pause
	}

	[SerializeField]
	private RawImage m_rawImage;

	[SerializeField]
	private UniGifImageAspectController m_imgAspectCtrl;

	[SerializeField]
	private FilterMode m_filterMode;

	[SerializeField]
	private TextureWrapMode m_wrapMode = TextureWrapMode.Clamp;

	[SerializeField]
	private bool m_outputDebugLog;

	private List<UniGif.GifTexture> m_gifTextureList;

	public Text imagePath;

	private static UniGifImage _instance;

	public List<LoadGifImage.GifFrame> frames;

	public List<ushort> m_delayFrameTime = new List<ushort>();

	private bool closePlay;

	[NonSerialized]
	public List<Texture2D> m_listText = new List<Texture2D>();

	[NonSerialized]
	public List<Sprite> m_sprite = new List<Sprite>();

	private float Texture_Max_Size = 256f;

	public State nowState { get; private set; }

	public int loopCount { get; private set; }

	public int width { get; private set; }

	public int height { get; private set; }

	public static UniGifImage Instance
	{
		get
		{
			if (_instance == null)
			{
				_instance = new UniGifImage();
			}
			return _instance;
		}
	}

	protected UniGifImage()
	{
	}

	protected void Awake()
	{
		_instance = this;
	}

	private void Start()
	{
		if (UIManager.Instance.currentScene != UIManager.SceneState.MediaPopup && m_rawImage == null)
		{
			m_rawImage = GetComponent<RawImage>();
			Color color = m_rawImage.color;
			color.a = 0f;
			m_rawImage.color = color;
		}
		if (UIManager.Instance.currentScene == UIManager.SceneState.MainGridScene && frames != null)
		{
			frames.Clear();
			m_listText.Clear();
			m_sprite.Clear();
			closePlay = false;
			if (m_rawImage != null)
			{
				Color color2 = m_rawImage.color;
				color2.a = 0f;
				m_rawImage.color = color2;
			}
			if (LoadGifImage.Instance.imageGIF.color.a >= 0.5f)
			{
				Color color3 = LoadGifImage.Instance.imageGIF.color;
				color3.a = 0f;
				LoadGifImage.Instance.imageGIF.color = color3;
			}
			m_delayFrameTime.Clear();
			LoadGifImage.Instance.ClearData();
		}
	}

	public void LoadingGifImageByFile()
	{
		Debug.Log("[LoadingGifImageByFile] Clicked Button! width: " + width + ", height: " + height);
		UIManager.Instance.SetSceneState(UIManager.SceneState.MediaPopup);
		MediaPickerController.Instance.fullScreenPanel.SetActive(value: true);
		Sprite sprite = Sprite.Create((Texture2D)m_rawImage.texture, new Rect(0f, 0f, m_rawImage.texture.width, m_rawImage.texture.height), Vector2.zero, 1f);
		LoadGifImage.Instance.imageGIF.sprite = sprite;
		if (LoadGifImage.Instance.imageGIF.color.a <= 0.5f)
		{
			Color color = LoadGifImage.Instance.imageGIF.color;
			color.a = 1f;
			LoadGifImage.Instance.imageGIF.color = color;
		}
		SizeToFitImage(LoadGifImage.Instance.imageGIF.sprite);
		LoadGifImage.Instance.imageGIF.raycastTarget = true;
	}

	public void MediaPopupOff()
	{
		Debug.Log("[MediaPopupOff] Clicked Button! width: " + width + ", height: " + height);
		if (LoadGifImage.Instance.imageGIF.color.a >= 0.5f)
		{
			Color color = LoadGifImage.Instance.imageGIF.color;
			color.a = 0f;
			LoadGifImage.Instance.imageGIF.color = color;
		}
		LoadGifImage.Instance.imageGIF.raycastTarget = false;
		LoadGifImage.Instance.imageGIF.sprite = null;
		MediaPickerController.Instance.fullScreenPanel.SetActive(value: false);
		UIManager.Instance.SetSceneState(UIManager.SceneState.MainGridScene);
	}

	private Texture2D ScaleTexture(Texture2D source, int targetWidth, int targetHeight)
	{
		Texture2D texture2D = new Texture2D(targetWidth, targetHeight, source.format, mipChain: true);
		Color[] pixels = texture2D.GetPixels(0);
		float num = 1f / (float)targetWidth;
		float num2 = 1f / (float)targetHeight;
		for (int i = 0; i < pixels.Length; i++)
		{
			pixels[i] = source.GetPixelBilinear(num * ((float)i % (float)targetWidth), num2 * Mathf.Floor(i / targetWidth));
		}
		texture2D.SetPixels(pixels, 0);
		texture2D.Apply();
		return texture2D;
	}

	public void CopyFrame(Texture2D texture, int width, int height)
	{
		Debug.Log("[CopyFrame] Sceen State: " + UIManager.Instance.currentScene);
		if (UIManager.Instance.currentScene == UIManager.SceneState.MainGridScene)
		{
			float num = texture.width;
			float num2 = texture.height;
			float num6;
			float num7;
			if (num > Texture_Max_Size || num2 > Texture_Max_Size)
			{
				float num3 = num / Texture_Max_Size;
				float num4 = num2 / Texture_Max_Size;
				if (num3 > num4)
				{
					float num5 = num3;
					num6 = Texture_Max_Size;
					num7 = Mathf.Round(num2 / num5);
				}
				else
				{
					float num5 = num4;
					num7 = Texture_Max_Size;
					num6 = Mathf.Round(num / num5);
				}
			}
			else
			{
				num6 = num;
				num7 = num2;
			}
			Debug.Log("[CopyFrame] textureWidth: " + num + ", textureHeight: " + num2 + ", finalWidth: " + num6 + ", finalHeight: " + num7);
			m_rawImage.texture = ScaleTexture(texture, (int)num6, (int)num7);
			if (m_rawImage.color.a <= 0.5f)
			{
				Color color = m_rawImage.color;
				color.a = 1f;
				m_rawImage.color = color;
			}
			m_imgAspectCtrl.FixAspectRatio(width, height);
		}
		this.width = width;
		this.height = height;
	}

	public void SizeToFitImage(Sprite sprite)
	{
		Vector2 vector = sprite.bounds.size;
		AspectRatioFitter component = LoadGifImage.Instance.imageGIF.GetComponent<AspectRatioFitter>();
		component.aspectMode = AspectRatioFitter.AspectMode.WidthControlsHeight;
		component.aspectRatio = vector.x / vector.y;
	}

	public void SizeToFitTexture2D(Texture2D texture)
	{
		Vector2 vector = new Vector2(texture.width, texture.height);
		AspectRatioFitter component = MediaPickerController.Instance.fullImage.GetComponent<AspectRatioFitter>();
		component.aspectMode = AspectRatioFitter.AspectMode.WidthControlsHeight;
		component.aspectRatio = vector.x / vector.y;
	}

	public void SetDelayTime(ushort delayTime)
	{
		m_delayFrameTime.Add(delayTime);
	}

	private void Flush(UnityEngine.Object obj)
	{
		UnityEngine.Object.Destroy(obj);
	}

	public void StartPlayGif(string file)
	{
		string filePath = "file://" + file;
		LoadGifImage.GIFMaker gIFMaker = new LoadGifImage.GIFMaker(System.Threading.ThreadPriority.Highest);
		gIFMaker.m_Frames = frames;
		gIFMaker.m_FilePath = filePath;
		gIFMaker.m_OnFileSaveProgress = null;
		gIFMaker.Start();
		DOStart(_andShowButton: true);
	}

	public void DOStart(bool _andShowButton)
	{
		StopAllCoroutines();
		if (_andShowButton)
		{
			StartCoroutine(AnimListTexture());
		}
	}

	public IEnumerator AnimListTexture()
	{
		int index = 0;
		Debug.Log("[AnimListTexture] imageGIF size X: " + LoadGifImage.Instance.imageGIF.rectTransform.sizeDelta.x + ", Y: " + LoadGifImage.Instance.imageGIF.rectTransform.sizeDelta.y);
		while (true)
		{
			foreach (Sprite item in m_sprite)
			{
				LoadGifImage.Instance.imageGIF.sprite = item;
				float seconds = (float)(int)m_delayFrameTime[index] / 100f;
				index++;
				if (index >= frames.Count)
				{
					index = 0;
				}
				if (closePlay)
				{
					closePlay = false;
					break;
				}
				yield return new WaitForSeconds(seconds);
			}
			yield return null;
		}
	}

	public void ShowAlbumEditPopup()
	{
		Debug.Log("[ShowAlbumEditPopup] click Button!");
	}

	private void OnDestroy()
	{
		Clear();
	}

	public IEnumerator SetGifFromUrlCoroutine(string url, bool autoPlay = true)
	{
		if (string.IsNullOrEmpty(url))
		{
			Debug.LogError("URL is nothing.");
			yield break;
		}
		if (nowState == State.Loading)
		{
			Debug.LogWarning("Already loading: " + url);
			yield break;
		}
		nowState = State.Loading;
		string text = ((!url.StartsWith("http")) ? url : url);
		Debug.Log("[SetGifFromUrlCoroutine] path; " + text);
		using (WWW www = new WWW(text))
		{
			yield return www;
			if (!string.IsNullOrEmpty(www.error))
			{
				Debug.LogError("File load error.\n" + www.error);
				nowState = State.None;
				yield break;
			}
			Clear();
			nowState = State.Loading;
			if (autoPlay)
			{
				yield return StartCoroutine(UniGif.GetTextureListCoroutine(www.bytes, delegate(List<UniGif.GifTexture> gifTexList, int loopCount, int width, int height)
				{
					if (gifTexList != null)
					{
						m_gifTextureList = gifTexList;
						this.loopCount = loopCount;
						this.width = width;
						this.height = height;
						nowState = State.Ready;
						Play();
					}
					else
					{
						Debug.LogError("Gif texture get error.");
						nowState = State.None;
					}
				}, this, m_filterMode, m_wrapMode, m_outputDebugLog));
				Debug.Log("[SetGifFromUrlCoroutine] full image done!");
			}
			else
			{
				yield return StartCoroutine(UniGif.GetDefaultTextureListCoroutine(www.bytes, delegate(List<UniGif.GifTexture> gifTexList, int loopCount, int width, int height)
				{
					if (gifTexList != null)
					{
						m_gifTextureList = gifTexList;
						this.loopCount = loopCount;
						this.width = width;
						this.height = height;
						nowState = State.Ready;
						Play();
					}
					else
					{
						Debug.LogError("Gif texture get error.");
						nowState = State.None;
					}
				}, this, m_filterMode, m_wrapMode, m_outputDebugLog));
				Debug.Log("[SetGifFromUrlCoroutine] 1st image done!");
			}
		}
		Resources.UnloadUnusedAssets();
	}

	public void Clear()
	{
		closePlay = true;
		StopAllCoroutines();
		if (UIManager.Instance.currentScene == UIManager.SceneState.MainGridScene && m_rawImage != null)
		{
			m_rawImage.texture = null;
		}
		if (m_gifTextureList != null)
		{
			for (int i = 0; i < m_gifTextureList.Count; i++)
			{
				if (m_gifTextureList[i] != null)
				{
					if (m_gifTextureList[i].m_texture2d != null)
					{
						UnityEngine.Object.Destroy(m_gifTextureList[i].m_texture2d);
						m_gifTextureList[i].m_texture2d = null;
					}
					m_gifTextureList[i] = null;
				}
			}
			m_gifTextureList.Clear();
			m_gifTextureList = null;
		}
		nowState = State.None;
		if (frames != null)
		{
			frames.Clear();
			m_listText.Clear();
			m_sprite.Clear();
			if (LoadGifImage.Instance.imageGIF.color.a >= 0.5f)
			{
				Color color = LoadGifImage.Instance.imageGIF.color;
				color.a = 0f;
				LoadGifImage.Instance.imageGIF.color = color;
			}
			m_delayFrameTime.Clear();
			LoadGifImage.Instance.ClearData();
		}
	}

	public void Play()
	{
		if (nowState != State.Ready)
		{
			Debug.LogWarning("State is not READY.");
			return;
		}
		if (m_rawImage == null || m_gifTextureList == null || m_gifTextureList.Count <= 0)
		{
			Debug.LogError("Raw Image or GIF Texture is nothing.");
			return;
		}
		nowState = State.Playing;
		m_rawImage.texture = m_gifTextureList[0].m_texture2d;
	}

	public void Stop()
	{
		if (nowState != State.Playing && nowState != State.Pause)
		{
			Debug.LogWarning("State is not Playing and Pause.");
		}
		else
		{
			nowState = State.Ready;
		}
	}

	public void Pause()
	{
		if (nowState != State.Playing)
		{
			Debug.LogWarning("State is not Playing.");
		}
		else
		{
			nowState = State.Pause;
		}
	}

	public void Resume()
	{
		if (nowState != State.Pause)
		{
			Debug.LogWarning("State is not Pause.");
		}
		else
		{
			nowState = State.Playing;
		}
	}
}
