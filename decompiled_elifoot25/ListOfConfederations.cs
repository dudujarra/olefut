using System;
using System.Collections.Generic;

[Serializable]
public class ListOfConfederations : EliList
{
	public ListOfConfederations()
	{
	}

	public Confederation FindByCode(string confederationCode)
	{
		return (Confederation)Find((EliObject x) => ((Confederation)x).ConfederationCode == confederationCode);
	}

	public void LoadFlags(DbConfederations dbConfederations)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Confederation obj = (Confederation)enumerator.Current;
			obj.LoadFlag(dbConfederations);
			obj.LoadRegionFlags(dbConfederations);
		}
	}

	public ListOfConfederations(List<EliObject> other)
	{
		foreach (EliObject item in other)
		{
			Add(item);
		}
	}
}
