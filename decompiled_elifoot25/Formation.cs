using System;

[Serializable]
public struct Formation
{
	public string name;

	public string subName;

	public PlayerPosition[] positions;

	public string FullName
	{
		get
		{
			string text = LanguageController.instance.Get_Translation("FORMATION_SUBNAME_" + subName);
			return name + " " + text;
		}
	}

	private Formation(string name, string subName, PlayerPosition[] positions)
	{
		this.name = name;
		this.subName = subName;
		this.positions = positions;
	}
}
