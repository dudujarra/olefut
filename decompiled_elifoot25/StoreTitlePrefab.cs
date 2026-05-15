using UnityEngine;
using UnityEngine.UI;

public class StoreTitlePrefab : MonoBehaviour
{
	public Text title;

	public void Initialize(string translatedTitle)
	{
		title.text = translatedTitle;
	}
}
