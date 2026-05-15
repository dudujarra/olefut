using System.Runtime.InteropServices;
using UnityEngine;

public static class GamePermissions
{
	[StructLayout(LayoutKind.Sequential, Size = 1)]
	public struct Permissions
	{
		public static PermissionLevel dumps = PermissionLevel.L9_Author;

		public static PermissionLevel simulation = PermissionLevel.L9_Author;

		public static PermissionLevel quickMatches = PermissionLevel.L9_Author;

		public static PermissionLevel userServerRoot = PermissionLevel.L9_Author;

		public static PermissionLevel quitAnytime = PermissionLevel.L9_Author;

		public static PermissionLevel devMenu = PermissionLevel.L9_Author;

		public static PermissionLevel skipLeague = PermissionLevel.L9_Author;

		public static PermissionLevel skipNationalCup = PermissionLevel.L9_Author;

		public static PermissionLevel skipInternationalCup = PermissionLevel.L9_Author;

		public static PermissionLevel developmentOptions = PermissionLevel.L9_Author;

		public static PermissionLevel allCoachesHuman = PermissionLevel.L9_Author;

		public static PermissionLevel fireCoaches = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel advancedTestOptions = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel matchDuration = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel numAvailablePlayers = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel impersonation = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel skipNationalCupFirstLeg = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel skipInternationalNationalCupFirstLeg = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel retrieveInfoInterval = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel dumpFiles = PermissionLevel.L8_AdvancedTester;

		public static PermissionLevel testOptions = PermissionLevel.L7_Tester;

		public static PermissionLevel applicationStatus = PermissionLevel.L7_Tester;

		public static PermissionLevel premiumVersion = PermissionLevel.L6_Premium;

		public static PermissionLevel vipVersion = PermissionLevel.L5_VIP;

		public static PermissionLevel multipleHumanCoaches = PermissionLevel.L3_VIP;

		public static PermissionLevel removeHumanCoaches = PermissionLevel.L3_VIP;

		public static PermissionLevel vacationHumanCoaches = PermissionLevel.L3_VIP;

		public static PermissionLevel startAnyDivision = PermissionLevel.L3_VIP;

		public static PermissionLevel fullBankLoans = PermissionLevel.L3_VIP;

		public static PermissionLevel hideAutoVideoAds = PermissionLevel.L3_VIP;

		public static PermissionLevel skipInterstitialAds = PermissionLevel.L3_VIP;

		public static PermissionLevel allowPlay = PermissionLevel.L2_Free;

		public static PermissionLevel showExitButton = PermissionLevel.L0_None;

		public static PermissionLevel chooseInitialTeam = PermissionLevel.L0_None;

		public static PermissionLevel substitutionsAnytime = PermissionLevel.L0_None;

		public static PermissionLevel autoSave = PermissionLevel.L0_None;

		public static PermissionLevel inviteFirstDivision = PermissionLevel.L0_None;

		public static PermissionLevel substitutionsAtHalfTime = PermissionLevel.L0_None;

		public static PermissionLevel matchSpeed = PermissionLevel.L0_None;

		public static PermissionLevel coins = PermissionLevel.L0_None;

		public static PermissionLevel retrieveInfo = PermissionLevel.L0_None;

		public static PermissionLevel sendError = PermissionLevel.L0_None;

		public static PermissionLevel language = PermissionLevel.L0_None;

		public static PermissionLevel sound = PermissionLevel.L0_None;

		public static PermissionLevel vibration = PermissionLevel.L0_None;

		public static PermissionLevel editor = PermissionLevel.L0_None;

		public static PermissionLevel save = PermissionLevel.L0_None;

		public static PermissionLevel numDivisionsPermission = PermissionLevel.L0_None;

		public static PermissionLevel matchSpeedHuman = matchSpeed;

		public static PermissionLevel matchSpeedNoHuman = matchSpeed;

		public static PermissionLevel matchSpeedSimulation = simulation;
	}

