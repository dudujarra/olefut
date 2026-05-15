using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace MediaPicker;

public class ImageFitter : MonoBehaviour
{
	public RawImage rawImage;

	public Text imagePath;

	private AspectRatioFitter aspectRatioFitter;

	public Vector2 cellSize = Vector2.one;

	private void Start()
	{
		rawImage.rectTransform.sizeDelta = cellSize;
		base.gameObject.AddComponent<Button>().onClick.AddListener(delegate
		{
			ImageFullScreen();
		});
	}

	private void ImageFullScreen()
	{
		Debug.Log("[ImageFullScreen] image path: " + imagePath.text);
		LoadPicture(imagePath.text);
	}

	public void SizeToFitImage(Texture2D texture2D)
	{
		Vector2 vector = new Vector2(texture2D.width, texture2D.height);
		aspectRatioFitter = rawImage.GetComponent<AspectRatioFitter>();
		aspectRatioFitter.aspectMode = AspectRatioFitter.AspectMode.None;
		aspectRatioFitter.aspectRatio = vector.x / vector.y;
	}

	private void LoadPicture(string path)
	{
		StartCoroutine(LoadTexture(path, finishedLoading));
	}

	private IEnumerator LoadTexture(string path, Action callBack = null)
	{
		string text = "file://" + path;
		Debug.Log("[LoadTexture] url: " + text);
		using (UnityWebRequest www = UnityWebRequestTexture.GetTexture(text))
		{
			yield return www.SendWebRequest();
			if (www.isNetworkError)
			{
				Debug.Log("[LoadTexture] www.error: " + www.error);
			}
			else
			{
				Texture2D content = DownloadHandlerTexture.GetContent(www);
				MediaPickerController.Instance.SetFullScreenPanel(isShow: true);
				MediaPickerController.Instance.fullImage.GetComponent<RawImage>().texture = content;
				Vector2 vector = new Vector2(content.width, content.height);
				AspectRatioFitter component = MediaPickerController.Instance.fullImage.GetComponent<AspectRatioFitter>();
				component.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
				component.aspectRatio = vector.x / vector.y;
			}
		}
		Resources.UnloadUnusedAssets();
		callBack?.Invoke();
		yield return null;
	}

	private void finishedLoading()
	{
		Debug.Log("[finishedLoading] Finished Copying Texture");
		MediaPickerController.Instance.SetFullScreenPanel(isShow: true);
	}

	public void FullImageOff()
	{
		MediaPickerController.Instance.SetFullScreenPanel(isShow: false);
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
}
