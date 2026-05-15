using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;
using UnityEngine.UI;

public class RankingView : EliView
{
	[Serializable]
	public struct SavedRanking
	{
		public string saveTime;

		public Get_Ranking[] ranking;
	}

	[Serializable]
	public struct Get_Ranking
	{
		public int rankingPosition;

		public string coachId;

		public string coachGuid;

		public string coachName;

		public string teamName;

		public int points;

		public int isFollowee;

		public int numFollowers;
	}

	private struct Get_Ranking_Form
	{
		public int limitRecords;

		public string includeCoachGuids;
	}

	private struct Send_Follow_Form
	{
		public string followers;

		public string addFollowees;

		public string removeFollowees;
	}

	private struct Search_Friend_Form
	{
		public string nameQuery;

		public string includeCoachGuids;
	}

	public ShareScreenshot shareScreenshot;

	[Header("Header & CanvasGroup")]
	public CanvasGroup canvasGroup;

	public Text headerText;

	[Header("List")]
	public RectTransform rankingViewport;

	public RectTransform rankingList;

	public GameObject rankingPrefab;

	[Header("FollowersList")]
	[ReadOnly]
	public List<string> guidsToFollow = new List<string>();

	[ReadOnly]
	public List<string> guidsToUnfollow = new List<string>();

	[Header("Footer")]
	public GameObject footer;

	public GameObject shareButton;

	public GameObject returnToRankingButton;

	public GameObject elifootTitle;

	private SavedRanking savedRanking;

	private readonly string shareTitle = "Elifoot";

	private readonly string shareDescription = "Ranking";

	private readonly int MAX_GUIDS_SENDING = 30;

	private bool viewingGlobalRanking;

	private string lastSearch;

	private bool forceReload;

	private bool showLoadingView;

	private bool showWarningMessages;

	private Func<bool> checkBeforeShowing;

	private Get_Ranking[] globalRanking;

	private Get_Ranking[] searchRanking;

	private Get_Ranking_Form GetRankingForm;

	private Send_Follow_Form SendFollowForm;

	private Search_Friend_Form SearchFriendForm;

	private Action onClose;

	private const int RELOAD_RANKING_INTERVAL = 60;

	public static string offlineRankingDatabasePath => DataManager.RANKING_PATH + "/" + DataManager.RANKING_FILENAME;

	public void Initialize(bool showLoadingView, bool showWarningMessages, bool forceReload, Func<bool> checkBeforeShowing = null, Action onClose = null)
	{
		this.onClose = onClose;
		this.onClose = (Action)Delegate.Combine(this.onClose, new Action(Close));
		if (!showLoadingView)
		{
			canvasGroup.alpha = 0f;
			canvasGroup.interactable = false;
		}
		LoadRecordedFollowsAndUnfollows();
		this.showLoadingView = showLoadingView;
		this.showWarningMessages = showWarningMessages;
		this.checkBeforeShowing = checkBeforeShowing;
		this.forceReload = forceReload;
		viewingGlobalRanking = true;
		UpdateHeaderAndFooter();
		ResetView();
		ResetList();
		shareButton.SetActive(value: false);
		if (showLoadingView)
		{
			ScreenController.instance.ShowLoadingView("WAIT_RANKING_LOADING");
		}
		GetRanking();
	}

	internal void AddFollowee(string guid)
	{
		if (!guidsToFollow.Contains(guid))
		{
			guidsToFollow.Add(guid);
			ElifootOptions.followGuidsToSendToServer = string.Join(",", guidsToFollow.ToArray());
			ElifootOptions.SaveOptions();
		}
		if (globalRanking == null || globalRanking.Length == 0)
		{
			return;
		}
		for (int i = 0; i < globalRanking.Length; i++)
		{
			if (globalRanking[i].coachGuid == guid)
			{
				globalRanking[i].isFollowee = 1;
				Debug.Log($"Added followee: {guid} at position {i}");
				SaveOfflineRanking();
				break;
			}
		}
	}

	private void LoadRecordedFollowsAndUnfollows()
	{
		string[] array;
		if (!string.IsNullOrEmpty(ElifootOptions.followGuidsToSendToServer))
		{
			array = ElifootOptions.followGuidsToSendToServer.Split(',');
			foreach (string text in array)
			{
				if (text.ToUpper() != "NULL" && !string.IsNullOrEmpty(text))
				{
					guidsToFollow.Add(text);
				}
			}
		}
		if (string.IsNullOrEmpty(ElifootOptions.unfollowGuidsToSendToServer))
		{
			return;
		}
		array = ElifootOptions.unfollowGuidsToSendToServer.Split(',');
		foreach (string text2 in array)
		{
			if (text2.ToUpper() != "NULL" && !string.IsNullOrEmpty(text2))
			{
				guidsToUnfollow.Add(text2);
			}
		}
	}

