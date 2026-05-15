using System;
using System.Collections.Generic;
using UnityEngine;

namespace Picker;

[Serializable]
public class ItemList<ParamType>
{
	[SerializeField]
	public List<ParamType> items = new List<ParamType>();
}
