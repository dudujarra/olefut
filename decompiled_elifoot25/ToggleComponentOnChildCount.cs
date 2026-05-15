using System.Collections.Generic;
using UnityEngine;

public class ToggleComponentOnChildCount : MonoBehaviour
{
	[Header("References")]
	[SerializeField]
	private List<MonoBehaviour> componentsToToggleOn;

	[SerializeField]
	private List<MonoBehaviour> componentsToToggleOff;

	[SerializeField]
	private Transform childContainer;

	[Header("Settings")]
	[SerializeField]
	private int minChildCount;

	private void Update()
	{
		if (childContainer.childCount < minChildCount)
		{
			ToggleComponents(enable: false);
		}
		else
		{
			ToggleComponents(enable: true);
		}
	}

	private void ToggleComponents(bool enable)
	{
		foreach (MonoBehaviour item in componentsToToggleOn)
		{
			item.enabled = enable;
		}
		foreach (MonoBehaviour item2 in componentsToToggleOff)
		{
			item2.enabled = !enable;
		}
	}
}
