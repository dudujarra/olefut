using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

[Serializable]
public class Team : TeamBase
{
	[Serializable]
	public class TeamMatch
	{
		[Serializable]
		public struct PlayerSpot
		{
			public PlayerPosition formationPosition;

			public Player player;
		}

		public bool prepared;

		public int goals;

		public int targetGoals;

		public bool hasRedCard;

		public bool isHome;

		public int numSubstitutionsAvailable = DataManager.SUBSTITUTIONS_PER_MATCH_MAX;

		public PenaltyShootoutStatus penaltyShootoutStatus;

		public int penaltiesShot;

		public int penaltyShootoutGoals;

		public bool forcedSubstitution;

		public bool playerOffersComputed;

		public bool waitingForInMatchPenalty;

		public bool bankLoanChanged;

		public ListOfPlayers substitutePlayers;

		public ListOfPlayers unusedPlayers;

		public ListOfPlayers penaltyPlayers;

		public PlayerSpot[] selectedPlayersSpots = new PlayerSpot[11];

		private Formation formation;

		public bool Prepared
		{
			get
			{
				return prepared;
			}
			set
			{
				prepared = value;
			}
		}

		public Formation Formation => formation;

		public TeamMatch()
		{
			Reset();
		}

		public void Reset()
		{
			prepared = false;
			goals = 0;
			targetGoals = 0;
			hasRedCard = false;
			isHome = false;
			numSubstitutionsAvailable = DataManager.SUBSTITUTIONS_PER_MATCH_MAX;
			penaltyShootoutStatus = PenaltyShootoutStatus.None;
			penaltiesShot = 0;
			penaltyShootoutGoals = 0;
			forcedSubstitution = false;
			playerOffersComputed = false;
			waitingForInMatchPenalty = false;
			bankLoanChanged = false;
			selectedPlayersSpots = new PlayerSpot[11];
			formation = default(Formation);
		}

		public void SetFormation(Formation formation)
		{
			this.formation = formation;
			for (int i = 0; i < selectedPlayersSpots.Length; i++)
			{
				selectedPlayersSpots[i].formationPosition = formation.positions[i];
			}
		}

		public bool HasSubstitutionsAvailable()
		{
			return (numSubstitutionsAvailable > 0) & (substitutePlayers.Count != 0);
		}

		public void ReorderSelectedPlayers(int from, int to)
		{
			int num = from - to;
			if (num > 0)
			{
				for (int num2 = Mathf.Max(from, to); num2 > Mathf.Min(from, to); num2--)
				{
					Player player = selectedPlayersSpots[num2].player;
					selectedPlayersSpots[num2].player = selectedPlayersSpots[num2 - 1].player;
					selectedPlayersSpots[num2 - 1].player = player;
				}
			}
			else if (num < 0)
			{
				for (int i = Mathf.Min(from, to); i < Mathf.Max(from, to); i++)
				{
					Player player2 = selectedPlayersSpots[i].player;
					selectedPlayersSpots[i].player = selectedPlayersSpots[i + 1].player;
					selectedPlayersSpots[i + 1].player = player2;
				}
			}
		}

		public void ReorderPenaltyPlayers(int from, int to)
		{
			int num = from - to;
			if (num > 0)
			{
				for (int num2 = Mathf.Max(from, to); num2 > Mathf.Min(from, to); num2--)
				{
					Player value = penaltyPlayers.Player(num2);
					penaltyPlayers[num2] = penaltyPlayers.Player(num2 - 1);
					penaltyPlayers[num2 - 1] = value;
				}
			}
			else if (num < 0)
			{
				for (int i = Mathf.Min(from, to); i < Mathf.Max(from, to); i++)
				{
					Player value2 = penaltyPlayers.Player(i);
					penaltyPlayers[i] = penaltyPlayers.Player(i + 1);
					penaltyPlayers[i + 1] = value2;
				}
			}
		}

		public bool IsInSelectedPlayers(Player player)
		{
			PlayerSpot[] array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				if (array[i].player == player)
				{
					return true;
				}
			}
			return false;
		}

		public int GetSelectedPlayerSpot(Player player)
		{
			for (int i = 0; i < selectedPlayersSpots.Length; i++)
			{
				if (selectedPlayersSpots[i].player == player)
				{
					return i;
				}
			}
			return -1;
		}

		public int GetFirstPlayerIndexByPosition(PlayerPosition playerPosition)
		{
			for (int i = 0; i < selectedPlayersSpots.Length; i++)
			{
				if (selectedPlayersSpots[i].player != null && selectedPlayersSpots[i].player.Position == playerPosition)
				{
					return i;
				}
			}
			return -1;
		}

