using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

[Serializable]
public class Coach : EliObject
{
	[Serializable]
	public class CoachSeason
	{
		private bool seasonPointsChanged;

		private long seasonPoints;

		public long SeasonPoints
		{
			get
			{
				return seasonPoints;
			}
			set
			{
				if (seasonPoints != value)
				{
					seasonPointsChanged = true;
				}
				seasonPoints = value;
			}
		}

		public bool SeasonPointsChanged
		{
			get
			{
				return seasonPointsChanged;
			}
			set
			{
				seasonPointsChanged = value;
			}
		}

		public void Reset()
		{
			seasonPoints = 0L;
		}
	}

	[Serializable]
	public class CoachEvent : EliObject
	{
		public enum CoachEventType
		{
			Started,
			Hired,
			Fired,
			Invited,
			Resigned,
			DivisionUp,
			DivisionDown,
			Excluded,
			CompetitionWon,
			CompetitionSecond,
			CompetitionThird,
			BestScorer,
			HomeWin,
			HomeDraw,
			HomeLost,
			AwayWin,
			AwayDraw,
			AwayLost
		}

		public Competition competition;

		public CoachEventType coachEventType;

		public int seasonNumber;

		private object[] parameters;

		private long prizeMoney;

		public bool shallAnnounce;

		public object[] Parameters => parameters;

		private CoachEvent(CoachEventType coachEventType, Competition competition, int seasonNumber, long prizeMoney, bool mayAnnounce, params object[] parameters)
			: base(generateID: false)
		{
			this.coachEventType = coachEventType;
			this.competition = competition;
			this.seasonNumber = seasonNumber;
			this.parameters = parameters;
			this.prizeMoney = prizeMoney;
			if (mayAnnounce && (uint)(coachEventType - 5) <= 5u)
			{
				shallAnnounce = true;
			}
		}

		public CoachEvent(CoachEventType coachEventType, Competition competition, int seasonNumber, long prizeMoney, params object[] parameters)
			: this(coachEventType, competition, seasonNumber, prizeMoney, mayAnnounce: true, parameters)
		{
		}

		public CoachEvent(CoachEventType coachEventType, Competition competition, params object[] parameters)
			: this(coachEventType, competition, 0, 0L, mayAnnounce: false, parameters)
		{
		}

		public static bool ShallAddToHistory(CoachEventType eventType, Competition competition)
		{
			switch (eventType)
			{
			case CoachEventType.Started:
			case CoachEventType.Hired:
			case CoachEventType.Fired:
			case CoachEventType.Invited:
			case CoachEventType.Resigned:
			case CoachEventType.DivisionUp:
			case CoachEventType.DivisionDown:
			case CoachEventType.Excluded:
			case CoachEventType.CompetitionWon:
			case CoachEventType.CompetitionSecond:
			case CoachEventType.CompetitionThird:
			case CoachEventType.BestScorer:
				return true;
			case CoachEventType.HomeWin:
			case CoachEventType.HomeDraw:
			case CoachEventType.HomeLost:
			case CoachEventType.AwayWin:
			case CoachEventType.AwayDraw:
			case CoachEventType.AwayLost:
				return false;
			default:
				return false;
			}
		}

		public string GetTitleText()
		{
			return LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant() + "_TITLE");
		}

		public static string GetTransactionText(CoachEventType eventType, Competition competition, params object[] parameters)
		{
			string text = "";
			switch (eventType)
			{
			case CoachEventType.CompetitionWon:
				return LanguageController.instance.Get_Translation("COACH_EVENT_COMPETITIONWON", competition.GetName());
			case CoachEventType.BestScorer:
			{
				if (parameters.Length == 0)
				{
					return LanguageController.instance.Get_Translation("COACH_EVENT_BESTSCORER");
				}
				Player player = null;
				string text2 = null;
				string text3 = null;
				foreach (object obj in parameters)
				{
					if (obj is Competition)
					{
						competition = (Competition)obj;
					}
					if (obj is Player)
					{
						player = (Player)obj;
					}
					if (obj is Division)
					{
						_ = (Division)obj;
					}
				}
				if (player != null)
				{
					text3 = player.Name;
				}
				text2 = competition.GetName();
				if (text2 != null && text3 != null)
				{
					return LanguageController.instance.Get_Translation("COACH_EVENT_BESTSCORER_COMPETITION_PLAYER", text2, text3);
				}
				if (text2 != null)
				{
					return LanguageController.instance.Get_Translation("COACH_EVENT_BESTSCORER_COMPETITION", text2);
				}
				return LanguageController.instance.Get_Translation("COACH_EVENT_BESTSCORER");
			}
			default:
				return LanguageController.instance.Get_Translation("COACH_EVENT_" + eventType.ToString().ToUpperInvariant());
			}
		}

