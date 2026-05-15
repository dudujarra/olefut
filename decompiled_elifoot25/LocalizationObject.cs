using System.Collections.Generic;

public class LocalizationObject
{
	public string key;

	public Dictionary<string, string> translation = new Dictionary<string, string>();

	public LocalizationObject(string _key, Dictionary<string, string> _translation)
	{
		key = _key;
		foreach (KeyValuePair<string, string> item in _translation)
		{
			translation.Add(item.Key, item.Value);
		}
	}
}
