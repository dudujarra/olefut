using UnityEngine;
using UnityEngine.UI;

public class CountryAlertPrefab : MonoBehaviour
{
	public Image countryFlag;

	public Text countryName;

	internal void Initialize(DbCountries.DbCountry country)
	{
		countryFlag.sprite = country.Flag;
		countryName.text = country.Name;
	}

	internal void Initialize(DbCountries.DbRegion region)
	{
		countryFlag.sprite = region.Flag;
		countryName.text = region.fullName;
	}
}