	public static bool[] allowed = new bool[11];

	public static PermissionLevel impersonationLevel = PermissionLevel.L0_None;

	public static string myDeviceID;

	public static string retrieveInfoAuthorizationPermission = "0";

	public static string retrieveInfoAuthorizationCode = null;

	public static bool publicVersion = false;

	public static DeviceAuthorization needsDeviceAuthorization = DeviceAuthorization.WhiteListAuthor;

	public static bool hasTimeBomb = true;

	public static string googlePublicKey;

	public static string aptoidePublicKey;

	public static int minTeamsPerDivision = 8;

	public static bool upgradeVip = false;

	public static bool upgradePremium = false;

	public static bool inWhitelist = false;

	private static string[] whiteListAuthor = new string[9] { "4331643256", "3551228594", "3551228594", "5421792913", "1946849858", "5200257550", "8666282185", "2318393097", "0573783934" };

	private static string[] whiteListAdvancedTesters = new string[2] { "12951420", "xxxxxxxx" };

	private static string[] whiteListRegularTesters = new string[90]
	{
		"40418054", "23404305", "42071575", "11333070", "10470089", "13635545", "15737761", "11505010", "24154310", "01043242",
		"66424745", "24154310", "56579804", "20655624", "20655624", "15200629", "05932325", "61520703", "34370407", "01520013",
		"27644119", "83628637", "23206040", "69100049", "33165863", "51607158", "64452573", "51833710", "64344403", "23722452",
		"33712578", "65472601", "91737120", "65341405", "45593287", "03575003", "51616593", "00201533", "32001769", "93363215",
		"63823731", "63823731", "29262925", "50907103", "23254204", "02052441", "19284453", "31316078", "06213035", "92402347",
		"22125432", "33965249", "47157067", "18455337", "31142596", "45374008", "40322600", "51443035", "32560053", "32336755",
		"13635545", "07400940", "41801714", "51444034", "77258244", "66424745", "34545652", "15053701", "12870323", "50991731",
		"30651954", "42210251", "73053106", "21702232", "80614532", "69100049", "50844353", "53555609", "54661711", "54761711",
		"91564375", "57581726", "37152528", "42666705", "42064074", "20217404", "41121311", "30767493", "35216100", "xxxxxxxx"
	};

	private static bool CheckWhiteList(string[] thisList)
	{
		bool result = false;
		for (int i = 0; i < thisList.Length; i++)
		{
			if (thisList[i].Trim().Equals(myDeviceID))
			{
				result = true;
				break;
			}
		}
		return result;
	}

	public static void CheckInWhitelist()
	{
		myDeviceID = Util.GetDeviceID(allowReadFromCache: true);
		if (needsDeviceAuthorization != DeviceAuthorization.None)
		{
			inWhitelist = false;
			if (needsDeviceAuthorization <= DeviceAuthorization.WhiteListAuthor)
			{
				inWhitelist = CheckWhiteList(whiteListAuthor);
			}
			if (!inWhitelist && needsDeviceAuthorization <= DeviceAuthorization.WhiteListAdvancedTester)
			{
				inWhitelist = CheckWhiteList(whiteListAdvancedTesters);
			}
			if (!inWhitelist && needsDeviceAuthorization <= DeviceAuthorization.WhiteListRegularTester)
			{
				inWhitelist = CheckWhiteList(whiteListRegularTesters);
			}
		}
	}

	public static bool AllowsImpersonation()
	{
		return Permissions.impersonation.CompareTo(DataManager.instance.buildLevel) < 0;
	}

	public static PermissionLevel GetPremiumAccessLevel()
	{
		if (!ElifootOptions.extras.premiumVersion)
		{
			return PermissionLevel.L0_None;
		}
		return Permissions.premiumVersion;
	}

	public static PermissionLevel GetVIPAccessLevel()
	{
		if (!ElifootOptions.extras.vipVersion)
		{
			return PermissionLevel.L0_None;
		}
		return Permissions.vipVersion;
	}

