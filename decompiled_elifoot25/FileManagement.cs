using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using UnityEngine;

public static class FileManagement
{
	private static readonly byte[] key;

	private static string[] blocks;

	public static FM_StringMode stringConversion;

	private static string persistentDataPath;

	private static string streamingAssetsPath;

	static FileManagement()
	{
		key = new byte[16]
		{
			217, 134, 151, 168, 185, 202, 129, 135, 150, 130,
			141, 201, 210, 167, 198, 169
		};
		stringConversion = FM_StringMode.UTF8;
		persistentDataPath = Application.persistentDataPath;
		streamingAssetsPath = Application.streamingAssetsPath;
	}

	public static void SaveRawFile(string name, byte[] content, bool enc = false, bool fullPath = false)
	{
		if (name != "")
		{
			if (!fullPath)
			{
				name = Combine(persistentDataPath, name);
			}
			if (content != null)
			{
				CreateDirectory(GetParentDirectory(name));
				if (enc)
				{
					File.WriteAllBytes(name, Encrypt(content, key));
				}
				else
				{
					File.WriteAllBytes(name, content);
				}
			}
			else
			{
				UnityEngine.Debug.LogError("[FileManagement.SaveRawFile] Exception: Trying to save null data.");
			}
		}
		else
		{
			UnityEngine.Debug.LogError("[FileManagemnt.SaveRawFile] Can't save an unnamed file.");
		}
	}

	public static byte[] ReadRawFile(string name, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		byte[] array = new byte[0];
		string text = name;
		if (name != "")
		{
			if (FileExists(text, checkSA, fullPath))
			{
				if (!fullPath)
				{
					if (FileExists(name, checkSA: false))
					{
						text = Combine(persistentDataPath, name);
					}
					else if (checkSA)
					{
						text = Combine(streamingAssetsPath, name);
					}
				}
				if (text.Contains("://") && Application.platform == RuntimePlatform.Android)
				{
					WWW wWW = new WWW(text);
					while (!wWW.isDone)
					{
					}
					if (string.IsNullOrEmpty(wWW.error))
					{
						array = wWW.bytes;
					}
					else
					{
						UnityEngine.Debug.LogError("[FileManagement.ReadRawFile] WWW error: " + wWW.error);
					}
				}
				else
				{
					array = File.ReadAllBytes(text);
				}
			}
			else
			{
				UnityEngine.Debug.LogWarning("[FileManagement.ReadRawFile] File not found: " + text);
			}
			if (array.Length != 0 && enc)
			{
				array = Decrypt(array, key);
			}
		}
		else
		{
			UnityEngine.Debug.LogError("[FileManagement.ReadRawFile] Can't read an unnamed file.");
		}
		return array;
	}

