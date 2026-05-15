using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "DB Teams", menuName = "DB Teams")]
public class DbTeams : ScriptableObject
{
	[Serializable]
	public struct DbTeam
	{
		public string shortName;

		public string teamVersion;

		public string longName;

		public string teamID;

		private List<string> previousTeamIDs;

		public string countryCode;

		[SerializeField]
		private int countryIndex;

		public string regionCode;

		[SerializeField]
		private int regionIndex;

		public int level;

		public string coach;

		public Color textColor;

		public Color backColor;

		[NonSerialized]
		private Sprite logo;

		[HideInInspector]
		public byte[] savedLogoBytes;

		[NonSerialized]
		public bool logoByteImageIsLoaded;

		[NonSerialized]
		private Sprite shirt;

		public bool usesStandardShirt;

		public List<DbPlayer> players;

		public bool wasEdited;

		public bool isTeamValid;

		public List<string> PreviousTeamIDs
		{
			get
			{
				if (previousTeamIDs == null)
				{
					previousTeamIDs = new List<string>();
				}
				return previousTeamIDs;
			}
			set
			{
				previousTeamIDs = value;
			}
		}

		public int CountryIndex
		{
			get
			{
				if (countryIndex >= 0 && countryIndex < LoadAndSavingTeams.instance.countries.allCountries.Count && LoadAndSavingTeams.instance.countries.allCountries[countryIndex].code == countryCode)
				{
					return countryIndex;
				}
				if (!string.IsNullOrEmpty(countryCode))
				{
					countryIndex = LoadAndSavingTeams.instance.countries.FindCountryIndex(countryCode);
					return countryIndex;
				}
				return -1;
			}
			set
			{
				countryIndex = value;
			}
		}

		public int RegionIndex
		{
			get
			{
				if (CountryIndex == -1)
				{
					return -1;
				}
				if (regionIndex >= 0 && regionIndex < LoadAndSavingTeams.instance.countries.allCountries[CountryIndex].regions.Count && LoadAndSavingTeams.instance.countries.allCountries[CountryIndex].regions[regionIndex].code == regionCode)
				{
					return regionIndex;
				}
				if (!string.IsNullOrEmpty(regionCode))
				{
					regionIndex = LoadAndSavingTeams.instance.countries.FindRegionIndex(CountryIndex, regionCode);
					return regionIndex;
				}
				return -1;
			}
			set
			{
				regionIndex = value;
			}
		}

		public Sprite Logo
		{
			get
			{
				if (ShouldLoadLogoByteArray(this))
				{
					Sprite sprite = CreateLogoFromByteArray(this);
					logoByteImageIsLoaded = true;
					if (sprite != null)
					{
						logo = sprite;
					}
				}
				if (IsLogoSpriteNull(this, logo) && !factoryLogoNotFound.Contains(teamID) && (logo = LoadLogoFromFactory(this)) == null)
				{
					factoryLogoNotFound.Add(teamID);
				}
				return logo;
			}
			set
			{
				logo = value;
			}
		}

		public Sprite LogoFactory => logo;

		public Sprite Shirt
		{
			get
			{
				if (IsShirtSpriteNull(this, shirt))
				{
					if (usesStandardShirt)
					{
						shirt = LoadLogosAndShirts.defaultShirtStatic;
					}
					else if (!factoryShirtNotFound.Contains(teamID))
					{
						Sprite sprite = LoadShirtFromFactory(this);
						if (sprite != null)
						{
							shirt = sprite;
						}
						else
						{
							factoryShirtNotFound.Add(teamID);
							shirt = LoadLogosAndShirts.defaultShirtStatic;
						}
					}
					else
					{
						shirt = LoadLogosAndShirts.defaultShirtStatic;
					}
				}
				return shirt;
			}
			set
			{
				shirt = value;
			}
		}

		public Sprite ShirtFactory => shirt;

