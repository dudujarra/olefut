using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

[Serializable]
public class Player : PlayerBase
{
	public struct PlayerPositionColor
	{
		public PlayerSector sector;

		public Color32 color;
	}

	[Serializable]
	public class PlayerMatch
	{
		public int deltaSkill;

		public int goalsScored;

		private int yellowCards;

		private bool redCard;

		public bool injured;

		public bool played;

		public bool sentOff;

		public bool RedCard
		{
			get
			{
				return redCard;
			}
			set
			{
				redCard = value;
				sentOff = true;
			}
		}

		public int YellowCards
		{
			get
			{
				return yellowCards;
			}
			set
			{
				yellowCards = value;
				if (yellowCards >= 2)
				{
					sentOff = true;
				}
			}
		}

		public void Reset()
		{
			deltaSkill = 0;
			goalsScored = 0;
			yellowCards = 0;
			redCard = false;
			injured = false;
			played = false;
			sentOff = false;
		}
	}

	[Serializable]
	public class PlayerSeason
	{
		private Dictionary<Competition, int> goalsScored = new Dictionary<Competition, int>();

		private int goalsScoredTotal;

		public int GoalsScoredTotal => goalsScoredTotal;

		public void Reset(Player p)
		{
			goalsScored.Clear();
			goalsScoredTotal = 0;
		}

		public int GetGoals(Competition competition)
		{
			if (goalsScored.ContainsKey(competition))
			{
				return goalsScored[competition];
			}
			return 0;
		}

		public void AddGoals(Competition competition, int goals)
		{
			if (!goalsScored.ContainsKey(competition))
			{
				goalsScored.Add(competition, goals);
			}
			else
			{
				goalsScored[competition] += goals;
			}
			goalsScoredTotal += goals;
		}

		public int TotalGoalsInSeason()
		{
			return goalsScored.Values.Sum();
		}
	}

	[Serializable]
	public class PlayerHistory
	{
		public int goalsScored;

		public int redCards;

		public int yellowCards;

		public int injuries;

		public int matchesPlayed;
	}

	private string originalName;

	private string changedName;

	public readonly Country country;

	private bool isStar;

	public int skill;

	public int aim;

	public int sickness;

	protected PlayerBehaviour behaviour = PlayerBehaviour.Standard;

	private static readonly float[,] positionStrengthMatrix = new float[11, 11]
	{
		{
			1f, 0.6f, 0.7f, 0.6f, 0.6f, 0.6f, 0.6f, 0.6f, 0.55f, 0.55f,
			0.55f
		},
		{
			0.6f, 1f, 0.94f, 0.97f, 0.91f, 0.94f, 0.82f, 0.91f, 0.85f, 0.79f,
			0.73f
		},
		{
			0.7f, 0.94f, 1f, 0.94f, 0.94f, 0.79f, 0.88f, 0.79f, 0.76f, 0.76f,
			0.76f
		},
		{
			0.6f, 0.97f, 0.94f, 1f, 0.91f, 0.91f, 0.82f, 0.94f, 0.79f, 0.85f,
			0.73f
		},
		{
			0.65f, 0.91f, 0.94f, 0.91f, 1f, 0.82f, 0.94f, 0.82f, 0.82f, 0.82f,
			0.82f
		},
		{
			0.55f, 0.88f, 0.76f, 0.82f, 0.82f, 1f, 0.94f, 0.97f, 0.94f, 0.91f,
			0.88f
		},
		{
			0.55f, 0.76f, 0.82f, 0.76f, 0.94f, 0.94f, 1f, 0.94f, 0.88f, 0.88f,
			0.91f
		},
		{
			0.55f, 0.82f, 0.76f, 0.88f, 0.82f, 0.97f, 0.94f, 1f, 0.91f, 0.94f,
			0.88f
		},
		{
			0.55f, 0.82f, 0.73f, 0.76f, 0.73f, 0.94f, 0.82f, 0.91f, 1f, 0.97f,
			0.94f
		},
		{
			0.55f, 0.76f, 0.73f, 0.82f, 0.73f, 0.91f, 0.82f, 0.94f, 0.97f, 1f,
			0.94f
		},
		{
			0.55f, 0.73f, 0.85f, 0.73f, 0.76f, 0.79f, 0.79f, 0.79f, 0.94f, 0.94f,
			1f
		}
	};

