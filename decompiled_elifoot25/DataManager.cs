using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.SceneManagement;

public class DataManager : MonoBehaviour
{
	public enum DbTeamsMode
	{
		NormalMode,
		PackageMode
	}

	public enum IsInCup
	{
		Playing,
		SkipNext,
		Eliminated,
		NotPresent
	}

	public enum PlayerPosition
	{
		Keeper,
		LeftBack,
		Stopper,
		RightBack,
		Sweeper,
		LeftMidfield,
		Midfield,
		RightMidfield,
		LeftWing,
		RightWing,
		Striker
	}

	private struct SetCoachPoints_Form
	{
		public string coachguid;

		public string coachname;

		public long coachpoints;

		public string coachteam;

		public string gameId;
	}

	private enum FileStatus
	{
		OK,
		Error,
		EndOfFile,
		WrongVersion,
		PathNotFound,
		WrongFileHeader,
		WrongFileType
	}

	public static DataManager instance;

	public GameProperties properties;

	[Header("Debug")]
	public bool DBDebugMode;

	[Header("Build options")]
	[ReadOnlyWhenPlaying]
	public string applicationTitle;

	public PermissionLevel buildLevel;

	public PermissionLevel baseRegLevel;

	[ReadOnlyWhenPlaying]
	public string version;

	[ReadOnly]
	public readonly DbTeamsMode dbTeamsMode;

	[ReadOnlyWhenPlaying]
	public string timeBomb = "";

	[Header("Development")]
	public bool useFakeStoreInEditor;

	public bool iPhoneXUpperMarginInEditor;

	public Sprite imgMenuLogo;

	public const string SAVE_GAME_VERSION_2020J = "20200801";

	public const string SAVE_GAME_VERSION_2020K = "20200817";

	public const string SAVE_GAME_VERSION_2020L = "20200825";

	public const string SAVE_GAME_VERSION_2020M = "20201104";

	public const string SAVE_GAME_VERSION_2020N = "20201110";

	public const string SAVE_GAME_VERSION_2020O = "20201127";

	public const string SAVE_GAME_VERSION_2020P = "20210130";

	public const string SAVE_GAME_VERSION_2020Q = "20210421";

	public const string SAVE_GAME_VERSION_2020R = "20220516";

	public const string SAVE_GAME_VERSION_2022A = "20220918";

	public const string SAVE_GAME_VERSION_2025A = "20251104";

	private static string CURRENT_SAVE_GAME_VERSION = "20251104";

	public static string[] ALLOWED_GAME_VERSIONS = new string[11]
	{
		"20200801", "20200817", "20200825", "20201104", "20201110", "20201127", "20210130", "20210421", "20220516", "20220918",
		"20251104"
	};

	public static string[] TEAM_FILE_VERSIONS = new string[1] { "2020.3" };

	public static long FREE_SPACE_REQUIRED_IN_MB_STANDARD = 25L;

	public static long FREE_SPACE_REQUIRED_IN_MB_HUGE_TEST = 250000L;

	public static Dictionary<string, string> configDictionary = new Dictionary<string, string>();

	public static string GOOGLE_PUBLIC_KEY_VIP = null;

	public static string GOOGLE_PUBLIC_KEY_PRO = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiM9o0yleiPDp/f1ZAi6cSTRe8WUdqFZGPSFROtqCJ5+rha4O6PPSn9WjBYP4k+OIl5rqpUFjo41yoFDJy2/WfoQXC2JhxaeW4qiNXTe2DXP4bzP4C/7MoeWztgN+CZHtlCL/aqqJ55cFBpW1njtFFIBTtF3O+q8kaqVk90IOS93yGxiAwqb9zeJtpMk+G6z0yAojIEV6e0T7yk1AIswEZ0w085XtRvBmif5ZJ1qDFd2jHDRYRLe24FccZTiqaF4KwEsxAmCu43A2txdXpcffzFly+Q6bj745HJ7HFCtu4Qoko2jqf3dkcj9ZVOOafBanmEL8gvsTyT9R0ngwHl0JywIDAQAB";

	public static string GOOGLE_PUBLIC_KEY_FREE = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiM9o0yleiPDp/f1ZAi6cSTRe8WUdqFZGPSFROtqCJ5+rha4O6PPSn9WjBYP4k+OIl5rqpUFjo41yoFDJy2/WfoQXC2JhxaeW4qiNXTe2DXP4bzP4C/7MoeWztgN+CZHtlCL/aqqJ55cFBpW1njtFFIBTtF3O+q8kaqVk90IOS93yGxiAwqb9zeJtpMk+G6z0yAojIEV6e0T7yk1AIswEZ0w085XtRvBmif5ZJ1qDFd2jHDRYRLe24FccZTiqaF4KwEsxAmCu43A2txdXpcffzFly+Q6bj745HJ7HFCtu4Qoko2jqf3dkcj9ZVOOafBanmEL8gvsTyT9R0ngwHl0JywIDAQAB";

	public static string GOOGLE_PUBLIC_KEY_BETA = GOOGLE_PUBLIC_KEY_FREE;

	public static string APTOIDE_PUBLIC_KEY_BETA = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7PrOn+w456RmUF/NHzZYFXc6CSn5+61lQms8mavRm1IMFVHMxJbJC+Pr4i7ZFH1YhqK4eD8qdSRQpnU7uEAdw2sp57aVJmS7URKb0vdUSk/+TYDZxJBW8OeetqH9y3GYXTz7BrZVJ/j46zsdpxWk+Zm2QQ2IQZYYvjH8NeQKXAhyYXBwpusdPMzt3YY3oo1+MLxSCLNWHPPnbFMftG5j7Tn08BU7OY23GCYrc4QDpQGY8T6fqo8VaT34Ud3g550CQuSB+k9+nN+aWy39Os3qlr3lyVVOoC+IjQMBHTBGUXMdZCmO3zUc3qROyNvorP3hyeoP3StMI6r1OHV8qtXuMwIDAQAB";

	public static string APTOIDE_PUBLIC_KEY_VIP = null;

	public static string APTOIDE_PUBLIC_KEY_PRO = null;

	public static string APTOIDE_PUBLIC_KEY_FREE = null;

	public const string FILE_NAMES_VERSION = "1";

	public const string FILE_NAMES_TYPE = "ELIFOOT NAMES";

	public static int PLAYER_SICKNESS_MAX = 10;

	public static int PLAYER_AIM_MAX = 17;

	public static int PLAYERSEARCH_SIZE_MAX = 50;

	public const long PLAYER_SALARY_MIN = 100L;

	public const long PLAYER_SALARY_MAX = 200000L;

	public static int NUM_MATCHES_BLOCKED_BY_SALARY = 10;

	public const float LOAN_INTEREST = 0.01f;

	public const long LOAN_MAX = 50000000L;

	public const long LOAN_STEP = 1000000L;

