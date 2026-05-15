using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Toggle))]
public class AddOnValueChangedGraphics : MonoBehaviour
{
	public Graphic[] selectedGraphics;

	private Toggle toggle;

	private void Awake()
	{
		if (selectedGraphics.Length >= 0)
		{
			toggle = GetComponent<Toggle>();
			toggle.onValueChanged.AddListener(OnToggle);
			for (int i = 0; i < selectedGraphics.Length; i++)
			{
				selectedGraphics[i].enabled = false;
			}
		}
	}

	public void OnToggle(bool active)
	{
		for (int i = 0; i < selectedGraphics.Length; i++)
		{
			selectedGraphics[i].enabled = active;
		}
	}
}
