using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net.Mail;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using SimpleJSON;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

public class Util : ScriptableObject
{
	public enum ManageOption
	{
		ReadFromCache,
		WriteToCache,
		CreateParameter,
		ReadParameter,
		ResetDefaultValue,
		DeleteFromCache
	}

	public enum ResourceType
	{
		Sprite,
		Font,
		Image
	}

	private static System.Random randGenerator = new System.Random();

	private static string DEVICEID_CACHE = "TEST1337";

	private static string ID_SHARED_SECRET = "makdfongoarehu40";

	public static string moneyStringTemplate = "{1} {0}";

	public static string moneySymbol = "€";

	public static Dictionary2<ResourceType, string, UnityEngine.Object> resourceDictionary = new Dictionary2<ResourceType, string, UnityEngine.Object>();

	private static byte[] _salt = Encoding.ASCII.GetBytes("o6806642kbM7c5");

	private static string guidReceived = "";

	public static readonly string noInternetCode = "NO_INTERNET";

	public static readonly string serverErrorCode = "SERVER_ERROR";

	public static Texture2D DecompressTexture(Texture2D source)
	{
		RenderTexture temporary = RenderTexture.GetTemporary(source.width, source.height, 0, RenderTextureFormat.Default, RenderTextureReadWrite.Linear);
		Graphics.Blit(source, temporary);
		RenderTexture active = RenderTexture.active;
		RenderTexture.active = temporary;
		Texture2D texture2D = new Texture2D(source.width, source.height);
		texture2D.ReadPixels(new Rect(0f, 0f, temporary.width, temporary.height), 0, 0);
		texture2D.Apply();
		RenderTexture.active = active;
		RenderTexture.ReleaseTemporary(temporary);
		return texture2D;
	}

	public static double GetRandomDouble()
	{
		return randGenerator.NextDouble();
	}

	public static int GetRandomInt(int maxValue)
	{
		return randGenerator.Next(maxValue);
	}

	public static int GetRandomInt(int minValue, int maxValue)
	{
		return randGenerator.Next(minValue, maxValue);
	}

	public static int Average(int a, int b)
	{
		return (a + b) / 2;
	}

	public static void OpenURL(string url)
	{
		Application.OpenURL(url);
	}

	public static string IntArrayToString(int[] myArray, char separator)
	{
		string text = "";
		foreach (int num in myArray)
		{
			text = text + num + separator;
		}
		return text.Remove(text.Length - 1);
	}

	public static bool IsValidEmail(string email)
	{
		try
		{
			return new MailAddress(email).Address == email;
		}
		catch
		{
			return false;
		}
	}

	public static int SumOfArrayOfInt(int[] myArray)
	{
		int num = 0;
		foreach (int num2 in myArray)
		{
			num += num2;
		}
		return num;
	}

	public static ScreenOrientation GetPerceivedOrientation()
	{
		if (Screen.width > Screen.height)
		{
			return ScreenOrientation.LandscapeLeft;
		}
		return ScreenOrientation.Portrait;
	}

	public static Dictionary<string, string> RandomFriend(List<object> friends)
	{
		Dictionary<string, object> dictionary = (Dictionary<string, object>)friends[UnityEngine.Random.Range(0, friends.Count)];
		Dictionary<string, string> obj = new Dictionary<string, string>
		{
			["id"] = (string)dictionary["id"],
			["first_name"] = (string)dictionary["first_name"]
		};
		Dictionary<string, object> dictionary2 = (Dictionary<string, object>)((Dictionary<string, object>)dictionary["picture"])["data"];
		obj["image_url"] = (string)dictionary2["url"];
		return obj;
	}

	public static void DrawActualSizeTexture(Vector2 pos, Texture texture, float scale = 1f)
	{
		GUI.DrawTexture(new Rect(pos.x, pos.y, (float)texture.width * scale, (float)texture.height * scale), texture);
	}

	public static void DrawSimpleText(Vector2 pos, GUIStyle style, string text)
	{
		GUI.Label(new Rect(pos.x, pos.y, Screen.width, Screen.height), text, style);
	}

	private static void JavascriptLog(string msg)
	{
		Application.ExternalCall("console.log", msg);
	}

	public static IEnumerator Wait(float duration)
	{
		yield return new WaitForSeconds(duration);
	}

	public static string CurrentTimeString()
	{
		return $"{DateTime.Now.ToUniversalTime().Hour:00}:{DateTime.Now.ToUniversalTime().Minute:00}:{DateTime.Now.ToUniversalTime().Second:00}.{DateTime.Now.ToUniversalTime().Millisecond:000}";
	}

	public static void QuitApplication()
	{
		Application.Quit();
	}

	public static string GetGameObjectPath(GameObject obj)
	{
		string text = "";
		Transform transform = obj.gameObject.transform;
		_ = transform.parent;
		while (transform.parent != null)
		{
			if (text.Length > 0)
			{
				text = " : " + text;
			}
			text = transform.name + text;
			transform = transform.parent;
		}
		return text;
	}

