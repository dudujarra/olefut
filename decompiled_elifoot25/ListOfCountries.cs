using System;
using System.Collections.Generic;

[Serializable]
public class ListOfCountries : EliList
{
	public ListOfCountries()
	{
	}

	public ListOfCountries(List<EliObject> other)
	{
		foreach (EliObject item in other)
		{
			Add(item);
		}
	}

	public void Initialize()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Country)enumerator.Current).Initialize();
		}
	}

	public void ComputeTargetSkills()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Country)enumerator.Current).ComputeTargetSkills();
		}
	}

	public Country FindCountryByCode(string countryCode)
	{
		return (Country)Find((EliObject x) => ((Country)x).CountryCode == countryCode);
	}

	public void LoadFlags(DbCountries dbCountries)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Country obj = (Country)enumerator.Current;
			obj.LoadFlag(dbCountries);
			obj.LoadRegionFlags(dbCountries);
		}
	}

	public override void PostLoad()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Country)enumerator.Current).PostLoad();
		}
	}
}
