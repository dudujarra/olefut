using System;
using UnityEngine;

[Serializable]
public class PlayerBase : EliObject
{
	public static readonly PlayerSector[] playerSectors = new PlayerSector[11]
	{
		PlayerSector.SectorGoal,
		PlayerSector.SectorDefense,
		PlayerSector.SectorDefense,
		PlayerSector.SectorDefense,
		PlayerSector.SectorMidfield,
		PlayerSector.SectorMidfield,
		PlayerSector.SectorMidfield,
		PlayerSector.SectorMidfield,
		PlayerSector.SectorForward,
		PlayerSector.SectorForward,
		PlayerSector.SectorForward
	};

	private int injured;

	private int suspended;

	private int lockedFor;

	private long salary;

	private PlayerSector sector;

	private PlayerPosition position;

	[NonSerialized]
	private Team team;

	private long teamID;

	[NonSerialized]
	private Team soldToTeam;

	private long soldToTeamID;

	[NonSerialized]
	private Team bestOfferTeam;

	private long bestOfferTeamID;

	private long bestOfferValue;

	private static Sprite lockedIconBlue;

	private static Sprite lockedIconGreen;

	private static Sprite lockedIconYellow;

	private static Sprite lockedIconRed;

	private static Sprite lockedIconSold;

	private static Sprite iconSell;

	private static Sprite iconChangeSalary;

	private static Sprite healInjuryIcon;

	private static Sprite removeRedCardIcon;

	public int Injured
	{
		get
		{
			return injured;
		}
		set
		{
			injured = Mathf.Max(0, value);
		}
	}

	public int Suspended
	{
		get
		{
			return suspended;
		}
		set
		{
			suspended = Mathf.Max(0, value);
		}
	}

	public int LockedFor
	{
		get
		{
			return lockedFor;
		}
		set
		{
			lockedFor = Mathf.Max(0, value);
		}
	}

	public long Salary
	{
		get
		{
			return salary;
		}
		set
		{
			if (team != null)
			{
				team.PlayerSalaryChanged((Player)this, salary, value);
			}
			if (salary != 0L)
			{
				lockedFor = DataManager.NUM_MATCHES_BLOCKED_BY_SALARY;
			}
			salary = value;
		}
	}

	public long InitSalary
	{
		set
		{
			salary = value;
		}
	}

	public PlayerSector Sector => sector;

	public PlayerPosition Position
	{
		get
		{
			return position;
		}
		set
		{
			position = value;
			sector = playerSectors[(int)value];
		}
	}

	public Team Team
	{
		get
		{
			return team;
		}
		set
		{
			team = value;
			if (team == null)
			{
				teamID = 0L;
			}
			else
			{
				teamID = team.ID;
			}
		}
	}

	public long TeamID => teamID;

	public Team SoldToTeam
	{
		get
		{
			return soldToTeam;
		}
		set
		{
			soldToTeam = value;
			soldToTeamID = value?.ID ?? 0;
		}
	}

	public Team BestOfferTeam
	{
		get
		{
			return bestOfferTeam;
		}
		set
		{
			bestOfferTeam = value;
			bestOfferTeamID = value?.ID ?? 0;
		}
	}

	public long BestOfferValue
	{
		get
		{
			return bestOfferValue;
		}
		set
		{
			bestOfferValue = value;
		}
	}

	protected static Sprite LockedIconBlue
	{
		get
		{
			if (lockedIconBlue == null)
			{
				lockedIconBlue = Util.LoadSprite("Art/Icons/icon_lockedBlue");
			}
			return lockedIconBlue;
		}
	}

	protected static Sprite LockedIconGreen
	{
		get
		{
			if (lockedIconGreen == null)
			{
				lockedIconGreen = Util.LoadSprite("Art/Icons/icon_lockedGreen");
			}
			return lockedIconGreen;
		}
	}

	protected static Sprite LockedIconYellow
	{
		get
		{
			if (lockedIconYellow == null)
			{
				lockedIconYellow = Util.LoadSprite("Art/Icons/icon_lockedYellow");
			}
			return lockedIconYellow;
		}
	}

	protected static Sprite LockedIconRed
	{
		get
		{
			if (lockedIconRed == null)
			{
				lockedIconRed = Util.LoadSprite("Art/Icons/icon_lockedRed");
			}
			return lockedIconRed;
		}
	}

	protected static Sprite LockedIconSold
	{
		get
		{
			if (lockedIconSold == null)
			{
				lockedIconSold = Util.LoadSprite("Art/Icons/Player sold");
			}
			return lockedIconSold;
		}
	}

	protected static Sprite IconSell
	{
		get
		{
			if (iconSell == null)
			{
				iconSell = Util.LoadSprite(ConfigManager.configDictionary["#ICON_NEXT"]);
			}
			return iconSell;
		}
	}

	protected static Sprite IconChangeSalary
	{
		get
		{
			if (iconChangeSalary == null)
			{
				iconChangeSalary = Util.LoadSprite(ConfigManager.configDictionary["#ICON_NEXT"]);
			}
			return iconChangeSalary;
		}
	}

	protected static Sprite HealInjuryIcon
	{
		get
		{
			if (healInjuryIcon == null)
			{
				healInjuryIcon = Util.LoadSprite(ConfigManager.configDictionary["#ICON_VIDEO"]);
			}
			return healInjuryIcon;
		}
	}

	protected static Sprite RemoveRedCardIcon
	{
		get
		{
			if (removeRedCardIcon == null)
			{
				removeRedCardIcon = Util.LoadSprite(ConfigManager.configDictionary["#ICON_VIDEO"]);
			}
			return removeRedCardIcon;
		}
	}

	public void ChangeSalaryWithoutBlocking(long newSalary)
	{
		if (team != null)
		{
			team.PlayerSalaryChanged((Player)this, salary, newSalary);
		}
		salary = newSalary;
	}

	public PlayerBase()
		: base(generateID: true)
	{
	}

	public override void PostLoad()
	{
		base.PostLoad();
		soldToTeam = DataManager.instance.allTeams.FindTeamByID(soldToTeamID);
		bestOfferTeam = DataManager.instance.allTeams.FindTeamByID(bestOfferTeamID);
	}
}
