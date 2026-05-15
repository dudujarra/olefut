using System;
using UnityEngine;
using UnityEngine.UI;

public class LeaguePrefab : MonoBehaviour
{
	public Toggle toggle;

	public AddTargetGraphics addTargetGraphics;

	public AddOnValueChangedGraphics toggleAddOns;

	[Space]
	public GameObject alertIcon;

	public Image flag;

	public Text countryName;

	public Text numberOfTeams;

	[ReadOnly]
	public int countryIndex;

	[ReadOnly]
	public string countryCode;

	[ReadOnly]
	public int numberOfTeamsCount;

	private Action toggleAction;

	public void Initialize(Sprite flag, string countryName, int numberOfTeams, int countryIndex, string countryCode, Action toggleAction, bool isInteractable)
	{
		this.flag.sprite = flag;
		this.countryName.text = countryName;
		this.numberOfTeams.text = numberOfTeams.ToString();
		numberOfTeamsCount = numberOfTeams;
		this.countryIndex = countryIndex;
		this.countryCode = countryCode;
		this.toggleAction = toggleAction;
		toggle.SetIsOnWithoutNotify(isInteractable);
		toggleAddOns.OnToggle(isInteractable);
		if (!isInteractable)
		{
			toggle.interactable = false;
			addTargetGraphics.ChangeToDisabledState(includeEliComponents: false);
		}
		alertIcon.SetActive(value: false);
	}

	public void TogglePressed()
	{
		toggleAction?.Invoke();
	}

	public void CheckAlertStatus(int teamsPerDivision)
	{
		alertIcon.SetActive(numberOfTeamsCount < teamsPerDivision);
	}
}
