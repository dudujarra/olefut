using System;
using System.Collections.Generic;

[Serializable]
public class ListOfRegionalFederations : EliList
{
	public RegionalFederation FindByCode(Confederation confederation, string regionalFederationCode)
	{
		return (RegionalFederation)Find((EliObject x) => ((RegionalFederation)x).myConfederation == confederation && ((RegionalFederation)x).RegionalFederationCode == regionalFederationCode);
	}

	public void LoadFlags(DbConfederations dbConfederations, int dbConfederationIndex)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((RegionalFederation)enumerator.Current).LoadFlag(dbConfederations, dbConfederationIndex);
		}
	}
}
