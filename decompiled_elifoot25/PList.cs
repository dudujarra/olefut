using System.Collections.Generic;
using UnityEngine;

public class PList : List<Player>
{
	public new void Add(Player item)
	{
		Debug.Log("PList.Add()");
		base.Add(item);
	}

	public new bool Remove(Player item)
	{
		Debug.Log("Removing " + item.Name);
		return base.Remove(item);
	}
}