	public static readonly Dictionary<PlayerSector, Color32> playerPositionColors = new Dictionary<PlayerSector, Color32>
	{
		{
			PlayerSector.SectorGoal,
			new Color32(220, 220, 50, byte.MaxValue)
		},
		{
			PlayerSector.SectorDefense,
			new Color32(30, 120, 220, byte.MaxValue)
		},
		{
			PlayerSector.SectorMidfield,
			new Color32(30, 220, 30, byte.MaxValue)
		},
		{
			PlayerSector.SectorForward,
			new Color32(220, 30, 30, byte.MaxValue)
		}
	};

	private int[] weightFactor = new int[2];

	public double playerLoss;

	public long nextSalary;

	public long directSellPrice;

	public PlayerMatch playerMatch = new PlayerMatch();

	public PlayerHistory history = new PlayerHistory();

	public PlayerSeason playerSeason = new PlayerSeason();

	public string OriginalName => originalName;

	public string ChangedName => changedName;

	public string Name
	{
		get
		{
			if (changedName != null)
			{
				return changedName;
			}
			return originalName;
		}
		set
		{
			value = value.Substring(0, Mathf.Min(value.Length, DataManager.PLAYER_NAME_LENGTH_MAX));
			if (originalName == null)
			{
				originalName = value;
			}
			if (value == originalName)
			{
				changedName = null;
			}
			else
			{
				changedName = value;
			}
		}
	}

	public bool IsStar
	{
		get
		{
			return isStar;
		}
		set
		{
			isStar = value;
		}
	}

	public PlayerBehaviour Behaviour => behaviour;

	public int[] WeightFactor
	{
		get
		{
			return weightFactor;
		}
		set
		{
			weightFactor = value;
		}
	}