	private const int TEAMS_PER_DIVISION_MIN = 2;

	public const int TEAMS_PER_DIVISION_MAX = 20;

	public const int TEAMS_PER_DIVISION_DEFAULT = 8;

	public const int NUM_LEAGUE_ROUNDS_MAX = 38;

	public const int NUM_DIVISION_CONFIGURATIONS = 9;

	public const int TEAMS_IN_INTERNATIONAL_DIVISION_MAX = 50;

	public static long BANK_AMOUNT_MAX = 999999999999L;

	public static int COACH_NAME_LENGTH_MAX = 50;

	public static int COACH_EMAIL_LENGTH_MAX = 50;

	public static int COACH_PASSWORD_LENGTH_MAX = 100;

	public static int COACH_RECOVER_PASSWORD_CODE_LENGTH_MAX = 6;

	public static int COACH_EVENTS_LENGTH_HUMAN_MAX = 30;

	public static int COACH_EVENTS_LENGTH_COMPUTER_MAX = 5;

	public static int HASH_SIZE = 8;

	public static int HUMAN_COACHES_MAX = 8;

	public static int TRANSFERED_PLAYERS_LENGTH_MAX = 30;

	public static int COACH_EVENT_NEWS_LENGTH_MAX = 30;

	public static int LAST_WINNERS_LENGTH_MAX = 50;

	public static int PLAYER_NAME_LENGTH_MAX = 30;

	public static int PLAYER_SKILL_MIN = 1;

	public static int PLAYER_SKILL_MAX = 99;

	public static int PLAYER_SKILL_STAR_INCREASE = PLAYER_SKILL_MAX / 10;

	public static int PLAYER_SKILL_NATIONALITY_INCREASE = PLAYER_SKILL_MAX / 20;

	public static int SOCIAL_STANDINGS_MAX = 20;

	public static int SUBSTITUTIONS_PER_MATCH_MAX = 5;

	public static int SUBSTITUTES_IN_BENCH_MAX = 10;

	public static int TEAM_MININAME_LENGTH_MAX = 15;

	public static int TEAM_MORALE_DEFAULT = 50;

	public static int TEAM_MORALE_MAX = 100;

	public static int TEAM_MORALE_MIN = 0;

	public static int TEAM_NAME_LENGTH_MAX = 30;

	public static int TEAM_INIT_SKILL_MAX = PLAYER_SKILL_MAX;

	public static int TEAM_INIT_SKILL_MIN = PLAYER_SKILL_MIN;

	public static int TEAM_FULL_NAME_LENGTH_MAX = 40;

	public static int TEAM_SHORT_NAME_LENGTH_MAX = 20;

	public static int TRANSACTIONS_LENGTH_HUMAN_MAX = 50;

	public static int TRANSACTIONS_LENGTH_COMPUTER_MAX = 5;

	public static int TICKETINCOME_LENGTH_HUMAN_MAX = 50;

	public static int TICKETINCOME_LENGTH_COMPUTER_MAX = 5;

	public const int PLAYERS_PER_TEAM_MAX = 50;

	public const int PLAYERS_PER_TEAM_DESIRED = 30;

	public const int PLAYERS_PER_TEAM_MIN = 14;

	public const int FIELD_PLAYERS_PER_TEAM_MIN = 10;

	public const int GOALKEEPERS_PER_TEAM_MIN = 1;

	public static int MORALE_TO_FIRE_BASE = 45;

	public static int MORALE_TO_FIRE_DECREASE_PER_DIVISION = 3;

	public static int MORALE_TO_FIRE_HUMAN = 35;

	public static int MORALE_TO_HIRE = 70;

	public static int STADIUM_MAX_NUMBER_SEATS = 100000;

	public static int STADIUM_SEATS_BLOCK_SIZE = 5000;

	public static long STADIUM_SEATS_BASE_BLOCK_PRICE = 1000000L;

	public static string EDITOR_LAST_USED_ID_PREF = "EDITOR_ID";

	public static int PENALTIES_COUNT_UNTIL_SUDDEN_DEATH = 5;

	public static float PENALTIES_IN_MATCH_WAIT_TIME = 3f;

	public static float MATCH_BREAK_WAIT_TIME = 4f;

	public static float COACH_NEWS_WAIT_TIME = 10f;

	public static string AUTOSAVE_DEFAULT_NAME = "Auto-save";

	public static string PROMOTION_FILE_NAME = "prodata.eli";

	public static string UNBLOCK_TEAMS_FILE_NAME = "ubtdata.eli";

	public static string RANKING_FILENAME = "ranking.eli";

	public static string RANKING_PATH = "Data";

	public static string SAVELOAD_PATH = "SaveGames";

	public static string DATA_PATH = "Data";

	public static string CHANGEDNAMES_PATH = "ChangedNames.csv";

	public static string LOG_ERROR_PATH = "LogError";

	public static string DUMPFILE_PATH = "";

	public static string DOWNLOADEDNAMES_PATH = "DownloadedNames.csv";

	[Header("Configuration")]
	public static long PRIZE_MONEY_COMPETITION_WINNER = 10000000L;

	public static long PRIZE_MONEY_COMPETITION_SECOND = 3000000L;

	public static long PRIZE_MONEY_COMPETITION_THIRD = 1000000L;

	public static long PRIZE_MONEY_BEST_STRIKER = 1000000L;

	public static readonly int REWARD_VIDEO_AD_COINS_MIN = 2;

	public static readonly int REWARD_VIDEO_AD_COINS_MAX = 5;

	public static long SOCIAL_POINTS_MATCH_HOME_WIN = 2L;

	public static long SOCIAL_POINTS_MATCH_HOME_DRAW = 1L;

	public static long SOCIAL_POINTS_MATCH_AWAY_WIN = 3L;

	public static long SOCIAL_POINTS_MATCH_AWAY_DRAW = 2L;

	public static long SOCIAL_POINTS_DIVISION_UP = 10L;

	public static long SOCIAL_POINTS_DIVISION_DOWN = -10L;

	public static long SOCIAL_POINTS_LEAGUE_WIN = 5L;

	public static long SOCIAL_POINTS_LEAGUE_SECOND = 2L;

	public static long SOCIAL_POINTS_LEAGUE_THIRD = 1L;

	public static long SOCIAL_POINTS_NATIONAL_CUP_WIN = 3L;

	public static long SOCIAL_POINTS_BEST_STRIKER = 2L;

	public static long SOCIAL_POINTS_RESIGN = -50L;

	public static int[] moraleBonusHome = new int[3] { 7, -3, -10 };

	public static int[] moraleBonusAway = new int[3] { 10, 3, -7 };