		public Color GetLogoOrShirtColor()
		{
			if (Logo != null)
			{
				return Color.white;
			}
			if (Shirt != null)
			{
				if (usesStandardShirt)
				{
					return backColor;
				}
				return Color.white;
			}
			return Color.white;
		}

		public Sprite GetLogoOrShirt()
		{
			if (Logo != null)
			{
				return Logo;
			}
			return Shirt;
		}

		public List<(DbPlayer, int)> PlayersSorted()
		{
			List<(DbPlayer, int)> list = new List<(DbPlayer, int)>();
			for (int i = 0; i < players.Count; i++)
			{
				list.Add((players[i], i));
			}
			list.Sort(delegate((DbPlayer player, int index) p1, (DbPlayer player, int index) p2)
			{
				int num = p1.player.position.CompareTo(p2.player.position);
				return (num != 0) ? num : string.Compare(p1.player.name, p2.player.name, StringComparison.OrdinalIgnoreCase);
			});
			return list;
		}

		public bool IsTeamValid()
		{
			(int, int) tuple = CountGKAndFieldPlayers();
			int item = tuple.Item1;
			int item2 = tuple.Item2;
			bool flag = !string.IsNullOrEmpty(teamID) && teamID != "0";
			flag &= !string.IsNullOrEmpty(shortName);
			flag &= !string.IsNullOrEmpty(longName);
			flag &= !string.IsNullOrEmpty(coach);
			flag &= !string.IsNullOrEmpty(countryCode);
			flag &= CountryIndex >= 0;
			flag &= level >= DataManager.TEAM_INIT_SKILL_MIN && level <= DataManager.TEAM_INIT_SKILL_MAX;
			flag &= players.Count >= 14 && players.Count <= 50;
			flag = flag && item >= 1;
			return isTeamValid = flag && item2 >= 10;
		}

		private (int, int) CountGKAndFieldPlayers()
		{
			int num = 0;
			int num2 = 0;
			for (int i = 0; i < players.Count; i++)
			{
				if (players[i].position == PlayerPosition.Keeper)
				{
					num++;
				}
				else
				{
					num2++;
				}
			}
			return (num, num2);
		}
	}

	[Serializable]
	public struct DbPlayer
	{
		public string name;

		public bool isStar;

		public PlayerPosition position;

		public PlayerBehaviour behaviour;

		public string countryCode;

		private int countryIndex;

		public int CountryIndex
		{
			get
			{
				if (countryIndex >= 0 && countryIndex < LoadAndSavingTeams.instance.countries.allCountries.Count && LoadAndSavingTeams.instance.countries.allCountries[countryIndex].code == countryCode)
				{
					return countryIndex;
				}
				if (countryCode != "")
				{
					countryIndex = LoadAndSavingTeams.instance.countries.FindCountryIndex(countryCode);
					return countryIndex;
				}
				return -1;
			}
			set
			{
				countryIndex = value;
			}
		}
	}

	public string confederationCodes;

	public string countryCodes;

	public string regionCodes;

	public int teamsCount;

	public string mostRecentTeamVersion;

	public string fileName;

	public string fileTitle;

	public string fileDescription;

	public string databaseVersion;

	public string fileFormat;

	public string fileAuthor;

	public string fileEmail;

	public string fileWebsite;

	public int dateYear;

	public int dateMonth;

	public int dateDay;

	public int dateHour;

	public int dateMinute;

	public int dateSecond;

	private DateTime fileDate;

	public bool saved;

	public string appVersion;

	public bool isFullyUpdated;

	public List<DbTeam> AllTeams = new List<DbTeam>();

	private static readonly HashSet<string> corruptedLogoTeams = new HashSet<string>();

	private static readonly HashSet<string> corruptedShirtTeams = new HashSet<string>();

	private static readonly HashSet<string> factoryLogoNotFound = new HashSet<string>();

	private static readonly HashSet<string> factoryShirtNotFound = new HashSet<string>();

