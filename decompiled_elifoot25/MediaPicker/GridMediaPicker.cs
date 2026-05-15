using UnityEngine;
using UnityEngine.UI;

namespace MediaPicker;

public class GridMediaPicker : MonoBehaviour
{
	public static GridMediaPicker Instance;

	public GameObject imagePrefab;

	public GameObject videoPrefab;

	public GameObject gifPrefab;

	private void Awake()
	{
		Instance = this;
	}

	public void AddImage(string path, Texture2D texture2D)
	{
		GameObject obj = Object.Instantiate(imagePrefab, base.transform);
		obj.GetComponentInChildren<Text>().text = path;
		obj.GetComponent<RawImage>().texture = texture2D;
		obj.GetComponent<ImageFitter>().SizeToFitImage(texture2D);
	}

	public void AddVideo(string path, string mimeType)
	{
		Object.Instantiate(videoPrefab, base.transform).GetComponentInChildren<Text>().text = path;
	}

	public void AddGifImage(string path)
	{
		Debug.Log("[AddGifImage] filePath: " + path);
		UniGifImage componentInChildren = Object.Instantiate(gifPrefab, base.transform).GetComponentInChildren<UniGifImage>();
		componentInChildren.imagePath.text = path;
		StartCoroutine(componentInChildren.SetGifFromUrlCoroutine(path, autoPlay: false));
	}

	public void CearAllMediaItems()
	{
		foreach (Transform item in base.transform)
		{
			Object.Destroy(item.gameObject);
		}
		MediaPickerController.Instance.totalImageCount = 0;
		MediaPickerController.Instance.totalVideoCount = 0;
		UIManager.Instance.ShowGrid(isShow: false);
	}
}
