using UnityEngine;
using UnityEngine.UI;

public class SharedPrefab : MonoBehaviour
{
	public Button button;

	public GameObject toggleGameObject;

	public Toggle toggle;

	public void ChangeModeToToggle()
	{
		button.enabled = false;
		toggle.enabled = true;
		toggleGameObject.SetActive(value: true);
		toggle.isOn = false;
	}

	public void ChangeModeToButton()
	{
		button.enabled = true;
		toggle.enabled = false;
		toggleGameObject.SetActive(value: false);
	}
}
