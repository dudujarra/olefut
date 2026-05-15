using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class TopPrefab : MonoBehaviour
{
	public Button button;

	public GameObject selectedBackground;

	public Image flag;

	public TMP_Text topName;

	public void Initialize(Sprite flag, string name, int index = 0, Action<TopPrefab, int, bool> clickAction = null)
	{
		this.flag.sprite = flag;
		topName.text = name;
		if (clickAction != null)
		{
			button.onClick.AddListener(delegate
			{
				clickAction(this, index, arg3: true);
			});
		}
	}

	public void Select()
	{
		selectedBackground.SetActive(value: true);
	}

	public void DeSelect()
	{
		selectedBackground.SetActive(value: false);
	}
}