	public static bool MayUpgrade(InAppPurchases.GameItemType gameItemType, bool extraActive)
	{
		if (InAppPurchases.instance.HasAvailableExternalItem(gameItemType))
		{
			return !extraActive;
		}
		return false;
	}

	public static PermissionLevel GetCurRegLevel()
	{
		PermissionLevel permissionLevel = Registration.RegLevel;
		if (upgradeVip || ElifootOptions.extras.vipVersion)
		{
			permissionLevel = (PermissionLevel)Mathf.Max((int)permissionLevel, 5);
		}
		if (upgradePremium || ElifootOptions.extras.premiumVersion)
		{
			permissionLevel = (PermissionLevel)Mathf.Max((int)permissionLevel, 6);
		}
		if (AllowsImpersonation())
		{
			permissionLevel = (PermissionLevel)Mathf.Min((int)Registration.RegLevel, (int)impersonationLevel);
		}
		return permissionLevel;
	}

	public static void ComputeRegLevel()
	{
		PermissionLevel curRegLevel = GetCurRegLevel();
		for (int i = 0; i < allowed.Length; i++)
		{
			allowed[i] = i <= (int)curRegLevel;
		}
	}

	public static string GetLevelString(PermissionLevel reg)
	{
		return LanguageController.instance.Get_Translation($"REG_LEVEL_{(int)reg}");
	}

	public static void CheckBuildPermissions()
	{
		switch (DataManager.instance.buildLevel)
		{
		case PermissionLevel.L6_Premium:
			googlePublicKey = DataManager.GOOGLE_PUBLIC_KEY_VIP;
			break;
		case PermissionLevel.L5_VIP:
			googlePublicKey = DataManager.GOOGLE_PUBLIC_KEY_PRO;
			break;
		default:
			googlePublicKey = DataManager.GOOGLE_PUBLIC_KEY_FREE;
			break;
		}
		switch (DataManager.instance.buildLevel)
		{
		case PermissionLevel.L9_Author:
			publicVersion = false;
			needsDeviceAuthorization = DeviceAuthorization.WhiteListAuthor;
			aptoidePublicKey = DataManager.APTOIDE_PUBLIC_KEY_BETA;
			minTeamsPerDivision = 2;
			break;
		case PermissionLevel.L8_AdvancedTester:
			publicVersion = false;
			needsDeviceAuthorization = DeviceAuthorization.WhiteListAdvancedTester;
			aptoidePublicKey = DataManager.APTOIDE_PUBLIC_KEY_BETA;
			minTeamsPerDivision = 2;
			break;
		case PermissionLevel.L7_Tester:
			publicVersion = false;
			needsDeviceAuthorization = DeviceAuthorization.WhiteListRegularTester;
			aptoidePublicKey = DataManager.APTOIDE_PUBLIC_KEY_BETA;
			minTeamsPerDivision = 4;
			break;
		case PermissionLevel.L6_Premium:
			publicVersion = true;
			needsDeviceAuthorization = DeviceAuthorization.None;
			hasTimeBomb = false;
			aptoidePublicKey = DataManager.APTOIDE_PUBLIC_KEY_VIP;
			minTeamsPerDivision = 8;
			break;
		case PermissionLevel.L5_VIP:
			publicVersion = true;
			needsDeviceAuthorization = DeviceAuthorization.None;
			hasTimeBomb = false;
			aptoidePublicKey = DataManager.APTOIDE_PUBLIC_KEY_PRO;
			minTeamsPerDivision = 8;
			break;
		case PermissionLevel.L2_Free:
			publicVersion = true;
			needsDeviceAuthorization = DeviceAuthorization.None;
			hasTimeBomb = false;
			aptoidePublicKey = DataManager.APTOIDE_PUBLIC_KEY_FREE;
			minTeamsPerDivision = 8;
			break;
		case PermissionLevel.L3_VIP:
		case PermissionLevel.L4_VIP:
			break;
		}
	}
}