	public static Component GetComponent(GameObject obj, string name)
	{
		return obj.transform.Find(name).GetComponent<Component>();
	}

	public static GameObject GetGameObject(GameObject obj, string name)
	{
		try
		{
			return obj.transform.Find(name).gameObject;
		}
		catch (Exception)
		{
			return null;
		}
	}

	public static Text GetGameObjectText(GameObject obj, string name)
	{
		return obj.transform.Find(name).GetComponent<Text>();
	}

	public static void SetGameObjectActive(GameObject obj, string name, bool setActive)
	{
		Transform transform = obj.transform.Find(name);
		if (transform != null)
		{
			transform.gameObject.SetActive(setActive);
		}
	}

	public static void SetGameObjectText(GameObject obj, string name, string newText)
	{
		Transform transform = obj.transform.Find(name);
		if (transform != null)
		{
			Text component = transform.GetComponent<Text>();
			if (component != null)
			{
				component.text = newText;
			}
		}
	}

	public static Image GetGameObjectImage(GameObject obj, string name)
	{
		return obj.transform.Find(name).GetComponent<Image>();
	}

	public static void SetGameObjectImage(GameObject obj, string name, Sprite sprite)
	{
		Transform transform = obj.transform.Find(name);
		if (transform != null)
		{
			Image component = transform.GetComponent<Image>();
			if (component != null)
			{
				component.sprite = sprite;
			}
		}
	}

	public static void SetGameObjectImageColor(GameObject obj, string name, Color newColor)
	{
		Transform transform = obj.transform.Find(name);
		if (transform != null)
		{
			Image component = transform.GetComponent<Image>();
			if (component != null)
			{
				component.color = newColor;
			}
		}
	}

	public static Button GetGameObjectButton(GameObject obj, string name)
	{
		return obj.transform.Find(name).GetComponent<Button>();
	}

	public static InputField GetGameObjectInputField(GameObject obj, string name)
	{
		return obj.transform.Find(name).GetComponent<InputField>();
	}

	private static float GetColorValue(string s)
	{
		return (float)int.Parse(s.Trim()) / 255f;
	}

	public static Color ParseColor(string rgb)
	{
		string[] array = rgb.Trim().Split(';', ',');
		Color result = default(Color);
		result.r = GetColorValue(array[0]);
		result.g = GetColorValue(array[1]);
		result.b = GetColorValue(array[2]);
		if (array.Length >= 4)
		{
			result.a = GetColorValue(array[3]);
		}
		else
		{
			result.a = 1f;
		}
		return result;
	}

	public static string ColorToHex(Color32 color)
	{
		return color.r.ToString("X2") + color.g.ToString("X2") + color.b.ToString("X2");
	}

	public static int GetCheckSum(string fromString, int maxValue)
	{
		return Mathf.Abs(fromString.GetHashCode()) % maxValue;
	}

	public static double Clamp(double x, double minValue, double maxValue)
	{
		if (!(x < minValue))
		{
			if (!(x > maxValue))
			{
				return x;
			}
			return maxValue;
		}
		return minValue;
	}

	public static long Clamp(long x, long minValue, long maxValue)
	{
		if (x >= minValue)
		{
			if (x <= maxValue)
			{
				return x;
			}
			return maxValue;
		}
		return minValue;
	}

	public static string StringInArray(string[] stringArray, int index, string defaultValue)
	{
		if (stringArray.Length <= index)
		{
			return defaultValue;
		}
		return stringArray[index].Trim();
	}

	public static int StrToIntDef(string s, int @default)
	{
		if (int.TryParse(s, out var result))
		{
			return result;
		}
		return @default;
	}

	public static bool IsBetween(int x, int min, int max)
	{
		if (x >= min)
		{
			return x <= max;
		}
		return false;
	}

	public static string GetDeviceID(bool allowReadFromCache)
	{
		string text = "";
		if (allowReadFromCache)
		{
			string cipherText = PlayerPrefs.GetString(DEVICEID_CACHE, "");
			if (!string.IsNullOrEmpty(text))
			{
				text = DecryptStringAES(cipherText, ID_SHARED_SECRET);
			}
		}
		if (text.Length != 10)
		{
			text = HashToNumbers(SystemInfo.deviceUniqueIdentifier, 10);
			string value = EncryptStringAES(text, ID_SHARED_SECRET);
			PlayerPrefs.SetString(DEVICEID_CACHE, value);
		}
		return text;
	}

	public static string HashToNumbers(string str, int size)
	{
		char[] array = "0123456789".ToCharArray();
		char[] array2 = new char[size];
		for (int i = 0; i < str.Length; i++)
		{
			array2[i % size] = (char)(array2[i % size] ^ str[i]);
		}
		for (int j = 0; j < size; j++)
		{
			array2[j] = array[array2[j] % array.Length];
		}
		return new string(array2);
	}