	public static int[,] desiredNumPlayers = new int[5, 11]
	{
		{
			3, 2, 3, 2, 1, 2, 2, 2, 1, 1,
			1
		},
		{
			3, 2, 3, 2, 1, 2, 2, 2, 2, 2,
			2
		},
		{
			3, 3, 4, 3, 1, 2, 2, 2, 2, 2,
			2
		},
		{
			4, 3, 4, 3, 2, 2, 3, 2, 2, 2,
			2
		},
		{
			4, 3, 4, 3, 2, 2, 3, 2, 2, 2,
			3
		}
	};

	public ListOfAllTeams allTeams = new ListOfAllTeams();

	public ListOfPlayers allPlayers = new ListOfPlayers();

	public ListOfPlayers tradedPlayers = new ListOfPlayers();

	public ListOfCoaches allCoaches = new ListOfCoaches();

	public ListOfDivisions allDivisions = new ListOfDivisions();

	public ListOfMatches allMatches = new ListOfMatches();

	public ListOfMatches recordedMatches = new ListOfMatches();

	public ListOfCompetitions allCompetitions = new ListOfCompetitions();

	public ListOfCountries allCountries = new ListOfCountries();

	public ListOfRegions allRegions = new ListOfRegions();

	public ListOfConfederations allConfederations = new ListOfConfederations();

	public ListOfRegionalFederations allRegionalFederations = new ListOfRegionalFederations();

	public ListOfPromotions myPromotions = new ListOfPromotions();

	public ListOfUnblockTeams myUnblockTeams = new ListOfUnblockTeams();

	public List<Account> allRecordedCoaches = new List<Account>();

	public bool stopElifoot;

	public GameSocial social;

	public bool isNewGame;

	public bool isLoadedGame;

	[Header("Icons")]
	public Sprite redCardIcon;

	public Sprite yellowCardIcon;

	public Sprite secondYellowCardIcon;

	public Sprite injuryIcon;

	public Sprite soldIcon;

	[Header("Sounds")]
	public AudioSource soundDefaultClick;

	public AudioSource soundMatchEvent;

	public AudioSource soundRedCard;

	public AudioSource soundWinner;

	public AudioSource soundDivisionUp;

	public AudioSource soundInjury;

	public AudioSource soundGoal;

	public bool matchEventAudioNotification;

	public bool matchEventSound;

	[Header("Music")]
	public AudioSource musicMenu;

	public AudioSource musicTeamMain;

	public int matchesWithoutSaving;

	public int matchesPlayed;

	public string saveFileName;

	public EliCrash eliCrash = new EliCrash();

	private SetCoachPoints_Form SetCoachPointsForm;

	private static bool hasScreenshot = false;

	private void Awake()
	{
		if (instance != null)
		{
			UnityEngine.Object.Destroy(base.gameObject);
			return;
		}
		instance = this;
		properties = new GameProperties();
		Registration.CheckRegistrationInfo();
		SAVELOAD_PATH = Path.Combine(Application.persistentDataPath, SAVELOAD_PATH);
		CHANGEDNAMES_PATH = Path.Combine(Application.persistentDataPath, CHANGEDNAMES_PATH);
		DUMPFILE_PATH = Path.Combine(Application.persistentDataPath, DUMPFILE_PATH);
		RANKING_PATH = Path.Combine(Application.persistentDataPath, RANKING_PATH);
	}

	private void Start()
	{
		Application.SetStackTraceLogType(LogType.Log, StackTraceLogType.None);
		GamePermissions.CheckBuildPermissions();
		int num = PlayerPrefs.GetInt("Impersonation", (int)Registration.RegLevel);
		GamePermissions.impersonationLevel = (Enum.IsDefined(typeof(PermissionLevel), num) ? ((PermissionLevel)num) : Registration.RegLevel);
		GamePermissions.impersonationLevel = (PermissionLevel)Mathf.Min((int)GamePermissions.impersonationLevel, (int)Registration.RegLevel);
		GamePermissions.ComputeRegLevel();
		GamePermissions.CheckInWhitelist();
		LanguageController.instance.StartController();
		ElifootOptions.Initialize();
		ElifootOptions.ReadOptions();
		LoadAllRecordedCoaches();
		Util.DeleteOldFiles(Application.persistentDataPath + "/" + LOG_ERROR_PATH, 1);
		if (LanguageController.instance != null)
		{
			Util.moneySymbol = LanguageController.instance.Get_Translation("**MONEY_SYMBOL");
			Util.moneyStringTemplate = LanguageController.instance.Get_Translation("**MONEY_STRING_TEMPLATE");
		}
	}

	public void ClearData()
	{
		if (allTeams != null)
		{
			allTeams.Clear();
		}
		if (allPlayers != null)
		{
			allPlayers.Clear();
		}
		if (allCoaches != null)
		{
			allCoaches.Clear();
		}
		if (allDivisions != null)
		{
			allDivisions.Clear();
		}
		if (allCompetitions != null)
		{
			allCompetitions.Clear();
		}
		if (tradedPlayers != null)
		{
			tradedPlayers.Clear();
		}
	}

	public IEnumerator NewGame(List<int> countryIndexes)
	{
		ScreenController.instance.ShowLoadingView("WAIT_CREATE_GAME");
		yield return null;
		RankingView.EraseSavedRankingAndFollows();
		SaveCoachGuids();
		SoundManager.instance.FadeCurrentMusic();
		properties.playerTransferEventList = new EliLimitedList(TRANSFERED_PLAYERS_LENGTH_MAX);
		properties.coachEventNews = new EliLimitedList(100000);
		saveFileName = null;
		matchesWithoutSaving = 0;
		ClearData();
		LoadDBAndConvert.instance.ConvertDBTeamsIntoTeams(countryIndexes);
		CreateCompetitions();
		ScreenController.instance.HideLoadingView();
		stopElifoot = false;
		GC.Collect();
		Resources.UnloadUnusedAssets();
	}

