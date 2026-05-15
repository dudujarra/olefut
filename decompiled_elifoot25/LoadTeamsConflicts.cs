using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LoadTeamsConflicts : MonoBehaviour
{
	[Serializable]
	public struct TeamsResolution
	{
		public enum Status
		{
			Same,
			New,
			Downgrade,
			Updated,
			Conflict
		}

		public Status status;

		public int teamsUpdateIndex;

		public int teamsIndex;

		public int oldTeamsIndex;

		public string packageTeamShortName;

		public string packageTeamLongName;

		public string internalTeamShortName;

		public string internalTeamLongName;

		public string internalOldTeamShortName;

		public string internalOldTeamLongName;

		public float similarity;

		public bool isVerifiedToChange;
	}

	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbTeams teamsUpdate;

	[ReadOnly]
	public List<TeamsResolution> teamsResolution = new List<TeamsResolution>();

	private LoadingWithProgressView loadingWithProgressView;

	private int changeThisTeamID;

	private const int NO_TEAM = -1;

	private const int SAME_TEAM_CASE = -1;

	private const int UPDATED_TEAM_CASE = 1;

	private const int DOWNGRADE_TEAM_CASE = -2;

	private const int DEFAULT_BATCH_SIZE = 20;

	private readonly float SIMILARITY_SEARCH = 0.7f;

	private readonly float POSSIBLE_UPDATE = 0.85f;

	public static LoadTeamsConflicts instance;

	private void Awake()
	{
		instance = this;
	}

	public IEnumerator SolveConflicts()
	{
		Debug.Log("LoadTeamsConflicts: SolveConflicts");
		loadingWithProgressView = ScreenController.instance.ShowLoadingWithProgressView("WAIT_OPEN_TEAMS_PACKAGE");
		yield return new WaitForEndOfFrame();
		Debug.Log($"SolveConflicts: {teams.AllTeams.Count} teamsLocal vs {teamsUpdate.AllTeams.Count} teamsUpdate");
		teamsUpdate.AllTeams.Sort((DbTeams.DbTeam team1, DbTeams.DbTeam team2) => team1.shortName.CompareTo(team2.shortName));
		teamsResolution.Clear();
		yield return StartCoroutine(FindSimilarTeams());
		Debug.Log($"SolveConflicts: Complete. {teamsResolution.Count} resolutions");
		loadingWithProgressView.Close();
		teamsResolution.Reverse();
	}

	private IEnumerator FindSimilarTeams(int batchSize = 20)
	{
		if (teamsUpdate.AllTeams == null || teamsUpdate.AllTeams.Count == 0)
		{
			Debug.LogWarning("FindSimilarTeams: teamsUpdate.AllTeams is null or empty, skipping");
			yield break;
		}
		int total = teamsUpdate.AllTeams.Count;
		Debug.Log($"FindSimilarTeams: Comparing {total} teams");
		for (int start = total - 1; start >= 0; start -= batchSize)
		{
			int num = Mathf.Max(start - batchSize + 1, 0);
			for (int num2 = start; num2 >= num; num2--)
			{
				var (mostSimilarTeamIndex, similarityPercentage) = GetMostSimilarTeam(num2);
				AddTeamResolutionJustFound(num2, mostSimilarTeamIndex, similarityPercentage);
				UpdateProgressBar(num2);
			}
			Debug.Log($"FindSimilarTeams: {total - num}/{total}");
			yield return new WaitForEndOfFrame();
		}
	}

	private void UpdateProgressBar(int currentIndex)
	{
		if (!(loadingWithProgressView == null))
		{
			float amount = (float)(teamsUpdate.AllTeams.Count - currentIndex + 1) / (float)teamsUpdate.AllTeams.Count * 100f;
			loadingWithProgressView.UpdateProgress(amount);
		}
	}

	private (int, float) GetMostSimilarTeam(int teamsUpdateIndex)
	{
		DbTeams.DbTeam newTeam = teamsUpdate.AllTeams[teamsUpdateIndex];
		return FindSimilarTeam(newTeam);
	}

	private void ErrorCouldntFindTeams(int teamsUpdateIndex)
	{
		AddResolution(TeamsResolution.Status.New, teamsUpdateIndex, -1, 0f);
	}

	private void AddTeamResolutionJustFound(int teamsUpdateIndex, int mostSimilarTeamIndex, float similarityPercentage)
	{
		if (similarityPercentage != -2f)
		{
			if (similarityPercentage != -1f)
			{
				if (similarityPercentage == 1f)
				{
					AddResolution(TeamsResolution.Status.Updated, teamsUpdateIndex, mostSimilarTeamIndex, similarityPercentage);
				}
				else if (similarityPercentage >= POSSIBLE_UPDATE)
				{
					AddResolution(TeamsResolution.Status.Updated, teamsUpdateIndex, mostSimilarTeamIndex, similarityPercentage);
				}
				else if (similarityPercentage >= SIMILARITY_SEARCH)
				{
					AddResolution(TeamsResolution.Status.Conflict, teamsUpdateIndex, mostSimilarTeamIndex, similarityPercentage);
				}
				else
				{
					AddResolution(TeamsResolution.Status.New, teamsUpdateIndex, -1, similarityPercentage);
				}
			}
			else
			{
				ResolveSameTeamCase(teamsUpdateIndex, mostSimilarTeamIndex, similarityPercentage);
			}
		}
		else
		{
			AddResolution(TeamsResolution.Status.Downgrade, teamsUpdateIndex, mostSimilarTeamIndex, similarityPercentage);
		}
	}

	private void ResolveSameTeamCase(int teamsUpdateIndex, int mostSimilarTeamIndex, float similarityPercentage)
	{
		if (!LoadAndSavingTeams.instance.isAppUpdate)
		{
			AddResolution(TeamsResolution.Status.Same, teamsUpdateIndex, mostSimilarTeamIndex, similarityPercentage);
			return;
		}
		teamsUpdate.AllTeams.RemoveAt(teamsUpdateIndex);
		ReduceIndexOnAllResolutions(teamsUpdateIndex);
	}

	private void ReduceIndexOnAllResolutions(int teamsUpdateIndexRemoved)
	{
		for (int i = 0; i < teamsResolution.Count; i++)
		{
			TeamsResolution value = teamsResolution[i];
			if (value.teamsUpdateIndex > teamsUpdateIndexRemoved)
			{
				value.teamsUpdateIndex--;
			}
			teamsResolution[i] = value;
		}
	}

	private void AddResolution(TeamsResolution.Status status, int teamsUpdateIndex, int teamsIndex, float similarity)
	{
		if (changeThisTeamID != -1 && changeThisTeamID == teamsIndex)
		{
			changeThisTeamID = -1;
		}
		string packageTeamShortName = ((teamsUpdateIndex != -1 && teamsUpdateIndex < teamsUpdate.AllTeams.Count) ? teamsUpdate.AllTeams[teamsUpdateIndex].shortName : "");
		string internalTeamShortName = ((teamsIndex != -1 && teamsIndex < teams.AllTeams.Count) ? teams.AllTeams[teamsIndex].shortName : "");
		string internalOldTeamShortName = ((changeThisTeamID != -1 && changeThisTeamID < teams.AllTeams.Count) ? teams.AllTeams[changeThisTeamID].shortName : "");
		teamsResolution.Add(new TeamsResolution
		{
			status = status,
			teamsUpdateIndex = teamsUpdateIndex,
			teamsIndex = teamsIndex,
			oldTeamsIndex = changeThisTeamID,
			packageTeamShortName = packageTeamShortName,
			packageTeamLongName = ((teamsUpdateIndex != -1 && teamsUpdateIndex < teamsUpdate.AllTeams.Count) ? teamsUpdate.AllTeams[teamsUpdateIndex].longName : ""),
			internalTeamShortName = internalTeamShortName,
			internalTeamLongName = ((teamsIndex != -1 && teamsIndex < teams.AllTeams.Count) ? teams.AllTeams[teamsIndex].longName : ""),
			internalOldTeamShortName = internalOldTeamShortName,
			internalOldTeamLongName = ((changeThisTeamID != -1 && changeThisTeamID < teams.AllTeams.Count) ? teams.AllTeams[changeThisTeamID].longName : ""),
			similarity = similarity
		});
	}

	private (int, float) FindSimilarTeam(DbTeams.DbTeam newTeam)
	{
		int num = -1;
		float item = 0f;
		changeThisTeamID = -1;
		if (num == -1)
		{
			(num, item) = FindMostSimilarTeamOf(newTeam);
		}
		return (num, item);
	}

	private (int, float) FindSameTeamIDof(DbTeams.DbTeam newTeam)
	{
		for (int i = 0; i < teams.AllTeams.Count; i++)
		{
			DbTeams.DbTeam dbTeam = teams.AllTeams[i];
			if (!(newTeam.teamID == dbTeam.teamID))
			{
				continue;
			}
			if (!dbTeam.wasEdited)
			{
				if (ShouldEvaluateByVersion() && long.TryParse(dbTeam.teamVersion, out var result) && long.TryParse(newTeam.teamVersion, out var result2))
				{
					return GetTeamVersionResolution(i, result2, result);
				}
				return GetSimilarityResolutionBySameTeamIDNotEdited(i, newTeam, dbTeam);
			}
			var (num, item) = GetSimilarityResolutionBySameTeamIDEdited(i, dbTeam, newTeam);
			if (num == -1)
			{
				changeThisTeamID = i;
				continue;
			}
			return (num, item);
		}
		return (-1, 0f);
	}

	private bool ShouldEvaluateByVersion()
	{
		return LoadAndSavingTeams.instance.isAppUpdate;
	}

	private (int, float) GetTeamVersionResolution(int teamIndex, long newTeam_version, long oldTeam_version)
	{
		if (newTeam_version > oldTeam_version)
		{
			return (teamIndex, 1f);
		}
		if (newTeam_version == oldTeam_version)
		{
			return (teamIndex, -1f);
		}
		return (teamIndex, -2f);
	}

	private (int, float) GetSimilarityResolutionBySameTeamIDNotEdited(int teamIndex, DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		if (GetTeamsSimilarityPercentage(newTeam, oldTeam) == 1f)
		{
			return (teamIndex, -1f);
		}
		return (teamIndex, 1f);
	}

	private (int, float) GetSimilarityResolutionBySameTeamIDEdited(int teamIndex, DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		float teamsSimilarityPercentage = GetTeamsSimilarityPercentage(newTeam, oldTeam);
		if (teamsSimilarityPercentage == 1f)
		{
			return (teamIndex, -1f);
		}
		if (teamsSimilarityPercentage >= SIMILARITY_SEARCH)
		{
			return (teamIndex, teamsSimilarityPercentage);
		}
		return (-1, 0f);
	}

	private (int, float) FindMostSimilarTeamOf(DbTeams.DbTeam newTeam)
	{
		int item = -1;
		float num = 0f;
		for (int i = 0; i < teams.AllTeams.Count; i++)
		{
			DbTeams.DbTeam oldTeam = teams.AllTeams[i];
			if (oldTeam.countryCode != newTeam.countryCode)
			{
				continue;
			}
			float teamsSimilarityPercentage = GetTeamsSimilarityPercentage(newTeam, oldTeam);
			if (teamsSimilarityPercentage > num)
			{
				if (teamsSimilarityPercentage == 1f)
				{
					return (i, -1f);
				}
				item = i;
				num = teamsSimilarityPercentage;
			}
		}
		return (item, num);
	}

	private float GetTeamsSimilarityPercentage(DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		float num = 0.1f;
		float num2 = 0.1f;
		float num3 = 0.1f;
		float num4 = 0.04f;
		float num5 = 0.2f;
		float num6 = 0.1f;
		float num7 = 0.02f;
		float num8 = 0.4f;
		float num9 = 0.15f;
		float num10 = 0.15f;
		float num11 = num + num2 + num3 + num4 + num5 + num6 + num7 + num8 + num9 + num10;
		float num12 = 0f;
		if (newTeam.backColor == oldTeam.backColor && newTeam.textColor == oldTeam.textColor)
		{
			num12 += num4;
		}
		if (newTeam.countryCode == oldTeam.countryCode)
		{
			num12 += num5;
			if (newTeam.regionCode == oldTeam.regionCode || (string.IsNullOrEmpty(newTeam.regionCode) && string.IsNullOrEmpty(oldTeam.regionCode)))
			{
				num12 += num6;
			}
		}
		if (newTeam.level == oldTeam.level)
		{
			num12 += num7;
		}
		num12 += num * GetStringsSimilarityPercentage(newTeam.longName, oldTeam.longName);
		num12 += num2 * GetStringsSimilarityPercentage(newTeam.shortName, oldTeam.shortName);
		num12 += num3 * GetStringsSimilarityPercentage(newTeam.coach, oldTeam.coach);
		if (num9 > 0f)
		{
			float num13 = num9 + num10 + num8;
			if (num12 / num11 >= SIMILARITY_SEARCH - num13 / num11 && LogoIsEqual(newTeam, oldTeam))
			{
				num12 += num9;
			}
		}
		if (num10 > 0f)
		{
			float num14 = num10 + num8;
			if (num12 / num11 >= SIMILARITY_SEARCH - num14 / num11 && ShirtIsEqual(newTeam, oldTeam))
			{
				num12 += num10;
			}
		}
		if (num8 > 0f)
		{
			float num15 = num8;
			if (num12 / num11 >= SIMILARITY_SEARCH - num15 / num11)
			{
				float a = num8 * GetPlayersSimilarity(newTeam, oldTeam);
				float b = num8 * GetPlayersSimilarity(oldTeam, newTeam);
				num12 += Mathf.Min(a, b);
			}
		}
		return num12 / num11;
	}

	private bool LogoIsEqual(DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		Sprite logo = newTeam.Logo;
		Sprite logo2 = oldTeam.Logo;
		if (logo == null && logo2 == null)
		{
			return true;
		}
		if (!(logo != null) || !(logo2 != null))
		{
			return false;
		}
		if (newTeam.savedLogoBytes != null && oldTeam.savedLogoBytes != null && newTeam.savedLogoBytes.Length != 0 && oldTeam.savedLogoBytes.Length != 0 && oldTeam.savedLogoBytes.Length == newTeam.savedLogoBytes.Length && ((IStructuralEquatable)newTeam.savedLogoBytes).Equals((object)oldTeam.savedLogoBytes, StructuralComparisons.StructuralEqualityComparer))
		{
			return true;
		}
		try
		{
			return logo != null && logo2 != null && TextureIsTheSame(logo.texture, logo2.texture);
		}
		catch (Exception)
		{
			return false;
		}
	}

	private bool ShirtIsEqual(DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		if (newTeam.usesStandardShirt && oldTeam.usesStandardShirt)
		{
			return true;
		}
		if (newTeam.usesStandardShirt || oldTeam.usesStandardShirt)
		{
			return false;
		}
		Sprite shirt = newTeam.Shirt;
		Sprite shirt2 = oldTeam.Shirt;
		if (shirt == null || shirt2 == null)
		{
			if (shirt == null)
			{
				return shirt2 == null;
			}
			return false;
		}
		try
		{
			return TextureIsTheSame(shirt.texture, shirt2.texture);
		}
		catch (Exception)
		{
			return false;
		}
	}

	private bool TextureIsTheSame(Texture2D first, Texture2D second)
	{
		if (first == null || second == null)
		{
			return first == second;
		}
		if (first.width != second.width || first.height != second.height || first.format != second.format)
		{
			return false;
		}
		try
		{
			Color32[] readablePixels = GetReadablePixels(first);
			Color32[] readablePixels2 = GetReadablePixels(second);
			if (readablePixels.Length != readablePixels2.Length)
			{
				return false;
			}
			for (int i = 0; i < readablePixels.Length; i++)
			{
				if (readablePixels[i].r != readablePixels2[i].r || readablePixels[i].g != readablePixels2[i].g || readablePixels[i].b != readablePixels2[i].b || readablePixels[i].a != readablePixels2[i].a)
				{
					return false;
				}
			}
			return true;
		}
		catch (Exception arg)
		{
			Debug.LogError($"Texture comparison failed: {arg}");
			return false;
		}
	}

	private Color32[] GetReadablePixels(Texture2D texture)
	{
		if (texture.isReadable)
		{
			return texture.GetPixels32();
		}
		RenderTexture temporary = RenderTexture.GetTemporary(texture.width, texture.height);
		Graphics.Blit(texture, temporary);
		Texture2D texture2D = new Texture2D(texture.width, texture.height, TextureFormat.RGBA32, mipChain: false);
		RenderTexture active = RenderTexture.active;
		RenderTexture.active = temporary;
		texture2D.ReadPixels(new Rect(0f, 0f, texture.width, texture.height), 0, 0);
		texture2D.Apply();
		RenderTexture.active = active;
		RenderTexture.ReleaseTemporary(temporary);
		Color32[] pixels = texture2D.GetPixels32();
		if (Application.isPlaying)
		{
			UnityEngine.Object.Destroy(texture2D);
			return pixels;
		}
		UnityEngine.Object.DestroyImmediate(texture2D);
		return pixels;
	}

	private float GetPlayersSimilarity(DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		if (newTeam.players == null || newTeam.players.Count == 0)
		{
			Debug.LogWarning("GetPlayersSimilarity: team '" + newTeam.shortName + "' has no players");
			return 0f;
		}
		float num = 0f;
		for (int i = 0; i < newTeam.players.Count; i++)
		{
			(List<int>, float) tuple = FindMostSimilarPlayerName(i, newTeam, oldTeam);
			List<int> item = tuple.Item1;
			float item2 = tuple.Item2;
			num += GetMostSimilarPlayer(item, item2, i, newTeam, oldTeam);
		}
		num /= (float)newTeam.players.Count;
		return num / 100f;
	}

	private (List<int>, float) FindMostSimilarPlayerName(int playerIndex, DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		List<int> list = new List<int>();
		float num = 0f;
		for (int i = 0; i < oldTeam.players.Count; i++)
		{
			float stringsSimilarityPercentage = GetStringsSimilarityPercentage(newTeam.players[playerIndex].name, oldTeam.players[i].name);
			if (stringsSimilarityPercentage >= 1f)
			{
				if (list.Count > 0 && (float)list[0] < 1f)
				{
					list.Clear();
				}
				list.Add(i);
				num = stringsSimilarityPercentage;
			}
			else if (num < stringsSimilarityPercentage)
			{
				list.Clear();
				list.Add(i);
				num = stringsSimilarityPercentage;
			}
		}
		return (list, num);
	}

	private float GetMostSimilarPlayer(List<int> mostSimilarPlayersIndexes, float maxNameSimilarity, int playerIndex, DbTeams.DbTeam newTeam, DbTeams.DbTeam oldTeam)
	{
		float num = 46f;
		float num2 = 2f;
		float num3 = 30f;
		float num4 = 20f;
		float num5 = 2f;
		float num6 = 0f;
		for (int i = 0; i < mostSimilarPlayersIndexes.Count; i++)
		{
			float num7 = num * maxNameSimilarity;
			DbTeams.DbPlayer dbPlayer = newTeam.players[playerIndex];
			DbTeams.DbPlayer dbPlayer2 = oldTeam.players[mostSimilarPlayersIndexes[i]];
			if (dbPlayer.isStar == dbPlayer2.isStar)
			{
				num7 += num2;
			}
			if (dbPlayer.countryCode == dbPlayer2.countryCode)
			{
				num7 += num3;
			}
			if (dbPlayer.position == dbPlayer2.position)
			{
				num7 += num4;
			}
			if (dbPlayer.behaviour == dbPlayer2.behaviour)
			{
				num7 += num5;
			}
			if (num7 > num6)
			{
				num6 = num7;
			}
			_ = 1f;
		}
		return num6;
	}

	private float GetStringsSimilarityPercentage(string string1, string string2)
	{
		if (string.IsNullOrEmpty(string1) || string.IsNullOrEmpty(string2))
		{
			if (string.IsNullOrEmpty(string1) && string.IsNullOrEmpty(string2))
			{
				return 1f;
			}
			return 0f;
		}
		if (string1.CompareTo(string2) == 0)
		{
			return 1f;
		}
		float num = CompareStrings(string1, string2);
		float num2 = string1.Length;
		if (num2 < (float)string2.Length)
		{
			num2 = string2.Length;
		}
		if (num2 <= 0f)
		{
			return 1f;
		}
		return 1f - num / num2;
	}

	private int CompareStrings(string s, string t)
	{
		if (string.IsNullOrEmpty(s))
		{
			if (string.IsNullOrEmpty(t))
			{
				return 0;
			}
			return t.Length;
		}
		if (string.IsNullOrEmpty(t))
		{
			return s.Length;
		}
		int length = s.Length;
		int length2 = t.Length;
		int[,] array = new int[length + 1, length2 + 1];
		int num = 0;
		while (num <= length)
		{
			array[num, 0] = num++;
		}
		int num2 = 1;
		while (num2 <= length2)
		{
			array[0, num2] = num2++;
		}
		for (int i = 1; i <= length; i++)
		{
			for (int j = 1; j <= length2; j++)
			{
				int num3 = ((t[j - 1] != s[i - 1]) ? 1 : 0);
				int a = array[i - 1, j] + 1;
				int b = array[i, j - 1] + 1;
				int b2 = array[i - 1, j - 1] + num3;
				array[i, j] = Mathf.Min(Mathf.Min(a, b), b2);
			}
		}
		return array[length, length2];
	}
}