	public static string MakeCSV(char separator, params object[] columns)
	{
		string text = "";
		foreach (object obj in columns)
		{
			text = text + obj.ToString() + separator;
		}
		if (text.Length > 0)
		{
			text.Remove(text.Length - 1);
		}
		return text;
	}

	public static string OrdinalString(int value, string language)
	{
		string text = value.ToString();
		if (!string.IsNullOrEmpty(language))
		{
			switch (language.ToUpperInvariant())
			{
			case "EN":
			{
				int num = value % 10;
				int num2 = value % 100;
				return num switch
				{
					1 => text + ((num2 == 11) ? "th" : "st"), 
					2 => text + ((num2 == 12) ? "th" : "nd"), 
					3 => text + ((num2 == 13) ? "th" : "rd"), 
					_ => text + "th", 
				};
			}
			case "PT-PT":
			case "PT-BR":
				return text + "º";
			default:
				return text + ".";
			}
		}
		return text + ".";
	}

	public static string GetRandomFileName(bool returnUpperCase)
	{
		string randomFileName = Path.GetRandomFileName();
		randomFileName = randomFileName.Replace(".", "");
		if (returnUpperCase)
		{
			randomFileName = randomFileName.ToUpper();
		}
		randomFileName = randomFileName.Replace("Q", "B");
		randomFileName = randomFileName.Replace("i", "2");
		randomFileName = randomFileName.Replace("I", "2");
		randomFileName = randomFileName.Replace("O", "A");
		randomFileName = randomFileName.Replace("o", "a");
		return randomFileName.Replace("l", "3");
	}

	public static void DeleteOldFiles(string folder, int numDays)
	{
		if (!FileManagement.DirectoryExists(folder))
		{
			return;
		}
		string[] files = Directory.GetFiles(folder);
		foreach (string fileName in files)
		{
			try
			{
				FileInfo fileInfo = new FileInfo(fileName);
				if (fileInfo.LastWriteTimeUtc < DateTime.UtcNow.AddDays(-1 * numDays))
				{
					fileInfo.Delete();
				}
			}
			catch (Exception ex)
			{
				Debug.LogError(ex.Message);
			}
		}
	}

	public static void InitArray(int[] arr, int value)
	{
		for (int i = 0; i < arr.Length; i++)
		{
			arr[i] = value;
		}
	}

	public static string TrimEndCrLf(string value)
	{
		return value.TrimEnd(Environment.NewLine.ToCharArray()).TrimEnd("\n".ToCharArray()).TrimEnd("\r".ToCharArray());
	}

	public static string AttendanceString(long amount)
	{
		return amount.ToString("###,###,##0");
	}

	public static string MoneyString(long amount)
	{
		string arg = amount.ToString("###,###,##0");
		return string.Format(moneyStringTemplate, arg, moneySymbol);
	}

	public static string MoneyStringThousand(long amount)
	{
		string arg = (amount / 1000).ToString("###,###,##0K");
		return string.Format(moneyStringTemplate, arg, moneySymbol);
	}

	public static void UpdateLanguage()
	{
		moneyStringTemplate = LanguageController.instance.Get_Translation("**MONEY_STRING_TEMPLATE");
		moneySymbol = LanguageController.instance.Get_Translation("**MONEY_SYMBOL");
	}

	public static float GetScreenWidth()
	{
		try
		{
			GameObject gameObject = GameObject.Find("_Canvas");
			if (gameObject == null)
			{
				gameObject = GameObject.Find("Canvas");
			}
			return gameObject.GetComponent<RectTransform>().sizeDelta.x;
		}
		catch (Exception ex)
		{
			Debug.LogErrorFormat("Utils.GetScreenWidth() Error: {0}", ex.Message);
		}
		return 0f;
	}

	public static float GetScreenHeight()
	{
		GameObject gameObject = GameObject.Find("_Canvas");
		if (gameObject == null)
		{
			gameObject = GameObject.Find("Canvas");
		}
		return gameObject.GetComponent<CanvasScaler>().referenceResolution.y;
	}

	private int ReadOptionValue(string key, int defaultValue, int usagePermissionLevel, int minValue, int maxValue)
	{
		return Mathf.Clamp(ReadOptionValue(key, defaultValue, usagePermissionLevel), minValue, maxValue);
	}

	private int ReadOptionValue(string key, int defaultValue, int usagePermissionLevel)
	{
		if (GamePermissions.allowed[usagePermissionLevel])
		{
			return PlayerPrefs.GetInt(key, defaultValue);
		}
		return defaultValue;
	}

	private bool ReadOptionValue(string key, bool defaultValue, int usagePermissionLevel)
	{
		return Convert.ToBoolean(ReadOptionValue(key, Convert.ToInt16(defaultValue), usagePermissionLevel));
	}

	public static object ManageOneSystemOption(ManageOption mode, string key, object optionVariable, object defaultValue, ref ListOfParameters listOfParameters)
	{
		EliParameterPermissions[] permissions = new EliParameterPermissions[5]
		{
			EliParameterPermissions.ResetToDefaultValue,
			EliParameterPermissions.ReadFromCache,
			EliParameterPermissions.WriteToCache,
			EliParameterPermissions.DeleteFromCache,
			EliParameterPermissions.EditableAuthor
		};
		return ManageOneOption(mode, key, null, null, null, optionVariable, defaultValue, PermissionLevel.L0_None, ref listOfParameters, -1, -1, permissions);
	}