	private void CreateCompetitions()
	{
		if (allTeams.Count == 0)
		{
			Debug.LogError("Teams not loaded before creating divisions!");
			return;
		}
		allDivisions.Clear();
		allCompetitions.Clear();
		allTeams.SortByInitOrder(includeRegionCode: true);
		Country country = null;
		Region region = null;
		Competition competition = null;
		Competition competition2 = null;
		Competition competition3 = null;
		foreach (Team allTeam in allTeams)
		{
			if (allTeam.country != country)
			{
				country = allTeam.country;
				competition2 = new Competition(CompetitionType.NationalLeague, CompetitionSubtype.None, "NAMES_RULE_PARAMETER_LEAGUE", null, null, country);
				allCompetitions.Add(competition2);
				competition3 = new Competition(CompetitionType.NationalCup, CompetitionSubtype.None, "NAME_RULES_PARAMETER_CUP", null, null, country);
				allCompetitions.Add(competition3);
			}
			competition2.AddTeam(allTeam);
			competition3.AddTeam(allTeam);
			if (instance.properties.playRegionalLeagues && !string.IsNullOrEmpty(allTeam.RegionCode()))
			{
				if (allTeam.country.playRegional && (allTeam.country != country || allTeam.region != region))
				{
					region = allTeam.region;
					competition = new Competition(CompetitionType.RegionalLeague, CompetitionSubtype.None, "NAME_RULES_PARAMETER_REGIONAL", null, null, country, region);
					allCompetitions.Add(competition);
				}
				if (allTeam.country.playRegional)
				{
					competition.AddTeam(allTeam);
				}
			}
			allTeam.ComputeAverageSkill();
		}
		if (instance.properties.playSuperLeague)
		{
			instance.allTeams.SortByInitLevelDesc();
			int count = instance.allTeams.Count;
			int num = instance.TeamsPerDivision(CompetitionType.SuperLeague);
			int val = ElifootOptions.numDivisionsLeagueMax[7];
			int num2 = count;
			if (Math.Min(val, num2 / num) > 0)
			{
				Confederation confederation = (Confederation)instance.allConfederations.Find((EliObject x) => ((Confederation)x).ConfederationCode == "FIFA");
				if (confederation != null)
				{
					Competition competition4 = new Competition(CompetitionType.SuperLeague, CompetitionSubtype.SuperLeague, "NAMES_RULE_PARAMETER_LEAGUE", confederation);
					allCompetitions.Add(competition4);
					int num3 = 0;
					while (num3 < num2)
					{
						competition4.AddTeam(instance.allTeams.Team(num3++));
					}
				}
			}
		}
		if (instance.properties.playInternationalLeagues)
		{
			foreach (Confederation confederation2 in new ListOfConfederations(allConfederations.FindAll((EliObject x) => ((Confederation)x).isActive)))
			{
				new ListOfCountries(confederation2.myCountries.FindAll((EliObject x) => ((Country)x).isActive));
				string confederationCode = confederation2.ConfederationCode;
				if (!(confederationCode == "UEFA"))
				{
					if (!(confederationCode == "CONMEBOL") || confederation2.numActiveCountries < 2)
					{
						continue;
					}
					Competition competition5 = new Competition(CompetitionType.InternationalLeague, CompetitionSubtype.Libertadores, "NAMES_RULE_PARAMETER_LEAGUE", confederation2);
					confederation2.myCompetitions.Add(competition5);
					allCompetitions.Add(competition5);
					Competition competition6 = new Competition(CompetitionType.InternationalLeague, CompetitionSubtype.SudAmericana, "NAMES_RULE_PARAMETER_LEAGUE", confederation2);
					confederation2.myCompetitions.Add(competition6);
					allCompetitions.Add(competition6);
					foreach (Competition item in new ListOfCompetitions(allCompetitions.FindAll((EliObject x) => ((Competition)x).competitionType == CompetitionType.NationalCup && ((Competition)x).country.MyConfederation == confederation2)))
					{
						item.AddCompetitionQualification(1, 1, 0f, competition5, null);
					}
					foreach (Competition item2 in new ListOfCompetitions(allCompetitions.FindAll((EliObject x) => ((Competition)x).competitionType == CompetitionType.NationalLeague && ((Competition)x).country.MyConfederation == confederation2)))
					{
						item2.AddCompetitionQualification(1, 4, 0.25f, competition5, null);
						item2.AddCompetitionQualification(4, 4, 0.25f, competition6, competition5);
					}
				}
				else
				{
					if (confederation2.numActiveCountries < 2)
					{
						continue;
					}
					Competition competition7 = new Competition(CompetitionType.InternationalLeague, CompetitionSubtype.ChampionsLeague, "NAMES_RULE_PARAMETER_LEAGUE", confederation2);
					confederation2.myCompetitions.Add(competition7);
					allCompetitions.Add(competition7);
					Competition competition8 = new Competition(CompetitionType.InternationalLeague, CompetitionSubtype.EuropaLeague, "NAMES_RULE_PARAMETER_LEAGUE", confederation2);
					confederation2.myCompetitions.Add(competition8);
					allCompetitions.Add(competition8);
					foreach (Competition item3 in new ListOfCompetitions(allCompetitions.FindAll((EliObject x) => ((Competition)x).competitionType == CompetitionType.NationalLeague && ((Competition)x).country.MyConfederation == confederation2)))
					{
						item3.AddCompetitionQualification(1, 2, 0.25f, competition7, null);
						item3.AddCompetitionQualification(1, 4, 0.25f, competition8, competition7);
					}
					foreach (Competition item4 in new ListOfCompetitions(allCompetitions.FindAll((EliObject x) => ((Competition)x).competitionType == CompetitionType.NationalCup && ((Competition)x).country.MyConfederation == confederation2)))
					{
						item4.AddCompetitionQualification(1, 1, 0f, competition8, competition7);
					}
				}
			}
		}
		allCompetitions.Initialize();
		foreach (Competition allCompetition in allCompetitions)
		{
			allCompetition.CheckNextYearTeams();
		}
	}

	public void StartUpNewGame()
	{
		allCountries.Initialize();
		allDivisions.Initialize();
		allTeams.Initialize();
		isNewGame = true;
	}

	public void CheckRankingPermission(Action afterPopUpAction = null)
	{
		if (!ElifootOptions.playWorldRanking)
		{
			string title = LanguageController.instance.Get_Translation("COACH_WORLD_RANKING");
			string description = LanguageController.instance.Get_Translation("COACH_RANKING_CONFIRM");
			Action action = AcceptedRankingPermission;
			if (afterPopUpAction != null)
			{
				action = (Action)Delegate.Combine(action, afterPopUpAction);
			}
			ScreenController.instance.ShowThreeDialogPopUpWithMoreInfo(title, description, action, MoreInfoRankingPermission, afterPopUpAction);
		}
	}

	private void AcceptedRankingPermission()
	{
		ElifootOptions.playWorldRanking = true;
		ElifootOptions.SaveOptions();
		UpdateCoachPointsInServer(newSeason: false, showInfoAndWarnings: false, forceSend: true);
	}

	private void MoreInfoRankingPermission()
	{
		ScreenController.instance.ShowScrollableTextView("COACH_WORLD_RANKING", "COACH_WORLD_RANKING_DESCRIPTION");
	}

	private void LoadAllRecordedCoaches()
	{
		if (string.IsNullOrEmpty(ElifootOptions.allRecordedCoachGuids))
		{
			return;
		}
		string[] array = ElifootOptions.allRecordedCoachGuids.Split(',');
		string[] array2 = ElifootOptions.allRecordedCoachNames.Split(',');
		string[] array3 = ElifootOptions.allRecordedCoachEmails.Split(',');
		string[] array4 = ElifootOptions.allRecordedCoachPasswords.Split(',');
		for (int i = 0; i < array.Length; i++)
		{
			Account recordedAccount = new Account
			{
				guid = array[i],
				coachName = ((i < array2.Length) ? array2[i] : ""),
				email = ((i < array3.Length) ? array3[i] : ""),
				password = ((i < array4.Length) ? array4[i] : "")
			};
			if (allRecordedCoaches.FindIndex((Account acc) => acc.guid == recordedAccount.guid) < 0)
			{
				allRecordedCoaches.Add(recordedAccount);
			}
		}
	}

