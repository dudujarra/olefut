using System;
using UnityEngine;
using UnityEngine.UI;

public class NewTeamPrefab : MonoBehaviour
{
	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbTeams teamsUpdated;

	public DbCountries countries;

	public Image countryFlag;

	public Image regionFlag;

	public Text teamName;

	public Image background;

	[Header("Status")]
	public GameObject SameTeam;

	public GameObject NewTeam;

	public GameObject UpdatedTeam;

	public GameObject DowngradeTeam;

	public GameObject ConflictTeam;

	[Header("Button/Toggle")]
	public Button button;

	public Toggle toggle;

	public AddOnValueChangedGraphics toggleAddOns;

	public GameObject disableForeground;

	[ReadOnly]
	public int teamResolutionIndex;

	private Color oddColor;

	private Color evenColor;

	private Action onToggleAction;

	public void Initialize(int teamResolutionIndex, Action onClickAction, Action onToggleAction, bool isVerified)
	{
		this.teamResolutionIndex = teamResolutionIndex;
		LoadTeamsConflicts.TeamsResolution teamsResolution = LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex];
		oddColor = ConfigManager.instance.COLOR_OBSCURE_LIST_LIGHT;
		evenColor = ConfigManager.instance.COLOR_OBSCURE_LIST_DARK;
		background.color = ((base.transform.GetSiblingIndex() % 2 == 0) ? evenColor : oddColor);
		if (teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Same)
		{
			UpdateTeamInfo(teamsUpdated, teamsResolution.teamsUpdateIndex, isVerified: false);
			button.enabled = false;
			toggle.interactable = false;
			toggle.SetIsOnWithoutNotify(value: true);
			toggleAddOns.OnToggle(active: true);
			ToggleVerified();
			disableForeground.SetActive(value: true);
		}
		else if (teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.New || teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Updated)
		{
			UpdateTeamInfo(teamsUpdated, teamsResolution.teamsUpdateIndex, isVerified: false);
		}
		else if (teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Downgrade || teamsResolution.status == LoadTeamsConflicts.TeamsResolution.Status.Conflict)
		{
			UpdateTeamInfo(teams, teamsResolution.teamsIndex, isVerified: false);
		}
		button.onClick.AddListener(onClickAction.Invoke);
		this.onToggleAction = onToggleAction;
		if (isVerified)
		{
			ConfirmConflict();
		}
	}

	private void UpdateTeamInfo(DbTeams teamsSelected, int index, bool isVerified)
	{
		DbTeams.DbTeam team = teamsSelected.AllTeams[index];
		LoadTeamsConflicts.TeamsResolution value = LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex];
		value.isVerifiedToChange = isVerified;
		LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex] = value;
		teamName.text = team.shortName;
		countryFlag.sprite = countries.GetCountryFlag(team.CountryIndex);
		regionFlag.sprite = countries.GetRegionFlag(team.CountryIndex, team.RegionIndex);
		regionFlag.color = (RegionFlagShouldAppear(team) ? Color.white : Color.clear);
		LoadTeamsConflicts.TeamsResolution.Status status = LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].status;
		ChangeStatus(status);
	}

	private bool RegionFlagShouldAppear(DbTeams.DbTeam team)
	{
		if (team.CountryIndex >= 0 && team.CountryIndex < countries.allCountries.Count)
		{
			return countries.allCountries[team.CountryIndex].regions.Count > 0;
		}
		return false;
	}

	private void ChangeStatus(LoadTeamsConflicts.TeamsResolution.Status status)
	{
		SameTeam.SetActive(status == LoadTeamsConflicts.TeamsResolution.Status.Same);
		NewTeam.SetActive(status == LoadTeamsConflicts.TeamsResolution.Status.New);
		UpdatedTeam.SetActive(status == LoadTeamsConflicts.TeamsResolution.Status.Updated);
		DowngradeTeam.SetActive(status == LoadTeamsConflicts.TeamsResolution.Status.Downgrade);
		ConflictTeam.SetActive(status == LoadTeamsConflicts.TeamsResolution.Status.Conflict);
	}

	public void ToggleVerified()
	{
		UpdateTeamInfo(teamsUpdated, LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].teamsUpdateIndex, toggle.isOn);
		onToggleAction?.Invoke();
	}

	public void ToggleVerified2()
	{
		UpdateTeamInfo(teamsUpdated, LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].teamsUpdateIndex, toggle.isOn);
	}

	public void NegateConflict()
	{
		toggle.isOn = false;
		if (LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].status == LoadTeamsConflicts.TeamsResolution.Status.New)
		{
			UpdateTeamInfo(teamsUpdated, LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].teamsUpdateIndex, isVerified: false);
		}
		else
		{
			UpdateTeamInfo(teams, LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].teamsIndex, isVerified: false);
		}
	}

	public void ConfirmConflict()
	{
		toggle.isOn = true;
		UpdateTeamInfo(teamsUpdated, LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex].teamsUpdateIndex, isVerified: true);
	}

	public void ChangeConflictToNewStatus()
	{
		LoadTeamsConflicts.TeamsResolution value = LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex];
		value.status = LoadTeamsConflicts.TeamsResolution.Status.New;
		LoadTeamsConflicts.instance.teamsResolution[teamResolutionIndex] = value;
		DbTeams.DbTeam dbTeam = teams.AllTeams[value.teamsIndex];
		DbTeams.DbTeam value2 = teamsUpdated.AllTeams[value.teamsUpdateIndex];
		if (dbTeam.teamID == value2.teamID || teams.AlreadyHasThisTeamID(value2.teamID))
		{
			value2.PreviousTeamIDs.Add(value2.teamID);
			value2.teamID = Guid.NewGuid().ToString();
			teamsUpdated.AllTeams[value.teamsUpdateIndex] = value2;
		}
	}
}