	public DateTime FileDate
	{
		get
		{
			if ((fileDate == default(DateTime) || fileDate.Year == 1) && dateYear != 0)
			{
				fileDate = new DateTime(dateYear, dateMonth, dateDay, dateHour, dateMinute, dateSecond);
			}
			return fileDate;
		}
		set
		{
			fileDate = value;
			dateYear = fileDate.Year;
			dateMonth = fileDate.Month;
			dateDay = fileDate.Day;
			dateHour = fileDate.Hour;
			dateMinute = fileDate.Minute;
			dateSecond = fileDate.Second;
		}
	}

	public static void ClearCorruptedSpritesCache()
	{
		corruptedLogoTeams.Clear();
		corruptedShirtTeams.Clear();
		factoryLogoNotFound.Clear();
		factoryShirtNotFound.Clear();
	}

	public void Erase()
	{
		saved = false;
		appVersion = "";
		isFullyUpdated = false;
		if (AllTeams != null)
		{
			AllTeams.Clear();
		}
		else
		{
			AllTeams = new List<DbTeam>();
		}
		databaseVersion = "";
		fileFormat = "";
		fileAuthor = "";
		fileEmail = "";
		fileWebsite = "";
		fileName = "";
		fileTitle = "";
		fileDescription = "";
		dateYear = 0;
		dateMonth = 0;
		dateDay = 0;
		dateHour = 0;
		dateMinute = 0;
		dateSecond = 0;
		fileDate = default(DateTime);
	}

	public void SetEqualTo(DbTeams dbTeams)
	{
		Erase();
		saved = dbTeams.saved;
		appVersion = dbTeams.appVersion;
		isFullyUpdated = dbTeams.isFullyUpdated;
		AllTeams = dbTeams.AllTeams ?? new List<DbTeam>();
		databaseVersion = dbTeams.databaseVersion;
		fileFormat = dbTeams.fileFormat;
		fileAuthor = dbTeams.fileAuthor;
		fileEmail = dbTeams.fileEmail;
		fileWebsite = dbTeams.fileWebsite;
		fileName = dbTeams.fileName;
		fileTitle = dbTeams.fileTitle;
		fileDescription = dbTeams.fileDescription;
		dateYear = dbTeams.dateYear;
		dateMonth = dbTeams.dateMonth;
		dateDay = dbTeams.dateDay;
		dateHour = dbTeams.dateHour;
		dateMinute = dbTeams.dateMinute;
		dateSecond = dbTeams.dateSecond;
		fileDate = dbTeams.fileDate;
	}

	public int FindTeamIndex(string teamID)
	{
		for (int i = 0; i < AllTeams.Count; i++)
		{
			if (teamID == AllTeams[i].teamID)
			{
				return i;
			}
			if (AllTeams[i].PreviousTeamIDs.Contains(teamID))
			{
				return i;
			}
		}
		return -1;
	}

	public int FindTeamVersion(string teamID)
	{
		for (int i = 0; i < AllTeams.Count; i++)
		{
			if (teamID == AllTeams[i].teamID)
			{
				return i;
			}
		}
		return -1;
	}

	public List<(int, string)> GetTeamsSorted(int countryIndex, int regionIndex, bool sortByLevel)
	{
		List<(int, string)> list = new List<(int, string)>();
		for (int i = 0; i < AllTeams.Count; i++)
		{
			if (AllTeams[i].CountryIndex == countryIndex)
			{
				if (regionIndex == -1)
				{
					list.Add((i, AllTeams[i].shortName));
				}
				else if (regionIndex != -1 && AllTeams[i].RegionIndex == regionIndex)
				{
					list.Add((i, AllTeams[i].shortName));
				}
			}
		}
		if (sortByLevel)
		{
			list.Sort(((int index, string shortName) a, (int index, string shortName) b) => AllTeams[b.index].level.CompareTo(AllTeams[a.index].level));
		}
		else
		{
			list.Sort(((int index, string shortName) a, (int index, string shortName) b) => string.Compare(a.shortName, b.shortName, StringComparison.OrdinalIgnoreCase));
		}
		return list;
	}