	public static object ManageOneOption(ManageOption mode, string key, string displayName, string sectionTitle, string sectionSubTitle, object optionVariable, object defaultValue, PermissionLevel usagePermission, ref ListOfParameters listOfParameters, params EliParameterPermissions[] permissions)
	{
		return ManageOneOption(mode, key, displayName, sectionTitle, sectionSubTitle, optionVariable, defaultValue, usagePermission, ref listOfParameters, -1, -1, permissions);
	}

	public static object ManageOneOption(ManageOption mode, string key, string displayName, string sectionTitle, string sectionSubTitle, object optionVariable, object defaultValue, PermissionLevel usagePermission, ref ListOfParameters listOfParameters, Func<object, bool> OnValueChanged, params EliParameterPermissions[] permissions)
	{
		return ManageOneOption(mode, key, displayName, sectionTitle, sectionSubTitle, optionVariable, defaultValue, usagePermission, ref listOfParameters, -1, -1, OnValueChanged, permissions);
	}

	public static object ManageOneOption(ManageOption mode, string key, string displayName, string sectionTitle, string sectionSubTitle, object optionVariable, object defaultValue, PermissionLevel usagePermission, ref ListOfParameters listOfParameters, int minIntValue, int maxIntValue, params EliParameterPermissions[] permissions)
	{
		return ManageOneOption(mode, key, displayName, sectionTitle, sectionSubTitle, optionVariable, defaultValue, usagePermission, ref listOfParameters, minIntValue, maxIntValue, null, permissions);
	}

