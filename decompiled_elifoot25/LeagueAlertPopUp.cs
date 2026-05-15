using System;
using System.Collections.Generic;
using UnityEngine;

public class LeagueAlertPopUp : EliView
{
	public RectTransform includedCountriesList;

	public RectTransform excludedCountriesList;

	public CountryAlertPrefab countryAlertPrefab;

	private Action yesAction;

	public void Initialize(List<DbCountries.DbCountry> includedCountries, List<DbCountries.DbCountry> excludedCountries, Action yesAction = null)
	{
		this.yesAction = yesAction;
		CreateIncludedCountryList(includedCountries);
		CreateExcludedCountryList(excludedCountries);
	}

	private void CreateIncludedCountryList(List<DbCountries.DbCountry> includedCountries)
	{
		for (int i = 0; i < includedCountriesList.childCount; i++)
		{
			UnityEngine.Object.Destroy(includedCountriesList.GetChild(i).gameObject);
		}
		foreach (DbCountries.DbCountry includedCountry in includedCountries)
		{
			UnityEngine.Object.Instantiate(countryAlertPrefab, includedCountriesList).Initialize(includedCountry);
		}
	}

	private void CreateExcludedCountryList(List<DbCountries.DbCountry> excludedCountries)
	{
		for (int i = 0; i < excludedCountriesList.childCount; i++)
		{
			UnityEngine.Object.Destroy(excludedCountriesList.GetChild(i).gameObject);
		}
		foreach (DbCountries.DbCountry excludedCountry in excludedCountries)
		{
			UnityEngine.Object.Instantiate(countryAlertPrefab, excludedCountriesList).Initialize(excludedCountry);
		}
	}

	public void YesButton()
	{
		yesAction?.Invoke();
		Close();
	}
}
