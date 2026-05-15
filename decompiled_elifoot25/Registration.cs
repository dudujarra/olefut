using System.Collections.Generic;
using UnityEngine;

public class Registration
{
	private static PermissionLevel regLevel = PermissionLevel.L0_None;

	private static string regName = null;

	private static string regKey = null;

	private static string regCode = null;

	private static Dictionary<string, PermissionLevel> keyList = new Dictionary<string, PermissionLevel>
	{
		{
			"24_VIP",
			PermissionLevel.L5_VIP
		},
		{
			"24_PREMIUM",
			PermissionLevel.L6_Premium
		},
		{
			"25_VIP",
			PermissionLevel.L5_VIP
		},
		{
			"25_PREMIUM",
			PermissionLevel.L6_Premium
		}
	};

	public static PermissionLevel RegLevel => regLevel;

	public static string RegName => regName;

	public static string RegKey => regKey;

	public static string RegCode => regCode;

	private static string GetRegistrationCode(string name, string key)
	{
		int num = int.MaxValue;
		string text = "";
		string text2 = key + name;
		if (text2.Length % 2 == 1)
		{
			text2 += "0";
		}
		long num2 = 65535L;
		for (int i = 0; i < text2.Length; i += 2)
		{
			int num3 = text2[i] % 10;
			int num4 = text2[i + 1] % 10;
			long num5 = 10 * num3 + num4;
			num2 ^= num5;
			for (num5 = 1L; num5 <= 8; num5++)
			{
				long num6 = 0L;
				if (num2 % 2 == 1)
				{
					num6 = 1879142401L;
				}
				num2 = (num2 / 2) & num;
				num2 ^= num6;
			}
		}
		string text3 = num2.ToString("X8");
		for (int j = 0; j < text3.Length; j++)
		{
			text += text3[j] % 10;
		}
		return text;
	}

	public static PermissionLevel VerifyRegistrationLevel(string name, string code)
	{
		foreach (KeyValuePair<string, PermissionLevel> key in keyList)
		{
			if (GetRegistrationCode(name, key.Key) == code)
			{
				regCode = code;
				regKey = key.Key;
				return key.Value;
			}
		}
		return PermissionLevel.L0_None;
	}

	public static void CheckRegistrationInfo()
	{
		PermissionLevel baseRegLevel = DataManager.instance.baseRegLevel;
		PermissionLevel buildLevel = DataManager.instance.buildLevel;
		string name = PlayerPrefs.GetString("REGISTRATION_NAME", "");
		string code = PlayerPrefs.GetString("REGISTRATION_CODE", "");
		PermissionLevel permissionLevel = VerifyRegistrationLevel(name, code);
		if (permissionLevel > PermissionLevel.L0_None && permissionLevel <= buildLevel)
		{
			regName = name;
			regLevel = permissionLevel;
		}
		else
		{
			permissionLevel = PermissionLevel.L0_None;
		}
		permissionLevel = (PermissionLevel)Mathf.Max((int)permissionLevel, (int)baseRegLevel);
		regLevel = permissionLevel;
	}

	public static void UpgradeRegistrationLevel(PermissionLevel newLevel)
	{
		CheckRegistrationInfo();
		if (newLevel > regLevel)
		{
			regLevel = newLevel;
		}
	}

	public static string GetRegistrationDescription()
	{
		string arg = LanguageController.instance.Get_Translation($"REG_DESC_{(int)regLevel}");
		return $"{arg} {regName}";
	}

	public static bool MayRegisterVersion()
	{
		return DataManager.instance.buildLevel != DataManager.instance.baseRegLevel;
	}

	public static void SaveRegistrationInfo(string name, string code)
	{
		PlayerPrefs.SetString("REGISTRATION_NAME", name);
		PlayerPrefs.SetString("REGISTRATION_CODE", code);
	}

	public static void RemoveRegistration()
	{
		PlayerPrefs.SetString("REGISTRATION_NAME", null);
		PlayerPrefs.SetString("REGISTRATION_CODE", null);
		CheckRegistrationInfo();
	}
}
