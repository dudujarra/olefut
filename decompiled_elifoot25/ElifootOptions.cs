using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using UnityEngine;

public class ElifootOptions : MonoBehaviour
{
	public enum Flags
	{
		confirmQuit,
		askChooseInitialTeam,
		showCannotChooseInitialTeam
	}

	public enum ElifootServer
	{
		Parallels,
		Localhost,
		Development,
		Staging,
		Production
	}

	public enum SimulationMode
	{
		Off,
		Partial,
		Total
	}

	public enum SimulationFlag
	{
		TeamManagement,
		Match,
		Invitations,
		Other
	}

	[StructLayout(LayoutKind.Sequential, Size = 1)]
	public struct extras
	{
		public static bool coachUnion;

		public static bool premiumVersion;

		public static bool sponsorship;

		public static bool vipVersion;
	}

	public class InApps
	{
		public bool hasPurchases;

		private List<string> availableSkus;

		private static DateTime INAPP_LAST_BUY_TIME_DEFAULT = new DateTime(2019, 1, 1);

		private static DateTime inAppLastBuyTime = INAPP_LAST_BUY_TIME_DEFAULT;

		private static PermissionLevel INAPP_LAST_BUY_TIME_PERMISSION = PermissionLevel.L0_None;

		private static DateTime INAPP_LAST_SUGGEST_TIME_DEFAULT = new DateTime(2019, 1, 1);

		private static DateTime inAppLastSuggestTime = INAPP_LAST_SUGGEST_TIME_DEFAULT;

		private static PermissionLevel INAPP_LAST_SUGGEST_TIME_PERMISSION = PermissionLevel.L0_None;

		public InApps()
		{
			hasPurchases = false;
			availableSkus = new List<string>();
			Load();
		}

		public void Save()
		{
			string value = string.Join(",", availableSkus.ToArray());
			PlayerPrefs.SetString("availableInApps", value);
		}

		public void Add(string sku)
		{
			if (!availableSkus.Contains(sku))
			{
				availableSkus.Add(sku);
				OnChangeSku(sku);
				Save();
			}
		}

		public void Delete(string sku)
		{
			availableSkus.Remove(sku);
			OnChangeSku(sku);
			Save();
		}

		public void DeleteAll()
		{
			availableSkus.Clear();
			PlayerPrefs.DeleteKey("availableInApps");
			InAppPurchases.ExternalItemConfig[] array = InAppPurchases.EXTERNAL_ITEMS();
			foreach (InAppPurchases.ExternalItemConfig externalItemConfig in array)
			{
				OnChangeSku(externalItemConfig.sku);
			}
		}

		private void OnChangeSku(string sku)
		{
			if (InAppPurchases.instance != null)
			{
				switch (InAppPurchases.instance.GetGameItemType(sku))
				{
				case InAppPurchases.GameItemType.Union:
					OnChangeSkuUnion();
					break;
				case InAppPurchases.GameItemType.Premium:
					OnChangeSkuPremium();
					break;
				case InAppPurchases.GameItemType.Sponsorship:
					OnChangeSkuSponsorship();
					break;
				case InAppPurchases.GameItemType.Vip:
					OnChangeSkuVIP();
					break;
				}
			}
		}

		private void OnChangeSkuUnion()
		{
			extras.coachUnion = HasAvailableInApp(InAppPurchases.GameItemType.Union);
		}

		private void OnChangeSkuSponsorship()
		{
			extras.sponsorship = HasAvailableInApp(InAppPurchases.GameItemType.Sponsorship);
		}

		private void OnChangeSkuVIP()
		{
			extras.vipVersion = HasAvailableInApp(InAppPurchases.GameItemType.Vip) || GamePermissions.upgradeVip;
			Registration.UpgradeRegistrationLevel(GamePermissions.GetVIPAccessLevel());
			GamePermissions.ComputeRegLevel();
		}

		private void OnChangeSkuPremium()
		{
			extras.premiumVersion = HasAvailableInApp(InAppPurchases.GameItemType.Premium) || GamePermissions.upgradePremium;
			Registration.UpgradeRegistrationLevel(GamePermissions.GetPremiumAccessLevel());
			GamePermissions.ComputeRegLevel();
		}

		public void Load()
		{
			string text = PlayerPrefs.GetString("availableInApps", null);
			if (string.IsNullOrEmpty(text))
			{
				return;
			}
			foreach (string item in text.Split(',').ToList())
			{
				Add(item);
			}
		}

		public bool HasAvailableInApp(string sku)
		{
			return availableSkus.Contains(sku);
		}

		public bool HasAvailableInApp(InAppPurchases.GameItemType gameItemType)
		{
			InAppPurchases.ExternalItemConfig[] array = InAppPurchases.EXTERNAL_ITEMS();
			foreach (InAppPurchases.ExternalItemConfig externalItemConfig in array)
			{
				if (externalItemConfig.gameItemType == gameItemType && availableSkus.Contains(externalItemConfig.sku))
				{
					return true;
				}
			}
			return false;
		}

		public void PurchaseSuccess()
		{
			hasPurchases = true;
			inAppLastBuyTime = DateTime.Now;
			SaveOptions();
		}

		private TimeSpan TimeSinceLastBuy()
		{
			return DateTime.UtcNow - inAppLastBuyTime;
		}

		private TimeSpan TimeSinceLastSuggest()
		{
			return DateTime.UtcNow - inAppLastSuggestTime;
		}

		public bool ShallSuggestPurchase()
		{
			int num = 0;
			_ = DateTime.UtcNow;
			TimeSpan timeSpan = TimeSinceLastBuy();
			TimeSpan timeSpan2 = TimeSinceLastSuggest();
			if (timeSpan.TotalMinutes < 5.0 && timeSpan2.TotalMinutes > 2.0)
			{
				num = 1;
			}
			else if (timeSpan.TotalMinutes < 10.0 && timeSpan2.TotalMinutes > 5.0)
			{
				num = 2;
			}
			else if (timeSpan.TotalMinutes < 15.0 && timeSpan2.TotalMinutes > 10.0)
			{
				num = 3;
			}
			else if (timeSpan.TotalDays > 1.0 && timeSpan2.TotalDays > 1.0)
			{
				num = 4;
			}
			else if (timeSpan.TotalDays > 2.0 && timeSpan2.TotalDays > 2.0)
			{
				num = 5;
			}
			else if (timeSpan.TotalDays > 5.0 && timeSpan2.TotalDays > 5.0)
			{
				num = 6;
			}
			else if (timeSpan.TotalDays > 10.0 && timeSpan2.TotalDays > 10.0)
			{
				num = 7;
			}
			else if (timeSpan.TotalDays > 30.0 && timeSpan2.TotalDays > 30.0)
			{
				num = 8;
			}
			else if (timeSpan.TotalDays > 60.0 && timeSpan2.TotalDays > 60.0)
			{
				num = 9;
			}
			return num > 0;
		}

		public void PurchaseSuggested()
		{
			inAppLastSuggestTime = DateTime.UtcNow;
			SaveOptions();
		}

