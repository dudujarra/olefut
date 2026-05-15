using System;
using System.Collections.Generic;

[Serializable]
public class ListOfRegions : EliList
{
	public Region FindByCode(Country country, string regionCode)
	{
		return (Region)Find((EliObject x) => ((Region)x).myCountry == country && ((Region)x).regionCode == regionCode);
	}

	public void LoadFlags(DbCountries dbCountries, int dbCountryIndex)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Region)enumerator.Current).LoadFlag(dbCountries, dbCountryIndex);
		}
	}
}