	public static void DeleteFile(string name, bool fullPath = false)
	{
		if (FileExists(name, checkSA: false, fullPath))
		{
			if (!fullPath)
			{
				name = Combine(persistentDataPath, name);
			}
			File.Delete(name);
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.DeleteFile] File not found: " + name);
		}
	}

	private static bool CheckNameOnIndex(string name, string type)
	{
		if (blocks == null)
		{
			string text = Combine(streamingAssetsPath, "FMSA_Index");
			byte[] array = new byte[0];
			if (text.Contains("://") && Application.platform == RuntimePlatform.Android)
			{
				WWW wWW = new WWW(text);
				while (!wWW.isDone)
				{
				}
				if (string.IsNullOrEmpty(wWW.error))
				{
					array = wWW.bytes;
				}
			}
			else
			{
				text = NormalizePath(text);
				array = ((!File.Exists(text)) ? new byte[0] : File.ReadAllBytes(text));
			}
			if (array != null)
			{
				blocks = ByteArrayToString(array).Split('|');
			}
			else
			{
				UnityEngine.Debug.LogWarning("[FileManagement.CheckNameOnIndex] Index file not found: " + text);
			}
		}
		name = name.Replace('\\', '/');
		for (int i = 0; i < blocks.Length; i++)
		{
			string[] array2 = blocks[i].Split(';');
			for (int j = 0; j < array2.Length; j++)
			{
				string[] array3 = array2[j].Split(',');
				array3[0] = array3[0].Replace('\\', '/');
				if (name == array3[0] && type == array3[1])
				{
					return true;
				}
			}
		}
		return false;
	}

	private static string[] GetNamesOnIndex(string name, string type)
	{
		if (blocks == null)
		{
			CheckNameOnIndex("", "");
		}
		List<string> list = new List<string>();
		name = name.Replace("//", "/");
		name = name.Replace('\\', '/');
		bool flag = false;
		for (int i = 0; i < blocks.Length; i++)
		{
			string[] array = blocks[i].Split(';');
			for (int j = 0; j < array.Length; j++)
			{
				string[] array2 = array[j].Split(',');
				array2[0] = NormalizePath(array2[0]);
				if (array2[0].StartsWith(name) && type == array2[1])
				{
					list.Add(array2[0]);
					flag = true;
				}
			}
			if (flag)
			{
				break;
			}
		}
		return list.ToArray();
	}

	public static AudioClip ImportAudio(string file, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		if (!fullPath)
		{
			if (FileExists(file, checkSA: false))
			{
				file = Combine(persistentDataPath, file);
				file = "file:///" + file;
			}
			else if (checkSA)
			{
				file = Combine(streamingAssetsPath, file);
				if (Application.platform != RuntimePlatform.Android)
				{
					file = "file:///" + file;
				}
			}
		}
		else
		{
			file = "file:///" + file;
		}
		WWW wWW = new WWW(file);
		while (!wWW.isDone)
		{
		}
		if (string.IsNullOrEmpty(wWW.error))
		{
			AudioClip audioClip = wWW.GetAudioClip(threeD: true);
			audioClip.name = GetFileNameWithoutExtension(file);
			return audioClip;
		}
		UnityEngine.Debug.LogError("[FileManagement.ImportAudio] WWW error: " + wWW.error);
		return null;
	}

	public static void SaveAudio(string name, AudioClip clip, bool enc = false, bool fullPath = false)
	{
		byte[] content = OpenWavParser.AudioClipToByteArray(clip);
		if (!name.EndsWith(".wav") && !name.EndsWith(".WAV"))
		{
			name += ".wav";
		}
		SaveRawFile(name, content, enc, fullPath);
	}

	public static bool FileExists(string name, bool checkSA = true, bool fullPath = false)
	{
		bool flag = false;
		if (!fullPath)
		{
			flag = File.Exists(Combine(persistentDataPath, name));
			if (!flag && checkSA)
			{
				flag = File.Exists(Combine(streamingAssetsPath, name));
			}
		}
		else
		{
			flag = File.Exists(name);
		}
		return flag;
	}

	public static void SaveFile<T>(string name, T content, bool enc = false, bool fullPath = false)
	{
		byte[] content2 = StringToByteArray(content.ToString());
		SaveRawFile(name, content2, enc, fullPath);
	}

	public static T ReadFile<T>(string name, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		byte[] array = new byte[0];
		string text = "";
		T result = default(T);
		array = ReadRawFile(name, enc, checkSA, fullPath);
		if (array.Length != 0)
		{
			text = ByteArrayToString(array);
			try
			{
				result = CustomParser<T>(text);
				return result;
			}
			catch (FormatException)
			{
				UnityEngine.Debug.LogError("[FileManagement.ReadFile] Exception: FormatException - Trying to read data in the wrong format. (" + typeof(T)?.ToString() + "): " + name);
			}
			return result;
		}
		return default(T);
	}

	public static void SaveArray<T>(string name, T[] content, char separator = '\t', bool enc = false, bool fullPath = false)
	{
		string text = "";
		for (int i = 0; i < content.Length; i++)
		{
			text += content[i].ToString();
			if (i < content.Length - 1)
			{
				text += separator;
			}
		}
		if (content.Length != 0)
		{
			SaveFile(name, text, enc, fullPath);
		}
		else
		{
			UnityEngine.Debug.LogError("[FileManagement.SaveArray] Trying to save empty array: " + name);
		}
	}

	public static void SaveArray<T>(string name, List<T> content, char separator = '\t', bool enc = false, bool fullPath = false)
	{
		SaveArray(name, content.ToArray(), separator, enc, fullPath);
	}

	public static T[] ReadArray<T>(string name, char separator = '\t', bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		return ReadList<T>(name, separator, enc, checkSA, fullPath).ToArray();
	}

	public static T[] ReadArray<T>(string name, string[] separator, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		return ReadList<T>(name, separator, enc, checkSA, fullPath).ToArray();
	}

	public static List<T> ReadList<T>(string name, char separator = '\t', bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		List<T> list = new List<T>();
		string text = ReadFile<string>(name, enc, checkSA, fullPath);
		if (!string.IsNullOrEmpty(text))
		{
			string[] array = text.Split(separator);
			for (int i = 0; i < array.Length; i++)
			{
				list.Add(CustomParser<T>(array[i]));
			}
		}
		return list;
	}

	public static List<T> ReadList<T>(string name, string[] separator, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		List<T> list = new List<T>();
		string text = ReadFile<string>(name, enc, checkSA, fullPath);
		if (!string.IsNullOrEmpty(text))
		{
			string[] array = text.Split(separator, StringSplitOptions.None);
			for (int i = 0; i < array.Length; i++)
			{
				list.Add(CustomParser<T>(array[i]));
			}
		}
		return list;
	}

	public static string[] ReadAllLines(string name, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		string[] separator = new string[3] { "\r\n", "\n", "\r" };
		return ReadArray<string>(name, separator, enc, checkSA, fullPath);
	}

	public static FM_IniFile ImportIniFile(string name, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		return new FM_IniFile(name, enc, checkSA, fullPath);
	}

	public static Texture2D ImportTexture(string file, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		byte[] data = ReadRawFile(file, enc, checkSA, fullPath);
		Texture2D texture2D = new Texture2D(2, 2);
		texture2D.LoadImage(data);
		texture2D.Apply();
		return texture2D;
	}

	public static Sprite ImportSprite(string file, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		Sprite result = null;
		Texture2D texture2D = ImportTexture(file, enc, checkSA, fullPath);
		texture2D.Apply();
		if (texture2D.width >= 32 && texture2D.height >= 32)
		{
			result = Sprite.Create(texture2D, new Rect(new Vector2(0f, 0f), new Vector2(texture2D.width, texture2D.height)), new Vector2(0f, 0f));
		}
		return result;
	}

	public static void SaveJpgTexture(string name, Texture texture, int quality = 75, bool enc = false, bool fullPath = false)
	{
		Texture2D tex = (Texture2D)texture;
		SaveRawFile(name, tex.EncodeToJPG(quality), enc, fullPath);
	}

	public static void SavePngTexture(string name, Texture texture, bool enc = false, bool fullPath = false)
	{
		Texture2D tex = (Texture2D)texture;
		SaveRawFile(name, tex.EncodeToPNG(), enc, fullPath);
	}

	public static void AddLogLine(string name, string content, bool deleteDate = false, bool enc = false, bool fullPath = false)
	{
		string text = ReadFile<string>(name, enc, checkSA: false, fullPath);
		if (text == null)
		{
			text = ((!deleteDate) ? (DateTime.Now.ToString() + " - " + content) : content);
		}
		else
		{
			text += Environment.NewLine;
			text = ((!deleteDate) ? (text + DateTime.Now.ToString() + " - " + content) : (text + content));
		}
		SaveFile(name, text, enc, fullPath);
	}

	public static void AddRawData(string name, byte[] content, bool enc = false, bool fullPath = false)
	{
		byte[] array = ReadRawFile(name, enc, checkSA: true, fullPath);
		byte[] array2 = new byte[array.Length + content.Length];
		Buffer.BlockCopy(array, 0, array2, 0, array.Length);
		Buffer.BlockCopy(content, 0, array2, array.Length, content.Length);
		SaveRawFile(name, array2, enc, fullPath);
	}

	public static bool DirectoryExists(string folder, bool checkSA = true, bool fullPath = false)
	{
		bool flag = false;
		if (!fullPath)
		{
			flag = Directory.Exists(Combine(persistentDataPath, folder));
			if (!flag && checkSA)
			{
				flag = Directory.Exists(Combine(streamingAssetsPath, folder));
			}
		}
		else
		{
			flag = Directory.Exists(folder);
		}
		return flag;
	}

	public static void CreateDirectory(string name, bool fullPath = false)
	{
		if (!fullPath)
		{
			name = Combine(persistentDataPath, name);
		}
		Directory.CreateDirectory(name);
	}

	public static void DeleteDirectory(string name, bool fullPath = false)
	{
		if (DirectoryExists(name, checkSA: false, fullPath))
		{
			if (!fullPath)
			{
				name = Combine(persistentDataPath, name);
			}
			Directory.Delete(name, recursive: true);
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.DeleteDirectory] Can't delete, directory not found: " + name);
		}
	}

	public static void EmptyDirectory(string name = "", bool filesOnly = true, bool fullPath = false)
	{
		if (DirectoryExists(name, checkSA: false, fullPath))
		{
			string[] array = ListFiles(name, checkSA: false, fullPath);
			for (int i = 0; i < array.Length; i++)
			{
				DeleteFile(Combine(name, array[i]), fullPath);
			}
			if (!filesOnly)
			{
				string[] array2 = ListDirectories(name, checkSA: false, fullPath);
				for (int j = 0; j < array2.Length; j++)
				{
					DeleteDirectory(Combine(name, array2[j]), fullPath);
				}
			}
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.EmptyDirectory] Can't delete folder content, folder not found: " + name);
		}
	}

	public static string[] ListFiles(string folder, bool checkSA = true, bool fullPath = false)
	{
		string[] array = null;
		try
		{
			if (!fullPath)
			{
				string path = Combine(persistentDataPath, folder);
				path = NormalizePath(path);
				if (DirectoryExists(path, checkSA: false, fullPath: true))
				{
					array = Directory.GetFiles(path);
					array = FilterPathNames(array);
				}
				if (checkSA)
				{
					path = Combine(streamingAssetsPath, folder);
					path = NormalizePath(path);
					if (DirectoryExists(path, checkSA: false, fullPath: true))
					{
						if (array != null)
						{
							string[] files = Directory.GetFiles(path);
							files = FilterPathNames(files);
							array = array.Union(files).ToArray();
						}
						else
						{
							array = Directory.GetFiles(path);
							array = FilterPathNames(array);
						}
					}
				}
			}
			else if (DirectoryExists(folder, checkSA: false, fullPath: true))
			{
				array = Directory.GetFiles(folder);
				array = FilterPathNames(array);
			}
			SortPathNames(array);
			if (array == null)
			{
				UnityEngine.Debug.LogWarning("[FileManagement.ListFiles] Can't read folder content, folder not found: " + folder);
			}
			return array;
		}
		catch (Exception ex)
		{
			UnityEngine.Debug.LogError("[FileManagement.ListFiles] Error: " + ex.Message);
			return array;
		}
	}

	public static string[] ListFiles(string folder, string[] filter, bool checkSA = true, bool fullPath = false, bool subfolders = false)
	{
		List<string> list = new List<string>();
		string[] array = ListFiles(folder, checkSA, fullPath);
		if (filter.Length != 0 && array != null)
		{
			for (int i = 0; i < array.Length; i++)
			{
				for (int j = 0; j < filter.Length; j++)
				{
					if (filter[j] == "" || filter[j].ToLower() == GetFileExtension(array[i]).ToLower())
					{
						list.Add(array[i]);
						break;
					}
				}
			}
		}
		if (subfolders)
		{
			string[] array2 = ListDirectories(folder, checkSA, fullPath);
			if (array2 != null && array2.Length != 0)
			{
				for (int k = 0; k < array2.Length; k++)
				{
					string text = Combine(folder, array2[k]);
					string[] array3 = ListFiles(text, filter, checkSA, fullPath, subfolders);
					if (array3 != null)
					{
						for (int l = 0; l < array3.Length; l++)
						{
							list.Add(Combine(text, array3[l]));
						}
					}
				}
			}
		}
		return list.ToArray();
	}

	public static string[] ListDirectories(string folder, bool checkSA = true, bool fullPath = false)
	{
		string[] array = null;
		try
		{
			if (!fullPath)
			{
				string text = Combine(persistentDataPath, folder);
				if (DirectoryExists(text, checkSA: false, fullPath: true))
				{
					array = Directory.GetDirectories(text);
					array = FilterPathNames(array);
				}
				if (checkSA)
				{
					text = Combine(streamingAssetsPath, folder);
					if (DirectoryExists(text, checkSA: false, fullPath: true))
					{
						if (array != null)
						{
							string[] directories = Directory.GetDirectories(text);
							directories = FilterPathNames(directories);
							array = array.Union(directories).ToArray();
						}
						else
						{
							array = Directory.GetDirectories(text);
							array = FilterPathNames(array);
						}
					}
				}
			}
			else if (DirectoryExists(folder, checkSA: false, fullPath: true))
			{
				array = Directory.GetDirectories(folder);
				array = FilterPathNames(array);
			}
			SortPathNames(array);
			if (array == null)
			{
				UnityEngine.Debug.LogWarning("[FileManagement.ListDirectories] Can't read folder content, folder not found: " + folder);
			}
			return array;
		}
		catch (Exception ex)
		{
			UnityEngine.Debug.LogError("[FileManagement.ListDirectories] Error: " + ex.Message);
			return array;
		}
	}

	public static List<byte[]> ReadDirectoryContent(string folder, bool enc = false, bool checkSA = true, bool fullPath = false)
	{
		List<byte[]> list = null;
		if (DirectoryExists(folder, checkSA, fullPath))
		{
			list = new List<byte[]>();
			string[] array = ListFiles(folder, checkSA, fullPath);
			for (int i = 0; i < array.Length; i++)
			{
				byte[] item = ReadRawFile(Combine(folder, array[i]), enc, checkSA, fullPath);
				list.Add(item);
			}
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.ReadDirectoryContent] Can't read folder content, folder not found: " + folder);
		}
		return list;
	}

	public static void CopyFile(string source, string dest, bool checkSA = true, bool fullPathSource = false, bool fullPathDest = false)
	{
		if (source != "" && dest != "")
		{
			source = NormalizePath(source);
			dest = NormalizePath(dest);
			if (FileExists(source, checkSA, fullPathSource))
			{
				byte[] content = ReadRawFile(source, enc: false, checkSA, fullPathSource);
				SaveRawFile(dest, content, enc: false, fullPathDest);
			}
			else
			{
				UnityEngine.Debug.LogWarning("[FileManagement.CopyFile] Source file not found: " + source);
			}
		}
	}

	public static void CopyDirectory(string source, string dest, bool checkSA = true, bool fullPathSource = false, bool fullPathDest = false)
	{
		if (!(source != "") || !(dest != ""))
		{
			return;
		}
		source = NormalizePath(source);
		dest = NormalizePath(dest);
		if (DirectoryExists(source, checkSA, fullPathSource))
		{
			string[] array = ListFiles(source, checkSA, fullPathSource);
			string[] array2 = ListDirectories(source, checkSA, fullPathSource);
			for (int i = 0; i < array.Length; i++)
			{
				string source2 = NormalizePath(Combine(source, array[i]));
				string dest2 = NormalizePath(Combine(dest, array[i]));
				CopyFile(source2, dest2, checkSA, fullPathSource, fullPathDest);
			}
			for (int j = 0; j < array2.Length; j++)
			{
				string source3 = NormalizePath(Combine(source, array2[j]));
				string dest3 = NormalizePath(Combine(dest, array2[j]));
				CopyDirectory(source3, dest3, checkSA, fullPathSource, fullPathDest);
			}
			CreateDirectory(dest);
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.CopyDirectory] Source path not found: " + source);
		}
	}

	public static void Move(string source, string dest, bool fullPathSource = false, bool fullPathDest = false)
	{
		if (!(source != "") || !(dest != ""))
		{
			return;
		}
		if (FileExists(source, checkSA: false, fullPathSource) || DirectoryExists(source, checkSA: false, fullPathSource))
		{
			if (!fullPathSource)
			{
				source = Combine(persistentDataPath, source);
			}
			if (!fullPathDest)
			{
				dest = Combine(persistentDataPath, dest);
			}
			CreateDirectory(GetParentDirectory(dest));
			File.Move(source, dest);
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.Move] Source file not found: " + source);
		}
	}

	public static void Rename(string source, string dest, bool fullPathSource = false, bool fullPathDest = false)
	{
		if (FileExists(source, checkSA: false, fullPathSource) || DirectoryExists(source, checkSA: false, fullPathSource))
		{
			Move(source, dest, fullPathSource, fullPathDest);
		}
		else
		{
			UnityEngine.Debug.LogWarning("[FileManagement.Rename] Source file not found: " + source);
		}
	}

	public static string GetParentDirectory(string path)
	{
		path = NormalizePath(path);
		int num = path.LastIndexOf('/');
		path = ((num < 0) ? "" : ((!(path == Path.GetPathRoot(path))) ? path.Substring(0, num) : ""));
		return NormalizePath(path);
	}

	public static string Combine(string path1, string path2)
	{
		return Path.Combine(path1, path2);
	}

	public static string NormalizePath(string path)
	{
		path = path.Replace('\\', '/');
		path = path.Replace("//", "/");
		if (path.Length >= 1 && path[path.Length - 1] == '/')
		{
			path = path.Substring(0, path.Length - 1);
		}
		if (path.Length > 1 && path[path.Length - 1] == ':')
		{
			path += "/";
		}
		return path;
	}

	public static string GetFileName(string path)
	{
		path = NormalizePath(path);
		return Path.GetFileName(path);
	}

	public static string GetFileNameWithoutExtension(string path)
	{
		path = NormalizePath(path);
		string fileName = Path.GetFileName(path);
		int num = fileName.LastIndexOf('.');
		if (num > 0)
		{
			return fileName.Substring(0, num);
		}
		return fileName;
	}

	public static string GetFileExtension(string path)
	{
		int num = path.LastIndexOf('.');
		string result = "";
		if (num > 0)
		{
			result = path.Substring(num);
		}
		return result;
	}

	public static T CustomParser<T>(string content)
	{
		string[] array = new string[0];
		switch (typeof(T).ToString())
		{
		case "UnityEngine.Vector2":
			content = content.Substring(1, content.Length - 2);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Vector2(float.Parse(array[0]), float.Parse(array[1])), typeof(T));
		case "UnityEngine.Vector3":
			content = content.Substring(1, content.Length - 2);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Vector3(float.Parse(array[0]), float.Parse(array[1]), float.Parse(array[2])), typeof(T));
		case "UnityEngine.Vector4":
			content = content.Substring(1, content.Length - 2);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Vector4(float.Parse(array[0]), float.Parse(array[1]), float.Parse(array[2]), float.Parse(array[3])), typeof(T));
		case "UnityEngine.Quaternion":
			content = content.Substring(1, content.Length - 2);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Quaternion(float.Parse(array[0]), float.Parse(array[1]), float.Parse(array[2]), float.Parse(array[3])), typeof(T));
		case "UnityEngine.Rect":
			content = content.Substring(1, content.Length - 2);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Rect(float.Parse(array[0].Split(':')[1]), float.Parse(array[1].Split(':')[1]), float.Parse(array[2].Split(':')[1]), float.Parse(array[3].Split(':')[1])), typeof(T));
		case "UnityEngine.Color":
			content = content.Substring(5, content.Length - 6);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Color(float.Parse(array[0]), float.Parse(array[1]), float.Parse(array[2]), float.Parse(array[3])), typeof(T));
		case "UnityEngine.Color32":
			content = content.Substring(5, content.Length - 6);
			array = content.Split(',');
			return (T)Convert.ChangeType(new Color32(byte.Parse(array[0]), byte.Parse(array[1]), byte.Parse(array[2]), byte.Parse(array[3])), typeof(T));
		default:
			return (T)Convert.ChangeType(content, typeof(T));
		}
	}

	public static byte[] Encrypt(byte[] data, byte[] key)
	{
		return XorEncryptDecrypt(data, key);
	}

	public static byte[] Decrypt(byte[] data, byte[] key)
	{
		return XorEncryptDecrypt(data, key);
	}

	public static string ByteArrayToString(byte[] content)
	{
		string result = "";
		switch (stringConversion)
		{
		case FM_StringMode.Fast:
		{
			char[] array = new char[content.Length];
			for (int i = 0; i < content.Length; i++)
			{
				array[i] = (char)content[i];
			}
			result = new string(array);
			break;
		}
		case FM_StringMode.ASCII:
			result = Encoding.ASCII.GetString(content);
			break;
		case FM_StringMode.BigEndianUnicode:
			result = Encoding.BigEndianUnicode.GetString(content);
			break;
		case FM_StringMode.Default:
			result = Encoding.Default.GetString(content);
			break;
		case FM_StringMode.Unicode:
			result = Encoding.Unicode.GetString(content);
			break;
		case FM_StringMode.UTF32:
			result = Encoding.UTF32.GetString(content);
			break;
		case FM_StringMode.UTF7:
			result = Encoding.UTF7.GetString(content);
			break;
		case FM_StringMode.UTF8:
			result = Encoding.UTF8.GetString(content);
			break;
		}
		return result;
	}

	public static byte[] StringToByteArray(string content)
	{
		byte[] array = new byte[0];
		switch (stringConversion)
		{
		case FM_StringMode.Fast:
		{
			array = new byte[content.Length];
			for (int i = 0; i < array.Length; i++)
			{
				array[i] = (byte)content[i];
			}
			break;
		}
		case FM_StringMode.ASCII:
			array = Encoding.ASCII.GetBytes(content.ToArray());
			break;
		case FM_StringMode.BigEndianUnicode:
			array = Encoding.BigEndianUnicode.GetBytes(content.ToArray());
			break;
		case FM_StringMode.Default:
			array = Encoding.Default.GetBytes(content.ToArray());
			break;
		case FM_StringMode.Unicode:
			array = Encoding.Unicode.GetBytes(content.ToArray());
			break;
		case FM_StringMode.UTF32:
			array = Encoding.UTF32.GetBytes(content.ToArray());
			break;
		case FM_StringMode.UTF7:
			array = Encoding.UTF7.GetBytes(content.ToArray());
			break;
		case FM_StringMode.UTF8:
			array = Encoding.UTF8.GetBytes(content.ToArray());
			break;
		}
		return array;
	}

	private static string[] FilterPathNames(string[] names)
	{
		if (names != null)
		{
			for (int i = 0; i < names.Length; i++)
			{
				names[i] = Path.GetFileName(names[i]);
			}
		}
		return names;
	}

	private static string[] SortPathNames(string[] names)
	{
		if (names != null)
		{
			Array.Sort(names);
		}
		return names;
	}

	private static byte[] XorEncryptDecrypt(byte[] data, byte[] key)
	{
		int num = 0;
		int i = 0;
		byte[] array = new byte[data.Length];
		while (num < data.Length)
		{
			for (; i < key.Length; i++)
			{
				if (num >= data.Length)
				{
					break;
				}
				array[num] = (byte)(data[num] ^ key[i]);
				num++;
			}
			i = 0;
		}
		return array;
	}

	public static void DeleteAll()
	{
		EmptyDirectory();
	}

	public static void DeleteKey(string key)
	{
		DeleteFile(key);
	}

	public static float GetFloat(string key, float defaultValue = 0f)
	{
		float result = defaultValue;
		if (FileExists(key))
		{
			result = ReadFile<float>(key);
		}
		return result;
	}

	public static int GetInt(string key, int defaultValue = 0)
	{
		int result = defaultValue;
		if (FileExists(key))
		{
			result = ReadFile<int>(key);
		}
		return result;
	}

	public static string GetString(string key, string defaultValue = "")
	{
		string result = defaultValue;
		if (FileExists(key))
		{
			result = ReadFile<string>(key);
		}
		return result;
	}

	public static bool HasKey(string key)
	{
		return FileExists(key);
	}

	public static void Save()
	{
		UnityEngine.Debug.Log("[FileManagement.Save] This method has no effect, data is already saved.");
	}

	public static void SetFloat(string key, float value)
	{
		SaveFile(key, value);
	}

	public static void SetInt(string key, int value)
	{
		SaveFile(key, value);
	}

	public static void SetString(string key, string value)
	{
		SaveFile(key, value);
	}

	public static bool GetBool(string key, bool defaultValue = false)
	{
		bool result = defaultValue;
		if (FileExists(key))
		{
			result = ReadFile<bool>(key);
		}
		return result;
	}

	public static double GetDouble(string key, double defaultValue = 0.0)
	{
		double result = defaultValue;
		if (FileExists(key))
		{
			result = ReadFile<double>(key);
		}
		return result;
	}

	public static void SetBool(string key, bool value)
	{
		SaveFile(key, value);
	}

	public static void SetDouble(string key, double value)
	{
		SaveFile(key, value);
	}

	public static void OpenFolder(string path = "", bool fullPath = false)
	{
		if (!fullPath)
		{
			path = persistentDataPath + "/" + path;
		}
		Process.Start(path);
	}

	public static byte[] ObjectToByteArray(object obj)
	{
		if (obj == null)
		{
			return null;
		}
		BinaryFormatter binaryFormatter = new BinaryFormatter();
		MemoryStream memoryStream = new MemoryStream();
		binaryFormatter.Serialize(memoryStream, obj);
		return memoryStream.ToArray();
	}

	public static object ByteArrayToObject(byte[] arrBytes)
	{
		MemoryStream memoryStream = new MemoryStream();
		BinaryFormatter binaryFormatter = new BinaryFormatter();
		memoryStream.Write(arrBytes, 0, arrBytes.Length);
		memoryStream.Seek(0L, SeekOrigin.Begin);
		return binaryFormatter.Deserialize(memoryStream);
	}

	public static string[] ListLogicalDrives()
	{
		return Directory.GetLogicalDrives();
	}

	public static void InstallLocalApk(string file, bool fullPath = false)
	{
		UnityEngine.Debug.LogError("[FileManagement.InstallLocalApk] Not supported in this platform.");
	}
}