		public bool HasAnyPlayerSuspended()
		{
			PlayerSpot[] array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				PlayerSpot playerSpot = array[i];
				if (playerSpot.player != null && playerSpot.player.Suspended > 0)
				{
					return true;
				}
			}
			return false;
		}

		public bool HasAnyPlayerInjured()
		{
			PlayerSpot[] array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				PlayerSpot playerSpot = array[i];
				if (playerSpot.player != null && playerSpot.player.Injured > 0)
				{
					return true;
				}
			}
			return false;
		}

		public bool HasGKFilled()
		{
			return selectedPlayersSpots[0].player != null;
		}

		public (Player, int) GetRandomSelectedPlayer()
		{
			int num = 0;
			PlayerSpot[] array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				if (array[i].player != null)
				{
					num++;
				}
			}
			int num2 = Util.GetRandomInt(num);
			for (int j = 0; j < selectedPlayersSpots.Length; j++)
			{
				PlayerSpot playerSpot = selectedPlayersSpots[j];
				if (playerSpot.player != null)
				{
					if (num2 == 0)
					{
						return (playerSpot.player, j);
					}
					num2--;
				}
			}
			return (null, -1);
		}

		public Player GetRandomSelectedPlayer(int weightCriteria)
		{
			int num = 0;
			PlayerSpot[] array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				PlayerSpot playerSpot = array[i];
				if (playerSpot.player != null)
				{
					num += playerSpot.player.GetSelectionWeight(weightCriteria);
				}
			}
			int randomInt = Util.GetRandomInt(num);
			num = 0;
			array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				PlayerSpot playerSpot2 = array[i];
				if (playerSpot2.player != null)
				{
					num += playerSpot2.player.GetSelectionWeight(weightCriteria);
					if (num >= randomInt)
					{
						return playerSpot2.player;
					}
				}
			}
			return null;
		}

		public Formation GetBestFormation(ListOfPlayers availablePlayers, bool setSelectedPlayers = false)
		{
			float num = 10f;
			if ((float)UnityEngine.Random.Range(0, 100) < num)
			{
				availablePlayers.SortBySkill();
			}
			else
			{
				availablePlayers.Shuffle();
			}
			List<PlayerPosition> list = new List<PlayerPosition>();
			ListOfPlayers listOfPlayers = new ListOfPlayers();
			Formation result = default(Formation);
			Formation[] newShuffledFormations = FormationsData.GetNewShuffledFormations();
			float num2 = 1000f;
			float num3 = Mathf.Min(1f, (float)DataManager.instance.allMatches.Count / num2) * 100f;
			float num4 = 1f;
			float num5 = Mathf.Min(1f, (float)DataManager.instance.allMatches.Count / num4) * 100f;
			bool checkBySector = (float)UnityEngine.Random.Range(0, 100) < num5;
			if ((float)UnityEngine.Random.Range(0, 100) >= num3)
			{
				int num6 = ((availablePlayers.Count >= 11) ? 11 : 3);
				foreach (Player availablePlayer in availablePlayers)
				{
					list.Add(availablePlayer.Position);
					listOfPlayers.Add(availablePlayer);
					if (list.Count < num6)
					{
						continue;
					}
					(Formation, bool) possibleFormation = GetPossibleFormation(list, newShuffledFormations, checkBySector);
					if (possibleFormation.Item2)
					{
						if (setSelectedPlayers)
						{
							SetSelectedPlayers(possibleFormation.Item1, listOfPlayers);
						}
						return possibleFormation.Item1;
					}
					(result, _) = possibleFormation;
				}
			}
			else
			{
				int num7 = UnityEngine.Random.Range(0, newShuffledFormations.Length);
				result = newShuffledFormations[num7];
			}
			if (setSelectedPlayers)
			{
				SetSelectedPlayers(result, availablePlayers);
			}
			return result;
		}

		private (Formation, bool) GetPossibleFormation(List<PlayerPosition> currentPlayers, Formation[] allPossibleFormations, bool checkBySector)
		{
			Formation item = default(Formation);
			int num = -1;
			for (int i = 0; i < allPossibleFormations.Length; i++)
			{
				Formation formation = allPossibleFormations[i];
				int num2 = 0;
				if (checkBySector)
				{
					foreach (PlayerSector sector in Enum.GetValues(typeof(PlayerSector)))
					{
						int a = formation.positions.Count((PlayerPosition pos) => Player.GetPositionSector(pos) == sector);
						int b = currentPlayers.Count((PlayerPosition pos) => Player.GetPositionSector(pos) == sector);
						num2 += Mathf.Min(a, b);
					}
				}
				else
				{
					foreach (PlayerPosition position in Enum.GetValues(typeof(PlayerPosition)))
					{
						int a2 = formation.positions.Count((PlayerPosition pos) => pos == position);
						int b2 = currentPlayers.Count((PlayerPosition pos) => pos == position);
						num2 += Mathf.Min(a2, b2);
					}
				}
				if (num2 == 11)
				{
					return (formation, true);
				}
				if (num2 > num)
				{
					num = num2;
					item = formation;
				}
			}
			return (item, false);
		}

		public void SetSelectedPlayers(Formation formation, ListOfPlayers players)
		{
			if (formation.positions.Length != 11 || selectedPlayersSpots.Length != 11)
			{
				Debug.LogError("Something is wrong with the formation!");
				return;
			}
			Array.Clear(selectedPlayersSpots, 0, selectedPlayersSpots.Length);
			SetFormation(formation);
			ListOfPlayers listOfPlayers = new ListOfPlayers(players);
			for (int i = 1; i <= 2; i++)
			{
				int curSpotIndex;
				for (curSpotIndex = 0; curSpotIndex < selectedPlayersSpots.Length; curSpotIndex++)
				{
					if (selectedPlayersSpots[curSpotIndex].player == null)
					{
						if (listOfPlayers.Count == 0)
						{
							break;
						}
						Player player = null;
						player = ((i != 1) ? ((Player)listOfPlayers.OrderByDescending((EliObject p) => ((Player)p).GetGameSpotSkill(selectedPlayersSpots[curSpotIndex].formationPosition)).FirstOrDefault()) : ((Player)listOfPlayers.FirstOrDefault((EliObject p) => ((Player)p).Position == selectedPlayersSpots[curSpotIndex].formationPosition)));
						if (player != null && player != null)
						{
							selectedPlayersSpots[curSpotIndex].player = player;
							listOfPlayers.Remove(player);
						}
					}
				}
			}
		}

		public void SetSubstitutePlayers(ListOfPlayers fromThesePlayers)
		{
			int sUBSTITUTES_IN_BENCH_MAX = DataManager.SUBSTITUTES_IN_BENCH_MAX;
			substitutePlayers = ChooseBestPlayers(1, 1, 1, 1, sUBSTITUTES_IN_BENCH_MAX, fromThesePlayers);
			substitutePlayers.AddRange(ChooseBestPlayers(0, 1, 1, 1, sUBSTITUTES_IN_BENCH_MAX - substitutePlayers.Count, fromThesePlayers));
			substitutePlayers.AddRange(ChooseBestPlayers(0, 1, 1, 1, sUBSTITUTES_IN_BENCH_MAX - substitutePlayers.Count, fromThesePlayers));
			substitutePlayers.AddRange(ChooseBestPlayers(0, sUBSTITUTES_IN_BENCH_MAX, sUBSTITUTES_IN_BENCH_MAX, sUBSTITUTES_IN_BENCH_MAX, sUBSTITUTES_IN_BENCH_MAX - substitutePlayers.Count, fromThesePlayers));
			substitutePlayers.AddRange(ChooseBestPlayers(sUBSTITUTES_IN_BENCH_MAX, 0, 0, 0, sUBSTITUTES_IN_BENCH_MAX - substitutePlayers.Count, fromThesePlayers));
			substitutePlayers.SortByPosition();
		}

		public void SetUnusedPlayers(ListOfPlayers availablePlayers)
		{
			availablePlayers = new ListOfPlayers(availablePlayers, Mathf.Max(0, ElifootOptions.numAvailablePlayersMax - 11 - 7), onlyAvailable: true);
			unusedPlayers = new ListOfPlayers();
			foreach (Player availablePlayer in availablePlayers)
			{
				unusedPlayers.Add(availablePlayer);
			}
			availablePlayers.Clear();
			unusedPlayers.SortByPosition();
		}

		private ListOfPlayers ChooseBestPlayers(int gkNumber, int dfNumber, int mfNumber, int fwNumber, int maxPlayers, ListOfPlayers availablePlayers)
		{
			ListOfPlayers listOfPlayers = new ListOfPlayers();
			availablePlayers.SortBySkill();
			int[] array = new int[4] { gkNumber, dfNumber, mfNumber, fwNumber };
			foreach (Player availablePlayer in availablePlayers)
			{
				if (listOfPlayers.Count >= maxPlayers)
				{
					break;
				}
				if (array[(int)availablePlayer.Sector] > 0)
				{
					listOfPlayers.Add(availablePlayer);
					array[(int)availablePlayer.Sector]--;
				}
			}
			foreach (Player item in listOfPlayers)
			{
				availablePlayers.Remove(item);
			}
			return listOfPlayers;
		}

		public void SetPlayerByFormation(Formation formation, ListOfPlayers availablePlayers)
		{
			SetSelectedPlayers(formation, availablePlayers);
			PlayerSpot[] array = selectedPlayersSpots;
			for (int i = 0; i < array.Length; i++)
			{
				PlayerSpot playerSpot = array[i];
				availablePlayers.Remove(playerSpot.player);
			}
			SetSubstitutePlayers(availablePlayers);
			SetUnusedPlayers(availablePlayers);
		}
	}

	[Serializable]
	public class TeamSeasonBalance
	{
		public long inTickets;

		public long inPlayersSold;

		public long inPrizes;

		public long inSponsorship;

		public long inLoan;

		public long inOther;

		public long outSalaries;

		public long outPlayerBought;

		public long outStadium;

		public long outLoan;

		public long outLoanInterest;

		public long outOther;

		public long totalIn;

		public long totalOut;

		public long totalBalance;

		public TeamSeasonBalance()
		{
			Reset();
		}

		public void Reset()
		{
			inTickets = 0L;
			inPlayersSold = 0L;
			inPrizes = 0L;
			inSponsorship = 0L;
			inOther = 0L;
			outSalaries = 0L;
			outPlayerBought = 0L;
			outStadium = 0L;
			outOther = 0L;
			totalIn = 0L;
			totalOut = 0L;
			totalBalance = 0L;
		}
	}

	[Serializable]
	public class TeamSeason
	{
		public TeamSeasonBalance seasonBalance = new TeamSeasonBalance();

		public TeamCalendar calendar;

		public int matchesPlayed;

		private bool receivedSponsorship;

		public bool ReceivedSponsorship
		{
			get
			{
				return receivedSponsorship;
			}
			set
			{
				receivedSponsorship = value;
			}
		}

		public TeamSeason()
		{
			Reset();
		}

		public void Reset()
		{
			seasonBalance.Reset();
			calendar = new TeamCalendar();
			ReceivedSponsorship = false;
			matchesPlayed = 0;
		}
	}

	public TeamMatch teamMatch = new TeamMatch();

	public TeamMatch.PlayerSpot[] lastGameSelectedPlayersSpots;

	public Formation lastGameFormation;

	public ListOfPlayers lastGameSubstitutePlayers;

	public TeamSeason teamSeason = new TeamSeason();

	public Stadium stadium = new Stadium();

	private int[] numPlayersInSquad = new int[Enum.GetValues(typeof(PlayerPosition)).Length];

	private int[] numPlayersAccountable = new int[Enum.GetValues(typeof(PlayerPosition)).Length];

	private int numPlayersTotal;

	private int numPlayersField;

	private EliList pendingBankTransactions = new EliList();

	public int attackForce;

	public int defenseForce;

	public readonly Country country;

	public readonly Region region;

	public string textColor = "255,255,255";

	public string backgroundColor = "0,0,0";

	public int initLevel = 1;

	public int inGameAverageSkill = 1;

	public int averageSkill = 1;

	public int averageSkillKeeper = 1;

	public int averageSkillField = 1;

	public bool unblocked;

	public float myTicketPrice = 20f;

	public EliLimitedList teamTicketIncomeList = new EliLimitedList(DataManager.TICKETINCOME_LENGTH_HUMAN_MAX);

	public ListOfCompetitions nextYearCompetitions = new ListOfCompetitions();

	public Dictionary<Competition, int> competitionsWon = new Dictionary<Competition, int>();

	private Bank teamBank;

	private long bankLoanValue;

	public float moneyRatio = 1f;

	public bool shallAnalyseCoachDismiss;

	public int findSubstituteCoachStartingIndex;

	private string dbTeamID;

	private int dbTeamIndex;

	[NonSerialized]
	private Sprite shirt;

	[NonSerialized]
	private Sprite logo;

	[NonSerialized]
	private Sprite countryFlag;

	private bool usesStandardShirt;

	public Bank TeamBank => teamBank;

	public long BankLoanValue => bankLoanValue;

	public string DbTeamId => dbTeamID;

	public bool UsesStandardShirt
	{
		get
		{
			return usesStandardShirt;
		}
		set
		{
			usesStandardShirt = value;
		}
	}

	public Sprite MyShirt
	{
		get
		{
			try
			{
				if (shirt == null)
				{
					if (dbTeamIndex >= 0 && dbTeamIndex < LoadAndSavingTeams.instance.teams.AllTeams.Count && (LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].teamID == dbTeamID || LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].PreviousTeamIDs.Contains(dbTeamID)))
					{
						shirt = LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].Shirt;
					}
					else
					{
						dbTeamIndex = LoadAndSavingTeams.instance.teams.FindTeamIndex(dbTeamID);
						if (dbTeamIndex < 0 || dbTeamIndex >= LoadAndSavingTeams.instance.teams.AllTeams.Count)
						{
							return null;
						}
						shirt = LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].Shirt;
					}
				}
				return shirt;
			}
			catch (Exception)
			{
				shirt = null;
				return null;
			}
		}
		set
		{
			shirt = value;
		}
	}

	public Sprite MyLogo
	{
		get
		{
			try
			{
				if (logo == null)
				{
					if (dbTeamIndex >= 0 && dbTeamIndex < LoadAndSavingTeams.instance.teams.AllTeams.Count && (LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].teamID == dbTeamID || LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].PreviousTeamIDs.Contains(dbTeamID)))
					{
						logo = LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].Logo;
					}
					else
					{
						dbTeamIndex = LoadAndSavingTeams.instance.teams.FindTeamIndex(dbTeamID);
						if (dbTeamIndex < 0 || dbTeamIndex >= LoadAndSavingTeams.instance.teams.AllTeams.Count)
						{
							return null;
						}
						logo = LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].Logo;
					}
				}
				return logo;
			}
			catch (Exception)
			{
				logo = null;
				return null;
			}
		}
		set
		{
			logo = value;
		}
	}

	public Sprite MyCountryFlag
	{
		get
		{
			try
			{
				if (countryFlag == null)
				{
					if (dbTeamIndex >= 0 && dbTeamIndex < LoadAndSavingTeams.instance.teams.AllTeams.Count && (LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].teamID == dbTeamID || LoadAndSavingTeams.instance.teams.AllTeams[dbTeamIndex].PreviousTeamIDs.Contains(dbTeamID)))
					{
						countryFlag = LoadAndSavingTeams.instance.countries.FindFlagByCountryCode(CountryCode());
					}
					else
					{
						dbTeamIndex = LoadAndSavingTeams.instance.teams.FindTeamIndex(dbTeamID);
						if (dbTeamIndex < 0 || dbTeamIndex >= LoadAndSavingTeams.instance.teams.AllTeams.Count)
						{
							return null;
						}
						countryFlag = LoadAndSavingTeams.instance.countries.FindFlagByCountryCode(CountryCode());
					}
				}
				return countryFlag;
			}
			catch (Exception)
			{
				countryFlag = null;
				return null;
			}
		}
		set
		{
			countryFlag = value;
		}
	}

	public string CountryCode()
	{
		if (country == null)
		{
			return null;
		}
		return country.CountryCode;
	}

	public string RegionCode()
	{
		if (region != null)
		{
			return region.regionCode;
		}
		return null;
	}

	public void Initialize()
	{
		InitalizePlayers();
		InitBank();
		ComputeAverageSkill();
		stadium.SetInitialNumberSeats(averageSkill);
		SetInitialTicketPrice();
	}

	private void InitalizePlayers()
	{
		foreach (Player player in base.Players)
		{
			player.Initialize(base.TargetPlayerSkill);
		}
		totalSalaries = base.Players.TotalSalaries();
	}

	public Team(string dbTeamID, int dbTeamIndex, string name, string miniName, string textColor, string backgroundColor, int initLevel, ListOfPlayers players, Country country, Region region)
	{
		this.dbTeamID = dbTeamID;
		this.dbTeamIndex = dbTeamIndex;
		base.ShortName = miniName;
		base.Name = name;
		this.textColor = textColor;
		this.backgroundColor = backgroundColor;
		this.initLevel = initLevel;
		base.Players = players;
		this.country = country;
		this.region = region;
		Array.Clear(numPlayersInSquad, 0, numPlayersInSquad.Length);
		Array.Clear(numPlayersAccountable, 0, numPlayersInSquad.Length);
		numPlayersTotal = 0;
		foreach (Player player in players)
		{
			PlayerWasAdded(player);
		}
		teamBank = new Bank();
		morale = DataManager.TEAM_MORALE_DEFAULT;
		stadium.SetInitialNumberSeats(this.initLevel);
	}

	public Color GetMoraleColor()
	{
		int num = (int)Mathf.Clamp(400f - 300f * (float)morale / (float)DataManager.TEAM_MORALE_MAX, 0f, 255f);
		int num2 = (int)Mathf.Clamp(-250f + 1000f * (float)morale / (float)DataManager.TEAM_MORALE_MAX, 0f, 255f);
		int num3 = 0;
		return Util.ParseColor($"{num},{num2},{num3}");
	}

	public long GetTotalSalaries()
	{
		return totalSalaries;
	}

	public void SetInitSkill(int baseSkill)
	{
		foreach (Player player in base.Players)
		{
			int value = baseSkill + 2 - Util.GetRandomInt(5) + (player.IsStar ? DataManager.PLAYER_SKILL_STAR_INCREASE : 0);
			value = Mathf.Clamp(value, DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
			player.skill = value;
			long newSalary = (long)Math.Round(1.3 * (double)player.MyFairSalary() / 100.0) * 100;
			player.ChangeSalaryWithoutBlocking(newSalary);
			player.ChangeSalaryWithoutBlocking(player.MyFairSalary());
		}
	}

	public Division GetLeagueDivision(CompetitionType competitionType)
	{
		Competition competition = FindCompetition(competitionType);
		if (competition == null)
		{
			return null;
		}
		return MyDivision(competition);
	}

	public string GetDivisionName(Competition competition)
	{
		return MyDivision(competition)?.GetName();
	}

	public string GetLeagueDivisionName(CompetitionType competitionType)
	{
		return GetLeagueDivision(competitionType)?.GetName();
	}

	public string GetCountryAndNationalDivision()
	{
		string text = country?.GetName();
		string text2 = GetLeagueDivision(CompetitionType.NationalLeague)?.GetShortName();
		string text3 = "";
		if (string.IsNullOrEmpty(text2))
		{
			return text;
		}
		return (text + " - " + text2).Trim();
	}

	public int GetLeaguePosition(CompetitionType competitionType)
	{
		Division leagueDivision = GetLeagueDivision(competitionType);
		if (leagueDivision == null)
		{
			return 0;
		}
		return CompetitionData(leagueDivision.Competition).leaguePosition;
	}

	public void SetLeagueRoundPositions(Division division, int teamIndex)
	{
		int num = Array.IndexOf(Calendars.divisionConfigurations, division.teams.Count);
		if (num == -1)
		{
			throw new Exception($"Error in Team.SetLeagueRoundPositions(), divisionConfigurationIndex not found for division.teams.Count = {division.teams.Count}");
		}
		TeamCompetitionData teamCompetitionData = CompetitionData(division);
		if (teamCompetitionData != null)
		{
			for (int i = 0; i < 38; i++)
			{
				teamCompetitionData.leagueRoundPositions[i] = Calendars.allLeagueRoundPositions[num, teamIndex, i];
			}
		}
	}

	public long AverageSalaryForSkill(int skill)
	{
		long num = 0L;
		long num2 = 1L;
		foreach (Player player in base.Players)
		{
			num += player.Salary;
			num2 += player.skill;
		}
		return (long)Mathf.Clamp((long)Math.Round(1f * (float)skill * (float)(num / num2) / 100f) * 100, 100f, 200000f);
	}

	public void RemoveFromCup(Competition competition)
	{
		TeamCompetitionData teamCompetitionData = CompetitionData(competition);
		if (teamCompetitionData != null)
		{
			teamCompetitionData.isInCup = DataManager.IsInCup.Eliminated;
		}
	}

	public void BeginSeason()
	{
		teamSeason.Reset();
		ResetCompetitionData();
		ProcessPendingTransactions();
		ComputeAverageSkill();
		RegisterForCompetitions();
	}

	public void EndOfSeason()
	{
	}

	public void RegisterForCompetitions()
	{
		foreach (Competition nextYearCompetition in nextYearCompetitions)
		{
			nextYearCompetition.AddTeam(this);
		}
		nextYearCompetitions.Clear();
	}

	public void ResetMatch()
	{
		teamMatch.Reset();
		base.Players.ResetMatch();
	}

	public void PreMatch()
	{
		TeamMatch.PlayerSpot[] selectedPlayersSpots = teamMatch.selectedPlayersSpots;
		for (int i = 0; i < selectedPlayersSpots.Length; i++)
		{
			TeamMatch.PlayerSpot playerSpot = selectedPlayersSpots[i];
			if (playerSpot.player != null)
			{
				playerSpot.player.playerMatch.played = true;
			}
		}
		try
		{
			teamMatch.numSubstitutionsAvailable = Math.Min(teamMatch.substitutePlayers.Count, DataManager.SUBSTITUTIONS_PER_MATCH_MAX);
		}
		catch
		{
			teamMatch.numSubstitutionsAvailable = Math.Min(teamMatch.substitutePlayers.Count, DataManager.SUBSTITUTIONS_PER_MATCH_MAX);
		}
		lastGameSelectedPlayersSpots = new TeamMatch.PlayerSpot[11];
		Array.Copy(teamMatch.selectedPlayersSpots, lastGameSelectedPlayersSpots, teamMatch.selectedPlayersSpots.Length);
		lastGameFormation = teamMatch.Formation;
		lastGameSubstitutePlayers = new ListOfPlayers(teamMatch.substitutePlayers);
	}

	public void PreparePenaltyShootout()
	{
		FillPenaltyPlayers();
		teamMatch.penaltyShootoutStatus = PenaltyShootoutStatus.Shooting;
	}

	private void FillPenaltyPlayers()
	{
		teamMatch.penaltyPlayers = new ListOfPlayers();
		TeamMatch.PlayerSpot[] selectedPlayersSpots = teamMatch.selectedPlayersSpots;
		for (int i = 0; i < selectedPlayersSpots.Length; i++)
		{
			TeamMatch.PlayerSpot playerSpot = selectedPlayersSpots[i];
			if (playerSpot.player != null)
			{
				teamMatch.penaltyPlayers.Add(playerSpot.player);
			}
		}
		teamMatch.penaltyPlayers.SortByGoalSkillDesc();
	}

	public override void PostLoad()
	{
		base.Players.MyTeam = this;
		if (pendingBankTransactions == null)
		{
			pendingBankTransactions = new EliList();
		}
		base.PostLoad();
	}

	private void SetGoalsFirstLeg(Match match, TeamMatch teamMatch)
	{
		CompetitionData(match.competition).goalsFirstLeg = teamMatch.goals;
	}

	public void PostMatch(Match match)
	{
		teamSeason.matchesPlayed++;
		if (match.calEntry.matchType == MatchType.CupFirstLeg)
		{
			SetGoalsFirstLeg(match, teamMatch);
		}
		bool flag = match.homeTeam == this;
		TeamCalendarEntry teamCalendarEntry = teamSeason.calendar.FindEntry(match.calEntry);
		if (teamCalendarEntry != null)
		{
			if (flag)
			{
				teamCalendarEntry.goalsFor = match.homeTeam.teamMatch.goals;
				teamCalendarEntry.goalsAgainst = match.awayTeam.teamMatch.goals;
			}
			else
			{
				teamCalendarEntry.goalsFor = match.awayTeam.teamMatch.goals;
				teamCalendarEntry.goalsAgainst = match.homeTeam.teamMatch.goals;
			}
			teamCalendarEntry.played = true;
		}
		if (flag)
		{
			stadium.UpdateOccupancyRate(match.attendance);
		}
		Division division = MyDivision(match.competition);
		if (division != null)
		{
			TeamCompetitionData teamCompetitionData = CompetitionData(match.competition);
			base.TargetPlayerSkill = division.GetTargetSkillForPosition(teamCompetitionData.leaguePosition);
		}
		base.Players.PostMatch(match.competition, base.TargetPlayerSkill, !base.Coach.Present(ElifootOptions.SimulationFlag.Match));
		base.Coach.PostMatch();
		ComputeAverageSkill();
		shallAnalyseCoachDismiss = true;
		findSubstituteCoachStartingIndex = 0;
		if (bankLoanValue > 0)
		{
			PayInterest();
		}
		UpdateMoneyRatio();
		UpdateTargetTicketPrice();
	}

	private void UpdateTargetTicketPrice()
	{
		float num = DesiredTicketPrice(correctForMoneyRatio: false);
		myTicketPrice = Mathf.Clamp(0.97f * myTicketPrice + 0.03f * num, myTicketPrice * 0.9f - 1f, myTicketPrice * 1.1f + 1f);
		myTicketPrice = Math.Max(myTicketPrice, 1f);
	}

	public void SetInitialTicketPrice()
	{
		float num = DesiredTicketPrice(correctForMoneyRatio: false);
		myTicketPrice = num;
	}

	private float DesiredTicketPrice(bool correctForMoneyRatio)
	{
		double num = ((stadium.OccupancyRate < 0.20000000298023224) ? 0.20000000298023224 : stadium.OccupancyRate);
		long num2 = (long)((double)stadium.NumberSeats * num);
		long num3 = 2 * totalSalaries;
		double num4 = 1.0;
		if (moneyRatio > 2f)
		{
			num4 = 1.0 + Math.Sqrt(moneyRatio - 2f);
		}
		float num5 = (float)((double)((float)num3 * 1f / (float)num2) / num4 + (double)(10f * (float)averageSkill / (float)DataManager.PLAYER_SKILL_MAX));
		if (correctForMoneyRatio)
		{
			long num6 = 6 * totalSalaries - teamBank.Money;
			return Mathf.Max((0.95f * (float)num3 + 0.05f * (float)num6) / (float)num2, num5 / 2f);
		}
		return num5;
	}

	public void AddCompetitionWon(Competition competition)
	{
		if (!competitionsWon.ContainsKey(competition))
		{
			competitionsWon.Add(competition, 1);
		}
		else
		{
			competitionsWon[competition]++;
		}
	}

	public void UpdateMoneyRatio()
	{
		long num = totalSalaries * 10;
		float num2 = ((teamBank.Money > 0) ? ((float)teamBank.Money / (float)num) : 0.01f);
		moneyRatio = num2;
	}

	public void SetComputerCoach()
	{
		base.Coach.Name = "Computer";
		base.Coach.human = false;
	}

	public void SetHumanCoach(string coachName)
	{
		base.Coach.Name = coachName;
		base.Coach.human = true;
	}

	public void ComputeAverageAttackDefence()
	{
		float[] array = new float[11]
		{
			3f, 0.9f, 0.9f, 0.9f, 0.4f, 0.4f, 0.4f, 0.4f, 0.1f, 0.1f,
			0.1f
		};
		float[] array2 = new float[11]
		{
			0f, 0.1f, 0.1f, 0.1f, 0.6f, 0.6f, 0.6f, 0.6f, 0.9f, 0.9f,
			0.9f
		};
		int[] array3 = new int[11];
		inGameAverageSkill = 0;
		int num = 0;
		TeamMatch.PlayerSpot[] selectedPlayersSpots = teamMatch.selectedPlayersSpots;
		for (int i = 0; i < selectedPlayersSpots.Length; i++)
		{
			TeamMatch.PlayerSpot playerSpot = selectedPlayersSpots[i];
			Player player = playerSpot.player;
			if (player != null)
			{
				array3[(int)playerSpot.formationPosition] += player.GetGameSpotSkill(playerSpot.formationPosition);
				inGameAverageSkill += player.GetGameSpotSkill(playerSpot.formationPosition);
			}
			else
			{
				num++;
			}
		}
		inGameAverageSkill /= 11;
		int num2 = initLevel / 10;
		int num3 = initLevel / 10;
		for (int j = 0; j < array3.Length; j++)
		{
			num2 += Mathf.RoundToInt(array2[(int)teamMatch.selectedPlayersSpots[j].formationPosition] * (float)array3[j]);
			num3 += Mathf.RoundToInt(array[(int)teamMatch.selectedPlayersSpots[j].formationPosition] * (float)array3[j]);
		}
		if (num > 0)
		{
			num2 = Mathf.RoundToInt((1f - 0.1f * (float)num) * (float)num2);
			num3 = Mathf.RoundToInt((1f - 0.1f * (float)num) * (float)num3);
		}
		if (teamMatch.isHome)
		{
			num2 = Mathf.RoundToInt(1.1f * (float)num2);
			num3 = Mathf.RoundToInt(1.1f * (float)num3);
		}
		else
		{
			num2 = Mathf.RoundToInt(num2);
			num3 = Mathf.RoundToInt(num3);
		}
		float num4 = 1f + 0.1f * ((float)morale / (float)DataManager.TEAM_MORALE_MAX);
		num2 = Mathf.RoundToInt((float)num2 * num4);
		num3 = Mathf.RoundToInt((float)num3 * num4);
		if (base.Coach.human && ElifootOptions.humanCoachSuperPower)
		{
			num2 *= 10;
			num3 *= 10;
		}
		attackForce = num2;
		defenseForce = num3;
	}

	public void ComputePlayerDeltaSkill()
	{
		try
		{
			int index = UnityEngine.Random.Range(0, base.Players.Count);
			Player player = (Player)base.Players[index];
			player.playerMatch.deltaSkill += ((!teamMatch.IsInSelectedPlayers(player)) ? 1 : (-1));
		}
		catch (Exception ex)
		{
			Debug.LogErrorFormat("Exception in Team:ComputePlayerDeltaSkill. Team.Name={0}. {1}", base.Name, ex.Message);
		}
	}

	public bool ScoresGoal(Match match, int matchMinutes, Team opponent)
	{
		teamMatch.targetGoals = Mathf.RoundToInt((float)ElifootOptions.goalFrequency * 0.8f * Mathf.Log(1f + 2.5f * (float)attackForce / (float)(DataManager.PLAYER_SKILL_MAX + 2 * opponent.defenseForce)));
		if (ElifootOptions.goalFrequency > 0 && inGameAverageSkill > opponent.inGameAverageSkill)
		{
			teamMatch.targetGoals += (inGameAverageSkill - opponent.inGameAverageSkill) / 8;
		}
		if (ElifootOptions.goalFrequency > 0 && opponent.teamMatch.goals == 0 && teamMatch.goals > 0)
		{
			teamMatch.targetGoals++;
		}
		bool flag = Util.GetRandomDouble() < (double)((float)(teamMatch.targetGoals - teamMatch.goals) / 150f);
		if (!flag && ElifootOptions.goalFrequency > 0)
		{
			flag = Util.GetRandomInt(1000) == 0;
		}
		if (flag)
		{
			teamMatch.goals++;
			if (match.HasPresentCoach())
			{
				SoundManager.instance.PlaySound(DataManager.instance.GetMatchEventAudioSource(MatchEventType.Goal), vibration: true);
			}
		}
		return flag;
	}

	public MatchEventType ShootPenalty(Team opponent, Player penaltyPlayer, bool inMatchPenalty, int gameTime)
	{
		MatchEventType matchEventType = penaltyPlayer.ShootPenalty(opponent, inMatchPenalty);
		if (!inMatchPenalty)
		{
			teamMatch.penaltiesShot++;
		}
		switch (matchEventType)
		{
		case MatchEventType.PenaltyGoalInMatch:
			penaltyPlayer.playerMatch.goalsScored++;
			teamMatch.goals++;
			break;
		case MatchEventType.PenaltyGoalShootout:
			teamMatch.penaltyShootoutGoals++;
			break;
		}
		return matchEventType;
	}

	public void ChangeMorale(int delta)
	{
		morale = Mathf.Clamp(morale + delta, DataManager.TEAM_MORALE_MIN, DataManager.TEAM_MORALE_MAX);
	}

	public void ChangeSkill(int delta)
	{
		averageSkill = Mathf.Clamp(averageSkill + delta, DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
	}

	public void ComputeAverageSkill()
	{
		int num = 0;
		int num2 = 0;
		int num3 = 0;
		int num4 = 0;
		int num5 = 0;
		foreach (Player player in base.Players)
		{
			num += player.skill;
			if (player.Position == PlayerPosition.Keeper)
			{
				num2 += player.skill;
				num4++;
			}
			else
			{
				num3 += player.skill;
				num5++;
			}
		}
		try
		{
			averageSkill = num / base.Players.Count;
			averageSkillField = ((num5 != 0) ? (num3 / num5) : 0);
			averageSkillKeeper = ((num4 != 0) ? (num2 / num4) : 0);
		}
		catch (Exception ex)
		{
			Debug.LogErrorFormat("Exception in Team::ComputeAverageSkill(). Team.name={0}. {1}", base.Name, ex.Message);
		}
	}

	public BuyPlayer CanBuyPlayer(Player p, long price)
	{
		if (teamBank.Money < price)
		{
			return BuyPlayer.Price;
		}
		if (numPlayersTotal >= 50)
		{
			return BuyPlayer.TotalPlayersInSquad;
		}
		if (Util.SumOfArrayOfInt(numPlayersAccountable) >= 50)
		{
			return BuyPlayer.TotalPlayersIncludingAcquisitions;
		}
		return BuyPlayer.OK;
	}

	public SellPlayer CanSellPlayer(Player player)
	{
		if (player.SoldToTeam != null)
		{
			return SellPlayer.Sold;
		}
		if (player.LockedFor > 0)
		{
			return SellPlayer.Locked;
		}
		if (GetTotalAccountablePlayers() <= 14)
		{
			return SellPlayer.MinTotalPlayers;
		}
		if (player.Position == PlayerPosition.Keeper)
		{
			if (numPlayersAccountable[0] <= 1)
			{
				return SellPlayer.MinGoalKeepers;
			}
		}
		else if (GetTotalAccountableFieldPlayers() <= 10)
		{
			return SellPlayer.MinFieldPlayers;
		}
		return SellPlayer.OK;
	}

	public bool IsPlayerForSale(Player player)
	{
		if (player.directSellPrice > 0)
		{
			return CanSellPlayer(player) == SellPlayer.OK;
		}
		return false;
	}

	public int PlayersByPosition(PlayerPosition position)
	{
		return base.Players.FindAll((EliObject obj) => ((Player)obj).Position == position).Count;
	}

	public int GetTotalAccountablePlayers()
	{
		int num = 0;
		for (int i = 0; i < numPlayersAccountable.Length; i++)
		{
			num += numPlayersAccountable[i];
		}
		return num;
	}

	public int GetTotalAccountableFieldPlayers()
	{
		int num = 0;
		for (int i = 1; i < numPlayersAccountable.Length; i++)
		{
			num += numPlayersAccountable[i];
		}
		return num;
	}

	public void PlayerWasAdded(Player player)
	{
		try
		{
			player.Team = this;
			numPlayersTotal++;
			numPlayersInSquad[(int)player.Position]++;
			if (player.Position != PlayerPosition.Keeper)
			{
				numPlayersField++;
			}
			if (player.SoldToTeam == null)
			{
				numPlayersAccountable[(int)player.Position]++;
			}
			totalSalaries += player.Salary;
		}
		catch
		{
			Debug.LogError("Error in Team.PlayerWasAdded. team: " + base.ShortName + ". player: " + player.Name);
		}
	}

	public void PlayerWasRemoved(Player player)
	{
		if (player != null)
		{
			if (player.Team == this)
			{
				player.Team = null;
			}
			numPlayersTotal--;
			numPlayersInSquad[(int)player.Position]--;
			if (player.Position != PlayerPosition.Keeper)
			{
				numPlayersField--;
			}
			if (player.SoldToTeam == null)
			{
				numPlayersAccountable[(int)player.Position]--;
			}
			totalSalaries -= player.Salary;
		}
	}

	public void PlayerSalaryChanged(Player player, long oldSalary, long newSalary)
	{
		totalSalaries += (newSalary -= oldSalary);
	}

	public void PrePrepareMatch(Match currentMatch)
	{
		teamMatch.isHome = currentMatch.homeTeam.Equals(this);
		UpdateTotalSalaries();
		if (base.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement))
		{
			PrePrepareMatchByHuman();
		}
		else
		{
			PrePrepareMatchByComputer();
		}
	}

	private void PrePrepareMatchByHuman()
	{
		ComputePlayerOffers();
	}

	public void PrePrepareMatchByComputer()
	{
		AutoUpdatePlayerSalaries();
	}

	public void PrepareMatchByComputer()
	{
		UpdateDirectSellPrices();
		TryBuildStadium();
		TryPayLoan();
		SetPlayersByBestFormation();
		ComputeAverageAttackDefence();
		teamMatch.Prepared = true;
	}

	public void TryBuildStadium()
	{
		if (!(stadium.OccupancyRate < 0.8) && (float)teamBank.Money / (float)totalSalaries > 3f && stadium.MayIncreaseNumberSeats())
		{
			long newBenchPrice = stadium.GetNewBenchPrice();
			if (teamBank.Money - 3 * totalSalaries > newBenchPrice)
			{
				stadium.IncreaseNumberSeats(DataManager.STADIUM_SEATS_BLOCK_SIZE);
				MoneyTransaction(-1 * newBenchPrice, TransactionType.Stadium, false);
			}
		}
	}

	public void TryPayLoan()
	{
		if (bankLoanValue > 0)
		{
			long num = (long)Mathf.FloorToInt((teamBank.Money - 3 * totalSalaries) / 1000000) * 1000000L;
			if (num > 0)
			{
				GetBankInterestValue(bankLoanValue - num);
				PayLoan(num);
			}
		}
	}

	public (Player, long) TrySellPlayers()
	{
		int count = DataManager.instance.allTeams.Count;
		if (teamBank.Money < 0)
		{
			ComputePlayerOffers();
			base.Players.SortByBestOfferDesc();
			foreach (Player player4 in base.Players)
			{
				if (CanSellPlayer(player4) == SellPlayer.OK && player4.BestOfferTeam != null && player4.BestOfferValue > 0 && player4.BestOfferTeam.CanBuyPlayer(player4, player4.BestOfferValue) == BuyPlayer.OK)
				{
					long newSalary = player4.BestOfferTeam.AverageSalaryForSkill(player4.skill);
					DataManager.PlayerTraded(player4, this, player4.BestOfferTeam, player4.BestOfferValue, newSalary);
					return (null, 0L);
				}
			}
		}
		if ((float)teamBank.Money / (float)totalSalaries < 3f || Util.GetRandomInt(count) < count / 100 || base.Players.Count > 30)
		{
			ComputePlayerOffers();
			base.Players.ComputePlayerLoss();
			bool flag = teamBank.Money < 0;
			if (!flag)
			{
				base.Players.SortByPlayerLoss();
			}
			int num = (flag ? 20 : 10);
			foreach (Player player5 in base.Players)
			{
				if (CanSellPlayer(player5) != SellPlayer.OK)
				{
					continue;
				}
				long num2 = player5.FairPrice();
				long num3 = ((!flag) ? PlayerDirectSellPrice(player5, num2) : 0);
				Team team = null;
				long num4 = 0L;
				int num5 = num;
				do
				{
					num5--;
					Team randomItem = ((Division)DataManager.instance.allDivisions.GetRandomItem()).teams.GetRandomItem();
					if (randomItem.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement) || randomItem.CanBuyPlayer(player5, num2) != BuyPlayer.OK)
					{
						continue;
					}
					long newSalary2 = player5.MyFairSalary();
					long offerForPlayer = randomItem.GetOfferForPlayer(player5, num3, newSalary2, num2);
					if (offerForPlayer > num4)
					{
						num4 = offerForPlayer;
						team = randomItem;
						if (!flag)
						{
							num5 = num;
						}
					}
				}
				while (num5 > 0);
				if (num4 >= num3 && team != null)
				{
					long newSalary3 = team.AverageSalaryForSkill(player5.skill);
					DataManager.PlayerTraded(player5, this, team, num4, newSalary3);
					break;
				}
			}
		}
		if ((float)teamBank.Money / (float)totalSalaries < 6f && Util.GetRandomInt(count) < count / 20)
		{
			base.Players.ComputePlayerLoss();
			base.Players.SortByPlayerLoss();
			foreach (Player player6 in base.Players)
			{
				if (CanSellPlayer(player6) == SellPlayer.OK)
				{
					ListOfTeams allPresentCoach = DataManager.instance.allTeams.GetAllPresentCoach(ElifootOptions.SimulationFlag.TeamManagement);
					long num6 = PlayerDirectSellPrice(player6, player6.FairPrice());
					if (allPresentCoach.CanBuyPlayer(player6, num6))
					{
						long num7 = CalculateSellPlayerBaseValue(num6);
						num7 = ((num7 >= 0) ? num7 : 0);
						return (player6, num7);
					}
				}
			}
		}
		return (null, 0L);
	}

	private long CalculateSellPlayerBaseValue(long basePrice)
	{
		return (long)UnityEngine.Random.Range((float)basePrice * 0.8f, (float)basePrice * 1.2f);
	}

	public void PlayerSold(Player player, long price, Team toTeam)
	{
		numPlayersAccountable[(int)player.Position]--;
		MoneyTransaction(price, TransactionType.PlayerSold, false, player);
		player.SoldToTeam = toTeam;
	}

	public void PlayerBought(Player player, long price, long newSalary)
	{
		numPlayersAccountable[(int)player.Position]++;
		player.nextSalary = newSalary;
		MoneyTransaction(-price, TransactionType.PlayerBought, false, player);
	}

	public long GetOfferForPlayer(Player player, long sellPrice, long newSalary, long fairPrice)
	{
		if (CanBuyPlayer(player, 0L) != BuyPlayer.OK)
		{
			return 0L;
		}
		double num = (double)PlayerNeed(player, numPlayersAccountable) * (double)fairPrice * Math.Sqrt(Math.Min(2f, moneyRatio));
		if (num > 0.95 * (double)sellPrice && num < (double)sellPrice)
		{
			num = sellPrice;
		}
		double num2 = teamBank.Money - (totalSalaries + newSalary) * 3;
		num = Mathf.Min((float)num, (float)num2);
		if (sellPrice == 0L && num < (double)(fairPrice / 2))
		{
			num = 0.0;
		}
		num = Math.Max(num, 0.0);
		num = Math.Round(num / 100.0) * 100.0;
		return (long)num;
	}

	public float PlayerLoss(Player player)
	{
		PlayerPosition position = player.Position;
		int[] array = (int[])numPlayersAccountable.Clone();
		array[(int)position]--;
		return PlayerNeed(player, array);
	}

	public long PlayerDirectSellPrice(Player player, long fairPrice)
	{
		long result = 0L;
		if (CanSellPlayer(player) == SellPlayer.OK)
		{
			float num = PlayerLoss(player);
			float num2 = (float)fairPrice * 1.6f * num;
			int num3 = ((num2 > 100000f) ? 1000 : 100);
			result = (long)num2;
			result = (long)Math.Round(num2 / (float)num3) * num3;
			result = Math.Max(result, 0L);
		}
		return result;
	}

	public float PlayerNeed(Player player, int[] accountablePlayers)
	{
		PlayerPosition position = player.Position;
		int value = (int)((float)averageSkill * 1f / (float)DataManager.PLAYER_SKILL_MAX * 5f);
		value = Mathf.Clamp(value, 0, DataManager.desiredNumPlayers.GetLength(0) - 1);
		float num = accountablePlayers[(int)position];
		float num2 = DataManager.desiredNumPlayers[value, (int)position];
		float num3 = 0f;
		foreach (int num4 in accountablePlayers)
		{
			num3 += (float)num4;
		}
		float num5 = 0f;
		foreach (PlayerPosition value2 in Enum.GetValues(typeof(PlayerPosition)))
		{
			num5 += (float)DataManager.desiredNumPlayers[value, (int)value2];
		}
		float num6 = Mathf.Sqrt(num2 / (num + 2f) * num5 / (num3 + 2f));
		num6 *= Mathf.Sqrt((float)player.skill / (float)averageSkill);
		if (position == PlayerPosition.Keeper && accountablePlayers[0] <= 1)
		{
			num6 *= 1.5f;
		}
		if (country == player.country)
		{
			num6 *= 1.2f;
		}
		return num6 / (float)Math.Sqrt((double)player.Behaviour);
	}

	public void SetGamePlayers()
	{
		if (teamMatch.Formation.Equals(default(Formation)))
		{
			if (!HasLastGameRecordedFormation())
			{
				SetPlayersByBestFormation();
				return;
			}
			ClearPlayersInSubstitutionView();
			ListOfPlayers availablePlayers = new ListOfPlayers(base.Players, base.Players.Count, onlyAvailable: true);
			SetPlayersByLastGame(ref availablePlayers);
		}
	}

	private void SetPlayersByBestFormation()
	{
		ListOfPlayers listOfPlayers = new ListOfPlayers(base.Players, base.Players.Count, onlyAvailable: true);
		teamMatch.GetBestFormation(listOfPlayers, setSelectedPlayers: true);
		TeamMatch.PlayerSpot[] selectedPlayersSpots = teamMatch.selectedPlayersSpots;
		for (int i = 0; i < selectedPlayersSpots.Length; i++)
		{
			TeamMatch.PlayerSpot playerSpot = selectedPlayersSpots[i];
			listOfPlayers.Remove(playerSpot.player);
		}
		teamMatch.SetSubstitutePlayers(listOfPlayers);
		teamMatch.SetUnusedPlayers(listOfPlayers);
	}

	public void RefreshBestPlayersForCurrentFormation()
	{
		ClearPlayersInSubstitutionView();
		ListOfPlayers listOfPlayers = new ListOfPlayers(base.Players, base.Players.Count, onlyAvailable: true);
		listOfPlayers.SortBySkill();
		teamMatch.SetPlayerByFormation(teamMatch.Formation, listOfPlayers);
	}

	private void ClearPlayersInSubstitutionView()
	{
		teamMatch.substitutePlayers.Clear();
		teamMatch.unusedPlayers.Clear();
	}

	private bool HasLastGameRecordedFormation()
	{
		return (lastGameSelectedPlayersSpots != null && lastGameSelectedPlayersSpots.Length != 0) & !lastGameFormation.Equals(default(Formation)) & (lastGameSubstitutePlayers != null);
	}

	private void SetPlayersByLastGame(ref ListOfPlayers availablePlayers)
	{
		teamMatch.SetFormation(lastGameFormation);
		ListOfPlayers openPlayers = GetOpenPlayers(availablePlayers);
		SetSubstitutePlayersByLastGame(ref availablePlayers, ref openPlayers);
		SetSelectedPlayersByLastGame(ref availablePlayers, ref openPlayers);
		int limit = Mathf.Min(11, ElifootOptions.numAvailablePlayersMax);
		int limit2 = Mathf.Clamp(ElifootOptions.numAvailablePlayersMax - 11, 0, 7);
		int limit3 = Mathf.Max(0, ElifootOptions.numAvailablePlayersMax - 11 - 7);
		CheckMissingSelectedPlayers(limit, ref teamMatch.substitutePlayers);
		CheckMissingSelectedPlayers(limit, ref openPlayers);
		CheckMissingPlayers(ref teamMatch.substitutePlayers, limit2, ref openPlayers);
		CheckExcessPlayers(ref openPlayers, limit3);
		foreach (Player item in openPlayers)
		{
			teamMatch.unusedPlayers.Add(item);
		}
	}

	private ListOfPlayers GetOpenPlayers(ListOfPlayers availablePlayers)
	{
		ListOfPlayers listOfPlayers = new ListOfPlayers();
		foreach (Player player in availablePlayers)
		{
			if (lastGameSelectedPlayersSpots.Count((TeamMatch.PlayerSpot p) => p.player == player) == 0 && !lastGameSubstitutePlayers.Contains(player) && player != null)
			{
				listOfPlayers.Add(player);
			}
		}
		return listOfPlayers;
	}

	private void SetSubstitutePlayersByLastGame(ref ListOfPlayers availablePlayers, ref ListOfPlayers openPlayers)
	{
		foreach (Player lastGameSubstitutePlayer in lastGameSubstitutePlayers)
		{
			if (!availablePlayers.Contains(lastGameSubstitutePlayer))
			{
				Player bestPlayerByPosition = GetBestPlayerByPosition(openPlayers, lastGameSubstitutePlayer.Position, canReturnAnyPosition: true, canBeGK: true);
				if (bestPlayerByPosition != null)
				{
					teamMatch.substitutePlayers.Add(bestPlayerByPosition);
					openPlayers.Remove(bestPlayerByPosition);
				}
			}
			else
			{
				teamMatch.substitutePlayers.Add(lastGameSubstitutePlayer);
			}
		}
	}

	private void SetSelectedPlayersByLastGame(ref ListOfPlayers availablePlayers, ref ListOfPlayers openPlayers)
	{
		for (int i = 0; i < lastGameSelectedPlayersSpots.Length; i++)
		{
			Player player = lastGameSelectedPlayersSpots[i].player;
			if (player == null || !availablePlayers.Contains(player) || KeeperSpecialCaseHappens(i, player, availablePlayers))
			{
				Player bestPlayerByPosition = GetBestPlayerByPosition(teamMatch.substitutePlayers, lastGameSelectedPlayersSpots[i].formationPosition);
				if (bestPlayerByPosition != null)
				{
					teamMatch.selectedPlayersSpots[i].player = bestPlayerByPosition;
					teamMatch.substitutePlayers.Remove(bestPlayerByPosition);
					continue;
				}
				bestPlayerByPosition = GetBestPlayerByPosition(openPlayers, lastGameSelectedPlayersSpots[i].formationPosition, canReturnAnyPosition: true);
				if (bestPlayerByPosition != null)
				{
					teamMatch.selectedPlayersSpots[i].player = bestPlayerByPosition;
					openPlayers.Remove(bestPlayerByPosition);
				}
			}
			else
			{
				teamMatch.selectedPlayersSpots[i].player = player;
			}
		}
	}

	private bool KeeperSpecialCaseHappens(int index, Player player, ListOfPlayers availablePlayers)
	{
		return (teamMatch.selectedPlayersSpots[index].formationPosition == PlayerPosition.Keeper) & (player.Position != PlayerPosition.Keeper) & (availablePlayers.GetFirstPlayerByPosition(PlayerPosition.Keeper) != null);
	}

	private void CheckMissingSelectedPlayers(int limit, ref ListOfPlayers getFromThesePlayers)
	{
		for (int i = 0; i < teamMatch.selectedPlayersSpots.Length; i++)
		{
			if (i >= limit)
			{
				teamMatch.selectedPlayersSpots[i].player = null;
			}
			else if (teamMatch.selectedPlayersSpots[i].player == null)
			{
				if (getFromThesePlayers.Count == 0)
				{
					break;
				}
				Player bestPlayerByPosition = GetBestPlayerByPosition(getFromThesePlayers, teamMatch.selectedPlayersSpots[i].formationPosition, canReturnAnyPosition: true, canBeGK: true);
				teamMatch.selectedPlayersSpots[i].player = bestPlayerByPosition;
				getFromThesePlayers.Remove(bestPlayerByPosition);
			}
		}
	}

	private void CheckMissingPlayers(ref ListOfPlayers fromThisList, int limit, ref ListOfPlayers getFromThesePlayers, bool oneGKOnly = false)
	{
		bool flag = fromThisList.Count < limit;
		while (flag && getFromThesePlayers != null && getFromThesePlayers.Count != 0)
		{
			if (oneGKOnly)
			{
				if (fromThisList.GetPlayersByPosition(PlayerPosition.Keeper).Count == 0)
				{
					Player bestPlayerByPosition = GetBestPlayerByPosition(getFromThesePlayers, PlayerPosition.Keeper);
					if (bestPlayerByPosition != null)
					{
						fromThisList.Add(bestPlayerByPosition);
						getFromThesePlayers.Remove(bestPlayerByPosition);
						flag = fromThisList.Count < limit;
						continue;
					}
					if (fromThisList.Count == limit - 1)
					{
						break;
					}
				}
				if (fromThisList.GetPlayersByPosition(PlayerPosition.Keeper).Count == 1)
				{
					Player bestPlayerByPosition2 = GetBestPlayerByPosition(getFromThesePlayers, null, canReturnAnyPosition: true);
					if (bestPlayerByPosition2 != null)
					{
						fromThisList.Add(bestPlayerByPosition2);
						getFromThesePlayers.Remove(bestPlayerByPosition2);
						flag = fromThisList.Count < limit;
					}
				}
			}
			else
			{
				Player bestPlayerByPosition3 = GetBestPlayerByPosition(getFromThesePlayers, null, canReturnAnyPosition: true, canBeGK: true);
				fromThisList.Add(bestPlayerByPosition3);
				getFromThesePlayers.Remove(bestPlayerByPosition3);
				flag = fromThisList.Count < limit;
			}
		}
		CheckExcessPlayers(ref fromThisList, limit);
	}

	private void CheckExcessPlayers(ref ListOfPlayers fromThisList, int limit)
	{
		bool flag = fromThisList.Count > limit;
		while (flag)
		{
			fromThisList.RemoveAt(fromThisList.Count - 1);
			flag = fromThisList.Count > limit;
		}
	}

	private Player GetBestPlayerByPosition(ListOfPlayers fromThesePlayers, PlayerPosition? position, bool canReturnAnyPosition = false, bool canBeGK = false)
	{
		if (fromThesePlayers == null || fromThesePlayers.Count == 0)
		{
			return null;
		}
		fromThesePlayers.SortBySkill();
		if (position.HasValue)
		{
			foreach (Player fromThesePlayer in fromThesePlayers)
			{
				if (fromThesePlayer.Position == position)
				{
					return fromThesePlayer;
				}
			}
			if (!canReturnAnyPosition)
			{
				return null;
			}
			if (position != PlayerPosition.Keeper)
			{
				foreach (Player fromThesePlayer2 in fromThesePlayers)
				{
					if (fromThesePlayer2.Position != PlayerPosition.Keeper)
					{
						return fromThesePlayer2;
					}
				}
			}
			if (!canBeGK)
			{
				return null;
			}
		}
		else if (!canBeGK)
		{
			foreach (Player fromThesePlayer3 in fromThesePlayers)
			{
				if (fromThesePlayer3.Position != PlayerPosition.Keeper)
				{
					return fromThesePlayer3;
				}
			}
			return null;
		}
		return fromThesePlayers.Player(0);
	}

	private void AutoUpdatePlayerSalaries()
	{
		for (int i = 1; i <= 3; i++)
		{
			Player randomItem = base.Players.GetRandomItem();
			if (randomItem != null && (randomItem.CanChangeSalary(spontaneous: false) || teamBank.Money < 0))
			{
				long salary = randomItem.Salary;
				long fairSalary = Player.GetFairSalary(randomItem.skill, this, randomItem.MaxSalaryIncrease());
				fairSalary = (int)((float)fairSalary / 100f) * 100;
				if ((float)salary / (float)fairSalary > 1.1f || (float)fairSalary / 1.1f > (float)salary)
				{
					randomItem.Salary = fairSalary;
					break;
				}
			}
		}
	}

	public void UpdateTotalSalaries()
	{
		totalSalaries = base.Players.TotalSalaries();
	}

	public void UpdateDirectSellPrices()
	{
		foreach (Player player in base.Players)
		{
			player.directSellPrice = PlayerDirectSellPrice(player, player.FairPrice());
		}
	}

	public void PaySalaries()
	{
		MoneyTransaction(-totalSalaries, TransactionType.Salaries, false);
	}

	public void ForcedSubstitutionByComputer(Match match, int gameTime)
	{
		teamMatch.forcedSubstitution = false;
		for (int i = 0; i < teamMatch.selectedPlayersSpots.Length; i++)
		{
			Player player = teamMatch.selectedPlayersSpots[i].player;
			if (player != null && (player.playerMatch.sentOff || player.playerMatch.injured))
			{
				SubstituteComputerPlayer(match, i, gameTime);
				break;
			}
		}
	}

	private void SubstituteComputerPlayer(Match match, int playerToGoIndex, int gameTime)
	{
		Player player = teamMatch.selectedPlayersSpots[playerToGoIndex].player;
		if (player.playerMatch.sentOff)
		{
			RemovePCPlayer(match, gameTime, playerToGoIndex);
		}
		else if (player.playerMatch.injured)
		{
			if (!teamMatch.HasSubstitutionsAvailable())
			{
				RemovePCPlayer(match, gameTime, playerToGoIndex);
				return;
			}
			Player bestPlayerByPosition = GetBestPlayerByPosition(teamMatch.substitutePlayers, player.Position, canReturnAnyPosition: true, canBeGK: true);
			int player2Index = teamMatch.substitutePlayers.IndexOf(bestPlayerByPosition);
			SubstitutePlayersInMatch(match, PlayerList.Selected, PlayerList.Substitute, playerToGoIndex, player2Index, gameTime);
		}
		else
		{
			Debug.LogError("Should NOT have an else...");
		}
	}

	private void RemovePCPlayer(Match match, int gameTime, int playerToGoIndex)
	{
		teamMatch.selectedPlayersSpots[playerToGoIndex].player = null;
		if (playerToGoIndex == 0)
		{
			FindAndFillGKPosition(match, gameTime);
		}
		ComputeAverageAttackDefence();
	}

	private void FindAndFillGKPosition(Match match, int gameTime)
	{
		int firstPlayerIndexByPosition = teamMatch.GetFirstPlayerIndexByPosition(PlayerPosition.Keeper);
		if (firstPlayerIndexByPosition != -1)
		{
			SubstitutePlayers(PlayerList.Selected, PlayerList.Selected, firstPlayerIndexByPosition, 0);
			return;
		}
		if (teamMatch.HasSubstitutionsAvailable())
		{
			Player firstPlayerByPosition = teamMatch.substitutePlayers.GetFirstPlayerByPosition(PlayerPosition.Keeper);
			if (firstPlayerByPosition != null)
			{
				int player2Index = teamMatch.substitutePlayers.IndexOf(firstPlayerByPosition);
				int item = teamMatch.GetRandomSelectedPlayer().Item2;
				SubstitutePlayersInMatch(match, PlayerList.Selected, PlayerList.Substitute, item, player2Index, gameTime);
				SubstitutePlayers(PlayerList.Selected, PlayerList.Selected, item, 0);
				return;
			}
		}
		int item2 = teamMatch.GetRandomSelectedPlayer().Item2;
		SubstitutePlayers(PlayerList.Selected, PlayerList.Selected, item2, 0);
	}

	public void SubstitutePlayersInMatch(Match match, PlayerList player1List, PlayerList player2List, int player1Index, int player2Index, int gameTime)
	{
		(Player, Player) bothPlayers = GetBothPlayers(player1List, player2List, player1Index, player2Index);
		if (player1List != player2List)
		{
			RegisterSubstitutionEvents(match, bothPlayers.Item1, bothPlayers.Item2, player1List, player2List, gameTime);
			teamMatch.numSubstitutionsAvailable--;
		}
		SubstitutePlayers(player1List, player2List, player1Index, player2Index);
		teamMatch.substitutePlayers.RemoveNullPlayers();
	}

	public void SubstitutePlayers(PlayerList player1List, PlayerList player2List, int player1Index, int player2Index)
	{
		(Player, Player) bothPlayers = GetBothPlayers(player1List, player2List, player1Index, player2Index);
		switch (player1List)
		{
		case PlayerList.Selected:
			teamMatch.selectedPlayersSpots[player1Index].player = bothPlayers.Item2;
			break;
		case PlayerList.Substitute:
			teamMatch.substitutePlayers[player1Index] = bothPlayers.Item2;
			break;
		case PlayerList.Unused:
			teamMatch.unusedPlayers[player1Index] = bothPlayers.Item2;
			break;
		case PlayerList.Penalty:
			teamMatch.penaltyPlayers[player1Index] = bothPlayers.Item2;
			break;
		}
		switch (player2List)
		{
		case PlayerList.Selected:
			teamMatch.selectedPlayersSpots[player2Index].player = bothPlayers.Item1;
			break;
		case PlayerList.Substitute:
			teamMatch.substitutePlayers[player2Index] = bothPlayers.Item1;
			break;
		case PlayerList.Unused:
			teamMatch.unusedPlayers[player2Index] = bothPlayers.Item1;
			break;
		case PlayerList.Penalty:
			teamMatch.penaltyPlayers[player2Index] = bothPlayers.Item1;
			break;
		}
		ComputeAverageAttackDefence();
	}

	private (Player, Player) GetBothPlayers(PlayerList player1List, PlayerList player2List, int player1Index, int player2Index)
	{
		Player item = null;
		switch (player1List)
		{
		case PlayerList.Selected:
			item = teamMatch.selectedPlayersSpots[player1Index].player;
			break;
		case PlayerList.Substitute:
			item = teamMatch.substitutePlayers.Player(player1Index);
			break;
		case PlayerList.Unused:
			item = teamMatch.unusedPlayers.Player(player1Index);
			break;
		case PlayerList.Penalty:
			item = teamMatch.penaltyPlayers.Player(player1Index);
			break;
		}
		Player item2 = null;
		switch (player2List)
		{
		case PlayerList.Selected:
			item2 = teamMatch.selectedPlayersSpots[player2Index].player;
			break;
		case PlayerList.Substitute:
			item2 = teamMatch.substitutePlayers.Player(player2Index);
			break;
		case PlayerList.Unused:
			item2 = teamMatch.unusedPlayers.Player(player2Index);
			break;
		case PlayerList.Penalty:
			item2 = teamMatch.penaltyPlayers.Player(player2Index);
			break;
		}
		return (item, item2);
	}

	private void RegisterSubstitutionEvents(Match match, Player player1, Player player2, PlayerList player1List, PlayerList player2List, int gameTime)
	{
		if (player1List == PlayerList.Selected)
		{
			GenerateMatchEvent(match, MatchEventType.PlayerOut, player1, gameTime);
			GenerateMatchEvent(match, MatchEventType.PlayerIn, player2, gameTime);
		}
		else
		{
			GenerateMatchEvent(match, MatchEventType.PlayerOut, player2, gameTime);
			GenerateMatchEvent(match, MatchEventType.PlayerIn, player1, gameTime);
		}
	}

	private void GenerateMatchEvent(Match match, MatchEventType matchEventType, Player player, int gameTime)
	{
		Match.MatchEvent item = new Match.MatchEvent(matchEventType, gameTime, this, player, -1, -1, match.CheckTeamPlaysHome(this));
		match.eventList.Add(item);
		switch (matchEventType)
		{
		case MatchEventType.PlayerOut:
		{
			int selectedPlayerSpot = teamMatch.GetSelectedPlayerSpot(player);
			teamMatch.selectedPlayersSpots[selectedPlayerSpot].player = null;
			break;
		}
		case MatchEventType.PlayerIn:
			player.playerMatch.played = true;
			break;
		}
	}

	public void RemoveFromGame(ListOfTeams globalTeams, ListOfPlayers globalPlayers, ListOfCoaches globalCoaches)
	{
		globalCoaches.Remove(base.Coach);
		base.Coach = null;
		foreach (Player player in base.Players)
		{
			globalPlayers.Remove(player);
		}
		base.Players.Clear();
		globalTeams.Remove(this);
	}

	public override int GetSelectionWeight(int criteria)
	{
		int result = 1;
		switch ((TeamWeightCriteria)criteria)
		{
		case TeamWeightCriteria.InternationalCupSelection:
			result = averageSkill ^ 2;
			break;
		case TeamWeightCriteria.AverageSkill:
			result = averageSkill;
			break;
		}
		return result;
	}

	public string GetGoalsString(Match match, bool isHome, int defaultFontSize)
	{
		string text = "";
		int num = Mathf.RoundToInt((float)defaultFontSize * 0.7f);
		switch (match.calEntry.matchType)
		{
		case MatchType.CupSingleLeg:
			if (teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.None)
			{
				return $"{teamMatch.goals}";
			}
			return $"{teamMatch.penaltyShootoutGoals}";
		case MatchType.CupSecondLeg:
			if (teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.None)
			{
				int goalsFirstLeg = CompetitionData(match.competition).goalsFirstLeg;
				if (isHome)
				{
					return string.Format("<size={2}><color=#{3}>{0}</color></size>  {1}", goalsFirstLeg, teamMatch.goals, num, Util.ColorToHex(ConfigManager.instance.COLOR_GOALS_FIRST_LEG));
				}
				return string.Format("{1}  <size={2}><color=#{3}>{0}</color></size>", goalsFirstLeg, teamMatch.goals, num, Util.ColorToHex(ConfigManager.instance.COLOR_GOALS_FIRST_LEG));
			}
			return $"{teamMatch.penaltyShootoutGoals}";
		default:
			return $"{teamMatch.goals}";
		}
	}

	public Color GetCoachTextColor()
	{
		if (base.Coach == null)
		{
			return ConfigManager.instance.COLOR_COACH_STANDARD;
		}
		return base.Coach.GetCoachTextColor();
	}

	public Color GetGoalTextColor()
	{
		switch (teamMatch.penaltyShootoutStatus)
		{
		case PenaltyShootoutStatus.None:
			if (base.Coach.human)
			{
				return ConfigManager.instance.COLOR_GOAL_HUMAN;
			}
			return ConfigManager.instance.COLOR_GOAL_STANDARD_TEXT;
		case PenaltyShootoutStatus.Won:
			return ConfigManager.instance.COLOR_GOAL_PENALTY_SHOOTOUT_WON_TEXT;
		case PenaltyShootoutStatus.Lost:
			return ConfigManager.instance.COLOR_GOAL_PENALTY_SHOOTOUT_LOST_TEXT;
		default:
			return ConfigManager.instance.COLOR_GOAL_STANDARD_TEXT;
		}
	}

	public Color GetGoalBackgroundColor()
	{
		return teamMatch.penaltyShootoutStatus switch
		{
			PenaltyShootoutStatus.None => Color.clear, 
			PenaltyShootoutStatus.Shooting => ConfigManager.instance.COLOR_GOAL_STANDARD_BACKGROUND, 
			PenaltyShootoutStatus.Won => ConfigManager.instance.COLOR_GOAL_PENALTY_SHOOTOUT_WON_BACKGROUND, 
			PenaltyShootoutStatus.Lost => ConfigManager.instance.COLOR_GOAL_PENALTY_SHOOTOUT_LOST_BACKGROUND, 
			_ => Color.clear, 
		};
	}

	public (HumanCoachStart, PermissionLevel) IsAvailableForHumanCoach()
	{
		if (base.Coach.human)
		{
			return (HumanCoachStart.HumanCoach, PermissionLevel.LZ_Infinite);
		}
		Competition competition = FindCompetition(CompetitionType.NationalLeague);
		if (competition == null)
		{
			return (HumanCoachStart.NotInNationalLeague, PermissionLevel.LZ_Infinite);
		}
		Division division = MyDivision(competition);
		if (division == null)
		{
			return (HumanCoachStart.NotInAnyDivision, PermissionLevel.L0_None);
		}
		PermissionLevel startAnyDivision = GamePermissions.Permissions.startAnyDivision;
		if (!unblocked && division.number == 1 && !GamePermissions.allowed[(int)startAnyDivision])
		{
			return (HumanCoachStart.PermissonLocked, startAnyDivision);
		}
		return (HumanCoachStart.Available, PermissionLevel.L0_None);
	}

	public bool CanShowInNewGame()
	{
		if (FindCompetition(CompetitionType.NationalLeague) == null)
		{
			return false;
		}
		if (country == null)
		{
			Debug.LogError($"CanShowInNewGame: team '{base.Name}' (id={base.ID}) has null country — hiding from new game selection");
			return false;
		}
		if (country.playRegional && region == null)
		{
			Debug.LogError($"CanShowInNewGame: team '{base.Name}' (id={base.ID}, country='{country.CountryCode}') has null region but country playRegional — hiding from new game selection");
			return false;
		}
		return true;
	}

	public override void PostDay()
	{
		if (base.Coach == null)
		{
			Debug.LogError("Equipa sem treinador: " + base.Name + ".");
		}
		else if (base.Coach.MyTeam == null)
		{
			Debug.LogError("Treinador (" + base.Coach.Name + ") não tem equipa (" + base.Name + ") marcada.");
		}
		else if (base.Coach.MyTeam != this)
		{
			Debug.LogError("Treinador (" + base.Coach.Name + ") não tem equipa correcta. Coach.MyTeam = " + base.Coach.MyTeam.Name + ", but this team = " + base.Name + ".");
		}
		base.Players.PostDay();
	}

	public void ComputePlayerOffers()
	{
		if (teamMatch.playerOffersComputed)
		{
			foreach (Player player in base.Players)
			{
				player.CheckBestOffer(this);
			}
			return;
		}
		foreach (Player player2 in base.Players)
		{
			player2.ComputeBestOffer(this, teamSeason.matchesPlayed == 0);
		}
		teamMatch.playerOffersComputed = true;
	}

	public void StartCalendar()
	{
		Team myOpponent = null;
		bool isHome = true;
		bool flag = GetLeagueDivision(CompetitionType.NationalLeague) != null;
		bool flag2 = GetLeagueDivision(CompetitionType.SuperLeague) != null;
		foreach (GlobalCalendarEntry item2 in DataManager.instance.properties.globalCalendar)
		{
			if ((flag && item2.competitionType == CompetitionType.NationalLeague) || (flag2 && item2.competitionType == CompetitionType.SuperLeague))
			{
				FindOpponent(item2, ref myOpponent, ref isHome);
				TeamCalendarEntry item = new TeamCalendarEntry(item2, myOpponent, isHome);
				teamSeason.calendar.Add(item);
			}
		}
	}

	private void FindOpponent(GlobalCalendarEntry calEntry, ref Team myOpponent, ref bool isHome)
	{
		int round = calEntry.round;
		Competition competition = FindCompetition(calEntry);
		int num = CompetitionData(competition).leagueRoundPositions[round - 1];
		isHome = num % 2 == 1;
		int pos = (isHome ? (num + 1) : (num - 1));
		myOpponent = MyDivision(competition).teams.FindTeamByLeagueRoundPosition(competition, round - 1, pos);
	}

	private void ProcessPendingTransactions()
	{
		foreach (PendingTransaction pendingBankTransaction in pendingBankTransactions)
		{
			MoneyTransaction(pendingBankTransaction);
		}
		pendingBankTransactions.Clear();
	}

	private void MoneyTransaction(PendingTransaction pendingTransaction)
	{
		MoneyTransaction(pendingTransaction.Amount, pendingTransaction.Type, pendingForNextSeason: false, pendingTransaction.Parameters);
	}

	private void MoneyPendingTransaction(long amount, TransactionType type, params object[] args)
	{
		PendingTransaction item = new PendingTransaction(amount, type, args);
		pendingBankTransactions.Add(item);
	}

	public void MoneyTransaction(long amount, TransactionType type, bool pendingForNextSeason, params object[] args)
	{
		if (pendingForNextSeason)
		{
			MoneyPendingTransaction(amount, type, args);
			return;
		}
		long num = (long)Mathf.Abs(amount);
		bool flag = true;
		switch (type)
		{
		case TransactionType.Other:
			if (amount > 0)
			{
				teamSeason.seasonBalance.inOther += num;
			}
			else
			{
				teamSeason.seasonBalance.outOther += num;
			}
			break;
		case TransactionType.PlayerBought:
			teamSeason.seasonBalance.outPlayerBought += num;
			break;
		case TransactionType.PlayerSold:
			teamSeason.seasonBalance.inPlayersSold += num;
			break;
		case TransactionType.Prize:
			teamSeason.seasonBalance.inPrizes += num;
			break;
		case TransactionType.Salaries:
			teamSeason.seasonBalance.outSalaries += num;
			break;
		case TransactionType.Stadium:
			teamSeason.seasonBalance.outStadium += num;
			break;
		case TransactionType.Sponsorship:
			teamSeason.seasonBalance.inSponsorship += num;
			break;
		case TransactionType.Loan:
			if (amount > 0)
			{
				teamSeason.seasonBalance.inLoan += num;
			}
			else
			{
				teamSeason.seasonBalance.outLoan += num;
			}
			break;
		case TransactionType.LoanInterest:
			teamSeason.seasonBalance.outLoanInterest += num;
			break;
		case TransactionType.TicketsLeague:
		case TransactionType.TicketsPlayoffs:
		case TransactionType.TicketsFinalPhase:
			teamSeason.seasonBalance.inTickets += num;
			break;
		case TransactionType.InitialMoney:
			flag = false;
			break;
		default:
			MoneyTransaction(amount, TransactionType.Other, pendingForNextSeason: false, args);
			return;
		}
		if (flag)
		{
			if (amount > 0)
			{
				teamSeason.seasonBalance.totalIn += num;
			}
			else
			{
				teamSeason.seasonBalance.totalOut += num;
			}
		}
		teamSeason.seasonBalance.totalBalance += amount;
		teamBank.AddTransaction(amount, type, args);
	}

	public int GlobalEquivalentSkill()
	{
		Competition competition = FindCompetition(CompetitionType.NationalLeague);
		return MyDivision(competition).GetTargetSkillForPosition(CompetitionData(competition).leaguePosition);
	}

	public void AddTicketIncome(Team team, Competition competition, long ticketPrice, long attendance, long ticketSales)
	{
		teamTicketIncomeList.Add(new TicketIncome(team, competition, ticketPrice, attendance, ticketSales));
	}

	public void SetHistoryDataLength()
	{
		try
		{
			if (ElifootOptions.allListsMaxSize || (base.Coach != null && base.Coach.human))
			{
				teamBank.transactions.ChangeMaxLength(DataManager.TRANSACTIONS_LENGTH_HUMAN_MAX);
				teamTicketIncomeList.ChangeMaxLength(DataManager.TICKETINCOME_LENGTH_HUMAN_MAX);
				if (base.Coach != null)
				{
					base.Coach.coachEvents.ChangeMaxLength(DataManager.COACH_EVENTS_LENGTH_HUMAN_MAX);
				}
			}
			else
			{
				teamBank.transactions.ChangeMaxLength(DataManager.TRANSACTIONS_LENGTH_COMPUTER_MAX);
				teamTicketIncomeList.ChangeMaxLength(DataManager.TICKETINCOME_LENGTH_COMPUTER_MAX);
				if (base.Coach != null)
				{
					base.Coach.coachEvents.ChangeMaxLength(DataManager.COACH_EVENTS_LENGTH_COMPUTER_MAX);
				}
			}
		}
		catch (Exception)
		{
		}
	}

	public void CheckCoachTeamPointer()
	{
		if (base.Coach != null)
		{
			base.Coach.MyTeam = this;
		}
	}

	private void InitBank()
	{
		long money = 7 * totalSalaries;
		teamBank.InitBank(money);
	}

	public long NumBankTransactions()
	{
		return teamBank.transactions.Count;
	}

	public long Money()
	{
		return teamBank.Money;
	}

	public long GetMaxLoan()
	{
		float num = 0f;
		long num2 = 0L;
		if (GamePermissions.allowed[(int)GamePermissions.Permissions.fullBankLoans])
		{
			num = 5f * Mathf.Sqrt(averageSkill);
			num2 = 50000000L;
		}
		else
		{
			num = 2f * Mathf.Sqrt(averageSkill);
			num2 = 10000000L;
		}
		long num3 = 1000000L;
		return Util.Clamp((long)(num / (float)num3 * (float)num3), 0L, num2) * 1000000;
	}

	public long GetBankInterestValue(long amount)
	{
		return (long)(0.01f * (float)amount);
	}

	public void ApplyForLoan(long amount)
	{
		bankLoanValue += amount;
		MoneyTransaction(amount, TransactionType.Loan, false);
	}

	public void PayLoan(long amount)
	{
		bankLoanValue -= amount;
		if (bankLoanValue < 0)
		{
			bankLoanValue = 0L;
		}
		MoneyTransaction(-amount, TransactionType.Loan, false);
	}

	private void PayInterest()
	{
		float num = 0.01f * (float)bankLoanValue;
		MoneyTransaction(-(long)num, TransactionType.LoanInterest, false);
	}

	public void DrawShirtOnImage(Image onImage)
	{
		if (!(onImage == null))
		{
			Sprite sprite = MyShirt;
			if (sprite == null)
			{
				sprite = LoadLogosAndShirts.defaultShirtStatic;
			}
			try
			{
				onImage.sprite = sprite;
			}
			catch (Exception ex) when (ex is MissingReferenceException || ex is InvalidCastException)
			{
				shirt = null;
				sprite = (onImage.sprite = LoadLogosAndShirts.defaultShirtStatic);
			}
			if (usesStandardShirt || sprite == null || sprite == LoadLogosAndShirts.defaultShirtStatic)
			{
				onImage.color = Util.ParseColor(backgroundColor);
			}
			else
			{
				onImage.color = Color.white;
			}
		}
	}

	public void DrawDefaultCountryFLagOnImage(Image onImage)
	{
		if (!(onImage == null))
		{
			Sprite sprite = MyCountryFlag;
			if (sprite == null)
			{
				sprite = LoadAndSavingTeams.instance.countries.GetDefaultCountryFlag();
			}
			try
			{
				onImage.sprite = sprite;
			}
			catch (Exception ex) when (ex is MissingReferenceException || ex is InvalidCastException)
			{
				countryFlag = null;
				return;
			}
			if (sprite == null)
			{
				onImage.color = Util.ParseColor(backgroundColor);
			}
		}
	}

	public void DrawLogoOnImage(Image onImage)
	{
		if (onImage == null)
		{
			return;
		}
		Sprite myLogo = MyLogo;
		if (myLogo == null)
		{
			DrawShirtOnImage(onImage);
			return;
		}
		try
		{
			onImage.sprite = myLogo;
		}
		catch (Exception ex) when (ex is MissingReferenceException || ex is InvalidCastException)
		{
			logo = null;
			DrawShirtOnImage(onImage);
		}
	}

	public void DrawCountryFlagOnImage(Image onImage)
	{
		if (onImage == null)
		{
			return;
		}
		Sprite myCountryFlag = MyCountryFlag;
		if (myCountryFlag == null)
		{
			DrawShirtOnImage(onImage);
			return;
		}
		try
		{
			onImage.sprite = myCountryFlag;
		}
		catch (Exception ex) when (ex is MissingReferenceException || ex is InvalidCastException)
		{
			countryFlag = null;
			DrawShirtOnImage(onImage);
		}
	}

	public Sprite GetLogoOrShirt()
	{
		try
		{
			return (MyLogo == null) ? MyShirt : MyLogo;
		}
		catch (InvalidCastException)
		{
			logo = null;
			return MyShirt;
		}
	}

	public Color GetLogoOrShirtColor()
	{
		try
		{
			if (MyLogo != null)
			{
				return Color.white;
			}
		}
		catch (InvalidCastException)
		{
			logo = null;
		}
		if (!usesStandardShirt)
		{
			return Color.white;
		}
		return Util.ParseColor(backgroundColor);
	}

	public void TryBuyPlayerHuman(Player player, Action OnBuyPlayerConfirmed, Action OnBuyPlayerCancelled)
	{
		BuyPlayer buyPlayer = CanBuyPlayer(player, player.directSellPrice);
		if (buyPlayer != BuyPlayer.OK)
		{
			string text = LanguageController.instance.Get_Translation("BUYPLAYER_" + buyPlayer.ToString().ToUpper());
			string description = LanguageController.instance.Get_Translation("BUYPLAYER_BLOCKED_MSG", text);
			ScreenController.instance.ShowInfoPopUp(description, OnBuyPlayerCancelled);
		}
		else
		{
			string description2 = LanguageController.instance.Get_Translation("PLAYERBUY_CONFIRMBUY", player.Name, Util.MoneyString(player.directSellPrice), player.Salary, player.FairPrice());
			ScreenController.instance.ShowThreeDialogPopUpWithMoreInfo(LanguageController.instance.Get_Translation("TEAM_FINANCEPLAYERBUYBUTTON"), description2, BuyPlayerConfirmed, BuyPlayerMoreInfo, OnBuyPlayerCancelled);
		}
		void BuyPlayerConfirmed()
		{
			long newSalary = AverageSalaryForSkill(player.skill);
			DataManager.PlayerTraded(player, player.Team, this, player.directSellPrice, newSalary);
			OnBuyPlayerConfirmed?.Invoke();
		}
		void BuyPlayerMoreInfo()
		{
			player.ShowDetails(null, canEdit: false);
		}
	}

	private static bool EventHasPlayer(PlayerTransferEvent te, Player p)
	{
		return te.player == p;
	}

	public void ResetNumPlayersAccountable()
	{
		Util.InitArray(numPlayersInSquad, 0);
		foreach (PlayerPosition value in Enum.GetValues(typeof(PlayerPosition)))
		{
			numPlayersInSquad[(int)value] = PlayersByPosition(value);
		}
		Array.Copy(numPlayersInSquad, numPlayersAccountable, numPlayersInSquad.Length);
		foreach (Player player in DataManager.instance.tradedPlayers)
		{
			PlayerTransferEvent playerTransferEvent = (PlayerTransferEvent)DataManager.instance.properties.playerTransferEventList.FindLast((EliObject obj) => ((PlayerTransferEvent)obj).player == player);
			if (playerTransferEvent != null)
			{
				if (playerTransferEvent.fromTeam == this)
				{
					playerTransferEvent.fromTeam.numPlayersAccountable[(int)player.Position]--;
					player.SoldToTeam = playerTransferEvent.toTeam;
				}
				if (playerTransferEvent.toTeam == this)
				{
					playerTransferEvent.toTeam.numPlayersAccountable[(int)player.Position]++;
				}
			}
		}
	}

	public long GetSponsorshipValue()
	{
		long result = 0L;
		if (ElifootOptions.extras.sponsorship && !teamSeason.ReceivedSponsorship)
		{
			int count = DataManager.instance.properties.globalCalendar.Count;
			int currentCalendarDay = DataManager.instance.properties.gameDay.currentCalendarDay;
			float num = 1f - (float)currentCalendarDay * 1f / (float)count;
			result = 500000 + Mathf.CeilToInt(Mathf.Sqrt((float)count * 1f * num) * (float)averageSkill / 40f) * 250000;
		}
		return result;
	}

	public long PaySponsorship()
	{
		long sponsorshipValue = GetSponsorshipValue();
		if (sponsorshipValue > 0)
		{
			MoneyTransaction(sponsorshipValue, TransactionType.Sponsorship, false);
			teamSeason.ReceivedSponsorship = true;
		}
		return sponsorshipValue;
	}
}