	public static object ManageOneOption(ManageOption mode, string key, string displayName, string sectionTitle, string sectionSubTitle, object optionVariable, object defaultValue, PermissionLevel usagePermission, ref ListOfParameters listOfParameters, int minIntValue, int maxIntValue, Func<object, bool> OnValueChanged, params EliParameterPermissions[] permissions)
	{
		if (!GamePermissions.allowed[(int)usagePermission])
		{
			return defaultValue;
		}
		PermissionLevel curRegLevel = GamePermissions.GetCurRegLevel();
		key = $"{key} {(int)curRegLevel}";
		switch (mode)
		{
		case ManageOption.ResetDefaultValue:
			if (EliParameter.HasPermission(permissions, EliParameterPermissions.ResetToDefaultValue))
			{
				return defaultValue;
			}
			return optionVariable;
		case ManageOption.DeleteFromCache:
			if (EliParameter.HasPermission(permissions, EliParameterPermissions.DeleteFromCache))
			{
				PlayerPrefs.DeleteKey(key);
			}
			break;
		case ManageOption.WriteToCache:
			if (!EliParameter.HasPermission(permissions, EliParameterPermissions.WriteToCache))
			{
				return optionVariable;
			}
			if (optionVariable is bool)
			{
				int value = Convert.ToInt16(optionVariable);
				PlayerPrefs.SetInt(key, value);
				break;
			}
			if (optionVariable is short)
			{
				int value2 = Convert.ToInt16(optionVariable);
				PlayerPrefs.SetInt(key, value2);
				break;
			}
			if (optionVariable is int)
			{
				int value3 = Convert.ToInt32(optionVariable);
				PlayerPrefs.SetInt(key, value3);
				break;
			}
			if (optionVariable is long)
			{
				PlayerPrefs.SetString(key, Convert.ToInt64(optionVariable).ToString());
				break;
			}
			if (optionVariable is double)
			{
				float value4 = (float)Convert.ToDouble(optionVariable);
				PlayerPrefs.SetFloat(key, value4);
				break;
			}
			if (optionVariable == null)
			{
				optionVariable = string.Empty;
			}
			PlayerPrefs.SetString(key, optionVariable.ToString());
			return optionVariable;
		case ManageOption.ReadFromCache:
		{
			if (!EliParameter.HasPermission(permissions, EliParameterPermissions.ReadFromCache))
			{
				return defaultValue;
			}
			if (optionVariable is bool)
			{
				return Convert.ToBoolean(PlayerPrefs.GetInt(key, Convert.ToInt16(defaultValue)));
			}
			if (optionVariable is int || optionVariable is short || optionVariable is int)
			{
				int num = PlayerPrefs.GetInt(key, Convert.ToInt32(defaultValue));
				if (EliParameter.HasPermission(permissions, EliParameterPermissions.LimitedInt))
				{
					num = Mathf.Clamp(num, minIntValue, maxIntValue);
				}
				return num;
			}
			if (optionVariable is long)
			{
				long num2 = Convert.ToInt64(PlayerPrefs.GetString(key, defaultValue.ToString()));
				if (EliParameter.HasPermission(permissions, EliParameterPermissions.LimitedInt))
				{
					num2 = Convert.ToInt64(Mathf.Clamp((float)num2 * 1f, (float)minIntValue * 1f, (float)maxIntValue * 1f));
				}
				return num2;
			}
			if (optionVariable is double)
			{
				return PlayerPrefs.GetFloat(key, (float)Convert.ToDouble(defaultValue));
			}
			string text;
			if (defaultValue == null)
			{
				text = PlayerPrefs.GetString(key, null);
				if (text.Length == 0)
				{
					text = null;
				}
			}
			else
			{
				text = PlayerPrefs.GetString(key, Convert.ToString(defaultValue));
			}
			return text;
		}
		case ManageOption.CreateParameter:
		{
			if (listOfParameters == null)
			{
				return null;
			}
			if (displayName == null)
			{
				return optionVariable;
			}
			bool flag = false;
			if (EliParameter.HasPermission(permissions, EliParameterPermissions.EditablePublic))
			{
				flag = true;
			}
			if (!flag)
			{
				return optionVariable;
			}
			if (EliParameter.HasPermission(permissions, EliParameterPermissions.ResetBeforeEdit))
			{
				optionVariable = defaultValue;
			}
			if (sectionTitle != null)
			{
				string text2 = LanguageController.instance.Get_Translation(sectionTitle);
				string text3 = LanguageController.instance.Get_Translation(sectionSubTitle);
				if (listOfParameters.LastSectionName != text2)
				{
					listOfParameters.StartSection(text2);
				}
				if (listOfParameters.LastSubSectionName != text3 && text3 != null)
				{
					listOfParameters.StartSubSection(text3);
				}
			}
			if (EliParameter.HasPermission(permissions, EliParameterPermissions.LimitedInt))
			{
				listOfParameters.RegisterParameter(key, displayName, (int)optionVariable, minIntValue, maxIntValue, OnValueChanged);
				break;
			}
			if (optionVariable is bool)
			{
				listOfParameters.RegisterParameter(key, displayName, (bool)optionVariable, EliParameter.HasPermission(permissions, EliParameterPermissions.RadioButton), OnValueChanged);
			}
			else if (optionVariable is short)
			{
				listOfParameters.RegisterParameter(key, displayName, (short)optionVariable);
			}
			else if (optionVariable is int)
			{
				listOfParameters.RegisterParameter(key, displayName, (int)optionVariable);
			}
			else if (optionVariable is long)
			{
				listOfParameters.RegisterParameter(key, displayName, (long)optionVariable);
			}
			else
			{
				listOfParameters.RegisterParameter(key, displayName, (string)optionVariable);
			}
			return optionVariable;
		}
		case ManageOption.ReadParameter:
		{
			if (listOfParameters == null)
			{
				return defaultValue;
			}
			if (displayName == null)
			{
				return optionVariable;
			}
			object obj = null;
			if (optionVariable is bool)
			{
				return listOfParameters.GetParameterValue(key, (bool)defaultValue);
			}
			if (optionVariable is short)
			{
				return listOfParameters.GetParameterValue(key, (int)defaultValue);
			}
			if (optionVariable is int)
			{
				return listOfParameters.GetParameterValue(key, (int)defaultValue);
			}
			if (optionVariable is long)
			{
				return listOfParameters.GetParameterValue(key, (int)defaultValue);
			}
			return listOfParameters.GetParameterValue(key, (string)defaultValue);
		}
		}
		return optionVariable;
	}

	public static string EncryptStringAES(string plainText, string sharedSecret)
	{
		if (string.IsNullOrEmpty(plainText))
		{
			throw new ArgumentNullException("plainText");
		}
		if (string.IsNullOrEmpty(sharedSecret))
		{
			throw new ArgumentNullException("sharedSecret");
		}
		string text = null;
		RijndaelManaged rijndaelManaged = null;
		try
		{
			Rfc2898DeriveBytes rfc2898DeriveBytes = new Rfc2898DeriveBytes(sharedSecret, _salt);
			rijndaelManaged = new RijndaelManaged();
			rijndaelManaged.Key = rfc2898DeriveBytes.GetBytes(rijndaelManaged.KeySize / 8);
			ICryptoTransform transform = rijndaelManaged.CreateEncryptor(rijndaelManaged.Key, rijndaelManaged.IV);
			using MemoryStream memoryStream = new MemoryStream();
			memoryStream.Write(BitConverter.GetBytes(rijndaelManaged.IV.Length), 0, 4);
			memoryStream.Write(rijndaelManaged.IV, 0, rijndaelManaged.IV.Length);
			using (CryptoStream stream = new CryptoStream(memoryStream, transform, CryptoStreamMode.Write))
			{
				using StreamWriter streamWriter = new StreamWriter(stream);
				streamWriter.Write(plainText);
			}
			return Convert.ToBase64String(memoryStream.ToArray());
		}
		finally
		{
			rijndaelManaged?.Clear();
		}
	}