	public Account GetAccount(string guid, string name)
	{
		Account account = allRecordedCoaches.Find((Account acc) => acc.guid == guid);
		if (account == null)
		{
			AddRecordedCoach(guid, name);
			account = allRecordedCoaches.Find((Account acc) => acc.guid == guid);
		}
		else if (string.IsNullOrEmpty(account.coachName))
		{
			account.coachName = name;
		}
		return account;
	}

	public void AddRecordedCoach(string guid, string coachName = "", string email = "", string password = "")
	{
		Account item = new Account
		{
			guid = guid,
			coachName = coachName,
			email = email,
			password = password
		};
		if (allRecordedCoaches.FindIndex((Account acc) => acc.guid == guid) < 0)
		{
			allRecordedCoaches.Add(item);
			SaveRecordedCoaches();
		}
	}

	public void DeleteRecordedCoach(Account account)
	{
		if (allRecordedCoaches.Contains(account))
		{
			allRecordedCoaches.Remove(account);
			SaveRecordedCoaches();
		}
	}

	public void EditOrAddRecordedCoach(Account account)
	{
		int num = allRecordedCoaches.FindIndex((Account acc) => acc.guid == account.guid);
		if (num >= 0)
		{
			allRecordedCoaches[num] = account;
		}
		else
		{
			allRecordedCoaches.Add(account);
		}
		SaveRecordedCoaches();
	}

	private void SaveRecordedCoaches()
	{
		ElifootOptions.allRecordedCoachGuids = "";
		ElifootOptions.allRecordedCoachNames = "";
		ElifootOptions.allRecordedCoachEmails = "";
		ElifootOptions.allRecordedCoachPasswords = "";
		if (allRecordedCoaches == null || allRecordedCoaches.Count == 0)
		{
			ElifootOptions.SaveOptions();
			return;
		}
		foreach (Account allRecordedCoach in allRecordedCoaches)
		{
			if (ElifootOptions.allRecordedCoachGuids == "")
			{
				ElifootOptions.allRecordedCoachGuids = allRecordedCoach.guid;
				ElifootOptions.allRecordedCoachNames = allRecordedCoach.coachName;
				ElifootOptions.allRecordedCoachEmails = allRecordedCoach.email;
				ElifootOptions.allRecordedCoachPasswords = allRecordedCoach.password;
			}
			else
			{
				ElifootOptions.allRecordedCoachGuids = ElifootOptions.allRecordedCoachGuids + "," + allRecordedCoach.guid;
				ElifootOptions.allRecordedCoachNames = ElifootOptions.allRecordedCoachNames + "," + allRecordedCoach.coachName;
				ElifootOptions.allRecordedCoachEmails = ElifootOptions.allRecordedCoachEmails + "," + allRecordedCoach.email;
				ElifootOptions.allRecordedCoachPasswords = ElifootOptions.allRecordedCoachPasswords + "," + allRecordedCoach.password;
			}
		}
		ElifootOptions.SaveOptions();
	}

	public void CheckCoachesGuids()
	{
		foreach (Coach allHumanCoach in instance.allCoaches.GetAllHumanCoaches())
		{
			allHumanCoach.CheckGUID();
			allHumanCoach.CheckAccount();
		}
	}

	public static string GetAppTitle(bool formatted)
	{
		return instance.applicationTitle;
	}

	public string GetGameVersion()
	{
		string text = "99";
		text = "05";
		string[] obj = new string[5] { instance.version, ".", text, null, null };
		int num = (int)instance.baseRegLevel;
		obj[3] = num.ToString();
		num = (int)instance.buildLevel;
		obj[4] = num.ToString();
		return string.Concat(obj);
	}

	public void CreateMatches(GlobalCalendarEntry calEntry)
	{
		if (allDivisions.Count == 0)
		{
			Debug.LogError("Divisions not created before creating matches!");
			return;
		}
		allMatches.Clear();
		switch (calEntry.competitionPhase)
		{
		case CompetitionPhase.GroupStage:
		{
			foreach (Division allDivision in allDivisions)
			{
				if (allDivision.Competition != null && allDivision.Competition.competitionType == calEntry.competitionType)
				{
					allDivision.teams.SortByLeagueRoundPosition(calEntry, calEntry.round - 1);
					allDivision.teams.ResetMatch();
					for (int num2 = 0; num2 + 1 < allDivision.teams.Count; num2 += 2)
					{
						Match item2 = new Match(allDivision, allDivision.teams.Team(num2), allDivision.teams.Team(num2 + 1), calEntry);
						allMatches.Add(item2);
					}
				}
			}
			break;
		}
		case CompetitionPhase.Playoffs:
		case CompetitionPhase.FinalPhase:
		{
			ListOfCompetitions listOfCompetitions = new ListOfCompetitions();
			if (calEntry.competition == null)
			{
				listOfCompetitions.AddRange(instance.allCompetitions.FindAll((EliObject x) => ((Competition)x).competitionType == calEntry.competitionType && ((Competition)x).firstRoundPlayed[(int)calEntry.competitionPhase] >= calEntry.round));
			}
			else
			{
				listOfCompetitions.Add(calEntry.competition);
			}
			{
				foreach (Competition item3 in listOfCompetitions)
				{
					ListOfTeams listOfTeams = item3.phaseTeams[(int)calEntry.competitionPhase];
					listOfTeams.SortByCupOrder(item3);
					listOfTeams.ResetMatch();
					for (int num = 0; num + 1 < listOfTeams.Count; num += 2)
					{
						Team team;
						Team team2;
						if (calEntry.matchType == MatchType.CupSecondLeg)
						{
							team = listOfTeams.Team(num + 1);
							team2 = listOfTeams.Team(num);
						}
						else
						{
							team = listOfTeams.Team(num);
							team2 = listOfTeams.Team(num + 1);
						}
						if (team.CompetitionData(item3).isInCup == IsInCup.Playing && team2.CompetitionData(item3).isInCup == IsInCup.Playing)
						{
							Match item = new Match(null, team, team2, calEntry);
							allMatches.Add(item);
						}
					}
				}
				break;
			}
		}
		}
	}

	public void StartLoadedGame()
	{
		isLoadedGame = true;
		SoundManager.instance.FadeCurrentMusic();
		SceneManager.LoadScene("Game");
	}

