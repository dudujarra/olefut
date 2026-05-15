using System;
using UnityEngine;
using UnityEngine.UI;

public class TopYearPrefab : MonoBehaviour
{
	public Button button;

	public GameObject selectedBackground;

	public Text year;

	public void Initialize(int year, int index = 0, Action<TopYearPrefab, int> clickAction = null)
	{
		this.year.text = year.ToString();
		if (clickAction != null)
		{
			button.onClick.AddListener(delegate
			{
				clickAction(this, index);
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