	private void UpdateHeaderAndFooter()
	{
		if (viewingGlobalRanking)
		{
			headerText.text = LanguageController.instance.Get_Translation("RANKING_TITLE");
			shareButton.SetActive(value: true);
			returnToRankingButton.SetActive(value: false);
		}
		else
		{
			headerText.text = LanguageController.instance.Get_Translation("RANKING_SEARCH_BY_NAME_TITLE", lastSearch);
			shareButton.SetActive(value: false);
			returnToRankingButton.SetActive(value: true);
		}
	}

	private void ResetList()
	{
		for (int i = 0; i < rankingList.childCount; i++)
		{
			UnityEngine.Object.Destroy(rankingList.GetChild(i).gameObject);
		}
	}

	private void FillRankingList(bool isGlobalRanking)
	{
		ResetList();
		int firstHumanCoach = 0;
		int lastHumanCoach = 0;
		int count = 0;
		bool darkenNext = false;
		bool darkenThis = false;
		viewingGlobalRanking = isGlobalRanking;
		Get_Ranking[] array = (viewingGlobalRanking ? globalRanking : searchRanking);
		for (int i = 0; i < array.Length; i++)
		{
			Get_Ranking player = array[i];
			RankingPrefab component = UnityEngine.Object.Instantiate(rankingPrefab, rankingList, worldPositionStays: false).GetComponent<RankingPrefab>();
			DarkenListBackgroundObj(component.gameObject, ref darkenThis, ref darkenNext);
			bool flag = player.isFollowee == 1;
			flag |= guidsToFollow.Contains(player.coachGuid);
			flag &= !guidsToUnfollow.Contains(player.coachGuid);
			component.Initialize(this, player, flag);
			if (DataManager.instance.allCoaches.GetAllHumanCoaches().Count > 0)
			{
				foreach (Coach allHumanCoach in DataManager.instance.allCoaches.GetAllHumanCoaches())
				{
					if (allHumanCoach.MyGUID.ToUpper() == player.coachGuid.ToUpper())
					{
						RecordCoachPosition();
						break;
					}
				}
			}
			else if (ElifootOptions.lastGameCoachGuids != "")
			{
				string[] array2 = ElifootOptions.lastGameCoachGuids.Split(',');
				for (int j = 0; j < array2.Length; j++)
				{
					if (array2[j].ToUpper() == player.coachGuid.ToUpper())
					{
						RecordCoachPosition();
						break;
					}
				}
			}
			if (flag)
			{
				RecordCoachPosition();
			}
			count++;
		}
		canvasGroup.alpha = 1f;
		canvasGroup.interactable = true;
		UpdateHeaderAndFooter();
		StartCoroutine(GoToPositionInScrollWithNoAlphaDisabling(firstHumanCoach, lastHumanCoach, canvasGroup, rankingViewport, rankingList, rankingPrefab));
		void RecordCoachPosition()
		{
			float y = rankingPrefab.GetComponent<RectTransform>().sizeDelta.y;
			int num = Mathf.CeilToInt(rankingViewport.rect.height / y);
			if (firstHumanCoach == 0)
			{
				firstHumanCoach = count;
			}
			else if (count - firstHumanCoach < num)
			{
				lastHumanCoach = count;
			}
		}
	}

	public void BackPressed()
	{
		CloseRankingView();
	}

	private void GetRanking()
	{
		if (LoadOfflineRanking())
		{
			if (forceReload || HasEnoughTimePassed())
			{
				GetServerRanking(offlineRankingAlreadyLoaded: true);
				return;
			}
			FillRankingList(isGlobalRanking: true);
			if (showLoadingView)
			{
				ScreenController.instance.HideLoadingView();
			}
		}
		else
		{
			GetServerRanking();
		}
	}

	private bool HasEnoughTimePassed()
	{
		if (DateTime.TryParse(savedRanking.saveTime, out var result))
		{
			return Math.Abs((DateTime.UtcNow - result).TotalMinutes) > 60.0;
		}
		return true;
	}

	private void GetServerRanking(bool offlineRankingAlreadyLoaded = false)
	{
		GetRankingForm.limitRecords = ElifootOptions.rankingLimitRecords;
		GetRankingForm.includeCoachGuids = GetLastGameCoachGuids();
		try
		{
			string url = ElifootUrlManager.GetCommandUrl("getcoachranking") + "&nocrypt=1&nocs=1&json=1";
			StartCoroutine(Util.Call((MonoBehaviour)this, url, GetRankingForm, (Action<Get_Ranking[]>)LoadSuccess, (Action)delegate
			{
				LoadFailed(offlineRankingAlreadyLoaded);
			}));
		}
		catch
		{
			LoadFailed(offlineRankingAlreadyLoaded);
		}
	}

