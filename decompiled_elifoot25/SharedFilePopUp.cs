using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

public class SharedFilePopUp : EliView
{
	[Header("Data")]
	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbTeams teamsUpdate;

	[Header("Author things")]
	public InputField fileAuthor;

	public InputField fileEmail;

	public InputField fileWebsite;

	[Header("File things")]
	public InputField fileName;

	public InputField fileTitle;

	public InputField fileDescription;

	public Toggle includeLogosToggle;

	public GameObject forceLogosConvertObj;

	public Toggle forceLogosConvertToggle;

	[Header("Footer")]
	public Button okButton;

	public AddTargetGraphics addTargetGraphics;

	private EditTeamsView editTeamsView20;

	private string countryCodes;

	private string regionCodes;

	private string confederationCodes;

	private List<string> countryCodesList = new List<string>();

	private List<string> regionCodesList = new List<string>();

	private List<string> confederationCodesList = new List<string>();

	public void Initialize(EditTeamsView editTeamsView20)
	{
		this.editTeamsView20 = editTeamsView20;
		FillCodesLists();
		if (this.editTeamsView20.autoCreatePackages)
		{
			AutoFill();
			return;
		}
		fileAuthor.text = teams.fileAuthor;
		fileEmail.text = teams.fileEmail;
		fileWebsite.text = teams.fileWebsite;
		ElifootOptions.includeLogosOnPackages |= this.editTeamsView20.autoCreatePackages;
		includeLogosToggle.SetIsOnWithoutNotify(ElifootOptions.includeLogosOnPackages);
		forceLogosConvertObj.SetActive(value: false);
		Invoke("CheckRequiredFields", 0.01f);
	}

	private void AutoFill()
	{
		fileAuthor.text = "Elifoot";
		fileEmail.text = "info@elifoot.net";
		fileWebsite.text = "www.elifoot.com";
		includeLogosToggle.isOn = true;
		fileTitle.text = editTeamsView20.autoCreateFileTitle;
		fileDescription.text = editTeamsView20.autoCreateFileDescription;
		fileName.text = editTeamsView20.autoCreateFileName;
		okButton.onClick.Invoke();
	}

	private void FillCodesLists()
	{
		countryCodesList = (from t in teamsUpdate.AllTeams.Select((DbTeams.DbTeam team) => team.countryCode).Distinct()
			orderby t
			select t).ToList();
		countryCodes = string.Join(",", countryCodesList);
		confederationCodesList = (from t in teamsUpdate.AllTeams.Select((DbTeams.DbTeam team) => LoadAndSavingTeams.instance.countries.allCountries[team.CountryIndex].confederationCode).Distinct()
			orderby t
			select t).ToList();
		confederationCodes = string.Join(",", confederationCodesList);
		if (countryCodesList.Count == 1)
		{
			regionCodesList = (from t in teamsUpdate.AllTeams.Select((DbTeams.DbTeam team) => team.regionCode).Distinct()
				orderby t
				select t).ToList();
			regionCodes = string.Join(",", regionCodesList);
		}
	}

	public void CheckRequiredFields()
	{
		bool flag = fileAuthor.text != "";
		flag &= fileName.text != "";
		flag &= fileTitle.text != "";
		okButton.interactable = flag;
		if (okButton.interactable)
		{
			addTargetGraphics.ChangeToNormalState();
		}
		else
		{
			addTargetGraphics.ChangeToDisabledState();
		}
	}

	public void VButton()
	{
		teams.fileAuthor = fileAuthor.text;
		teams.fileEmail = fileEmail.text;
		teams.fileWebsite = fileWebsite.text;
		LoadAndSavingTeams.instance.SaveTeams();
		CheckExcludeLogos();
		editTeamsView20.SendingSharedTeams(fileAuthor.text, fileEmail.text, fileWebsite.text, fileName.text, fileTitle.text, fileDescription.text, countryCodes, regionCodes, confederationCodes);
		base.Close();
	}

	private void CheckExcludeLogos()
	{
		if (!ElifootOptions.includeLogosOnPackages)
		{
			for (int i = 0; i < teamsUpdate.AllTeams.Count; i++)
			{
				DbTeams.DbTeam value = teamsUpdate.AllTeams[i];
				value.Logo = null;
				value.savedLogoBytes = null;
				teamsUpdate.AllTeams[i] = value;
			}
		}
	}

	public void IncludeLogos()
	{
		ElifootOptions.includeLogosOnPackages = includeLogosToggle.isOn;
		ElifootOptions.SaveOptions();
	}

	public void ForceLogosConvert()
	{
	}

	public override void Close()
	{
		base.Close();
		editTeamsView20.enabled = true;
	}
}