	public int TeamsPerDivision(CompetitionType competitionType)
	{
		int teamsPerDivision = Competition.competitionConfigurations[competitionType].teamsPerDivision;
		if (teamsPerDivision == 0)
		{
			return Calendars.divisionConfigurations[properties.divConfigIndex[(int)competitionType]];
		}
		return teamsPerDivision;
	}

	public static string GetCompetitionName(CompetitionType forCompetitionType)
	{
		return LanguageController.instance.Get_Translation($"COMPETITION_TYPE_{forCompetitionType.ToString().ToUpper()}");
	}

	public AudioSource GetMatchEventAudioSource(MatchEventType eventType)
	{
		if (matchEventSound)
		{
			switch (eventType)
			{
			case MatchEventType.Goal:
			case MatchEventType.PenaltyGoalInMatch:
			case MatchEventType.PenaltyGoalShootout:
				return soundGoal;
			case MatchEventType.Injury:
				return soundInjury;
			case MatchEventType.RedCard:
				return soundRedCard;
			}
		}
		else if (matchEventAudioNotification)
		{
			return soundMatchEvent;
		}
		return null;
	}

	public static void UpdateStrikers(bool forceUpdate, bool onlyTopGoals, bool setPrizes)
	{
		if (!forceUpdate && instance.properties.gameDay.strikersUpdated)
		{
			return;
		}
		foreach (Competition allCompetition in instance.allCompetitions)
		{
			instance.allPlayers.SortBySeasonGoalsDesc(allCompetition);
			int num = 0;
			int num2 = 0;
			long amount = allCompetition.PrizeMoneyValue(Coach.CoachEvent.CoachEventType.BestScorer);
			switch (allCompetition.configuration.strikersCriteria)
			{
			case CompetitionStrikersCriteria.Global:
				allCompetition.strikers = new ListOfPlayers();
				instance.allPlayers.SortBySeasonGoalsDesc(allCompetition);
				num2 = instance.allPlayers.Player(0).playerSeason.GetGoals(allCompetition);
				num = 0;
				foreach (Player allPlayer in instance.allPlayers)
				{
					int goals2 = allPlayer.playerSeason.GetGoals(allCompetition);
					if (goals2 > 0 && (goals2 == num2 || (num < 10 && !onlyTopGoals)))
					{
						allCompetition.strikers.Add(allPlayer);
						if (setPrizes)
						{
							allPlayer.Team.MoneyTransaction(amount, TransactionType.Prize, true, new Coach.CoachEvent(Coach.CoachEvent.CoachEventType.BestScorer, allCompetition, allPlayer));
						}
						num++;
						continue;
					}
					break;
				}
				break;
			case CompetitionStrikersCriteria.PerDivision:
				foreach (Division division2 in allCompetition.divisions)
				{
					division2.strikers = new ListOfPlayers();
				}
				foreach (Division division3 in allCompetition.divisions)
				{
					ListOfPlayers listOfPlayers = new ListOfPlayers();
					foreach (Team team in division3.teams)
					{
						listOfPlayers.AddRange(team.Players);
					}
					listOfPlayers.SortBySeasonGoalsDesc(allCompetition);
					num2 = listOfPlayers.Player(0).playerSeason.GetGoals(allCompetition);
					num = 0;
					foreach (Player item in listOfPlayers)
					{
						int goals = item.playerSeason.GetGoals(allCompetition);
						if (goals > 0 && (goals == num2 || (num < 10 && !onlyTopGoals)))
						{
							division3.strikers.Add(item);
							if (setPrizes)
							{
								item.Team.MoneyTransaction(amount, TransactionType.Prize, true, new Coach.CoachEvent(Coach.CoachEvent.CoachEventType.BestScorer, allCompetition, item, division3));
							}
							num++;
							continue;
						}
						break;
					}
				}
				break;
			default:
				throw new NotImplementedException($"DataManager.UpdateStrikers, CompetitionStrikersCriteria={allCompetition.configuration.strikersCriteria} not implemented.");
			case CompetitionStrikersCriteria.None:
				break;
			}
		}
		instance.properties.gameDay.strikersUpdated = true;
	}

	public static void PlayerTraded(Player player, Team fromTeam, Team toTeam, long price, long newSalary)
	{
		fromTeam.PlayerSold(player, price, toTeam);
		toTeam.PlayerBought(player, price, newSalary);
		instance.AddPlayerTransferEvent(player, fromTeam, toTeam, price, newSalary);
		instance.tradedPlayers.Add(player);
	}

	private void AddPlayerTransferEvent(Player player, Team fromTeam, Team toTeam, long price, long newSalary)
	{
		PlayerTransferEvent item = new PlayerTransferEvent(player, fromTeam, toTeam, price, properties.currentSeasonNumber, newSalary);
		instance.properties.playerTransferEventList.Add(item);
	}

	public static long GetTicketPrice(int skill, double moneyRatio, float prizeFactor)
	{
		return (long)Math.Max(1.0, (double)((float)(skill + 5) / 4f) / moneyRatio);
	}

	public IEnumerator OpenPageAppl(string command)
	{
		string serverApplUrl = ElifootUrlManager.GetServerApplUrl(command);
		yield return StartCoroutine(OpenPage(serverApplUrl));
	}

	public IEnumerator OpenPage(string url)
	{
		ScreenController.instance.ShowLoadingView();
		BooleanObj canConnect = new BooleanObj(value: false);
		yield return StartCoroutine(ElifootUrlManager.instance.CheckConnectionToMasterServer(canConnect));
		ScreenController.instance.HideLoadingView();
		if (!canConnect.Value)
		{
			ScreenController.instance.ShowInfoPopUp("CONNECTION_FAILED", null);
		}
		else
		{
			ElifootUrlManager.OpenUrl(url);
		}
	}

	public IEnumerator SendError(int errorCode, string errorTitle, string errorMessage)
	{
		if (!GamePermissions.allowed[(int)GamePermissions.Permissions.sendError])
		{
			yield break;
		}
		new BooleanObj(value: false);
		new BooleanObj(value: false);
		string url = ElifootUrlManager.GetCommandUrl("senderror");
		string text = $"&errorCode={errorCode}&errorTitle={UnityWebRequest.EscapeURL(errorTitle)}&errorMsg={UnityWebRequest.EscapeURL(errorMessage)}";
		url += text;
		using UnityWebRequest loaded = new UnityWebRequest(url);
		loaded.timeout = 30;
		loaded.downloadHandler = new DownloadHandlerBuffer();
		yield return loaded.SendWebRequest();
		if (loaded.result != UnityWebRequest.Result.Success)
		{
			Debug.LogErrorFormat("Error DataManager::SendError().\nURL:{0}\nError:{1}", url, loaded.error);
		}
	}

	public bool CheckSaveGameVersion(string filePath)
	{
		try
		{
			using (Stream serializationStream = File.Open(filePath, FileMode.Open, FileAccess.Read))
			{
				if (!GameVersionAllowed((string)new BinaryFormatter().Deserialize(serializationStream)))
				{
					return false;
				}
			}
			return true;
		}
		catch (Exception ex)
		{
			Debug.LogError("ERROR CheckSaveGameVersion - " + ex.Message);
			return false;
		}
	}