	public string GetLastGameCoachGuids()
	{
		string text = "";
		if (ElifootOptions.playWorldRanking)
		{
			if (DataManager.instance.allCoaches.GetAllHumanCoaches().Count > 0)
			{
				foreach (Coach allHumanCoach in DataManager.instance.allCoaches.GetAllHumanCoaches())
				{
					if (text != "")
					{
						text += ",";
					}
					text += allHumanCoach.MyGUID;
				}
			}
			else if (ElifootOptions.lastGameCoachGuids != "")
			{
				text = ElifootOptions.lastGameCoachGuids;
			}
		}
		return text;
	}

	private void LoadSuccess(Get_Ranking[] getRanking)
	{
		globalRanking = getRanking;
		if (getRanking == null || globalRanking == null || getRanking.Length == 0 || globalRanking.Length == 0)
		{
			LoadFailed();
		}
		else
		{
			if (checkBeforeShowing != null && !checkBeforeShowing())
			{
				CloseRankingView();
			}
			SaveOfflineRanking();
			FillRankingList(isGlobalRanking: true);
		}
		if (showLoadingView)
		{
			ScreenController.instance.HideLoadingView();
		}
	}

	private void LoadFailed(bool offlineRankingAlreadyLoaded = false)
	{
		if (offlineRankingAlreadyLoaded || LoadOfflineRanking())
		{
			FillRankingList(isGlobalRanking: true);
		}
		else
		{
			if (showWarningMessages)
			{
				ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("ERROR_NETWORK_FAILED"), LanguageController.instance.Get_Translation("ERROR_RETRIEVING_RANKING"), null);
			}
			CloseRankingView();
		}
		if (showLoadingView)
		{
			ScreenController.instance.HideLoadingView();
		}
	}

	private bool LoadOfflineRanking()
	{
		if (File.Exists(offlineRankingDatabasePath))
		{
			try
			{
				BinaryFormatter binaryFormatter = new BinaryFormatter();
				FileStream fileStream = File.Open(offlineRankingDatabasePath, FileMode.Open);
				savedRanking = (SavedRanking)binaryFormatter.Deserialize(fileStream);
				globalRanking = savedRanking.ranking;
				fileStream.Close();
				if (globalRanking != null && globalRanking.Length != 0)
				{
					return true;
				}
				return false;
			}
			catch (Exception ex)
			{
				Debug.LogError("File operation failed: " + ex.Message);
			}
		}
		return false;
	}

	private void SaveOfflineRanking()
	{
		SavedRanking savedRanking = new SavedRanking
		{
			saveTime = DateTime.Now.ToString(),
			ranking = globalRanking
		};
		try
		{
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			FileStream fileStream = File.Create(offlineRankingDatabasePath);
			binaryFormatter.Serialize(fileStream, savedRanking);
			fileStream.Close();
		}
		catch (Exception ex)
		{
			Debug.LogError("File operation failed: " + ex.Message);
		}
	}

	public static void EraseSavedRankingAndFollows()
	{
		if (File.Exists(offlineRankingDatabasePath))
		{
			try
			{
				File.Delete(offlineRankingDatabasePath);
			}
			catch (Exception ex)
			{
				Debug.LogError("File operation failed: " + ex.Message);
			}
		}
		ElifootOptions.followGuidsToSendToServer = "";
		ElifootOptions.unfollowGuidsToSendToServer = "";
		ElifootOptions.SaveOptions();
	}

	private void SendFollowersToServer(Action onSuccess, Action onError)
	{
		int num = Mathf.CeilToInt((float)(guidsToFollow.Count + guidsToUnfollow.Count) / (float)MAX_GUIDS_SENDING);
		for (int i = 0; i < num; i++)
		{
			int startingIndex = MAX_GUIDS_SENDING * i;
			(string, string) followeesToSend = GetFolloweesToSend(startingIndex);
			SendFollowForm.addFollowees = followeesToSend.Item1;
			SendFollowForm.removeFollowees = followeesToSend.Item2;
			SendFollowForm.followers = ElifootOptions.lastGameCoachGuids;
			try
			{
				ScreenController.instance.ShowLoadingView("WAIT_CONNECT_SERVER");
				string url = ElifootUrlManager.GetCommandUrl("updatefollowees") + "&nocrypt=1&nocs=1&json=1";
				StartCoroutine(Util.Call(this, url, SendFollowForm, onSuccess, onError));
			}
			catch
			{
				onError?.Invoke();
			}
		}
	}

	private (string, string) GetFolloweesToSend(int startingIndex)
	{
		int num = guidsToFollow.Count - startingIndex;
		int num2 = guidsToUnfollow.Count;
		if (num > 0)
		{
			num = Mathf.Min(num, MAX_GUIDS_SENDING);
		}
		else if (num2 > 0)
		{
			num2 += num;
		}
		num2 = Mathf.Min(num2, MAX_GUIDS_SENDING - num);
		string item = "";
		if (num > 0)
		{
			item = string.Join(",", guidsToFollow.ToArray(), startingIndex, num);
		}
		string item2 = "";
		if (num2 > 0)
		{
			item2 = string.Join(",", guidsToUnfollow.ToArray(), Mathf.Max(0, startingIndex - guidsToFollow.Count), num2);
		}
		return (item, item2);
	}

	public void CloseRankingView()
	{
		if (guidsToFollow.Count > 0 || guidsToUnfollow.Count > 0)
		{
			Action a = null;
			a = (Action)Delegate.Combine(a, new Action(ClearGuidUpdateLists));
			a = (Action)Delegate.Combine(a, new Action(RankingViewCloseComplete));
			a = (Action)Delegate.Combine(a, new Action(ScreenController.instance.HideLoadingView));
			SendFollowersToServer(a, SendingFollowersError);
		}
		else
		{
			RankingViewCloseComplete();
		}
	}

	private void ClearGuidUpdateLists()
	{
		guidsToFollow.Clear();
		guidsToUnfollow.Clear();
		ElifootOptions.followGuidsToSendToServer = "";
		ElifootOptions.unfollowGuidsToSendToServer = "";
		ElifootOptions.SaveOptions();
	}

	public void RankingViewCloseComplete()
	{
		onClose?.Invoke();
	}

	private void OnApplicationPause(bool pause)
	{
	}

	private void SendingFollowersError()
	{
		ScreenController.instance.HideLoadingView();
		ScreenController.instance.ShowDialogPopUp("ERROR_NETWORK_FAILED", "RANKING_ERROR_SYNC_FOLLOWERS", CloseRankingView, onClose);
	}

	public void SearchByName()
	{
		if (searchRanking == null || searchRanking.Length == 0 || !viewingGlobalRanking)
		{
			ScreenController.instance.ShowDialogInputfieldPopUp("RANKING_SEARCH_FRIENDS_TITLE", "RANKING_SEARCH_FRIENDS_DESC", "RANKING_SEARCH_FRIENDS_HINT", GetServerRankingByName, null);
		}
		else
		{
			FillRankingList(isGlobalRanking: false);
		}
	}

	private void GetServerRankingByName(string search)
	{
		SearchFriendForm.nameQuery = search;
		SearchFriendForm.includeCoachGuids = GetLastGameCoachGuids();
		lastSearch = search;
		try
		{
			ScreenController.instance.ShowLoadingView("WAIT_CONNECT_SERVER");
			string url = ElifootUrlManager.GetCommandUrl("getcoachesbyname") + "&nocrypt=1&nocs=1&json=1";
			StartCoroutine(Util.Call<Search_Friend_Form, Get_Ranking>(this, url, SearchFriendForm, SearchSuccess, SearchFailed));
		}
		catch
		{
			SearchFailed();
		}
	}

	private void SearchSuccess(Get_Ranking[] _searchRanking)
	{
		if (_searchRanking == null || _searchRanking.Length == 0)
		{
			ScreenController.instance.ShowDialogPopUp("RANKING_SEARCH_RESULT_EMPTY_TITLE", "RANKING_SEARCH_RESULT_EMPTY_DESC", null);
		}
		else
		{
			searchRanking = _searchRanking;
			returnToRankingButton.SetActive(value: true);
			FillRankingList(isGlobalRanking: false);
		}
		ScreenController.instance.HideLoadingView();
	}

	private void SearchFailed()
	{
		ScreenController.instance.HideLoadingView();
		ScreenController.instance.ShowDialogPopUp("ERROR_NETWORK_FAILED", "RANKING_ERROR_SEARCH", null);
	}

	public void ReturnToGlobalRanking()
	{
		FillRankingList(isGlobalRanking: true);
	}

	public void ShareButton()
	{
		DisableButtonsForSS();
		shareScreenshot.Share(shareTitle, shareDescription, EnableButtonsForSS);
	}

	private void DisableButtonsForSS()
	{
		footer.SetActive(value: false);
		elifootTitle.SetActive(value: true);
		for (int i = 0; i < rankingList.childCount; i++)
		{
			rankingList.GetChild(i).GetComponent<RankingPrefab>().DisableFollowers();
		}
	}

	private void EnableButtonsForSS()
	{
		footer.SetActive(value: true);
		elifootTitle.SetActive(value: false);
		for (int i = 0; i < rankingList.childCount; i++)
		{
			rankingList.GetChild(i).GetComponent<RankingPrefab>().EnableFollowers();
		}
	}
}