	public List<int> GetPlayersSorted(int teamIndex)
	{
		List<int> list = new List<int>();
		for (int i = 0; i < AllTeams[teamIndex].players.Count; i++)
		{
			list.Add(i);
		}
		list.Sort(delegate(int a, int b)
		{
			DbPlayer dbPlayer = AllTeams[teamIndex].players[a];
			DbPlayer dbPlayer2 = AllTeams[teamIndex].players[b];
			int num = dbPlayer.position.CompareTo(dbPlayer2.position);
			return (num != 0) ? num : string.Compare(dbPlayer.name, dbPlayer2.name, StringComparison.OrdinalIgnoreCase);
		});
		return list;
	}

	public bool AlreadyHasThisTeamID(string teamID)
	{
		return AllTeams.FindIndex((DbTeam a) => a.teamID == teamID) >= 0;
	}

	public DbTeam GetTeamByID(string teamID)
	{
		return AllTeams.Find((DbTeam a) => a.teamID == teamID);
	}

	public bool CheckDuplicateTeamIDs()
	{
		bool result = false;
		HashSet<string> hashSet = new HashSet<string>();
		for (int i = 0; i < AllTeams.Count; i++)
		{
			DbTeam value = AllTeams[i];
			if (hashSet.Contains(value.teamID))
			{
				value.teamID = Guid.NewGuid().ToString();
				AllTeams[i] = value;
				result = true;
			}
			else
			{
				hashSet.Add(value.teamID);
			}
		}
		return result;
	}

	private static bool ShouldLoadLogoByteArray(DbTeam team)
	{
		return (team.savedLogoBytes != null && team.savedLogoBytes.Length != 0) & !team.logoByteImageIsLoaded;
	}

	private static Sprite CreateLogoFromByteArray(DbTeam team)
	{
		Texture2D texture2D = new Texture2D(2, 2);
		if (texture2D.LoadImage(team.savedLogoBytes))
		{
			return Sprite.Create(texture2D, new Rect(0f, 0f, texture2D.width, texture2D.height), new Vector2(0.5f, 0.5f), 100f);
		}
		UnityEngine.Object.Destroy(texture2D);
		return null;
	}

	private static bool IsLogoSpriteNull(DbTeam team, Sprite logo)
	{
		if (corruptedLogoTeams.Contains(team.teamID))
		{
			return true;
		}
		try
		{
			bool flag = logo == null;
			if (flag)
			{
				return true;
			}
			flag |= logo.texture == null;
			if (flag)
			{
				return true;
			}
			return flag | (!team.logoByteImageIsLoaded && !logo.name.Contains("Logo_" + team.countryCode + "_" + team.teamID + "_"));
		}
		catch (Exception ex)
		{
			Debug.LogWarning("IsLogoSpriteNull error for team '" + team.shortName + "': " + ex.Message);
			corruptedLogoTeams.Add(team.teamID);
			return true;
		}
	}

	private static Sprite LoadLogoFromFactory(DbTeam team)
	{
		Sprite result = null;
		if (team.teamID != "0")
		{
			result = LoadLogo(team);
		}
		else if (DataManager.instance != null && DataManager.instance.DBDebugMode)
		{
			Debug.LogError("ERROR in team '" + team.shortName + "' -> teamID is equal to 0");
		}
		return result;
	}

	private static Sprite LoadLogo(DbTeam team)
	{
		foreach (DbTeam allTeam in LoadAndSavingTeams.instance.teamsFactory.AllTeams)
		{
			if (team.teamID == allTeam.teamID)
			{
				return allTeam.LogoFactory;
			}
			foreach (string previousTeamID in team.PreviousTeamIDs)
			{
				if (previousTeamID == allTeam.teamID)
				{
					return allTeam.LogoFactory;
				}
			}
		}
		return null;
	}