	public static string DecryptStringAES(string cipherText, string sharedSecret)
	{
		if (string.IsNullOrEmpty(cipherText))
		{
			throw new ArgumentNullException("cipherText");
		}
		if (string.IsNullOrEmpty(sharedSecret))
		{
			throw new ArgumentNullException("sharedSecret");
		}
		RijndaelManaged rijndaelManaged = null;
		string text = null;
		try
		{
			Rfc2898DeriveBytes rfc2898DeriveBytes = new Rfc2898DeriveBytes(sharedSecret, _salt);
			using MemoryStream memoryStream = new MemoryStream(Convert.FromBase64String(cipherText));
			rijndaelManaged = new RijndaelManaged();
			rijndaelManaged.Key = rfc2898DeriveBytes.GetBytes(rijndaelManaged.KeySize / 8);
			rijndaelManaged.IV = ReadByteArray(memoryStream);
			ICryptoTransform transform = rijndaelManaged.CreateDecryptor(rijndaelManaged.Key, rijndaelManaged.IV);
			using CryptoStream stream = new CryptoStream(memoryStream, transform, CryptoStreamMode.Read);
			using StreamReader streamReader = new StreamReader(stream);
			return streamReader.ReadToEnd();
		}
		finally
		{
			rijndaelManaged?.Clear();
		}
	}

	private static byte[] ReadByteArray(Stream s)
	{
		byte[] array = new byte[4];
		if (s.Read(array, 0, array.Length) != array.Length)
		{
			throw new SystemException("Stream did not contain properly formatted byte array");
		}
		byte[] array2 = new byte[BitConverter.ToInt32(array, 0)];
		if (s.Read(array2, 0, array2.Length) != array2.Length)
		{
			throw new SystemException("Did not read byte array properly");
		}
		return array2;
	}

	public static bool IsValueType(Type type)
	{
		return type.IsValueType;
	}

	public static PropertyInfo GetProperty(Type type, string name)
	{
		return type.GetProperty(name);
	}

	public static MethodInfo GetMethod(Type type, string name)
	{
		return type.GetMethod(name);
	}

	public static bool IsEnum(Type type)
	{
		return type.IsEnum;
	}

	public static FieldInfo GetField(Type type, string name)
	{
		return type.GetField(name);
	}

	public static Delegate CreateDelegate(Type type, object target, MethodInfo method)
	{
		return Delegate.CreateDelegate(type, target, method);
	}

	public static bool IsAssignableFrom(Type first, Type second)
	{
		return first.IsAssignableFrom(second);
	}

	public static UnityEngine.Object LoadSprite(ResourceType resourceType, string resourceName)
	{
		if (resourceDictionary.ContainsKey(resourceType, resourceName))
		{
			return resourceDictionary[resourceType, resourceName];
		}
		UnityEngine.Object obj = null;
		switch (resourceType)
		{
		case ResourceType.Sprite:
			obj = Resources.Load(resourceName, typeof(Sprite));
			break;
		case ResourceType.Font:
			obj = Resources.Load(resourceName, typeof(Font));
			break;
		}
		if (obj != null)
		{
			resourceDictionary.Add(resourceType, resourceName, obj);
		}
		return obj;
	}

	public static Sprite LoadSprite(string resourceName)
	{
		return LoadSprite(ResourceType.Sprite, resourceName) as Sprite;
	}

	public static Font LoadFont(string resourceName)
	{
		return (Font)LoadSprite(ResourceType.Font, resourceName);
	}

	public static IEnumerator Call<T, U>(MonoBehaviour script, string url, T formStruct, Action<U[]> RequestSuccess, Action RequestFailed) where T : struct
	{
		yield return script.StartCoroutine(AskGUID(url));
		if (!string.IsNullOrEmpty(guidReceived))
		{
			url = GetForm(url, formStruct) + "&gri=" + guidReceived;
			UnityWebRequest webRequest = UnityWebRequest.Get(url);
			webRequest.timeout = 60;
			yield return webRequest.SendWebRequest();
			WebRequestCallback(webRequest, RequestSuccess, RequestFailed);
		}
		else
		{
			Debug.LogError("Call<T,U>: Failed to obtain GUID from server");
			RequestFailed?.Invoke();
		}
	}

	public static IEnumerator Call<T, U>(MonoBehaviour script, string url, T formStruct, Action<U[]> RequestSuccess, Action<string> RequestFailed) where T : struct
	{
		if (Application.internetReachability == NetworkReachability.NotReachable)
		{
			RequestFailed?.Invoke(noInternetCode);
			yield break;
		}
		yield return script.StartCoroutine(AskGUID(url));
		if (!string.IsNullOrEmpty(guidReceived))
		{
			url = GetForm(url, formStruct) + "&gri=" + guidReceived;
			UnityWebRequest webRequest = UnityWebRequest.Get(url);
			webRequest.timeout = 60;
			yield return webRequest.SendWebRequest();
			WebRequestCallback(webRequest, RequestSuccess, RequestFailed);
		}
		else
		{
			Debug.LogError("Call<T,U>: Failed to obtain GUID from server");
			RequestFailed?.Invoke(serverErrorCode);
		}
	}