		public void ManageOptions(Util.ManageOption mode, ref ListOfParameters listOfParameters)
		{
			try
			{
				long num = inAppLastBuyTime.ToFileTimeUtc();
				num = (long)Util.ManageOneOption(mode, "inAppLastBuyTime", null, null, null, num, INAPP_LAST_BUY_TIME_DEFAULT, INAPP_LAST_BUY_TIME_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
				inAppLastBuyTime = DateTime.FromFileTimeUtc(num);
			}
			catch
			{
				inAppLastBuyTime = INAPP_LAST_BUY_TIME_DEFAULT;
			}
			try
			{
				long num2 = inAppLastSuggestTime.ToFileTimeUtc();
				num2 = (long)Util.ManageOneOption(mode, "inAppLastSuggestTime", null, null, null, num2, INAPP_LAST_SUGGEST_TIME_DEFAULT, INAPP_LAST_SUGGEST_TIME_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
				inAppLastSuggestTime = DateTime.FromFileTimeUtc(num2);
			}
			catch
			{
				inAppLastSuggestTime = INAPP_LAST_SUGGEST_TIME_DEFAULT;
			}
			inApps.hasPurchases = (bool)Util.ManageOneOption(mode, "hasInAppPurchases", "ID:OPTIONS_HAS_INAPP_PURCHASES", "ID:OPTIONS_INAPPS", null, inApps.hasPurchases, false, HAS_INAPP_PURCHASES_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditableAuthor);
		}
	}

	public static readonly Dictionary<ElifootServer, string> serverRoot = new Dictionary<ElifootServer, string>
	{
		{
			ElifootServer.Parallels,
			"http://10.211.55.4"
		},
		{
			ElifootServer.Localhost,
			"http://localhost"
		},
		{
			ElifootServer.Development,
			"https://dev1987.elifoot.net"
		},
		{
			ElifootServer.Staging,
			"https://staging.elifoot.com"
		},
		{
			ElifootServer.Production,
			"https://www.elifoot.com"
		}
	};

	public static bool useElifootServerParallels;

	public static bool useElifootServerLocalhost;

	public static bool useElifootServerDevelopment;

	public static bool useElifootServerStaging;

	public static bool useElifootServerProduction;

	public static int[] lastChoiceTeamsPerDivision;

	public static string lastChoiceLeague;

	public static string mainMenuInfoTextCaption;

	public static string mainMenuInfoTextLink;

	public static bool mainMenuShowAdButton;

	public static string mainMenuAdUrl;

	public static ElifootServer ELIFOOT_SERVER_DEFAULT = ElifootServer.Production;

	public static PermissionLevel SHOW_ELIFOOT_SERVER_PERMISSION = PermissionLevel.L9_Author;

	public static ElifootServer elifootServer = ELIFOOT_SERVER_DEFAULT;

	public static bool SHOW_STORE_APTOIDE_WARING_DEFAULT = true;

	public static PermissionLevel SHOW_STORE_APTOIDE_WARING_PERMISSION = PermissionLevel.L0_None;

	public static bool showStoreAptoideWarning = SHOW_STORE_APTOIDE_WARING_DEFAULT;

	public static bool updateAvailable;

	public static bool wonPromoCoins;

	public static int totalCoins;

	public static int TOTAL_COINS_DEFAULT;

	public static PermissionLevel TOTAL_COINS_PERMISSION = GamePermissions.Permissions.coins;

	public static bool userLikesBonusAds;

	public static string savedLanguages;

	private const bool CHOOSE_INITIAL_TEAM_DEFAULT = false;

	private static PermissionLevel CHOOSE_INITIAL_TEAM_PERMISSION = GamePermissions.Permissions.chooseInitialTeam;

	public static bool chooseInitialTeam = false;

	private const SimulationMode SIMULATION_MODE_DEFAULT = SimulationMode.Off;

	private static PermissionLevel SIMULATION_MODE_PERMISSION = GamePermissions.Permissions.simulation;

	public static SimulationMode simulationMode = SimulationMode.Off;

	public static Dictionary<SimulationFlag, bool> simulationFlags = new Dictionary<SimulationFlag, bool>();

	private const bool SIMULATION_STOP_BEFORE_LAST_MATCH_DEFAULT = false;

	private static PermissionLevel SIMULATION_STOP_BEFORE_LAST_MATCH_PERMISSION = GamePermissions.Permissions.simulation;

	public static bool simulationStopBeforeLastMatch = false;

	public const bool SIMULATION_SKIP_COACH_NEWS_DISPLAY_DEFAULT = false;

	public static PermissionLevel SIMULATION_SKIP_COACH_NEWS_DISPLAY_PERMISSION = GamePermissions.Permissions.simulation;

	public static bool simulationSkipCoachNewsDisplay = false;

	public const int NUM_DIVISIONS_LEAGUE_MAX = 10;

	public const int NUM_GROUPS_REGIONAL_LEAGUE_MAX = 2;

	public const int NUM_DIVISIONS_MIN_TESTER = 2;

	private const int NUM_DIVISIONS_MIN_USER = 4;

	public static int[] numDivisionsLeagueMin;

	public static PermissionLevel NUM_DIVISIONS_PERMISSION = GamePermissions.Permissions.numDivisionsPermission;

	public static int[] numDivisionsLeagueMax;

	private const int NUM_AVAILABLE_PLAYERS_DEFAULT = 50;

	public static PermissionLevel NUM_AVAILABLE_PLAYERS_PERMISSION = GamePermissions.Permissions.numAvailablePlayers;

	private const int NUM_AVAILABLE_PLAYERS_MIN = 7;

	private const int NUM_AVAILABLE_PLAYERS_MAX = 50;

	public static int numAvailablePlayersMax = 50;

	private const int PLAY_LEAGUE_ROUNDS_PER_SEASON_DEFAULT = 38;

	public static PermissionLevel PLAY_LEAGUE_ROUNDS_PER_SEASON_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	private const int PLAY_LEAGUE_ROUNDS_PER_SEASON_MIN = 1;

	private const int PLAY_LEAGUE_ROUNDS_PER_SEASON_MAX = 38;

	public static int playLeagueRoundsPerSeason = 38;

	private const bool REPEAT_SAME_CALENDAR_DAY_DEFAULT = false;

	public static PermissionLevel REPEAT_SAME_CALENDAR_DAY_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	public static bool repeatSameCalendarDay = false;

	private const bool PLAY_LEAGUE_DEFAULT = true;

	public static PermissionLevel PLAY_LEAGUE_PERMISSION = GamePermissions.Permissions.skipLeague;

	public static bool playLeague = true;

	private const int GOAL_FREQUENCY_DEFAULT = 4;

	private const int GOAL_FREQUENCY_MIN = 0;

	private const int GOAL_FREQUENCY_MAX = 10;

	public static PermissionLevel GOAL_FREQUENCY_PERMISSION = GamePermissions.Permissions.developmentOptions;

	public static int goalFrequency = 4;

	private const bool HUGE_TEST_FREE_SPACE_REQUIRED_DEFAULT = false;

	public static PermissionLevel HUGE_TEST_FREE_SPACE_REQUIRED_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	public static bool hugeTestFreeSpaceRequired = false;

	private const int PENALTY_FREQUENCY_DEFAULT = 3;

	private const int PENALTY_FREQUENCY_MIN = 0;

	private const int PENALTY_FREQUENCY_MAX = 20;

	public static PermissionLevel PENALTY_FREQUENCY_PERMISSION = GamePermissions.Permissions.testOptions;

	public static int penaltyFrequency = 3;

	public static bool penaltiesShootoutEnabled = true;

	private const bool PENALTIES_ENABLED_DEFAULT = true;

	public static PermissionLevel PENALTIES_ENABLED_PERMISSION = GamePermissions.Permissions.testOptions;

	public static bool penaltiesShootoutAlwaysView = false;

	private const bool PENALTIES_SHOOTOUT_ALWAYSVIEW_DEFAULT = false;

	public static PermissionLevel PENALTIES_SHOOTOUT_ALWAYSVIEW_PERMISSION = GamePermissions.Permissions.testOptions;

	private const int INJURY_FREQUENCY_DEFAULT = 3;

	private const int INJURY_FREQUENCY_MIN = 0;

	private const int INJURY_FREQUENCY_MAX = 20;

	public static PermissionLevel INJURY_FREQUENCY_PERMISSION = GamePermissions.Permissions.testOptions;

	public static int injuryFrequency = 3;

	public const bool INJURY_ONLY_IF_COACH_HUMAN_DEFAULT = false;

	public static PermissionLevel INJURY_ONLY_IF_COACH_HUMAN_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	public static bool injuryOnlyIfCoachHuman = false;

	private const int RED_CARD_FREQUENCY_DEFAULT = 3;

	private const int RED_CARD_FREQUENCY_MIN = 0;

	private const int RED_CARD_FREQUENCY_MAX = 20;

	public static PermissionLevel RED_CARD_FREQUENCY_PERMISSION = GamePermissions.Permissions.testOptions;

	public static int redCardFrequency = 3;

	public const bool RED_CARD_ONLY_IF_COACH_HUMAN_DEFAULT = false;

	public static PermissionLevel RED_CARD_ONLY_IF_COACH_HUMAN_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	public static bool redCardOnlyIfCoachHuman = false;

	public static int yellowCardFrequency = 3;

	private const int YELLOW_CARD_FREQUENCY_DEFAULT = 3;

	private const int YELLOW_CARD_FREQUENCY_MIN = 0;

	private const int YELLOW_CARD_FREQUENCY_MAX = 20;

	public static PermissionLevel YELLOW_CARD_FREQUENCY_PERMISSION = GamePermissions.Permissions.testOptions;

	public const bool YELLOW_CARD_ONLY_IF_COACH_HUMAN_DEFAULT = false;

	public static PermissionLevel YELLOW_CARD_ONLY_IF_COACH_HUMAN_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	public static bool yellowCardOnlyIfCoachHuman = false;

	public const int MATCH_SPEED_HUMAN_DEFAULT = 5;

	private const int MATCH_SPEED_HUMAN_MIN = 1;

	public const int MATCH_SPEED_HUMAN_MAX = 30;

	private const bool ALLOW_HIGH_SPEED_HUMAN = false;

	public static PermissionLevel MATCH_SPEED_HUMAN_PERMISSION = GamePermissions.Permissions.matchSpeedHuman;

	public static int matchSpeedHuman = 5;

	private const int MATCH_SPEED_NO_HUMAN_DEFAULT = 30;

	private const int MATCH_SPEED_NO_HUMAN_MIN = 1;

	public const int MATCH_SPEED_NO_HUMAN_MAX = 30;

	private const bool ALLOW_HIGH_SPEED_NO_HUMAN = true;

	public static PermissionLevel MATCH_SPEED_NO_HUMAN_PERMISSION = GamePermissions.Permissions.matchSpeedNoHuman;

	public static int matchSpeedNoHuman = 30;

	private const int MATCH_SPEED_SIMULATION_DEFAULT = 30;

	private const int MATCH_SPEED_SIMULATION_MIN = 1;

	public const int MATCH_SPEED_SIMULATION_MAX = 50;

	public static bool ALLOW_HIGH_SPEED_SIMULATION = true;

	public static PermissionLevel MATCH_SPEED_SIMULATION_PERMISSION = GamePermissions.Permissions.matchSpeedSimulation;

	public static int matchSpeedSimulation = 30;

	public const int PENALTIES_SHOOTOUT_SPEED_PRESENT_DEFAULT = 1;

	public const int PENALTIES_SHOOTOUT_SPEED_PRESENT_MAX = 10;

	public const int PENALTIES_SHOOTOUT_SPEED_PRESENT_MIN = 1;

	public static PermissionLevel PENALTIES_SHOOTOUT_SPEED_PRESENT_PERMISSION = GamePermissions.Permissions.developmentOptions;

	public static int penaltiesShootoutSpeedPresent = 1;

	public const int PENALTIES_SHOOTOUT_SPEED_NOT_PRESENT_DEFAULT = 4;

	public const int PENALTIES_SHOOTOUT_SPEED_NOT_PRESENT_MAX = 10;

	public const int PENALTIES_SHOOTOUT_SPEED_NOT_PRESENT_MIN = 1;

	public static PermissionLevel PENALTIES_SHOOTOUT_SPEED_NOT_PRESENT_PERMISSION = GamePermissions.Permissions.developmentOptions;

	public static int penaltiesShootoutSpeedNotPresent = 4;

	public const int PENALTIES_SHOOTOUT_SPEED_SIMULATION_DEFAULT = 10;

	public const int PENALTIES_SHOOTOUT_SPEED_SIMULATION_MAX = 10;

	public const int PENALTIES_SHOOTOUT_SPEED_SIMULATION_MIN = 1;

	public static PermissionLevel PENALTIES_SHOOTOUT_SPEED_SIMULATION_PERMISSION = GamePermissions.Permissions.developmentOptions;

	public static int penaltiesShootoutSpeedSimulation = 10;

	private const bool SUBSTITUTIONS_AT_HALFTIME_DEFAULT = true;

	public static PermissionLevel SUBSTITUTIONS_AT_HALFTIME_PERMISSION = GamePermissions.Permissions.substitutionsAtHalfTime;

	public static bool substitutionsAtHalfTime = true;

	public static PermissionLevel SOUND_PERMISSION = GamePermissions.Permissions.sound;

	private const bool SOUND_ENABLED_DEFAULT = true;

	private const int SOUND_EFFECTS_VOLUME_DEFAULT = 100;

	private const int SOUND_MUSIC_VOLUME_DEFAULT = 40;

	public const bool MATCH_EVENTS_AUDIO_NOTIFICATIONS_DEFAULT = true;

	public const bool MATCH_EVENTS_SOUNDS_DEFAULT = true;

	public const bool SCREEN_ROTATION_AUTO_DEFAULT = true;

	public static bool screenRotationAuto = true;

	public const bool SCREEN_ROTATION_PORTRAIT_UP_DEFAULT = false;

	public static bool screenRotationPortraitUp = false;

	public const bool SCREEN_ROTATION_PORTRAIT_DOWN_DEFAULT = false;

	public static bool screenRotationPortraitDown = false;

	public const bool SCREEN_ROTATION_LANDSCAPE_LEFT_DEFAULT = false;

	public static bool screenRotationLandscapeLeft = false;

	public const bool SCREEN_ROTATION_LANDSCAPE_RIGHT_DEFAULT = false;

	public static bool screenRotationLandscapeRight = false;

	private const bool VIBRATION_ENABLED_DEFAULT = false;

	public static PermissionLevel VIBRATION_ENABLED_PERMISSION = GamePermissions.Permissions.vibration;

	private const bool REMOVE_REGISTRATION_DEFAULT = false;

	private const bool RESET_DAILY_ADS_COUNTER_DEFAULT = false;

	public static PermissionLevel RESET_DAILY_ADS_COUNTER_PERMISSION = PermissionLevel.L9_Author;

	public static PermissionLevel REMOVE_RESGISTRATIONS_PERMISSION = PermissionLevel.L0_None;

	private static bool removeRegistration = false;

	private const int MATCH_DURATION_DEFAULT = 90;

	public static PermissionLevel MATCH_DURATION_PERMISSION = GamePermissions.Permissions.matchDuration;

	private const int MATCH_DURATION_MIN = 20;

	private const int MATCH_DURATION_MAX = 90;

	public static int matchDuration = 90;

	private const bool SHOW_MATCH_RESUME_DEFAULT = true;

	public static PermissionLevel SHOW_MATCH_RESUME_PERMISSION = PermissionLevel.L0_None;

	public static bool showMatchResume = true;

	private const bool KEEP_LOCAL_NAME_CHANGES_DEFAULT = true;

	public static PermissionLevel KEEP_LOCAL_NAME_CHANGES_PERMISSION = PermissionLevel.L0_None;

	public static bool keepLocalNameChanges = true;

	private const bool DUMP_FILES_DEFAULT = false;

	private const bool WRITE_DUMP_FILES_DEFAULT = false;

	private const bool DELETE_OLD_DUMP_FILES_DEFAULT = true;

	private const int DELETE_DUMP_FILES_OLDER_THAN_MIN = 0;

	private const int DELETE_DUMP_FILES_OLDER_THAN_MAX = 30;

	private const int DELETE_DUMP_FILES_OLDER_THAN_DEFAULT = 30;

	public static PermissionLevel DUMP_FILES_USAGE_PERMISION = GamePermissions.Permissions.dumpFiles;

	private const int RETRIEVEINFO_LAST_TIMESTAMP_DEFAULT = 0;

	public static PermissionLevel RETRIEVEINFO_LAST_TIMESTAMP_PERMISSION = GamePermissions.Permissions.retrieveInfo;

	public static int retrieveInfoLastTimestamp = 0;

	private const int RETRIEVEINFO_INTERVAL_DEFAULT = 1440;

	public static PermissionLevel RETRIEVEINFO_INTERVAL_PERMISSION = GamePermissions.Permissions.retrieveInfoInterval;

	private const int RETRIEVEINFO_INTERVAL_MIN = 0;

	private const int RETRIEVEINFO_INTERVAL_MAX = 1440;

	public static int retrieveInfoInterval = 1440;

	public const bool FIRE_COACHES_DEFAULT = true;

	public static PermissionLevel FIRE_COACHES_PERMISSION = GamePermissions.Permissions.fireCoaches;

	public static bool fireCoaches = true;

	public const int MAX_INVITATIONS_PER_MATCH_DEFAULT = 3;

	public static PermissionLevel MAX_INVITATIONS_PER_MATCH_PERMISSION = GamePermissions.Permissions.testOptions;

	public static int maxInvitaionsPerMatch = 3;

	public const int MATCHES_TO_FIRE_COACH_DEFAULT = 10;

	public static PermissionLevel MATCHES_TO_FIRE_COACH_PERMISSION = GamePermissions.Permissions.fireCoaches;

	public const int MATCHES_TO_FIRE_COACH_MIN = 0;

	public const int MATCHES_TO_FIRE_COACH_MAX = 20;

	public static int matchesToFireCoachHuman = 10;

	public static int matchesToFireCoachComputer = 10;

	public const bool ALL_LISTS_MAX_SIZE_DEFAULT = false;

	public static PermissionLevel ALL_LISTS_MAX_SIZE_PERMISSION = GamePermissions.Permissions.developmentOptions;

	public static bool allListsMaxSize = false;

	public const bool HUMAN_COACH_SUPER_POWER_DEFAULT = false;

	public static PermissionLevel HUMAN_COACH_SUPER_POWER_PERMISSION = GamePermissions.Permissions.developmentOptions;

	public static bool humanCoachSuperPower = false;

	public static int VIDEO_ADS_AUTO_INTERVAL_MIN = 1;

	public static int VIDEO_ADS_AUTO_INTERVAL_MAX = 100;

	public static int VIDEO_ADS_AUTO_INTERVAL_DEFAULT = 30;

	public static PermissionLevel VIDEO_ADS_AUTO_INTERVAL_PERMISSION = GamePermissions.Permissions.testOptions;

	public const bool AUTOSAVE_DEFAULT = true;

	public const int AUTOSAVE_MATCHES_FREQUENCY_DEFAULT = 5;

	public static PermissionLevel AUTOSAVE_PERMISSION = GamePermissions.Permissions.autoSave;

	public static bool autoSave = true;

	public const bool AUTOSAVE_WARNONERROR_DEFAULT = true;

	public static PermissionLevel AUTOSAVE_WARNONERROR_PERMISSION = GamePermissions.Permissions.autoSave;

	public static bool autoSaveWarnOnError = true;

	public static PermissionLevel AUTOSAVE_FREQUENCY_PERMISSION = GamePermissions.Permissions.autoSave;

	public const int AUTOSAVE_MATCHES_FREQUENCY_MIN = 1;

	public const int AUTOSAVE_MATCHES_FREQUENCY_MAX = 10;

	public static int autoSaveMatchesFrequency = 5;

	public const bool AUTOSAVE_ON_PAUSE_DEFAULT = false;

	public static PermissionLevel AUTOSAVE_ON_PAUSE_PERMISSION = GamePermissions.Permissions.autoSave;

	public static bool autoSaveOnPause = false;

	public const bool ALL_COACHES_HUMAN_DEFAULT = false;

	public static PermissionLevel ALL_COACHES_HUMAN_PERMISSION = GamePermissions.Permissions.allCoachesHuman;

	public static bool allCoachesHuman = false;

	public static int RANKING_LIMIT_RECORDS_MIN = 0;

	public static int RANKING_LIMIT_RECORDS_MAX = 200;

	public static int RANKING_LIMIT_RECORDS_DEFAULT = 50;

	public static PermissionLevel RANKING_LIMIT_RECORDS_PERMISSION = GamePermissions.Permissions.advancedTestOptions;

	public static int rankingLimitRecords = RANKING_LIMIT_RECORDS_DEFAULT;

	public static string appUpdateVersionDiscarded;

	public static string appUpdateVersionIgnored;

	public static string allRecordedCoachNames = "";

	public static string allRecordedCoachGuids = "";

	public static string allRecordedCoachEmails = "";

	public static string allRecordedCoachPasswords = "";

	public static bool playWorldRanking = false;

	public static string lastGameCoachGuids = "";

	public static string followGuidsToSendToServer = "";

	public static string unfollowGuidsToSendToServer = "";

	public static bool deleteOfflineRanking = false;

	public static string pathSharingTeams;

	public static string pathSharingScreenshots;

	public static bool includeLogosOnPackages = true;

	public static bool playRegionalLeagues = true;

	public static bool playInternationalLeagues = true;

	public static bool playSuperLeague = true;

	public static string newGameCountries;

	public static bool deleteDownloadedFiles = false;

	public static bool deleteAdsViewedInfo = false;

	public static bool showDownloadedFiles = true;

	public static int fileSortFieldEnum = 0;

	public static int fileSortOrderEnum = 0;

	public static bool resetDailyAdsCounter;

	public const bool PAUSE_ON_TASK_SWITCH_DEFAULT = false;

	public static PermissionLevel PAUSE_ON_TASK_SWITCH_PERMISSION = PermissionLevel.L0_None;

	public const bool HAS_INAPP_PURCHASES_DEFAULT = false;

	public static PermissionLevel HAS_INAPP_PURCHASES_PERMISSION = PermissionLevel.L0_None;

	public static InApps inApps = new InApps();

	public static void Initialize()
	{
		lastChoiceTeamsPerDivision = new int[Enum.GetValues(typeof(CompetitionType)).Length];
		lastChoiceTeamsPerDivision.InitArray(8);
		numDivisionsLeagueMin = new int[Enum.GetValues(typeof(CompetitionType)).Length];
		numDivisionsLeagueMax = new int[Enum.GetValues(typeof(CompetitionType)).Length];
		numDivisionsLeagueMin.InitArray(4);
		numDivisionsLeagueMax.InitArray(10);
		pathSharingTeams = PlayerPrefs.GetString("pathSharingTeams", "");
	}

	public static bool GetFlag(Flags flag, bool defautValue = false)
	{
		return Convert.ToBoolean(PlayerPrefs.GetInt(FlagString(flag), Convert.ToInt16(defautValue)));
	}

	public static void SetFlag(Flags flag, bool newValue)
	{
		string key = FlagString(flag);
		int value = Convert.ToInt16(newValue);
		PlayerPrefs.SetInt(key, value);
	}

	public static void DeleteFlag(Flags flag)
	{
		PlayerPrefs.DeleteKey(FlagString(flag));
	}

	public static string GetFlagText(Flags flag)
	{
		return LanguageController.instance.Get_Translation(FlagString(flag).ToUpper());
	}

	private static string FlagString(Flags flag)
	{
		return $"flag_{flag.ToString()}";
	}

	private static void DeleteCachedFlags()
	{
		foreach (Flags value in Enum.GetValues(typeof(Flags)))
		{
			DeleteFlag(value);
		}
	}

	public static void ReadOptions()
	{
		inApps.Load();
		ManageOptions(Util.ManageOption.ReadFromCache);
	}

	public static void SaveOptions()
	{
		inApps.Save();
		ManageOptions(Util.ManageOption.WriteToCache);
	}

	public static void ManageOptions(Util.ManageOption mode)
	{
		ListOfParameters listOfParameters = null;
		ManageOptions(mode, ref listOfParameters);
	}

	public static void ManageDivisionOptions(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		int num = 0;
		for (int i = 0; i < numDivisionsLeagueMax.Length; i++)
		{
			num = numDivisionsLeagueMax[i];
			num = (int)Util.ManageOneOption(mode, $"numDivisionsMax-{i}", "ID:OPTIONS_NUM_DIVISIONS_MAX", "ID:OPTIONS_LEAGUE", null, num, 10, NUM_DIVISIONS_PERMISSION, ref listOfParameters, numDivisionsLeagueMin[i], 10, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditableTester);
			numDivisionsLeagueMax[i] = num;
		}
		foreach (CompetitionType value in Enum.GetValues(typeof(CompetitionType)))
		{
			int num2 = lastChoiceTeamsPerDivision[(int)value];
			num2 = (int)Util.ManageOneOption(mode, "lastChoiceTeamsPerDivision " + value, null, null, null, num2, 8, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
			lastChoiceTeamsPerDivision[(int)value] = num2;
		}
	}

	public static void ManageLastChoiceLeague(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		lastChoiceLeague = (string)Util.ManageOneOption(mode, "lastChoiceLeague", null, null, null, lastChoiceLeague, null, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
	}

	public static void ManageOptions(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		inApps.ManageOptions(mode, ref listOfParameters);
		includeLogosOnPackages = (bool)Util.ManageOneSystemOption(mode, "includeLogosOnPackages", includeLogosOnPackages, true, ref listOfParameters);
		showDownloadedFiles = (bool)Util.ManageOneSystemOption(mode, "showRecordedFiles", showDownloadedFiles, true, ref listOfParameters);
		fileSortFieldEnum = (int)Util.ManageOneSystemOption(mode, "fileSortFieldEnum", fileSortFieldEnum, 0, ref listOfParameters);
		fileSortOrderEnum = (int)Util.ManageOneSystemOption(mode, "fileSortOrderEnum", fileSortOrderEnum, 0, ref listOfParameters);
		pathSharingTeams = (string)Util.ManageOneSystemOption(mode, "pathSharingTeams", pathSharingTeams, "", ref listOfParameters);
		pathSharingScreenshots = (string)Util.ManageOneSystemOption(mode, "pathSharingScreenshots", pathSharingScreenshots, "", ref listOfParameters);
		updateAvailable = (bool)Util.ManageOneOption(mode, "updateAvailable2", null, null, null, updateAvailable, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		wonPromoCoins = (bool)Util.ManageOneOption(mode, "wonPromoCoins", null, null, null, wonPromoCoins, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		totalCoins = (int)Util.ManageOneOption(mode, "totalCoins", null, null, null, totalCoins, TOTAL_COINS_DEFAULT, TOTAL_COINS_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		userLikesBonusAds = (bool)Util.ManageOneOption(mode, "userLikesBonusAds", null, null, null, userLikesBonusAds, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		showStoreAptoideWarning = (bool)Util.ManageOneOption(mode, "showStoreAptoideWarning", null, null, null, showStoreAptoideWarning, SHOW_STORE_APTOIDE_WARING_DEFAULT, SHOW_STORE_APTOIDE_WARING_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
		foreach (SimulationMode value2 in Enum.GetValues(typeof(SimulationMode)))
		{
			bool flag = simulationMode == value2;
			if ((bool)Util.ManageOneOption(mode, "simulationMode" + value2, $"ID:OPTIONS_SIMULATION_MODE_{value2.ToString().ToUpper()}", "ID:OPTIONS_SIMULATION", "ID:OPTIONS_SIMULATION_MODE", flag, false, SIMULATION_MODE_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.EditablePublic, EliParameterPermissions.RadioButton))
			{
				simulationMode = value2;
			}
		}
		foreach (SimulationFlag value3 in Enum.GetValues(typeof(SimulationFlag)))
		{
			bool value = false;
			simulationFlags.TryGetValue(value3, out value);
			value = (bool)Util.ManageOneOption(mode, "simulationFlag" + value3, $"ID:OPTIONS_SIMULATION_FLAG_{value3.ToString().ToUpper()}", "ID:OPTIONS_SIMULATION", "ID:OPTIONS_SIMULATION_FLAGS", value, false, SIMULATION_MODE_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.EditablePublic);
			simulationFlags[value3] = value;
		}
		simulationStopBeforeLastMatch = (bool)Util.ManageOneOption(mode, "simulationStopBeforeLastMatch", "ID:OPTIONS_SIMULATION_STOP_BEFORE_LAST_MATCH", "ID:OPTIONS_SIMULATION", "ID:OPTIONS_SIMULATION_ADVANCED", simulationStopBeforeLastMatch, false, SIMULATION_STOP_BEFORE_LAST_MATCH_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		simulationSkipCoachNewsDisplay = (bool)Util.ManageOneOption(mode, "simulationSkipCoachNewsDisplay", "ID:OPTIONS_SIMULATION_SKIP_COACH_NEWS_DISPLAY", "ID:OPTIONS_SIMULATION", "ID:OPTIONS_SIMULATION_ADVANCED", simulationSkipCoachNewsDisplay, false, SIMULATION_SKIP_COACH_NEWS_DISPLAY_PERMISSION, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		savedLanguages = (string)Util.ManageOneOption(mode, "savedLanguages", null, null, null, savedLanguages, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		chooseInitialTeam = (bool)Util.ManageOneOption(mode, "chooseInitialTeam", "ID:OPTIONS_CHOOSE_INITIAL_TEAM", "ID:OPTIONS_GAME", null, chooseInitialTeam, false, CHOOSE_INITIAL_TEAM_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.EditablePublic, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		playWorldRanking = (bool)Util.ManageOneOption(mode, "playWorldRanking", "ID:OPTIONS_PLAY_WORLD_RANKING", "ID:OPTIONS_GAME", null, playWorldRanking, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.EditablePublic, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		playRegionalLeagues = (bool)Util.ManageOneOption(mode, "playRegionalLeague", null, null, null, playRegionalLeagues, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		playInternationalLeagues = (bool)Util.ManageOneOption(mode, "playInternacionalLeague", null, null, null, playInternationalLeagues, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		playSuperLeague = (bool)Util.ManageOneOption(mode, "playSuperLeague", null, null, null, playSuperLeague, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		newGameCountries = (string)Util.ManageOneOption(mode, "newGameCountries", null, null, null, newGameCountries, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		bool flag2 = !Application.runInBackground;
		flag2 = (bool)Util.ManageOneOption(mode, "pauseOnTaskSwitch", "ID:OPTIONS_PAUSE_ON_TASK_SWITCH", "ID:OPTIONS_GAME", null, flag2, false, PAUSE_ON_TASK_SWITCH_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		Application.runInBackground = !flag2;
		ScreenOrientation orientation = Screen.orientation;
		screenRotationAuto = (bool)Util.ManageOneOption(mode, "screenRotationAuto", "ID:OPTIONS_ORIENTATION_AUTOROTATION", "ID:OPTIONS_ORIENTATION", null, screenRotationAuto, true, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic, EliParameterPermissions.RadioButton);
		if (screenRotationAuto)
		{
			Screen.autorotateToPortrait = true;
			Screen.autorotateToPortraitUpsideDown = true;
			Screen.autorotateToLandscapeLeft = true;
			Screen.autorotateToLandscapeRight = true;
			Screen.orientation = ScreenOrientation.AutoRotation;
		}
		screenRotationPortraitUp = (bool)Util.ManageOneOption(mode, "screenRotationPortraitUp", "ID:OPTIONS_ORIENTATION_PORTRAIT_UP", "ID:OPTIONS_ORIENTATION", null, screenRotationPortraitUp, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic, EliParameterPermissions.RadioButton);
		if (screenRotationPortraitUp)
		{
			Screen.autorotateToPortrait = true;
			Screen.autorotateToPortraitUpsideDown = false;
			Screen.autorotateToLandscapeLeft = false;
			Screen.autorotateToLandscapeRight = false;
			Screen.orientation = ScreenOrientation.Portrait;
		}
		screenRotationLandscapeLeft = (bool)Util.ManageOneOption(mode, "screenRotationLandscapeLeft", "ID:OPTIONS_ORIENTATION_LANDSCAPE_LEFT", "ID:OPTIONS_ORIENTATION", null, screenRotationLandscapeLeft, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic, EliParameterPermissions.RadioButton);
		if (screenRotationLandscapeLeft)
		{
			Screen.autorotateToLandscapeLeft = true;
			Screen.autorotateToPortrait = false;
			Screen.autorotateToPortraitUpsideDown = false;
			Screen.autorotateToLandscapeRight = false;
			Screen.orientation = ScreenOrientation.LandscapeLeft;
		}
		screenRotationLandscapeRight = (bool)Util.ManageOneOption(mode, "screenRotationLandscapeRight", "ID:OPTIONS_ORIENTATION_LANDSCAPE_RIGHT", "ID:OPTIONS_ORIENTATION", null, screenRotationLandscapeRight, false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic, EliParameterPermissions.RadioButton);
		if (screenRotationLandscapeRight)
		{
			Screen.autorotateToLandscapeLeft = true;
			Screen.autorotateToPortrait = false;
			Screen.autorotateToPortraitUpsideDown = false;
			Screen.autorotateToLandscapeRight = false;
			Screen.orientation = ScreenOrientation.LandscapeRight;
		}
		if (Screen.orientation != orientation)
		{
			UnityEngine.Object[] array = UnityEngine.Object.FindObjectsByType(typeof(EliView), FindObjectsSortMode.None);
			for (int i = 0; i < array.Length; i++)
			{
				((EliView)array[i]).ForceOrientationChange(Screen.orientation);
			}
		}
		SoundManager.instance.SoundEnabled = (bool)Util.ManageOneOption(mode, "soundEnabled", "ID:OPTIONS_SOUND_ENABLED", "ID:OPTIONS_SOUNDS", null, SoundManager.instance.SoundEnabled, true, SOUND_PERMISSION, ref listOfParameters, -1, -1, SoundManager.instance.SetSoundEnabled, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		DataManager.instance.matchEventAudioNotification = (bool)Util.ManageOneOption(mode, "matchEventAudioNotification", "ID:OPTIONS_MATCH_EVENT_AUDIO_NOTIFICATION", "ID:OPTIONS_SOUNDS", null, DataManager.instance.matchEventAudioNotification, true, SOUND_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		DataManager.instance.matchEventSound = (bool)Util.ManageOneOption(mode, "matchEventSound", "ID:OPTIONS_MATCH_EVENT_SOUND", "ID:OPTIONS_SOUNDS", null, DataManager.instance.matchEventSound, true, SOUND_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		SoundManager.instance.VolumeSound = (int)Util.ManageOneOption(mode, "soundEffectsVolume", "ID:OPTIONS_SOUND_EFFECTS_VOLUME", "ID:OPTIONS_SOUNDS", null, SoundManager.instance.VolumeSound, 100, SOUND_PERMISSION, ref listOfParameters, 0, 100, SoundManager.instance.SetVolumeSound, EliParameterPermissions.LimitedInt, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		SoundManager.instance.VolumeMusic = (int)Util.ManageOneOption(mode, "soundMusicVolume", "ID:OPTIONS_SOUND_MUSIC_VOLUME", "ID:OPTIONS_SOUNDS", null, SoundManager.instance.VolumeMusic, 40, SOUND_PERMISSION, ref listOfParameters, 0, 100, SoundManager.instance.SetVolumeMusic, EliParameterPermissions.LimitedInt, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		autoSave = (bool)Util.ManageOneOption(mode, "autoSave", "ID:OPTIONS_AUTOSAVE", "ID:OPTIONS_SAVE", null, autoSave, true, AUTOSAVE_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		autoSaveMatchesFrequency = (int)Util.ManageOneOption(mode, "autoSaveMatchesFrequency2", "ID:OPTIONS_AUTOSAVE_MATCHES_FREQUENCY", "ID:OPTIONS_SAVE", null, autoSaveMatchesFrequency, 5, AUTOSAVE_PERMISSION, ref listOfParameters, 1, 10, EliParameterPermissions.LimitedInt, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		autoSaveWarnOnError = (bool)Util.ManageOneOption(mode, "autoSaveWarnOnError", "ID:OPTIONS_AUTOSAVE_WARNONERROR", "ID:OPTIONS_SAVE", null, autoSaveWarnOnError, true, AUTOSAVE_WARNONERROR_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		autoSaveOnPause = (bool)Util.ManageOneOption(mode, "autoSaveOnPause", "ID:OPTIONS_AUTOSAVE_ON_PAUSE", "ID:OPTIONS_SAVE", null, autoSaveOnPause, false, AUTOSAVE_ON_PAUSE_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		numAvailablePlayersMax = (int)Util.ManageOneOption(mode, "numAvailablePlayersMax", "ID:OPTIONS_AVAILABLE_PLAYERS", "ID:OPTIONS_MATCH", null, numAvailablePlayersMax, 50, NUM_AVAILABLE_PLAYERS_PERMISSION, ref listOfParameters, 7, 50, EliParameterPermissions.LimitedInt, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		substitutionsAtHalfTime = (bool)Util.ManageOneOption(mode, "substitutionsAtHalfTime", "ID:OPTIONS_SUBSTITUTIONS_AT_HALFTIME", "ID:OPTIONS_MATCH", null, substitutionsAtHalfTime, true, SUBSTITUTIONS_AT_HALFTIME_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		matchDuration = (int)Util.ManageOneOption(mode, "matchDuration", "ID:OPTIONS_MATCH_DURATION", "ID:OPTIONS_MATCH", null, matchDuration, 90, MATCH_DURATION_PERMISSION, ref listOfParameters, 20, 90, EliParameterPermissions.LimitedInt, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		showMatchResume = (bool)Util.ManageOneOption(mode, "showMatchResume", "ID:OPTIONS_SHOW_MATCH_RESUME", "ID:OPTIONS_MATCH", null, showMatchResume, true, SHOW_MATCH_RESUME_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		matchSpeedHuman = (int)Util.ManageOneOption(mode, "matchSpeedHuman", "ID:OPTIONS_MATCH_SPEED_HUMAN", "ID:MATCH_SPEEDS", null, matchSpeedHuman, 5, MATCH_SPEED_HUMAN_PERMISSION, ref listOfParameters, 1, 30, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		matchSpeedNoHuman = (int)Util.ManageOneOption(mode, "matchSpeedNoHuman", "ID:OPTIONS_MATCH_SPEED_NO_HUMAN", "ID:MATCH_SPEEDS", null, matchSpeedNoHuman, 30, MATCH_SPEED_NO_HUMAN_PERMISSION, ref listOfParameters, 1, 30, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		matchSpeedSimulation = (int)Util.ManageOneOption(mode, "matchSpeedSimulation", "ID:OPTIONS_MATCH_SPEED_SIMULATION", "ID:MATCH_SPEEDS", null, matchSpeedSimulation, 30, MATCH_SPEED_SIMULATION_PERMISSION, ref listOfParameters, 1, 50, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		penaltiesShootoutEnabled = (bool)Util.ManageOneOption(mode, "penaltiesEnabled", "ID:OPTIONS_PENALTIS_SHOOTOUT_ENABLED", "ID:OPTIONS_PENALTY_SHOOTOUT", null, penaltiesShootoutEnabled, true, PENALTIES_ENABLED_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		penaltiesShootoutAlwaysView = (bool)Util.ManageOneOption(mode, "penaltiesAlwaysViewShootout", "ID:OPTIONS_PENALTIS_ALWAYSVIEW_ENABLED", "ID:OPTIONS_PENALTY_SHOOTOUT", null, penaltiesShootoutAlwaysView, false, PENALTIES_SHOOTOUT_ALWAYSVIEW_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		penaltiesShootoutSpeedPresent = (int)Util.ManageOneOption(mode, "penaltiesShootoutSpeedPresent", "ID:OPTIONS_PENALTY_SHOOTOUT_PRESENT", "ID:OPTIONS_PENALTY_SHOOTOUT", "ID:OPTIONS_PENALTY_SHOOTOUT_SPEED", penaltiesShootoutSpeedPresent, 1, PENALTIES_SHOOTOUT_SPEED_PRESENT_PERMISSION, ref listOfParameters, 1, 10, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		penaltiesShootoutSpeedNotPresent = (int)Util.ManageOneOption(mode, "penaltiesShootoutSpeedNotPresent", "ID:OPTIONS_PENALTY_SHOOTOUT_NOT_PRESENT", "ID:OPTIONS_PENALTY_SHOOTOUT", "ID:OPTIONS_PENALTY_SHOOTOUT_SPEED", penaltiesShootoutSpeedNotPresent, 4, PENALTIES_SHOOTOUT_SPEED_NOT_PRESENT_PERMISSION, ref listOfParameters, 1, 10, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		penaltiesShootoutSpeedSimulation = (int)Util.ManageOneOption(mode, "penaltiesShootoutSpeedSimulation", "ID:OPTIONS_PENALTY_SHOOTOUT_SIMULATION", "ID:OPTIONS_PENALTY_SHOOTOUT", "ID:OPTIONS_PENALTY_SHOOTOUT_SPEED", penaltiesShootoutSpeedSimulation, 10, PENALTIES_SHOOTOUT_SPEED_SIMULATION_PERMISSION, ref listOfParameters, 1, 10, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		ManageDivisionOptions(mode, ref listOfParameters);
		ManageLastChoiceLeague(mode, ref listOfParameters);
		playLeague = (bool)Util.ManageOneOption(mode, "playLeague", "ID:OPTIONS_PLAY_LEAGUE", "ID:OPTIONS_LEAGUE", null, playLeague, true, PLAY_LEAGUE_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		playLeagueRoundsPerSeason = (int)Util.ManageOneOption(mode, "roundsPerSeason", "ID:OPTIONS_ROUNDS_PER_SEASON", "ID:OPTIONS_LEAGUE", null, playLeagueRoundsPerSeason, 38, PLAY_LEAGUE_ROUNDS_PER_SEASON_PERMISSION, ref listOfParameters, 1, 38, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		int num = 0;
		for (int j = 0; j < numDivisionsLeagueMin.Length; j++)
		{
			num = numDivisionsLeagueMin[j];
			num = (int)Util.ManageOneOption(mode, $"numDivisionsMin-{j}", "ID:OPTIONS_NUM_DIVISIONS_MIN", "ID:OPTIONS_LEAGUE", null, num, 4, NUM_DIVISIONS_PERMISSION, ref listOfParameters, 2, 4, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditableTester);
			numDivisionsLeagueMin[j] = num;
		}
		goalFrequency = (int)Util.ManageOneOption(mode, "goalFrequency", "ID:OPTIONS_GOAL_FREQUENCY", "ID:OPTIONS_MATCH_EVENTS", null, goalFrequency, 4, GOAL_FREQUENCY_PERMISSION, ref listOfParameters, 0, 10, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		penaltyFrequency = (int)Util.ManageOneOption(mode, "penaltyFrequency", "ID:OPTIONS_PENALTY_FREQUENCY", "ID:OPTIONS_MATCH_EVENTS", null, penaltyFrequency, 3, PENALTY_FREQUENCY_PERMISSION, ref listOfParameters, 0, 20, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		injuryFrequency = (int)Util.ManageOneOption(mode, "injuryFrequency", "ID:OPTIONS_INJURY_FREQUENCY", "ID:OPTIONS_MATCH_EVENTS", null, injuryFrequency, 3, INJURY_FREQUENCY_PERMISSION, ref listOfParameters, 0, 20, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		injuryOnlyIfCoachHuman = (bool)Util.ManageOneOption(mode, "injuryOnlyIfCoachHuman", "ID:OPTIONS_ONLY_IF_COACH_HUMAN", "ID:OPTIONS_MATCH_EVENTS", null, injuryOnlyIfCoachHuman, false, INJURY_ONLY_IF_COACH_HUMAN_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		yellowCardFrequency = (int)Util.ManageOneOption(mode, "yellowCardFrequency-test3", "ID:OPTIONS_YELLOW_CARD_FREQUENCY", "ID:OPTIONS_MATCH_EVENTS", null, yellowCardFrequency, 3, YELLOW_CARD_FREQUENCY_PERMISSION, ref listOfParameters, 0, 20, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		yellowCardOnlyIfCoachHuman = (bool)Util.ManageOneOption(mode, "yellowCardOnlyIfCoachHuman", "ID:OPTIONS_ONLY_IF_COACH_HUMAN", "ID:OPTIONS_MATCH_EVENTS", null, yellowCardOnlyIfCoachHuman, false, YELLOW_CARD_ONLY_IF_COACH_HUMAN_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		redCardFrequency = (int)Util.ManageOneOption(mode, "redCardFrequency-test3", "ID:OPTIONS_RED_CARD_FREQUENCY", "ID:OPTIONS_MATCH_EVENTS", null, redCardFrequency, 3, RED_CARD_FREQUENCY_PERMISSION, ref listOfParameters, 0, 20, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		redCardOnlyIfCoachHuman = (bool)Util.ManageOneOption(mode, "redCardOnlyIfCoachHuman", "ID:OPTIONS_ONLY_IF_COACH_HUMAN", "ID:OPTIONS_MATCH_EVENTS", null, redCardOnlyIfCoachHuman, false, RED_CARD_ONLY_IF_COACH_HUMAN_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		fireCoaches = (bool)Util.ManageOneOption(mode, "fireCoaches", "ID:OPTIONS_FIRE_COACHES", "ID:OPTIONS_COACHES", null, fireCoaches, true, FIRE_COACHES_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		maxInvitaionsPerMatch = (int)Util.ManageOneOption(mode, "maxInvitaionsPerMatch", "ID:OPTIONS_INVITAIONS_LIMIT_PER_MATCH", "ID:OPTIONS_COACHES", null, maxInvitaionsPerMatch, 3, MAX_INVITATIONS_PER_MATCH_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		matchesToFireCoachHuman = (int)Util.ManageOneOption(mode, "matchesToFireCoachHuman", "ID:OPTIONS_COACHES_HUMAN", "ID:OPTIONS_COACHES", "ID:OPTIONS_MATCHES_TO_FIRE_COACH", matchesToFireCoachHuman, 10, MATCHES_TO_FIRE_COACH_PERMISSION, ref listOfParameters, 0, 20, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		matchesToFireCoachComputer = (int)Util.ManageOneOption(mode, "matchesToFireCoachComputer", "ID:OPTIONS_COACHES_COMPUTER", "ID:OPTIONS_COACHES", "ID:OPTIONS_MATCHES_TO_FIRE_COACH", matchesToFireCoachComputer, 10, MATCHES_TO_FIRE_COACH_PERMISSION, ref listOfParameters, 0, 20, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		resetDailyAdsCounter = (bool)Util.ManageOneOption(mode, "resetDailyAdsCounter", "ID:OPTIONS_RESET_DAILY_ADS_COUNTER", "ID:OPTIONS_ADS", null, resetDailyAdsCounter, false, RESET_DAILY_ADS_COUNTER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		allCoachesHuman = (bool)Util.ManageOneOption(mode, "allCoachesHuman", "ID:OPTIONS_ALL_COACHES_HUMAN", "ID:OPTIONS_DEVELOPER", null, allCoachesHuman, false, ALL_COACHES_HUMAN_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		rankingLimitRecords = (int)Util.ManageOneOption(mode, "rankingLimitRecords", "ID:OPTIONS_RANKING_LIMIT_RECORDS", "ID:OPTIONS_DEVELOPER", null, rankingLimitRecords, RANKING_LIMIT_RECORDS_DEFAULT, RANKING_LIMIT_RECORDS_PERMISSION, ref listOfParameters, RANKING_LIMIT_RECORDS_MIN, RANKING_LIMIT_RECORDS_MAX, EliParameterPermissions.LimitedInt, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditableTester);
		repeatSameCalendarDay = (bool)Util.ManageOneOption(mode, "repeatSameCalendarDay", "ID:OPTIONS_REPEAT_SAME_CALENDAR_DAY", "ID:OPTIONS_DEVELOPER", null, repeatSameCalendarDay, false, REPEAT_SAME_CALENDAR_DAY_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditableAuthor);
		allListsMaxSize = (bool)Util.ManageOneOption(mode, "allListsMaxSize", "ID:OPTIONS_ALL_LISTS_MAX_SIZE", "ID:OPTIONS_DEVELOPER", null, allListsMaxSize, false, ALL_LISTS_MAX_SIZE_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		humanCoachSuperPower = (bool)Util.ManageOneOption(mode, "humanCoachSuperPower", "ID:OPTIONS_HUMAN_SUPER_POWER", "ID:OPTIONS_DEVELOPER", null, humanCoachSuperPower, false, HUMAN_COACH_SUPER_POWER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		hugeTestFreeSpaceRequired = (bool)Util.ManageOneOption(mode, "hugeTestFreeSpaceRequired", "ID:OPTIONS_HUGE_FREE_SPACE_REQUIRED", "ID:OPTIONS_DEVELOPER", null, hugeTestFreeSpaceRequired, false, HUGE_TEST_FREE_SPACE_REQUIRED_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditablePublic);
		retrieveInfoInterval = (int)Util.ManageOneOption(mode, "retrieveInfoInterval", "ID:OPTIONS_RETRIEVEINFO_INTERVAL", "ID:OPTIONS_DEVELOPER", null, retrieveInfoInterval, 1440, RETRIEVEINFO_INTERVAL_PERMISSION, ref listOfParameters, 0, 1440, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.LimitedInt, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.EditableAuthor);
		lastGameCoachGuids = (string)Util.ManageOneOption(mode, "lastGameCoachGuids", null, null, null, lastGameCoachGuids, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		appUpdateVersionDiscarded = (string)Util.ManageOneOption(mode, "appUpdateVersionDiscarded", null, null, null, appUpdateVersionDiscarded, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		appUpdateVersionIgnored = (string)Util.ManageOneOption(mode, "appUpdateVersionIgnored", null, null, null, appUpdateVersionIgnored, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		allRecordedCoachNames = (string)Util.ManageOneOption(mode, "allRecordedCoachNames", null, null, null, allRecordedCoachNames, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		allRecordedCoachGuids = (string)Util.ManageOneOption(mode, "allRecordedCoachGuids", null, null, null, allRecordedCoachGuids, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		allRecordedCoachEmails = (string)Util.ManageOneOption(mode, "allRecordedCoachEmails", null, null, null, allRecordedCoachEmails, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		allRecordedCoachPasswords = (string)Util.ManageOneOption(mode, "allRecordedCoachPasswords", null, null, null, allRecordedCoachPasswords, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		followGuidsToSendToServer = (string)Util.ManageOneOption(mode, "followGuidsToSendToServer", null, null, null, followGuidsToSendToServer, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		unfollowGuidsToSendToServer = (string)Util.ManageOneOption(mode, "unfollowGuidsToSendToServer", null, null, null, unfollowGuidsToSendToServer, "", PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.ResetToDefaultValue);
		retrieveInfoLastTimestamp = (int)Util.ManageOneOption(mode, "retrieveInfoLastTimestamp", null, "ID:OPTIONS_DEVELOPER", null, retrieveInfoLastTimestamp, 0, RETRIEVEINFO_LAST_TIMESTAMP_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		keepLocalNameChanges = (bool)Util.ManageOneOption(mode, "keepLocalNameChanges", "ID:OPTIONS_KEEP_LOCAL_NAME_CHANGES", "ID:OPTIONS_DEVELOPER", null, keepLocalNameChanges, true, KEEP_LOCAL_NAME_CHANGES_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache);
		extras.coachUnion = (bool)Util.ManageOneOption(mode, "extrasCoachUnion", "ID:INTERNAL_ITEM_UNION_TITLE", "ID:OPTIONS_INAPPS", null, extras.coachUnion, extras.coachUnion, HAS_INAPP_PURCHASES_PERMISSION, ref listOfParameters, EliParameterPermissions.EditableAuthor);
		extras.premiumVersion = (bool)Util.ManageOneOption(mode, "extrasPremiumVersion", "ID:INTERNAL_ITEM_PREMIUM_TITLE", "ID:OPTIONS_INAPPS", null, extras.premiumVersion, extras.premiumVersion, HAS_INAPP_PURCHASES_PERMISSION, ref listOfParameters, EliParameterPermissions.EditableAuthor);
		extras.sponsorship = (bool)Util.ManageOneOption(mode, "extrasSponsorship", "ID:INTERNAL_ITEM_SPONSORSHIP_TITLE", "ID:OPTIONS_INAPPS", null, extras.sponsorship, extras.sponsorship, HAS_INAPP_PURCHASES_PERMISSION, ref listOfParameters, EliParameterPermissions.EditableAuthor);
		extras.vipVersion = (bool)Util.ManageOneOption(mode, "extrasVIPVersion", "ID:INTERNAL_ITEM_VIP_TITLE", "ID:OPTIONS_INAPPS", null, extras.vipVersion, extras.vipVersion, HAS_INAPP_PURCHASES_PERMISSION, ref listOfParameters, EliParameterPermissions.EditableAuthor);
		useElifootServerParallels = elifootServer == ElifootServer.Parallels;
		useElifootServerParallels = (bool)Util.ManageOneOption(mode, "useElifootServerParallels", "ID:ELIFOOTSERVER_PARALLELS", "ID:OPTIONS_DEVELOPER", "ID:OPTIONS_ELIFOOTSERVER", useElifootServerParallels, useElifootServerParallels, SHOW_ELIFOOT_SERVER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.RadioButton, EliParameterPermissions.EditableAuthor);
		if (useElifootServerParallels)
		{
			elifootServer = ElifootServer.Parallels;
		}
		useElifootServerLocalhost = elifootServer == ElifootServer.Localhost;
		useElifootServerLocalhost = (bool)Util.ManageOneOption(mode, "useElifootServerLocalhost", "ID:ELIFOOTSERVER_LOCALHOST", "ID:OPTIONS_DEVELOPER", "ID:OPTIONS_ELIFOOTSERVER", useElifootServerLocalhost, useElifootServerLocalhost, SHOW_ELIFOOT_SERVER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.RadioButton, EliParameterPermissions.EditableAuthor);
		if (useElifootServerLocalhost)
		{
			elifootServer = ElifootServer.Localhost;
		}
		useElifootServerDevelopment = elifootServer == ElifootServer.Development;
		useElifootServerDevelopment = (bool)Util.ManageOneOption(mode, "useElifootServerDevelopment", "ID:ELIFOOTSERVER_DEVELOPMENT", "ID:OPTIONS_DEVELOPER", "ID:OPTIONS_ELIFOOTSERVER", useElifootServerDevelopment, useElifootServerDevelopment, SHOW_ELIFOOT_SERVER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.RadioButton, EliParameterPermissions.EditableAuthor);
		if (useElifootServerDevelopment)
		{
			elifootServer = ElifootServer.Development;
		}
		useElifootServerStaging = elifootServer == ElifootServer.Staging;
		useElifootServerStaging = (bool)Util.ManageOneOption(mode, "useElifootServerStaging", "ID:ELIFOOTSERVER_STAGING", "ID:OPTIONS_DEVELOPER", "ID:OPTIONS_ELIFOOTSERVER", useElifootServerStaging, useElifootServerStaging, SHOW_ELIFOOT_SERVER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.RadioButton, EliParameterPermissions.EditableAuthor);
		if (useElifootServerStaging)
		{
			elifootServer = ElifootServer.Staging;
		}
		useElifootServerProduction = elifootServer == ElifootServer.Production;
		useElifootServerProduction = (bool)Util.ManageOneOption(mode, "useElifootServerProduction", "ID:ELIFOOTSERVER_PRODUCTION", "ID:OPTIONS_DEVELOPER", "ID:OPTIONS_ELIFOOTSERVER", useElifootServerProduction, useElifootServerProduction, SHOW_ELIFOOT_SERVER_PERMISSION, ref listOfParameters, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.DeleteFromCache, EliParameterPermissions.RadioButton, EliParameterPermissions.EditableAuthor);
		if (useElifootServerProduction)
		{
			elifootServer = ElifootServer.Production;
		}
		useElifootServerProduction = elifootServer == ElifootServer.Production;
		mainMenuInfoTextCaption = (string)Util.ManageOneOption(mode, "mainMenuInfoTextCaption", null, null, null, mainMenuInfoTextCaption, null, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
		mainMenuInfoTextLink = (string)Util.ManageOneOption(mode, "mainMenuInfoTextLink", null, null, null, mainMenuInfoTextLink, null, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
		mainMenuAdUrl = (string)Util.ManageOneOption(mode, "mainMenuAdUrl", null, null, null, mainMenuAdUrl, null, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.ReadFromCache, EliParameterPermissions.WriteToCache, EliParameterPermissions.ResetToDefaultValue, EliParameterPermissions.DeleteFromCache);
		LanguageController.instance.ManageActiveLanguage(mode, ref listOfParameters);
		ManageDivisionOptions(mode, ref listOfParameters);
		ManageLastChoiceLeague(mode, ref listOfParameters);
		DataManager.instance.eliCrash?.ManageOptions(mode, ref listOfParameters);
		if (mode == Util.ManageOption.CreateParameter && listOfParameters != null)
		{
			listOfParameters.StartSection("BUGREPORT_SECTION_TITLE");
			Sprite icon = Util.LoadSprite(ConfigManager.configDictionary["#ICON_BUG"]);
			listOfParameters.RegisterButtonParameter("BUGREPORT_OPEN_BUTTON", new EliParameter.ButtonConfig(null, active: true, icon, delegate
			{
				ScreenController.instance.ShowBugReportView();
			}));
		}
		if (listOfParameters != null)
		{
			listOfParameters.EndSection();
		}
	}

	public static bool IsSimulationFlagActive(SimulationFlag simulationFlag)
	{
		if (simulationMode != SimulationMode.Total)
		{
			if (simulationMode == SimulationMode.Partial)
			{
				return simulationFlags[simulationFlag];
			}
			return false;
		}
		return true;
	}

	public static void ParametersSaved(ListOfParameters parametersList)
	{
		ManageOptions(Util.ManageOption.ReadParameter, ref parametersList);
		if (DataManager.instance != null && DataManager.instance.allTeams != null)
		{
			DataManager.instance.allTeams.SetHistoryDataLength();
		}
		if (removeRegistration)
		{
			Registration.RemoveRegistration();
		}
		SaveOptions();
		if (!GamePermissions.AllowsImpersonation())
		{
			return;
		}
		KeyValuePair<int, string[]> parameterValue = parametersList.GetParameterValue("impersonation");
		if (parameterValue.Key < 0)
		{
			return;
		}
		string strB = parameterValue.Value[parameterValue.Key];
		foreach (PermissionLevel value in Enum.GetValues(typeof(PermissionLevel)))
		{
			if (GamePermissions.GetLevelString(value).CompareTo(strB) == 0)
			{
				GamePermissions.impersonationLevel = value;
			}
		}
		PlayerPrefs.SetInt("Impersonation", (int)GamePermissions.impersonationLevel);
		GamePermissions.ComputeRegLevel();
	}
}