	public Player(string name, bool isStar, PlayerPosition position, PlayerBehaviour behaviour, Country country, int skill)
	{
		Name = name;
		this.isStar = isStar;
		base.Position = position;
		this.behaviour = behaviour;
		this.country = country;
		this.skill = Mathf.Clamp(skill, DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
		base.InitSalary = MyFairInitSalary();
		aim = ((1 + Util.GetCheckSum("AIM" + name, DataManager.PLAYER_AIM_MAX)) * (int)base.Position) ^ 2;
		sickness = 1 + Util.GetCheckSum("SICK" + name, DataManager.PLAYER_SICKNESS_MAX);
	}

	public void Initialize(int targetSkill)
	{
		int num = Mathf.Clamp(targetSkill + Util.GetRandomInt(-3, 3), DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
		skill = num;
		base.InitSalary = GetFairSalary(skill, 200000L);
	}

	public override void PostLoad()
	{
		base.PostLoad();
		base.Team = DataManager.instance.allTeams.FindTeamByID(base.TeamID);
	}

	public void Unlock()
	{
		base.LockedFor = 0;
	}

	public bool Available()
	{
		if (base.Suspended <= 0)
		{
			return base.Injured <= 0;
		}
		return false;
	}

	public override string GetName()
	{
		if (!isStar)
		{
			return Name;
		}
		return Name + "*";
	}

	public int GoalSkill()
	{
		return aim * skill * ((!isStar) ? 1 : 3);
	}

	public int GetGameSkill()
	{
		return skill + ((country == base.Team.country) ? DataManager.PLAYER_SKILL_NATIONALITY_INCREASE : 0) + (isStar ? DataManager.PLAYER_SKILL_STAR_INCREASE : 0);
	}

	public int GetGameSpotSkill(PlayerPosition formationPosition)
	{
		float num = positionStrengthMatrix[(int)base.Position, (int)formationPosition];
		return Mathf.RoundToInt((float)GetGameSkill() * num);
	}

	public int GetGameSpotSkill(PlayerPosition formationPosition, int gameSkill)
	{
		float num = positionStrengthMatrix[(int)base.Position, (int)formationPosition];
		return Mathf.RoundToInt((float)gameSkill * num);
	}

	public string BehaviourDesc()
	{
		return GetBehaviourDesc(behaviour);
	}

	public static string GetBehaviourDesc(PlayerBehaviour behaviour)
	{
		return LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + behaviour.ToString().ToUpper());
	}

	public string PositionDesc()
	{
		return GetPositionDesc(base.Position);
	}

	public static string GetPositionDesc(PlayerPosition position)
	{
		return LanguageController.instance.Get_Translation("PLAYER_POSITION_DESC_" + position.ToString().ToUpper());
	}

	public string PositionCode()
	{
		return GetPositionCode(base.Position);
	}

	public static string GetPositionCode(PlayerPosition position)
	{
		return LanguageController.instance.Get_Translation("PLAYER_POSITION_CODE_" + position.ToString().ToUpper());
	}

	public Color PositionColor()
	{
		return GetBackgroundColor(base.Position);
	}

	public static Color PositionColor(PlayerPosition position)
	{
		return GetBackgroundColor(position);
	}

	public static PlayerSector GetPositionSector(PlayerPosition position)
	{
		return PlayerBase.playerSectors[(int)position];
	}

	public override int GetSelectionWeight(int criteria)
	{
		int result = 1;
		switch ((PlayerWeightCriteria)criteria)
		{
		case PlayerWeightCriteria.Goal:
			result = GoalSkill();
			break;
		case PlayerWeightCriteria.Card:
			result = (int)(behaviour ^ PlayerBehaviour.Gentleman);
			break;
		case PlayerWeightCriteria.Injury:
			result = sickness ^ 2;
			break;
		}
		return result;
	}

	public bool CanChangeSalary(bool spontaneous)
	{
		if (spontaneous)
		{
			if (base.LockedFor <= 0)
			{
				return base.SoldToTeam == null;
			}
			return false;
		}
		if (base.LockedFor <= 1)
		{
			return base.SoldToTeam == null;
		}
		return false;
	}

	public long MaxSalaryIncrease()
	{
		return (int)((float)base.Salary * 1.2f + 500f);
	}

	public bool AcceptsNewSalary(long newSalaryProposed, out long newSalaryDemanded)
	{
		newSalaryDemanded = (long)((float)MyFairSalary() * 1.3f);
		newSalaryDemanded = Math.Min(newSalaryDemanded, MaxSalaryIncrease());
		newSalaryDemanded = (long)Math.Round((double)newSalaryDemanded / 100.0) * 100;
		newSalaryDemanded = Util.Clamp(newSalaryDemanded, 100L, 200000L);
		bool num = (float)newSalaryProposed >= (float)newSalaryDemanded * 0.9f;
		if (num)
		{
			base.Salary = newSalaryProposed;
		}
		return num;
	}

	public long MyFairInitSalary()
	{
		return GetFairSalary(skill + 3, 200000L);
	}

	public long MyFairSalary()
	{
		return GetFairSalary(skill, 200000L);
	}

	public static long GetFairSalary(int skill, long maxSalary = 200000L)
	{
		return Util.Clamp((long)Math.Round((10.0 * Math.Pow(skill, 1.7) + 100.0) / 100.0) * 100, 100L, maxSalary);
	}

	public static long GetFairSalary(int skill, Team team, long maxSalary)
	{
		long num = GetFairSalary(skill, maxSalary);
		if (team.moneyRatio > 2f)
		{
			num = (long)Math.Max(100.0, (double)num * 1.0 * (double)Mathf.Sqrt(team.moneyRatio - 1f));
		}
		num = (long)Mathf.Clamp(num, 100f, maxSalary);
		return (long)Mathf.Clamp(num, 100f, 200000f);
	}

	public static string CanSellPlayer_ToString(SellPlayer canSell)
	{
		string text = $"CANSELLPLAYER_{canSell.ToString()}";
		int num = 0;
		switch (canSell)
		{
		case SellPlayer.MinFieldPlayers:
			num = 10;
			break;
		case SellPlayer.MinTotalPlayers:
			num = 14;
			break;
		}
		if (num > 0)
		{
			return string.Format(text, num);
		}
		return text;
	}

	public long FairPrice()
	{
		double num = GetFairSalary(skill, 200000L) * skill * 3 * (7 - skill / 20);
		if (isStar)
		{
			num *= 1.3;
		}
		return (long)Mathf.Round((float)num);
	}

	public void ComputeBestOffer(Team forTeam, bool startOfSeason)
	{
		long fairPrice = FairPrice();
		if (base.BestOfferTeam != null)
		{
			long newSalary = MyFairSalary();
			CheckBestOffer(forTeam, newSalary, fairPrice);
		}
		int num = (startOfSeason ? 100 : 10);
		for (int i = 0; i < num; i++)
		{
			Team randomItem = DataManager.instance.allTeams.GetRandomItem();
			if (!randomItem.Coach.human && randomItem != forTeam)
			{
				long newSalary = MyFairSalary();
				long offerForPlayer = randomItem.GetOfferForPlayer(this, 0L, newSalary, fairPrice);
				if (offerForPlayer > base.BestOfferValue)
				{
					base.BestOfferValue = offerForPlayer;
					base.BestOfferTeam = randomItem;
				}
			}
		}
	}

	public void CheckBestOffer(Team forTeam)
	{
		if (base.BestOfferTeam != null)
		{
			long newSalary = MyFairSalary();
			long fairPrice = FairPrice();
			CheckBestOffer(forTeam, newSalary, fairPrice);
		}
	}

	private void CheckBestOffer(Team forTeam, long newSalary, long fairPrice)
	{
		if (base.BestOfferTeam != null)
		{
			base.BestOfferValue = base.BestOfferTeam.GetOfferForPlayer(this, 0L, newSalary, fairPrice);
			if (base.BestOfferValue == 0L)
			{
				base.BestOfferTeam = null;
			}
		}
	}

	public void BeginSeason()
	{
		playerSeason.Reset(this);
	}

	public void EndOfSeason()
	{
		Unlock();
	}

	public void ResetMatch()
	{
		playerMatch.Reset();
	}

	public void PostMatch(Competition competition, int targetPlayerSkill, bool skillChangeRestricted)
	{
		targetPlayerSkill += (IsStar ? DataManager.PLAYER_SKILL_STAR_INCREASE : 0);
		base.LockedFor = Math.Max(--base.LockedFor, 0);
		playerSeason.AddGoals(competition, playerMatch.goalsScored);
		history.goalsScored += playerMatch.goalsScored;
		history.injuries += (playerMatch.injured ? 1 : 0);
		history.matchesPlayed += (playerMatch.played ? 1 : 0);
		history.redCards += (playerMatch.RedCard ? 1 : 0);
		history.yellowCards += playerMatch.YellowCards;
		if (!ElifootOptions.repeatSameCalendarDay)
		{
			ChangeSkillAfterMatch(targetPlayerSkill, skillChangeRestricted);
		}
		base.Suspended--;
	}

	private void ChangeSkillAfterMatch(int targetPlayerSkill, bool skillChangeRestricted)
	{
		if (Util.GetRandomInt((playerMatch.deltaSkill > 0) ? 5 : 10) == 0)
		{
			int num = 0;
			if (playerMatch.deltaSkill > 0 && skill < targetPlayerSkill + 5)
			{
				num = 1;
			}
			else if (playerMatch.deltaSkill < 0 && skill > targetPlayerSkill - 5)
			{
				num = -1;
			}
			else if (!skillChangeRestricted)
			{
				num = ((base.Position != PlayerPosition.Keeper) ? ((Util.GetRandomInt(5) == 0) ? ((int)Mathf.Sign(playerMatch.deltaSkill)) : 0) : ((Util.GetRandomInt(10) == 0) ? ((int)Mathf.Sign(playerMatch.deltaSkill)) : 0));
			}
			skill += num;
			skill = Mathf.Clamp(skill, DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
		}
	}

	public override void PostDay()
	{
		base.Injured--;
	}

	public void ComputeLoss()
	{
		if (base.Team == null)
		{
			playerLoss = 0.0;
		}
		else
		{
			playerLoss = base.Team.PlayerLoss(this);
		}
	}

	public MatchEventType ShootPenalty(Team opponent, bool inMatchPenalty)
	{
		Player player = null;
		Team.TeamMatch.PlayerSpot[] selectedPlayersSpots = opponent.teamMatch.selectedPlayersSpots;
		for (int i = 0; i < selectedPlayersSpots.Length; i++)
		{
			Team.TeamMatch.PlayerSpot playerSpot = selectedPlayersSpots[i];
			if (playerSpot.player != null)
			{
				player = playerSpot.player;
				break;
			}
		}
		int randomInt = Util.GetRandomInt(GoalSkill() / 2);
		int randomInt2 = Util.GetRandomInt(player.GetGameSpotSkill(PlayerPosition.Keeper));
		int randomInt3 = Util.GetRandomInt(20 + aim);
		if (randomInt3 == 0 && Util.GetRandomInt(20) == 0)
		{
			return MatchEventType.PenaltyPost;
		}
		if (randomInt3 < 3)
		{
			return MatchEventType.PenaltyOver;
		}
		if (randomInt3 < 6)
		{
			return MatchEventType.PenaltySide;
		}
		if (randomInt2 > randomInt)
		{
			return MatchEventType.PenaltyDefended;
		}
		if (inMatchPenalty)
		{
			return MatchEventType.PenaltyGoalInMatch;
		}
		return MatchEventType.PenaltyGoalShootout;
	}

	public void ShowDetails(Action<PlayerDetailsView, Player, PlayerDetailsView.ReturnAction> onReturnAction, bool canEdit = true)
	{
		ScreenController.instance.ShowPlayerDetailsView(this, onReturnAction, canEdit);
	}

	public static void ShowLockedLegend()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		listOfParameters.RegisterParameter("playerSold", "PLAYER_LOCKED_SOLD", GetLockedIcon(SellPlayer.Sold), EliParameterType.Icon);
		listOfParameters.RegisterParameter("playerContract", "PLAYER_LOCKED_CONTRACT", GetLockedIcon(SellPlayer.Locked, canChangeSalary: false), EliParameterType.Icon);
		listOfParameters.RegisterParameter("playerContractLastDay", "PLAYER_LOCKED_CONTRACT_LAST_DAY", GetLockedIcon(SellPlayer.Locked), EliParameterType.Icon);
		listOfParameters.RegisterParameter("playerLoakcedMinPlayers", "PLAYER_LOCKED_MIN_TOTAL_PLAYERS", GetLockedIcon(SellPlayer.MinTotalPlayers), EliParameterType.Icon);
		ScreenController.instance.ShowParameterEditor("GEN_LEGEND", listOfParameters, null, showLoadingView: false, ParametersView.GridViewMode.Enlarged);
	}

	public void FillPrefabForBuy(PlayerBuyPrefab playerObj, Player player, bool includeTeam, Action action)
	{
		playerObj.FillPrefab(player, includeTeam, action);
	}

	public static Color32 GetBackgroundColor(PlayerPosition playerPosition)
	{
		Color32 color = Color.black;
		try
		{
			return playerPositionColors[PlayerBase.playerSectors[(int)playerPosition]];
		}
		catch (Exception)
		{
			return Color.black;
		}
	}

	public Sprite GetLockedIcon(Team myTeam)
	{
		return GetLockedIcon(myTeam.CanSellPlayer(this), CanChangeSalary(spontaneous: false));
	}

	private static Sprite GetLockedIcon(SellPlayer sellPlayer, bool canChangeSalary = true)
	{
		switch (sellPlayer)
		{
		case SellPlayer.Sold:
			return PlayerBase.LockedIconSold;
		case SellPlayer.Locked:
			if (canChangeSalary)
			{
				return PlayerBase.LockedIconGreen;
			}
			return PlayerBase.LockedIconYellow;
		default:
			return PlayerBase.LockedIconRed;
		case SellPlayer.OK:
			return null;
		}
	}

	public Sprite GetSellIcon(Team myTeam)
	{
		if (myTeam.CanSellPlayer(this) == SellPlayer.OK)
		{
			return PlayerBase.IconSell;
		}
		return GetLockedIcon(myTeam);
	}

	public Sprite GetChangeSalaryIcon(Team myTeam)
	{
		if (CanChangeSalary(spontaneous: false))
		{
			return PlayerBase.IconChangeSalary;
		}
		return GetLockedIcon(myTeam);
	}

	public Sprite GetHealInjuryIcon()
	{
		return PlayerBase.HealInjuryIcon;
	}

	public Sprite GetRemoveRedCardIcon()
	{
		return PlayerBase.RemoveRedCardIcon;
	}
}