		public string GetTransactionText()
		{
			return GetTransactionText(coachEventType, competition, parameters);
		}

		public string GetMessageText(string coachName)
		{
			string text = "";
			string format = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant() + "_MESSAGE");
			switch (coachEventType)
			{
			case CoachEventType.DivisionUp:
			case CoachEventType.DivisionDown:
			case CoachEventType.Excluded:
				return string.Format(format, coachName, (parameters[0] as Division).GetName(), competition.GetName());
			case CoachEventType.CompetitionWon:
			case CoachEventType.CompetitionSecond:
			case CoachEventType.CompetitionThird:
			{
				string name = competition.GetName();
				return string.Format(format, coachName, name, Util.MoneyString(prizeMoney));
			}
			default:
				return string.Format(format, coachName);
			}
		}

		public Sprite GetMessageImage()
		{
			switch (coachEventType)
			{
			case CoachEventType.DivisionUp:
				return ScreenController.instance.divisionUpImage;
			case CoachEventType.DivisionDown:
			case CoachEventType.Excluded:
				return ScreenController.instance.divisionDownImage;
			case CoachEventType.CompetitionWon:
			case CoachEventType.CompetitionSecond:
			case CoachEventType.CompetitionThird:
				return competition.CoachEventImage(coachEventType);
			case CoachEventType.Hired:
				return ScreenController.instance.coachHiredIcon;
			case CoachEventType.Invited:
				return ScreenController.instance.coachInvitedIcon;
			case CoachEventType.Fired:
				return ScreenController.instance.coachFiredIcon;
			case CoachEventType.Resigned:
				return ScreenController.instance.coachResignedIcon;
			default:
				return null;
			}
		}

		public AudioSource GetMessageSound()
		{
			return coachEventType switch
			{
				CoachEventType.DivisionUp => DataManager.instance.soundDivisionUp, 
				CoachEventType.CompetitionWon => DataManager.instance.soundWinner, 
				CoachEventType.CompetitionSecond => DataManager.instance.soundWinner, 
				CoachEventType.CompetitionThird => DataManager.instance.soundWinner, 
				_ => null, 
			};
		}

		public string GetShortDescription(CoachEventShortDescription description, bool lineBreaks = false)
		{
			string result = "";
			switch (coachEventType)
			{
			case CoachEventType.Started:
				result = LanguageController.instance.Get_Translation("COACH_EVENT_STARTED");
				break;
			case CoachEventType.Hired:
			case CoachEventType.Fired:
			case CoachEventType.Invited:
			case CoachEventType.Resigned:
				if (description == CoachEventShortDescription.Event)
				{
					result = LanguageController.instance.Get_Translation($"COACH_EVENT_{coachEventType.ToString().ToUpperInvariant()}_SHORT");
				}
				else
				{
					if (parameters.Length == 0)
					{
						break;
					}
					Team team = (Team)parameters[0];
					if (team != null)
					{
						Country country = team.country;
						if (country != null)
						{
							result = $"{team} ({country.GetName()})";
						}
						else
						{
							result = $"{team} ({team.CountryCode()})";
						}
					}
					result = "";
				}
				break;
			case CoachEventType.DivisionUp:
			case CoachEventType.DivisionDown:
			case CoachEventType.Excluded:
				if (description == CoachEventShortDescription.Event)
				{
					result = LanguageController.instance.Get_Translation($"COACH_EVENT_{coachEventType.ToString().ToUpperInvariant()}_SHORT");
				}
				else if (parameters.Length >= 0 && parameters[0] is Division)
				{
					result = ((Division)parameters[0]).GetName();
				}
				break;
			case CoachEventType.CompetitionWon:
				result = ((description != CoachEventShortDescription.Event) ? competition.GetName(lineBreaks) : LanguageController.instance.Get_Translation("COACH_EVENT_WINNER_SHORT"));
				break;
			case CoachEventType.CompetitionSecond:
				result = ((description != CoachEventShortDescription.Event) ? competition.GetName(lineBreaks) : LanguageController.instance.Get_Translation("COACH_EVENT_SECOND_SHORT"));
				break;
			case CoachEventType.CompetitionThird:
				result = ((description != CoachEventShortDescription.Event) ? competition.GetName(lineBreaks) : LanguageController.instance.Get_Translation("COACH_EVENT_THIRD_SHORT"));
				break;
			case CoachEventType.HomeWin:
			case CoachEventType.HomeDraw:
			case CoachEventType.HomeLost:
			case CoachEventType.AwayWin:
			case CoachEventType.AwayDraw:
			case CoachEventType.AwayLost:
				if (description == CoachEventShortDescription.Event)
				{
					result = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant());
				}
				break;
			case CoachEventType.BestScorer:
				if (description == CoachEventShortDescription.Event)
				{
					result = LanguageController.instance.Get_Translation("COACH_EVENT_BESTSTRIKER");
				}
				break;
			}
			return result;
		}

		public string GetFullDescription(Competition competition)
		{
			return GetFullDescription(coachEventType, competition, parameters);
		}

		public static string GetFullDescription(CoachEventType coachEventType, Competition competition, params object[] parameters)
		{
			string result = "";
			switch (coachEventType)
			{
			case CoachEventType.Started:
				result = LanguageController.instance.Get_Translation("COACH_EVENT_STARTED");
				break;
			case CoachEventType.Hired:
			case CoachEventType.Fired:
			case CoachEventType.Invited:
			case CoachEventType.Resigned:
				if (parameters.Length == 0)
				{
					result = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant() + "_GEN");
					break;
				}
				result = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant());
				result = string.Format(result, ((Team)parameters[0]).Name);
				break;
			case CoachEventType.DivisionUp:
			case CoachEventType.DivisionDown:
			case CoachEventType.Excluded:
				if (parameters.Length == 0)
				{
					result = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant() + "_GEN");
				}
				else if (parameters[0] is Division)
				{
					result = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant() + "_TO");
					result = string.Format(result, ((Division)parameters[0]).GetName());
				}
				break;
			case CoachEventType.CompetitionWon:
				result = LanguageController.instance.Get_Translation("COACH_EVENT_LEAGUEWON_TITLE");
				break;
			case CoachEventType.CompetitionSecond:
				result = LanguageController.instance.Get_Translation("COACH_EVENT_LEAGUESECOND");
				break;
			case CoachEventType.CompetitionThird:
				result = LanguageController.instance.Get_Translation("COACH_EVENT_LEAGUETHIRD");
				break;
			case CoachEventType.HomeWin:
			case CoachEventType.HomeDraw:
			case CoachEventType.HomeLost:
			case CoachEventType.AwayWin:
			case CoachEventType.AwayDraw:
			case CoachEventType.AwayLost:
				result = LanguageController.instance.Get_Translation("COACH_EVENT_" + coachEventType.ToString().ToUpperInvariant());
				break;
			case CoachEventType.BestScorer:
				result = GetTransactionText(coachEventType, competition, parameters);
				break;
			}
			return result;
		}
	}

	[Serializable]
	public class CoachEventNews : EliObject
	{
		private Coach coachFired;

		private Coach coachHired;

		private Coach coachInvited;

		private Team teamFired;

		private Team teamInvited;

		private bool isResign;

		public CoachEventNews(Coach coachFired, Team teamFired, Coach coachHired, bool isResign)
			: this(coachFired, teamFired, null, null, coachHired, isResign)
		{
		}

		public CoachEventNews(Coach coachFired, Team teamFired, Coach coachInvited, Team teamInvited, Coach coachHired, bool isResign)
			: base(generateID: false)
		{
			this.coachFired = coachFired;
			this.teamFired = teamFired;
			this.coachInvited = coachInvited;
			this.teamInvited = teamInvited;
			this.coachHired = coachHired;
			this.isResign = isResign;
		}

		public string ToSaveString()
		{
			return $"{((coachFired == null) ? (-1) : coachFired.ID)};{((teamFired == null) ? (-1) : teamFired.ID)};{((coachInvited == null) ? (-1) : coachInvited.ID)};{((teamInvited == null) ? (-1) : teamInvited.ID)};{((coachHired == null) ? (-1) : coachHired.ID)};{isResign.ToString()}";
		}

		public CoachEventNews(string s)
			: base(generateID: false)
		{
			string[] stringArray = s.Split(';');
			int num = int.Parse(Util.StringInArray(stringArray, 0, "-1"));
			int num2 = int.Parse(Util.StringInArray(stringArray, 1, "-1"));
			int num3 = int.Parse(Util.StringInArray(stringArray, 2, "-1"));
			int num4 = int.Parse(Util.StringInArray(stringArray, 3, "-1"));
			int num5 = int.Parse(Util.StringInArray(stringArray, 4, "-1"));
			isResign = bool.Parse(Util.StringInArray(stringArray, 5, "false"));
			coachFired = DataManager.instance.allCoaches.FindCoachByID(num);
			teamFired = DataManager.instance.allTeams.FindTeamByID(num2);
			coachInvited = DataManager.instance.allCoaches.FindCoachByID(num3);
			teamInvited = DataManager.instance.allTeams.FindTeamByID(num4);
			coachHired = DataManager.instance.allCoaches.FindCoachByID(num5);
		}

		public CoachNewsType GetNewsType()
		{
			if (coachFired != null && coachInvited == null && coachHired == null)
			{
				if (isResign)
				{
					return CoachNewsType.Resigned;
				}
				return CoachNewsType.Fired;
			}
			if (coachFired == null && coachInvited != null && coachHired == null)
			{
				return CoachNewsType.Invited;
			}
			if (coachFired == null && coachInvited == null && coachHired != null)
			{
				return CoachNewsType.Hired;
			}
			if (coachInvited == null)
			{
				return CoachNewsType.FiredNotInvited;
			}
			return CoachNewsType.FiredInvited;
		}

		public int GetNumNews()
		{
			switch (GetNewsType())
			{
			case CoachNewsType.Resigned:
			case CoachNewsType.Fired:
			case CoachNewsType.Invited:
			case CoachNewsType.Hired:
				return 1;
			case CoachNewsType.FiredNotInvited:
			case CoachNewsType.FiredInvited:
				return 2;
			default:
				return 0;
			}
		}

		public void FillNewsPrefab(ref GameObject newsObj, int newsNumber)
		{
			Team team = null;
			Sprite sprite = null;
			Coach coach = null;
			Team team2 = null;
			string text = null;
			switch (GetNewsType())
			{
			case CoachNewsType.Resigned:
				team = teamFired;
				coach = coachFired;
				sprite = ScreenController.instance.coachResignedIcon;
				text = "COACH_EVENT_RESIGNED_SHORT";
				break;
			case CoachNewsType.Fired:
				team = teamFired;
				coach = coachFired;
				sprite = ScreenController.instance.coachFiredIcon;
				text = "COACH_EVENT_FIRED_SHORT";
				break;
			case CoachNewsType.Invited:
				team = teamFired;
				coach = coachInvited;
				sprite = ScreenController.instance.coachInvitedIcon;
				team2 = teamInvited;
				break;
			case CoachNewsType.Hired:
				team = teamInvited;
				coach = coachHired;
				sprite = ScreenController.instance.coachHiredIcon;
				text = "COACH_EVENT_HIRED_SHORT";
				break;
			case CoachNewsType.FiredNotInvited:
				switch (newsNumber)
				{
				case 1:
					team = teamFired;
					coach = coachFired;
					sprite = ScreenController.instance.coachFiredIcon;
					text = "COACH_EVENT_FIRED_SHORT";
					break;
				case 2:
					team = teamFired;
					coach = coachHired;
					sprite = ScreenController.instance.coachHiredIcon;
					text = "COACH_EVENT_HIRED_SHORT";
					break;
				}
				break;
			case CoachNewsType.FiredInvited:
				switch (newsNumber)
				{
				case 1:
					team = teamFired;
					coach = coachFired;
					sprite = ScreenController.instance.coachFiredIcon;
					text = "COACH_EVENT_FIRED_SHORT";
					break;
				case 2:
					team = teamFired;
					coach = coachInvited;
					sprite = ScreenController.instance.coachInvitedIcon;
					team2 = teamInvited;
					break;
				}
				break;
			}
			if (coach != null)
			{
				Text gameObjectText = Util.GetGameObjectText(newsObj, "Coach");
				gameObjectText.text = coach.Name;
				gameObjectText.color = coach.GetCoachTextColor();
			}
			GameObject gameObject = Util.GetGameObject(newsObj, "Panel1");
			if (team != null)
			{
				FillTeamPanel(gameObject, team);
			}
			if (sprite != null)
			{
				Util.GetGameObjectImage(newsObj, "ImgAction").sprite = sprite;
			}
			GameObject gameObject2 = Util.GetGameObject(newsObj, "Panel2");
			gameObject2.SetActive(team2 != null);
			if (team2 != null)
			{
				FillTeamPanel(gameObject2, team2);
			}
			Text gameObjectText2 = Util.GetGameObjectText(newsObj, "TxtAction");
			if (text == null)
			{
				gameObjectText2.gameObject.SetActive(value: false);
				return;
			}
			gameObjectText2.gameObject.SetActive(value: true);
			gameObjectText2.text = LanguageController.instance.Get_Translation(text).ToUpperInvariant();
			gameObjectText2.color = coach.GetCoachTextColor();
		}

		private void FillTeamPanel(GameObject panel, Team team)
		{
			Util.GetGameObjectImage(panel, "Background").color = Util.ParseColor(team.backgroundColor);
			Util.GetGameObjectText(panel, "TeamName").text = team.ShortName.ToUpperInvariant();
			Util.GetGameObjectText(panel, "TeamDivision").text = team.GetCountryAndNationalDivision();
			Util.GetGameObjectText(panel, "TeamName").color = Util.ParseColor(team.textColor);
			Util.GetGameObjectText(panel, "TeamDivision").color = Util.ParseColor(team.textColor);
		}

		public string GetDescription()
		{
			string result = null;
			switch (GetNewsType())
			{
			case CoachNewsType.Resigned:
				result = LanguageController.instance.Get_Translation("COACHNEWS_RESIGNED", coachFired.Name, teamFired.Name, teamFired.GetLeagueDivisionName(CompetitionType.NationalLeague));
				break;
			case CoachNewsType.Fired:
				result = LanguageController.instance.Get_Translation("COACHNEWS_FIRED", coachFired.Name, teamFired.Name, teamFired.GetLeagueDivisionName(CompetitionType.NationalLeague));
				break;
			case CoachNewsType.Invited:
				result = LanguageController.instance.Get_Translation("COACHNEWS_INVITED", teamFired.Name, coachInvited.Name, teamInvited.Name, teamInvited.GetLeagueDivisionName(CompetitionType.NationalLeague));
				break;
			case CoachNewsType.Hired:
				result = LanguageController.instance.Get_Translation("COACHNEWS_HIRED", teamInvited.Name, coachHired.Name);
				break;
			case CoachNewsType.FiredNotInvited:
				result = LanguageController.instance.Get_Translation("COACHNEWS_FIREDNOTINVITED", coachFired.Name, teamFired.Name, coachHired.Name);
				break;
			case CoachNewsType.FiredInvited:
				result = LanguageController.instance.Get_Translation("COACHNEWS_FIREDINVITED", coachFired.Name, teamFired.Name, coachInvited.Name, teamInvited.Name, coachHired.Name);
				break;
			}
			return result;
		}
	}

	[Serializable]
	public class Invitation : EliObject
	{
		public Coach coach;

		public Team team;

		public Invitation(Coach coach, Team team, bool confirmed = false)
			: base(generateID: false)
		{
			this.coach = coach;
			this.team = team;
		}
	}

	[Serializable]
	public class PlayerSearchOptions
	{
		public enum SortField
		{
			Name,
			Skill,
			Price,
			Star,
			Position,
			Nationality,
			Team,
			Behaviour
		}

		public enum SortOrder
		{
			Ascending,
			Descending
		}

		[Serializable]
		public struct PlayerSearchSortCriteria
		{
			public SortField sortField;

			public SortOrder sortOrder;
		}

		public long[][] priceIntervals = new long[6][]
		{
			new long[2] { -1L, -1L },
			new long[2] { -1L, 100000L },
			new long[2] { 100000L, 500000L },
			new long[2] { 500000L, 1000000L },
			new long[2] { 1000000L, 3000000L },
			new long[2] { 3000000L, -1L }
		};

		public string playerName;

		public bool starPlayer;

		public bool filterByPosition;

		public PlayerPosition playerPosition;

		public bool filterByBehaviour;

		public PlayerBehaviour playerBehaviour;

		public int priceIntervalIndex;

		public int minSkill;

		public int maxSkill;

		public int minAge;

		public int maxAge;

		public bool filterByNationality;

		public PlayerSearchSortCriteria sortCriteria;

		public PlayerSearchOptions()
		{
			playerName = "";
			starPlayer = false;
			filterByPosition = false;
			filterByBehaviour = false;
			priceIntervalIndex = 0;
			minSkill = DataManager.PLAYER_SKILL_MIN;
			maxSkill = DataManager.PLAYER_SKILL_MAX;
			filterByNationality = false;
			sortCriteria.sortField = SortField.Price;
			sortCriteria.sortOrder = SortOrder.Ascending;
		}
	}

	public CoachSeason coachSeason = new CoachSeason();

	public long totalSocialPoints;

	public bool updateServerPoints = true;

	public bool human;

	public EliLimitedList coachEvents;

	private ListOfTeams refusedInvitations;

	public PlayerSearchOptions searchOptions;

	public Dictionary<Competition, int> titles;

	public int matchesInTeam;

	public bool onVacation;

	private long teamID;

	private bool tryingToFire;

	private string originalName;

	private string changedName;

	private double mySkill;

	private string GUID;

	[NonSerialized]
	private Account account;

	[NonSerialized]
	private Team team;

	public bool errorSendingPoints;

	public bool refreshPlayersInSubstitutionView = true;

	public Dictionary<Competition, int> competitionsWon = new Dictionary<Competition, int>();

	private int teamInvitaionsAfterMatch;

	public bool TryingToFire
	{
		get
		{
			return tryingToFire;
		}
		set
		{
			tryingToFire = value;
		}
	}

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
			if (value != null)
			{
				value = value.Substring(0, Mathf.Min(value.Length, DataManager.COACH_NAME_LENGTH_MAX));
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
	}

	public double MySkill => mySkill;

	public string MyGUID
	{
		get
		{
			CheckGUID();
			return GUID;
		}
	}

	public Account Account
	{
		get
		{
			CheckAccount();
			return account;
		}
		set
		{
			account = value;
			Name = account.coachName;
		}
	}

	public Team MyTeam
	{
		get
		{
			return team;
		}
		set
		{
			if (team != value && value != null)
			{
				matchesInTeam = 0;
			}
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

	public Coach(string name, int initSkill)
		: this(name, initSkill, isHuman: false, "")
	{
	}

	public Coach(string name, int initSkill, bool isHuman)
		: this(name, initSkill, isHuman, "")
	{
	}

	public Coach(string name, int initSkill, bool isHuman, string guid, Account account = null)
		: base(generateID: true)
	{
		Name = name;
		human = isHuman;
		mySkill = initSkill;
		coachEvents = new EliLimitedList(DataManager.COACH_EVENTS_LENGTH_HUMAN_MAX);
		refusedInvitations = new ListOfTeams();
		titles = new Dictionary<Competition, int>();
		if (string.IsNullOrEmpty(guid))
		{
			CheckGUID();
		}
		else
		{
			GUID = guid;
		}
		this.account = account;
		CheckAccount();
	}

	public void CheckGUID()
	{
		if (human && string.IsNullOrEmpty(GUID))
		{
			GUID = Guid.NewGuid().ToString();
		}
	}

	public void CheckAccount()
	{
		if (human && account == null)
		{
			Account = DataManager.instance.GetAccount(MyGUID, Name);
		}
	}

	public override string ToString()
	{
		return string.Format("[Coach: Name={0}, OriginalName={1}, MatchesInTeam={2}, OnVacation={3}, TeamID={4}, MySkill={5}, MyTeam={6}, TotalSocialPoints={8}, human={9}, CoachEvents={10}]", Name, OriginalName, matchesInTeam, onVacation, teamID, MySkill, MyTeam, totalSocialPoints, human, coachEvents);
	}

	public bool Present(ElifootOptions.SimulationFlag simulationFlag)
	{
		if ((ElifootOptions.allCoachesHuman || human) && !onVacation)
		{
			return !ElifootOptions.IsSimulationFlagActive(simulationFlag);
		}
		return false;
	}

	public bool HasAccount()
	{
		if (account == null)
		{
			return false;
		}
		return account.HasCredentials();
	}

	public Color GetCoachTextColor()
	{
		if (!human)
		{
			return ConfigManager.instance.COLOR_COACH_STANDARD;
		}
		return ConfigManager.instance.COLOR_COACH_HUMAN;
	}

	public void BeginSeason()
	{
		coachSeason.Reset();
	}

	public override void PostLoad()
	{
		base.PostLoad();
		team = DataManager.instance.allTeams.FindTeamByID(teamID);
	}

	public void PostMatch()
	{
		matchesInTeam++;
		teamInvitaionsAfterMatch = 0;
	}

	public override void PostDay()
	{
		if (MyTeam == null)
		{
			teamInvitaionsAfterMatch = 0;
		}
		else if (MyTeam.Coach != this)
		{
			Debug.LogErrorFormat("Treinador ({0} não aponta para a equipa correcta ({1}).", MyTeam);
		}
		AdjustMySkill();
		DeleteRefusedInvitations();
	}

	public void AdjustMySkill()
	{
		Division division = null;
		Competition competition = null;
		if (team != null)
		{
			competition = team.FindCompetition(CompetitionType.NationalLeague);
			division = team.MyDivision(competition);
		}
		int num = ((team != null && division != null && competition != null) ? division.GetTargetSkillForPosition(team.CompetitionData(competition).leaguePosition) : ((int)(0.3f * (float)DataManager.PLAYER_SKILL_MAX)));
		mySkill = 0.95 * mySkill + 0.05 * (double)num;
	}

	private void DeleteRefusedInvitations()
	{
		if (refusedInvitations != null && Util.GetRandomInt(30) == 0)
		{
			Team randomItem = refusedInvitations.GetRandomItem();
			if (randomItem != null)
			{
				refusedInvitations.Remove(randomItem);
			}
		}
	}

	public void EndOfSeason()
	{
		long num = CurrentSocialPoints();
		if (totalSocialPoints != num)
		{
			totalSocialPoints = num;
			updateServerPoints = true;
		}
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

	public void CheckTeamPointer()
	{
		if (MyTeam != null && MyTeam.Coach != this)
		{
			MyTeam = null;
		}
	}

	public long CurrentSocialPoints()
	{
		return totalSocialPoints + coachSeason.SeasonPoints;
	}

	public void SocialPointsSent()
	{
		coachSeason.SeasonPointsChanged = false;
	}

	public bool ShallSendSocialPoints(bool newSeason, bool forceSend)
	{
		if (forceSend)
		{
			return true;
		}
		if (!coachSeason.SeasonPointsChanged)
		{
			return false;
		}
		if (newSeason)
		{
			return true;
		}
		if (errorSendingPoints)
		{
			return true;
		}
		return false;
	}

	public bool HasAnyTitle()
	{
		return titles.Values.Count((int x) => x > 0) > 0;
	}

	public int TotalNumberOfTitles()
	{
		return titles.Values.Sum();
	}

	public int MatchesToFire()
	{
		if (human)
		{
			return ElifootOptions.matchesToFireCoachHuman;
		}
		return ElifootOptions.matchesToFireCoachComputer;
	}

	public bool CanResign()
	{
		if (ElifootOptions.fireCoaches)
		{
			return matchesInTeam >= MatchesToFire();
		}
		return false;
	}

	public bool CanFire()
	{
		if (human && ElifootOptions.extras.coachUnion)
		{
			return false;
		}
		if (MyTeam == null)
		{
			return false;
		}
		int num = ((!human) ? DataManager.MORALE_TO_FIRE_BASE : DataManager.MORALE_TO_FIRE_HUMAN);
		if (ElifootOptions.fireCoaches && matchesInTeam >= MatchesToFire())
		{
			return team.morale <= num;
		}
		return false;
	}

	public static bool HasFireCoachFlag(FireCoach[] flags, FireCoach oneFlag)
	{
		return Array.IndexOf(flags, oneFlag) >= 0;
	}

	public void AddRefusedInvitation(Team toTheTeam)
	{
		if (Present(ElifootOptions.SimulationFlag.Invitations))
		{
			if (refusedInvitations == null)
			{
				refusedInvitations = new ListOfTeams();
			}
			if (refusedInvitations.IndexOf(toTheTeam) < 0)
			{
				refusedInvitations.Add(toTheTeam);
			}
		}
	}

	public bool AcceptsInvitationByComputer(Team toTheTeam)
	{
		if (MyTeam == null)
		{
			return true;
		}
		int num = (int)(15f * (float)toTheTeam.morale / (float)DataManager.TEAM_MORALE_MAX);
		int num2 = toTheTeam.averageSkill + num;
		int num3 = (int)(15f * (float)MyTeam.morale / (float)DataManager.TEAM_MORALE_MAX);
		int num4 = MyTeam.averageSkill + num3;
		return num2 - num4 >= 2;
	}

	internal void OnInviteReceived()
	{
		teamInvitaionsAfterMatch++;
	}

	internal bool CanReceiveMoreInvitations()
	{
		if (Present(ElifootOptions.SimulationFlag.Invitations))
		{
			return teamInvitaionsAfterMatch < ElifootOptions.maxInvitaionsPerMatch;
		}
		return true;
	}

	public CanHireCoach CanHireBasic()
	{
		if (MyTeam == null)
		{
			return CanHireCoach.OK;
		}
		if (TryingToFire)
		{
			return CanHireCoach.OK;
		}
		if (matchesInTeam < MatchesToFire())
		{
			return CanHireCoach.MatchesInTeamNotEnough;
		}
		if (MyTeam.morale < DataManager.MORALE_TO_HIRE)
		{
			return CanHireCoach.MoraleTooLow;
		}
		return CanHireCoach.OK;
	}

	public CanHireCoach CanHire(Team toTheTeam, EliList pendingInvitations, params FireCoach[] flags)
	{
		CanHireCoach canHireCoach = CheckCanHire(toTheTeam, flags);
		if (pendingInvitations != null && canHireCoach == CanHireCoach.OK)
		{
			foreach (Invitation pendingInvitation in pendingInvitations)
			{
				if (pendingInvitation.coach == this)
				{
					canHireCoach = CanHireCoach.OtherInvitationPending;
					return canHireCoach;
				}
			}
		}
		return canHireCoach;
	}

	private CanHireCoach CheckCanHire(Team toTheTeam, params FireCoach[] flags)
	{
		if (TryingToFire && MyTeam == toTheTeam)
		{
			return CanHireCoach.TryingToFire;
		}
		CanHireCoach canHireCoach = CanHireBasic();
		if (canHireCoach != CanHireCoach.OK)
		{
			return canHireCoach;
		}
		Competition competition = toTheTeam.FindCompetition(CompetitionType.NationalLeague);
		Division division = toTheTeam.MyDivision(competition);
		if (division == null && human)
		{
			return CanHireCoach.NotInNationalLeague;
		}
		if (human)
		{
			if (!toTheTeam.unblocked && !GamePermissions.allowed[(int)GamePermissions.Permissions.inviteFirstDivision] && division.number == 1)
			{
				return CanHireCoach.FirstDivisionNotAllowed;
			}
			if (refusedInvitations != null && refusedInvitations.IndexOf(toTheTeam) >= 0)
			{
				return CanHireCoach.InvitationAlreadyRefused;
			}
		}
		int averageSkill = toTheTeam.averageSkill;
		bool flag = HasFireCoachFlag(flags, FireCoach.MustFire);
		bool flag2 = HasFireCoachFlag(flags, FireCoach.AcceptHuman) && (division?.AcceptsHumanCoaches() ?? true);
		bool flag3 = HasFireCoachFlag(flags, FireCoach.Unemployed);
		int num = (int)((double)averageSkill - 0.25 * (double)DataManager.PLAYER_SKILL_MAX);
		if (!flag && MySkill < (double)num)
		{
			return CanHireCoach.MySkillTooLow;
		}
		if (MyTeam != null)
		{
			if (flag3)
			{
				return CanHireCoach.UnemployedOnlyAllowed;
			}
			if (human && MySkill > (double)(toTheTeam.averageSkill + 15))
			{
				return CanHireCoach.MySkillTooHigh;
			}
		}
		CanHireCoach canHireCoach2 = CanHireCoach.Unknown;
		if (human)
		{
			if (flag2)
			{
				return CanHireCoach.OK;
			}
			return CanHireCoach.HumansNotAccepted;
		}
		if (flag)
		{
			return CanHireCoach.OK;
		}
		return CanHireCoach.OK;
	}

	public bool HasEvents()
	{
		return coachEvents.Count > 0;
	}

	public void AddEvent(CoachEvent.CoachEventType eventType, Competition competition, params object[] args)
	{
		long num = competition?.PrizeMoneyValue(eventType, args) ?? 0;
		bool num2 = CoachEvent.ShallAddToHistory(eventType, competition);
		long num3 = DataManager.SocialPointsValue(eventType, competition, args);
		CoachEvent coachEvent = new CoachEvent(eventType, competition, DataManager.instance.properties.currentSeasonNumber, num, args);
		if (num2)
		{
			coachEvents.Add(coachEvent);
		}
		if (num > 0)
		{
			MyTeam.MoneyTransaction(num, TransactionType.Prize, true, coachEvent);
		}
		if (!onVacation)
		{
			coachSeason.SeasonPoints += num3;
		}
	}

	public void DrawShirtOnImage(Image onImage)
	{
		if (!(onImage == null))
		{
			if (MyTeam == null)
			{
				onImage.sprite = ScreenController.instance.genericHumanIcon;
			}
			else
			{
				MyTeam.DrawShirtOnImage(onImage);
			}
		}
	}

	public void DrawLogoOnImage(Image onImage)
	{
		if (!(onImage == null))
		{
			if (MyTeam == null)
			{
				onImage.sprite = ScreenController.instance.genericHumanIcon;
			}
			else
			{
				MyTeam.DrawLogoOnImage(onImage);
			}
		}
	}

	public int CompetitionRankPoints()
	{
		return titles.Sum((KeyValuePair<Competition, int> x) => x.Key.RankPointsFactor() * x.Value);
	}
}
