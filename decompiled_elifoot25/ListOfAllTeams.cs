using System;
using System.Collections.Generic;

[Serializable]
public class ListOfAllTeams : ListOfTeams
{
	public override void Initialize()
	{
		base.Initialize();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).Initialize();
		}
	}
}