	public (SavedGamesShortInfo.SavedGame?, string) CheckSaveGameVersionAndGetShortInfo(string filePath)
	{
		try
		{
			using Stream serializationStream = File.Open(filePath, FileMode.Open, FileAccess.Read);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			string text = (string)binaryFormatter.Deserialize(serializationStream);
			if (!GameVersionAllowed(text))
			{
				return (null, null);
			}
			return ((SavedGamesShortInfo.SavedGame)binaryFormatter.Deserialize(serializationStream), text);
		}
		catch
		{
			return (null, null);
		}
	}

	public static bool GameVersionAllowed(string gameVersion)
	{
		return ALLOWED_GAME_VERSIONS.Contains(gameVersion);
	}

	public bool HasSavedGames()
	{
		if (!Directory.Exists(SAVELOAD_PATH))
		{
			return false;
		}
		string[] files = Directory.GetFiles(SAVELOAD_PATH, "*.bin");
		if (files.Length == 0)
		{
			return false;
		}
		List<string> list = new List<string>();
		foreach (string text in files)
		{
			if (new FileInfo(text).Extension != ".bin")
			{
				continue;
			}
			try
			{
				if (CheckSaveGameVersion(text))
				{
					list.Add(text);
				}
			}
			catch (Exception ex)
			{
				Debug.LogErrorFormat("ERROR. Function HasSavedGames(), opening file path {0}\n{1}" + ex.Message);
			}
		}
		if (list.Count == 0)
		{
			return false;
		}
		return true;
	}

	public void DeleteAutoSaveFile()
	{
		string path = SAVELOAD_PATH + "/" + AUTOSAVE_DEFAULT_NAME + ".bin";
		string path2 = SAVELOAD_PATH + "/" + AUTOSAVE_DEFAULT_NAME + ".ext";
		try
		{
			File.Delete(path);
			File.Delete(path2);
		}
		catch
		{
		}
	}

	public bool HasEnoughSpace()
	{
		return true;
	}

	public void SaveGame(bool isAutoSave, bool forcedSave, Action onSave = null, bool isOverwrite = false, string overwritePath = null)
	{
		int num = 0;
		if (!HasEnoughSpace())
		{
			return;
		}
		instance.properties.lastUsedID = EliObject.lastUsedID;
		if (isAutoSave && string.IsNullOrEmpty(saveFileName))
		{
			saveFileName = AUTOSAVE_DEFAULT_NAME;
		}
		num = 100;
		try
		{
			Debug.Log($"SaveGame... isAutoSave:{isAutoSave}, isOverwrite:{isOverwrite}, overwritePath:{overwritePath} ");
			num = 101;
			if (!Directory.Exists(SAVELOAD_PATH))
			{
				num = 102;
				Directory.CreateDirectory(SAVELOAD_PATH);
			}
			num = 103;
			string text = SAVELOAD_PATH + "/savegame.temp";
			string text2 = SAVELOAD_PATH + "/" + saveFileName + ".bin";
			string text3 = ActiveSaveGameVersion();
			_ = SAVELOAD_PATH + "/debug.temp";
			num = 104;
			using (Stream stream = File.Open(text, FileMode.Create))
			{
				num = 201;
				BinaryFormatter binaryFormatter = new BinaryFormatter();
				num = 202;
				binaryFormatter.Serialize(stream, text3);
				num = 203;
				binaryFormatter.Serialize(stream, GetShortInfo());
				num = 204;
				instance.properties.Save(binaryFormatter, stream, text3);
				num = 250;
				object[] graph = new object[11]
				{
					instance.allCoaches, instance.allPlayers, instance.allTeams, instance.allMatches, instance.allDivisions, instance.allRegionalFederations, instance.allConfederations, instance.allRegions, instance.allCountries, instance.tradedPlayers,
					instance.allCompetitions
				};
				num = 251;
				binaryFormatter.Serialize(stream, graph);
			}
			num = 300;
			DeleteAutoSaveFile();
			num = 301;
			if (isOverwrite)
			{
				num = 302;
				File.Delete(overwritePath);
			}
			num = 310;
			File.Delete(text2);
			num = 311;
			File.Move(text, text2);
			num = 312;
			onSave?.Invoke();
			num = 313;
			if (!isAutoSave)
			{
				string message = LanguageController.instance.Get_Translation("SAVELOAD_SAVESUCCESS");
				ScreenController.instance.ShowToastMessage(message, 240f, 4f);
			}
			matchesWithoutSaving = 0;
			num = 320;
			SaveCoachGuids();
		}
		catch (Exception ex)
		{
			Debug.LogError($"ERROR Saving - {ex.Message} Error code: {num}");
			if (!isAutoSave || ElifootOptions.autoSaveWarnOnError)
			{
				string description = LanguageController.instance.Get_Translation("SAVELOAD_SAVEFAILED", num);
				ScreenController.instance.ShowInfoPopUp(description, null);
			}
		}
		Debug.Log("SaveGame end");
	}

	public void SaveCoachGuids()
	{
		string text = "";
		foreach (Coach allHumanCoach in allCoaches.GetAllHumanCoaches())
		{
			if (text != "")
			{
				text += ",";
			}
			text += allHumanCoach.MyGUID;
		}
		ElifootOptions.lastGameCoachGuids = text;
		ElifootOptions.SaveOptions();
	}

	private SavedGamesShortInfo.SavedGame GetShortInfo()
	{
		List<SavedGamesShortInfo.CoachData> list = new List<SavedGamesShortInfo.CoachData>();
		foreach (Coach allHumanCoach in instance.allCoaches.GetAllHumanCoaches())
		{
			list.Add(new SavedGamesShortInfo.CoachData
			{
				coachName = allHumanCoach.Name,
				team = ((allHumanCoach.MyTeam != null) ? allHumanCoach.MyTeam.ShortName : "")
			});
		}
		SavedGamesShortInfo.Date date = new SavedGamesShortInfo.Date
		{
			year = DateTime.Now.Year,
			month = DateTime.Now.Month,
			day = DateTime.Now.Day,
			hour = DateTime.Now.Hour,
			minute = DateTime.Now.Minute,
			second = DateTime.Now.Second
		};
		return new SavedGamesShortInfo.SavedGame
		{
			coachesData = list,
			date = date
		};
	}

	public static string ActiveSaveGameVersion()
	{
		return CURRENT_SAVE_GAME_VERSION;
	}

