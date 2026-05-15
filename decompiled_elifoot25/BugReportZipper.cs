using System;
using System.IO;
using System.IO.Compression;
using UnityEngine;

public static class BugReportZipper
{
	private const string TEMP_SUBDIR = "BugReport";

	public static string TempDir => Path.Combine(Application.temporaryCachePath, "BugReport");

	public static bool ZipSave(string saveBinPath, out string zipPath, out string error)
	{
		zipPath = null;
		error = null;
		if (string.IsNullOrEmpty(saveBinPath) || !File.Exists(saveBinPath))
		{
			error = "Save file not found: " + saveBinPath;
			return false;
		}
		try
		{
			Cleanup();
			Directory.CreateDirectory(TempDir);
			string text = Path.Combine(TempDir, "staging");
			Directory.CreateDirectory(text);
			string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(saveBinPath);
			string destFileName = Path.Combine(text, Path.GetFileName(saveBinPath));
			File.Copy(saveBinPath, destFileName, overwrite: true);
			string text2 = Path.ChangeExtension(saveBinPath, ".ext");
			if (File.Exists(text2))
			{
				string destFileName2 = Path.Combine(text, Path.GetFileName(text2));
				File.Copy(text2, destFileName2, overwrite: true);
			}
			zipPath = Path.Combine(TempDir, "Elifoot_Save_" + fileNameWithoutExtension + ".zip");
			if (File.Exists(zipPath))
			{
				File.Delete(zipPath);
			}
			ZipFile.CreateFromDirectory(text, zipPath, System.IO.Compression.CompressionLevel.Optimal, includeBaseDirectory: false);
			Directory.Delete(text, recursive: true);
			return true;
		}
		catch (Exception ex)
		{
			error = ex.Message;
			Debug.LogError($"[BugReportZipper] Failed to zip save: {ex}");
			return false;
		}
	}

	public static void Cleanup()
	{
		try
		{
			if (Directory.Exists(TempDir))
			{
				Directory.Delete(TempDir, recursive: true);
			}
		}
		catch (Exception ex)
		{
			Debug.LogWarning("[BugReportZipper] Cleanup failed: " + ex.Message);
		}
	}
}