	public static IEnumerator SendPointsToServer<T>(MonoBehaviour script, string url, T formStruct, Coach coach, Action<Coach> RequestSuccess, Action<Coach> RequestFailed) where T : struct
	{
		yield return script.StartCoroutine(AskGUID(url));
		if (!string.IsNullOrEmpty(guidReceived))
		{
			url = GetForm(url, formStruct) + "&gri=" + guidReceived;
			UnityWebRequest webRequest = UnityWebRequest.Get(url);
			webRequest.timeout = 60;
			yield return webRequest.SendWebRequest();
			if (NoErrorsHappened(webRequest))
			{
				RequestSuccess?.Invoke(coach);
			}
			else
			{
				RequestFailed?.Invoke(coach);
			}
			webRequest.Dispose();
		}
		else
		{
			Debug.LogError("SendPointsToServer: Failed to obtain GUID from server");
			RequestFailed?.Invoke(coach);
		}
	}

	public static IEnumerator Call<T>(MonoBehaviour script, string url, T formStruct, Action RequestSuccess, Action RequestFailed) where T : struct
	{
		yield return script.StartCoroutine(AskGUID(url));
		if (!string.IsNullOrEmpty(guidReceived))
		{
			url = GetForm(url, formStruct) + "&gri=" + guidReceived;
			UnityWebRequest webRequest = UnityWebRequest.Get(url);
			webRequest.timeout = 60;
			yield return webRequest.SendWebRequest();
			WebRequestCallback(webRequest, RequestSuccess, RequestFailed);
		}
		else
		{
			Debug.LogError("Call<T>: Failed to obtain GUID from server");
			RequestFailed?.Invoke();
		}
	}

	public static IEnumerator GetDbTeamsFile<T>(MonoBehaviour script, T formStruct, Action<float> progressAction, Action<DbTeams> RequestSuccess, Action RequestFailed) where T : struct
	{
		yield return script.StartCoroutine(AskGUID("getfile"));
		if (!string.IsNullOrEmpty(guidReceived))
		{
			string url = ElifootUrlManager.GetCommandUrl("getfile") + "&nocrypt=1&nocs=1&json=1";
			url = GetForm(url, formStruct) + "&gri=" + guidReceived;
			UnityWebRequest webRequest = UnityWebRequest.Get(url);
			webRequest.timeout = 120;
			webRequest.SendWebRequest();
			while (!webRequest.downloadHandler.isDone)
			{
				progressAction?.Invoke(webRequest.downloadProgress * 100f);
				yield return new WaitForEndOfFrame();
			}
			progressAction?.Invoke(100f);
			yield return new WaitForEndOfFrame();
			yield return new WaitForEndOfFrame();
			if (NoErrorsHappened(webRequest))
			{
				try
				{
					DbTeams dbTeams = ScriptableObject.CreateInstance<DbTeams>();
					JsonUtility.FromJsonOverwrite(webRequest.downloadHandler.text, dbTeams);
					RequestSuccess?.Invoke(dbTeams);
				}
				catch (Exception arg)
				{
					Debug.LogError($"GetDbTeamsFile JSON parse error: {arg}");
					RequestFailed?.Invoke();
				}
			}
			else
			{
				Debug.LogError("GetDbTeamsFile network error: " + webRequest.error);
				RequestFailed?.Invoke();
			}
			webRequest.Dispose();
		}
		else
		{
			Debug.LogError("GetDbTeamsFile: Failed to obtain GUID from server");
			RequestFailed?.Invoke();
		}
	}

	public static IEnumerator AskGUID(string nextUrl)
	{
		Debug.Log(nextUrl);
		string text2;
		try
		{
			string text = nextUrl.Substring(0, nextUrl.IndexOf(".asp?"));
			text2 = text.Substring(text.LastIndexOf('/') + 1);
		}
		catch (Exception)
		{
			text2 = null;
		}
		string nextCommand;
		if (text2 == null || text2 == "")
		{
			try
			{
				Uri uri = new Uri(nextUrl);
				nextCommand = Path.GetFileNameWithoutExtension(uri.LocalPath);
			}
			catch (Exception)
			{
				nextCommand = nextUrl;
			}
		}
		else
		{
			nextCommand = text2;
		}
		guidReceived = "";
		string uri2 = ElifootUrlManager.GetCommandUrl("gri") + "&nocrypt=1&nocs=1&json=1&next=" + nextCommand;
		UnityWebRequest webRequest = UnityWebRequest.Get(uri2);
		webRequest.timeout = 60;
		yield return webRequest.SendWebRequest();
		if (NoErrorsHappened(webRequest))
		{
			guidReceived = UnityWebRequest.EscapeURL(ReadGUID(webRequest.downloadHandler.text));
		}
		else
		{
			Debug.LogError("AskGUID failed for '" + nextCommand + "': " + webRequest.error);
		}
	}