	private IEnumerator TakeScreenshot(string screen_path)
	{
		yield return new WaitForEndOfFrame();
		int width = Screen.width;
		int height = Screen.height;
		Texture2D texture2D = new Texture2D(width, height, TextureFormat.RGB24, mipChain: false);
		texture2D.ReadPixels(new Rect(0f, 0f, width, height), 0, 0);
		texture2D.Apply();
		byte[] bytes = texture2D.EncodeToPNG();
		UnityEngine.Object.Destroy(texture2D);
		File.WriteAllBytes(screen_path, bytes);
		Debug.Log("Screenshot (" + screen_path + ") saved!");
	}

	private void Update()
	{
		if ((0u | ((Input.GetKey(KeyCode.Alpha1) && (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.RightControl))) ? 1u : 0u) | ((Input.GetKey(KeyCode.LeftControl) && Input.GetKey(KeyCode.H)) ? 1u : 0u) | ((Input.GetKey(KeyCode.LeftControl) && Input.GetKey(KeyCode.RightControl)) ? 1u : 0u)) != 0)
		{
			if (!hasScreenshot)
			{
				string path = $"{DateTime.Now.Year.ToString()}{DateTime.Now.Month.ToString().PadLeft(2, '0')}{DateTime.Now.Day.ToString().PadLeft(2, '0')}-{DateTime.Now.Hour.ToString().PadLeft(2, '0')}{DateTime.Now.Minute.ToString().PadLeft(2, '0')}{DateTime.Now.Second.ToString().PadLeft(2, '0')}.png";
				string screen_path = Path.Combine(Application.persistentDataPath, path);
				StartCoroutine(TakeScreenshot(screen_path));
				hasScreenshot = true;
			}
		}
		else
		{
			hasScreenshot = false;
		}
	}

	public static long SocialPointsValue(Coach.CoachEvent.CoachEventType eventType, Competition competition, params object[] parameters)
	{
		long num = 0L;
		switch (eventType)
		{
		case Coach.CoachEvent.CoachEventType.Resigned:
			num = SOCIAL_POINTS_RESIGN;
			break;
		case Coach.CoachEvent.CoachEventType.CompetitionWon:
			num = SOCIAL_POINTS_LEAGUE_WIN;
			break;
		case Coach.CoachEvent.CoachEventType.CompetitionSecond:
			num = SOCIAL_POINTS_LEAGUE_SECOND;
			break;
		case Coach.CoachEvent.CoachEventType.CompetitionThird:
			num = SOCIAL_POINTS_LEAGUE_THIRD;
			break;
		case Coach.CoachEvent.CoachEventType.DivisionUp:
			num = SOCIAL_POINTS_DIVISION_UP;
			break;
		case Coach.CoachEvent.CoachEventType.DivisionDown:
		case Coach.CoachEvent.CoachEventType.Excluded:
			num = SOCIAL_POINTS_DIVISION_DOWN;
			break;
		case Coach.CoachEvent.CoachEventType.BestScorer:
			num = SOCIAL_POINTS_BEST_STRIKER;
			break;
		case Coach.CoachEvent.CoachEventType.HomeWin:
			num = SOCIAL_POINTS_MATCH_HOME_WIN;
			break;
		case Coach.CoachEvent.CoachEventType.HomeDraw:
			num = SOCIAL_POINTS_MATCH_HOME_DRAW;
			break;
		case Coach.CoachEvent.CoachEventType.AwayWin:
			num = SOCIAL_POINTS_MATCH_AWAY_WIN;
			break;
		case Coach.CoachEvent.CoachEventType.AwayDraw:
			num = SOCIAL_POINTS_MATCH_AWAY_WIN;
			break;
		}
		if (competition != null)
		{
			num = (long)((float)num * 1f * competition.PrizeMultiplier());
		}
		return num;
	}

	public void UpdateCoachPointsInServer(bool newSeason, bool showInfoAndWarnings, bool forceSend)
	{
		if (!ElifootOptions.playWorldRanking)
		{
			return;
		}
		foreach (Coach allHumanCoach in allCoaches.GetAllHumanCoaches())
		{
			if (allHumanCoach.ShallSendSocialPoints(newSeason, forceSend))
			{
				SetCoachPointsForm.coachguid = allHumanCoach.MyGUID;
				SetCoachPointsForm.coachname = allHumanCoach.Name;
				SetCoachPointsForm.coachpoints = allHumanCoach.CurrentSocialPoints();
				SetCoachPointsForm.gameId = GameProperties.gameId;
				if (allHumanCoach.MyTeam != null)
				{
					SetCoachPointsForm.coachteam = allHumanCoach.MyTeam.Name;
				}
				else
				{
					SetCoachPointsForm.coachteam = "";
				}
				if (showInfoAndWarnings)
				{
					ScreenController.instance.ShowLoadingView("WAIT_CONNECT_SERVER");
				}
				string url = ElifootUrlManager.GetCommandUrl("setcoachpoints") + "&nocrypt=1&nocs=1";
				StartCoroutine(Util.SendPointsToServer(this, url, SetCoachPointsForm, allHumanCoach, SuccessSendingPoints, ErrorSendingsPoints));
			}
		}
		void ErrorSendingsPoints(Coach coach2)
		{
			if (showInfoAndWarnings)
			{
				ScreenController.instance.HideLoadingView();
				ScreenController.instance.ShowDialogPopUp("MENU_SEND_RANKING_POINTS", "RANKING_ERROR_SEND_POINTS", null);
			}
			coach2.errorSendingPoints = true;
		}
		void SuccessSendingPoints(Coach coach2)
		{
			if (showInfoAndWarnings)
			{
				ScreenController.instance.HideLoadingView();
				ScreenController.instance.ShowDialogPopUp("RANKING_SEND_POINTS_SUCESS_TITLE", "RANKING_SEND_POINTS_SUCESS_DESC", null);
			}
			coach2.errorSendingPoints = false;
			coach2.SocialPointsSent();
		}
	}

	public string Encode(string username)
	{
		string text = "";
		int num = 0;
		int num2 = 0;
		string text2 = "";
		string text3 = "";
		for (num = 0; num <= 25; num++)
		{
			text2 += (char)(65 + num);
		}
		for (num = 0; num <= 25; num++)
		{
			text2 += (char)(97 + num);
		}
		for (num = 0; num <= 9; num++)
		{
			text2 += Convert.ToString(num);
		}
		text3 = text2.Substring(16, text2.Length - 16) + text2.Substring(0, 16);
		for (num = 0; num < username.Length; num++)
		{
			num2 = text2.IndexOf(username.Substring(num, 1));
			text = ((num2 >= 0) ? (text + text3.Substring(num2, 1)) : (text + username.Substring(num, 1)));
		}
		return text;
	}

	public async void SetLanguage(string language = null)
	{
		if (language != null)
		{
			LanguageController.instance.SetLanguage(language);
		}
		Util.UpdateLanguage();
		allCompetitions.LanguageChanged();
		allDivisions.LanguageChanged();
		allCountries.LanguageChanged();
	}
}
