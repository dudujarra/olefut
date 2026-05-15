using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

public class PackageLoadedPopUp : EliView
{
	[Header("References")]
	[SerializeField]
	private Text teamCount;

	[SerializeField]
	private Text title;

	[SerializeField]
	private Text author;

	[SerializeField]
	private Text email;

	[SerializeField]
	private Text website;

	[SerializeField]
	private Text fileDescription;

	[SerializeField]
	private Text date;

	[SerializeField]
	private RectTransform countriesList;

	[SerializeField]
	private RectTransform regionsList;

	[SerializeField]
	private GameObject regionsParent;

	[SerializeField]
	private CountryAlertPrefab countryAlertPrefab;

	private Action yesAction;

	internal void Initialize(DbTeams update, List<DbCountries.DbCountry> countries, Action yesAction = null)
	{
		title.text = update.fileTitle;
		author.text = update.fileAuthor;
		email.text = update.fileEmail;
		website.text = update.fileWebsite;
		fileDescription.text = update.fileDescription;
		date.text = $"{update.FileDate.Date:dd-MMM-yyyy}";
		teamCount.text = update.AllTeams.Count.ToString();
		this.yesAction = yesAction;
		CreateCountriesList(countries, update);
	}

	private void CreateCountriesList(List<DbCountries.DbCountry> countries, DbTeams update)
	{
		for (int i = 0; i < countriesList.childCount; i++)
		{
			UnityEngine.Object.Destroy(countriesList.GetChild(i).gameObject);
		}
		foreach (DbCountries.DbCountry country in countries)
		{
			UnityEngine.Object.Instantiate(countryAlertPrefab, countriesList).Initialize(country);
		}
		if (countries.Count == 1 && countries[0].canSearchByRegion)
		{
			regionsParent.SetActive(value: true);
			for (int j = 0; j < regionsList.childCount; j++)
			{
				UnityEngine.Object.Destroy(regionsList.GetChild(j).gameObject);
			}
			{
				foreach (DbCountries.DbRegion item in countries[0].regions.Where((DbCountries.DbRegion region) => update.AllTeams.Any((DbTeams.DbTeam team) => team.regionCode == region.code)).ToList())
				{
					UnityEngine.Object.Instantiate(countryAlertPrefab, regionsList).Initialize(item);
				}
				return;
			}
		}
		regionsParent.SetActive(value: false);
	}

	public void YesButton()
	{
		yesAction?.Invoke();
		Close();
	}
}