	private static bool IsShirtSpriteNull(DbTeam team, Sprite shirt)
	{
		if (corruptedShirtTeams.Contains(team.teamID))
		{
			return true;
		}
		if (shirt == null)
		{
			return true;
		}
		try
		{
			bool flag = shirt.texture == null;
			if (flag)
			{
				return true;
			}
			flag |= !team.usesStandardShirt && !shirt.name.Contains("Shirt_" + team.countryCode + "_" + team.teamID + "_");
			return flag | (team.usesStandardShirt && shirt != LoadLogosAndShirts.defaultShirtStatic);
		}
		catch (Exception ex)
		{
			Debug.LogWarning("IsShirtSpriteNull error for team '" + team.shortName + "': " + ex.Message);
			corruptedShirtTeams.Add(team.teamID);
			return true;
		}
	}

	private static Sprite LoadShirtFromFactory(DbTeam team)
	{
		Sprite result = null;
		if (team.teamID != "0")
		{
			result = LoadShirt(team);
		}
		else if (DataManager.instance != null && DataManager.instance.DBDebugMode)
		{
			Debug.LogError("ERROR in team '" + team.shortName + "' -> teamID is equal to 0");
		}
		return result;
	}

	private static Sprite LoadShirt(DbTeam team)
	{
		foreach (DbTeam allTeam in LoadAndSavingTeams.instance.teamsFactory.AllTeams)
		{
			if (team.teamID == allTeam.teamID)
			{
				return allTeam.ShirtFactory;
			}
			foreach (string previousTeamID in team.PreviousTeamIDs)
			{
				if (previousTeamID == allTeam.teamID)
				{
					return allTeam.ShirtFactory;
				}
			}
		}
		return null;
	}

	public Sprite GetLogoOrShirt(int index)
	{
		DbTeam dbTeam = AllTeams[index];
		if (dbTeam.Logo != null)
		{
			return dbTeam.Logo;
		}
		if (dbTeam.Shirt != null)
		{
			return dbTeam.Shirt;
		}
		return LoadLogosAndShirts.defaultShirtStatic;
	}

	public Color GetLogoOrShirtColor(int index)
	{
		DbTeam dbTeam = AllTeams[index];
		if (dbTeam.Logo != null)
		{
			return Color.white;
		}
		if (dbTeam.Shirt != null)
		{
			if (dbTeam.usesStandardShirt)
			{
				return dbTeam.backColor;
			}
			return Color.white;
		}
		return Color.white;
	}

	public void UpdateMissingLogos()
	{
		int count = AllTeams.Count;
		int num = 0;
		int num2 = 0;
		for (int i = 0; i < AllTeams.Count; i++)
		{
			DbTeam value = AllTeams[i];
			if (!(value.Logo == null))
			{
				continue;
			}
			string text = "Logo_" + value.countryCode + "_" + value.teamID + "_" + value.shortName;
			Sprite sprite = null;
			try
			{
				num++;
				sprite = Resources.Load<Sprite>("Art/Team logos/" + text);
				if (!(sprite == null))
				{
					LoadLogosAndShirts.RetainSprite(sprite);
					value.Logo = sprite;
					AllTeams[i] = value;
					if (value.Logo == null)
					{
						Debug.LogError("Logo for eam " + value.shortName + " (" + value.countryCode + ") id:" + value.teamID + " was not loaded into local database");
					}
					else
					{
						num2++;
					}
				}
			}
			catch (Exception ex)
			{
				Debug.LogWarning("UpdateMissingLogos error for team '" + value.shortName + "': " + ex.Message);
			}
		}
		Debug.Log($"Update Missing Logos. Total teams: {count} Missing logos: {num} Updated logos: {num2}.");
	}
}