	private static string ReadGUID(string webAnswer)
	{
		string[] array = webAnswer.Split('\n');
		if (array.Length < 2)
		{
			return "";
		}
		array = array[1].Split(';');
		if (array.Length != 2)
		{
			return "";
		}
		return array[1].Trim();
	}

	public static void WebRequestCallback<U>(UnityWebRequest webRequest, Action<U[]> RequestSuccess, Action RequestFailed)
	{
		if (NoErrorsHappened(webRequest))
		{
			try
			{
				JSONNode jSONNode = ((JSONClass)JSONNode.Parse(webRequest.downloadHandler.text))["data"];
				if (jSONNode.Count > 0)
				{
					U[] array = new U[jSONNode.Count];
					for (int i = 0; i < jSONNode.Count; i++)
					{
						array[i] = JsonUtility.FromJson<U>(jSONNode[i].ToString());
					}
					RequestSuccess?.Invoke(array);
				}
				else
				{
					RequestSuccess?.Invoke(null);
				}
			}
			catch (Exception arg)
			{
				Debug.LogError($"WebRequestCallback JSON parse error: {arg}");
				RequestFailed?.Invoke();
			}
		}
		else
		{
			RequestFailed?.Invoke();
		}
		webRequest.Dispose();
	}

	public static void WebRequestCallback<U>(UnityWebRequest webRequest, Action<U[]> RequestSuccess, Action<string> RequestFailed)
	{
		if (NoErrorsHappened(webRequest))
		{
			try
			{
				JSONNode jSONNode = ((JSONClass)JSONNode.Parse(webRequest.downloadHandler.text))["data"];
				if (jSONNode.Count > 0)
				{
					U[] array = new U[jSONNode.Count];
					for (int i = 0; i < jSONNode.Count; i++)
					{
						array[i] = JsonUtility.FromJson<U>(jSONNode[i].ToString());
					}
					RequestSuccess?.Invoke(array);
				}
				else
				{
					RequestSuccess?.Invoke(null);
				}
			}
			catch (Exception arg)
			{
				Debug.LogError($"WebRequestCallback JSON parse error: {arg}");
				RequestFailed?.Invoke(serverErrorCode);
			}
		}
		else
		{
			RequestFailed?.Invoke(webRequest.error);
		}
		webRequest.Dispose();
	}

	public static void WebRequestCallback(UnityWebRequest webRequest, Action RequestSuccess, Action RequestFailed)
	{
		if (NoErrorsHappened(webRequest))
		{
			RequestSuccess?.Invoke();
		}
		else
		{
			RequestFailed?.Invoke();
		}
		webRequest.Dispose();
	}

	public static string GetForm<T>(string url, T formStruct) where T : struct
	{
		FieldInfo[] fields = formStruct.GetType().GetFields();
		for (int i = 0; i < fields.Length; i++)
		{
			object value = fields[i].GetValue(formStruct);
			url = url + "&" + fields[i].Name + "=" + UnityWebRequest.EscapeURL(value.ToString());
		}
		return url;
	}

	private static bool NoErrorsHappened(UnityWebRequest webRequest)
	{
		if (webRequest.result != UnityWebRequest.Result.Success)
		{
			Debug.LogError($"Web request failed: result={webRequest.result}, code={webRequest.responseCode}, error={webRequest.error}");
			return false;
		}
		return true;
	}

	public static string StringToHex(string source)
	{
		StringBuilder stringBuilder = new StringBuilder();
		byte[] bytes = Encoding.Unicode.GetBytes(source);
		foreach (byte b in bytes)
		{
			stringBuilder.Append(b.ToString("X2"));
		}
		return stringBuilder.ToString();
	}

	public static string HexString(string hexString)
	{
		byte[] array = new byte[hexString.Length / 2];
		for (int i = 0; i < array.Length; i++)
		{
			array[i] = Convert.ToByte(hexString.Substring(i * 2, 2), 16);
		}
		return Encoding.Unicode.GetString(array);
	}

	public static string Encrypt(string inputStr, string key)
	{
		byte[] bytes = Encoding.Unicode.GetBytes(inputStr);
		byte[] bytes2 = Encoding.Unicode.GetBytes(key);
		byte[] array = new byte[0];
		int num = 0;
		for (int i = 0; i < bytes.Length; i++)
		{
			array = new byte[0];
			for (int j = 0; j < bytes.Length; j++)
			{
				int num2 = bytes[j] + bytes[(j + 1) % bytes.Length];
				num2 -= 48;
				if (num2 < 0)
				{
					num2 += 255;
				}
				for (num2 += bytes2[num]; num2 > 255; num2 -= 255)
				{
				}
				Array.Resize(ref array, array.Length + 1);
				array[^1] = (byte)(num2 % 256);
				num = (num + 1) % bytes2.Length;
			}
			array.CopyTo(bytes, 0);
		}
		string text = "";
		for (int k = 0; k < array.Length; k++)
		{
			text += array[k].ToString("X2");
		}
		return text;
	}

	public static void DoNothing()
	{
	}
}
