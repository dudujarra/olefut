using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class NewTeamCountryRegionPrefab : MonoBehaviour
{
	public DbTeams teamsUpdate;

	public Button button;

	public Image flag;

	public Text nameOf;

	public Text numberOfTeamsText;

	public Toggle toggle;

	public AddOnValueChangedGraphics toggleAddOns;

	public GameObject SomeCheckImage;

	private int countryIndex;

	private int regionIndex;

	private int numberOfTeams;

	private Action onToggleAction;

	public void Initialize(Sprite flag, int countryIndex, int regionIndex, string name, int numberOfTeamsSelected, int numberOfTeams, Action onClickAction, Action onToggleAction)
	{
		this.countryIndex = countryIndex;
		this.regionIndex = regionIndex;
		this.numberOfTeams = numberOfTeams;
		this.flag.sprite = flag;
		nameOf.text = name;
		InsertNumberOfTeams(numberOfTeamsSelected, numberOfTeams);
		button.onClick.AddListener(onClickAction.Invoke);
		toggle.interactable = regionIndex != -1;
		this.onToggleAction = onToggleAction;
	}

	private void InsertNumberOfTeams(int numberOfTeamsSelected, int numberOfTeams)
	{
		numberOfTeamsText.text = $"{numberOfTeamsSelected}/{numberOfTeams}";
		if (numberOfTeamsSelected == 0)
		{
			if (toggle.isOn)
			{
				SetToggle(isOn: false);
			}
			SomeCheckImage.SetActive(value: false);
		}
		else if (numberOfTeamsSelected == numberOfTeams)
		{
			if (!toggle.isOn)
			{
				SetToggle(isOn: true);
			}
			SomeCheckImage.SetActive(value: false);
		}
		else
		{
			if (toggle.isOn)
			{
				SetToggle(isOn: false);
			}
			SomeCheckImage.SetActive(value: true);
		}
	}

	private void SetToggle(bool isOn)
	{
		toggle.SetIsOnWithoutNotify(isOn);
		toggleAddOns.OnToggle(isOn);
	}

	public void SelectAllTeamsFromCountryOrRegion()
	{
		VerifyToggleState();
		onToggleAction?.Invoke();
	}

	public void VerifyToggleState()
	{
		if (toggle.isOn)
		{
			AllVerified(verified: true);
			InsertNumberOfTeams(numberOfTeams, numberOfTeams);
		}
		else
		{
			AllVerified(verified: false);
			InsertNumberOfTeams(0, numberOfTeams);
		}
	}

	private void AllVerified(bool verified)
	{
		List<LoadTeamsConflicts.TeamsResolution> teamsResolution = LoadTeamsConflicts.instance.teamsResolution;
		for (int i = 0; i < teamsResolution.Count; i++)
		{
			if (teamsUpdate.AllTeams[teamsResolution[i].teamsUpdateIndex].CountryIndex == countryIndex && (regionIndex == -1 || teamsUpdate.AllTeams[teamsResolution[i].teamsUpdateIndex].RegionIndex == regionIndex))
			{
				List<LoadTeamsConflicts.TeamsResolution> teamsResolution2 = LoadTeamsConflicts.instance.teamsResolution;
				LoadTeamsConflicts.TeamsResolution value = teamsResolution2[i];
				value.isVerifiedToChange = verified;
				teamsResolution2[i] = value;
			}
		}
	}
}
