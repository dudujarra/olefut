using System.Collections.Generic;
using UnityEngine;

public class LoadLogosAndShirts : MonoBehaviour
{
	public Sprite standardShirt;

	public static Sprite defaultShirtStatic = null;

	[ReadOnly]
	public List<(Sprite, string)> allLogos = new List<(Sprite, string)>();

	[ReadOnly]
	public List<(Sprite, string)> allShirts = new List<(Sprite, string)>();

	private static readonly HashSet<Sprite> _spriteRetainer = new HashSet<Sprite>();

	public DbTeams teams;

	private readonly string TEAM_LOGOS_PATH = "Art/Team logos";

	private readonly string TEAM_SHIRTS_PATH = "Art/Shirts";

	public static void RetainSprite(Sprite sprite)
	{
		if (sprite != null)
		{
			_spriteRetainer.Add(sprite);
		}
	}

	private void Awake()
	{
		defaultShirtStatic = standardShirt;
	}

	public void LoadEverything()
	{
		LoadLogos();
		LoadShirts();
	}

	private void LoadLogos()
	{
		Sprite[] array = Resources.LoadAll<Sprite>(TEAM_LOGOS_PATH);
		foreach (Sprite sprite in array)
		{
			string[] array2 = sprite.name.Split('_');
			if (array2.Length >= 3)
			{
				allLogos.Add((sprite, array2[2]));
				_spriteRetainer.Add(sprite);
			}
			else
			{
				Debug.LogError("Couldn't get teamId from Logo '" + sprite.name + "' correctly");
			}
		}
	}

	private void LoadShirts()
	{
		Sprite[] array = Resources.LoadAll<Sprite>(TEAM_SHIRTS_PATH);
		foreach (Sprite sprite in array)
		{
			string[] array2 = sprite.name.Split('_');
			if (array2.Length >= 3)
			{
				allShirts.Add((sprite, array2[2]));
				_spriteRetainer.Add(sprite);
			}
			else
			{
				Debug.LogError("Couldn't get teamId from Shirt '" + sprite.name + "' correctly");
			}
		}
	}

	public Sprite GetLogoORShirt(string teamID)
	{
		Sprite sprite = FindLogo(teamID);
		if (sprite == null)
		{
			sprite = FindShirt(teamID).Item1;
		}
		return sprite;
	}

	public Sprite FindLogo(string teamID)
	{
		foreach (var allLogo in allLogos)
		{
			if (allLogo.Item2 == teamID)
			{
				return allLogo.Item1;
			}
		}
		return null;
	}

	public (Sprite, bool) FindShirt(string teamID)
	{
		foreach (var allShirt in allShirts)
		{
			if (allShirt.Item2 == teamID)
			{
				return (allShirt.Item1, false);
			}
		}
		return (GetStandardShirt(), true);
	}

	public Sprite GetStandardShirt()
	{
		return standardShirt;
	}
}
