using System;
using UnityEngine;
using UnityEngine.UI;

public class RankingPrefab : MonoBehaviour
{
	public Text position;

	public Text coachName;

	public Text teamName;

	public Text points;

	public GameObject followingButton;

	public GameObject unfollowingButton;

	public Text numberFollowers;

	private RankingView rankingView;

	private RankingView.Get_Ranking player;

	private bool isFollowing;

	public void Initialize(RankingView _rankingView, RankingView.Get_Ranking _player, bool isFollowing)
	{
		rankingView = _rankingView;
		player = _player;
		this.isFollowing = isFollowing;
		if (_player.rankingPosition == 0)
		{
			position.text = "";
		}
		else
		{
			position.text = _player.rankingPosition.ToString();
		}
		coachName.text = _player.coachName;
		points.text = player.points.ToString();
		if (string.IsNullOrEmpty(player.teamName) || player.teamName == "null")
		{
			teamName.text = LanguageController.instance.Get_Translation("COACH_UNEMPLOYED");
		}
		else
		{
			teamName.text = player.teamName;
		}
		if (rankingView.GetLastGameCoachGuids() == "")
		{
			DisableFollowers();
		}
		else
		{
			EnableFollowers();
		}
	}

	public void DisableFollowers()
	{
		unfollowingButton.SetActive(value: false);
		followingButton.SetActive(value: false);
		numberFollowers.gameObject.SetActive(value: false);
	}

	public void EnableFollowers()
	{
		unfollowingButton.SetActive(!isFollowing);
		followingButton.SetActive(isFollowing);
		SetNumberFollowers();
		CheckCoachColor();
	}

	private void SetNumberFollowers()
	{
		int num = GetNumberFollowers();
		if (num <= 0)
		{
			numberFollowers.gameObject.SetActive(value: false);
			return;
		}
		numberFollowers.gameObject.SetActive(value: true);
		if (num >= 1000000)
		{
			numberFollowers.text = $"{Math.Floor((float)num / 1000000f)}M";
		}
		else if (num >= 10000)
		{
			numberFollowers.text = $"{Math.Floor((float)num / 1000f)}K";
		}
		else if (num >= 1000)
		{
			numberFollowers.text = $"{Math.Floor((float)num / 100f) / 10.0:0.0}" + "K";
		}
		else
		{
			numberFollowers.text = num.ToString();
		}
	}

	private int GetNumberFollowers()
	{
		int num = player.numFollowers;
		if (rankingView.guidsToFollow.Contains(player.coachGuid))
		{
			if (DataManager.instance.allCoaches.GetAllHumanCoaches().Count != 0)
			{
				num += DataManager.instance.allCoaches.GetAllHumanCoaches().Count;
			}
			else if (ElifootOptions.lastGameCoachGuids != "")
			{
				num += ElifootOptions.lastGameCoachGuids.Split(',').Length;
			}
		}
		if (rankingView.guidsToUnfollow.Contains(player.coachGuid))
		{
			if (DataManager.instance.allCoaches.GetAllHumanCoaches().Count != 0)
			{
				num -= DataManager.instance.allCoaches.GetAllHumanCoaches().Count;
			}
			else if (ElifootOptions.lastGameCoachGuids != "")
			{
				num -= ElifootOptions.lastGameCoachGuids.Split(',').Length;
			}
		}
		return num;
	}

	private void CheckCoachColor()
	{
		if (DataManager.instance.allCoaches.GetAllHumanCoaches().Count > 0)
		{
			foreach (Coach allHumanCoach in DataManager.instance.allCoaches.GetAllHumanCoaches())
			{
				if (allHumanCoach.MyGUID.ToUpper() == player.coachGuid.ToUpper())
				{
					ChangeObjColor(ConfigManager.instance.COLOR_COACH_HUMAN);
					break;
				}
			}
			return;
		}
		if (!(ElifootOptions.lastGameCoachGuids != ""))
		{
			return;
		}
		string[] array = ElifootOptions.lastGameCoachGuids.Split(',');
		for (int i = 0; i < array.Length; i++)
		{
			if (array[i].ToUpper() == player.coachGuid.ToUpper())
			{
				ChangeObjColor(ConfigManager.instance.COLOR_COACH_HUMAN);
				break;
			}
		}
	}

	private void ChangeObjColor(Color color)
	{
		position.color = color;
		coachName.color = color;
		teamName.color = color;
		points.color = color;
	}

	public void Follow()
	{
		if (!rankingView.guidsToFollow.Contains(player.coachGuid) && !rankingView.guidsToUnfollow.Contains(player.coachGuid))
		{
			rankingView.AddFollowee(player.coachGuid);
			UpdateElifootOptions();
		}
		else if (rankingView.guidsToUnfollow.Contains(player.coachGuid))
		{
			rankingView.guidsToUnfollow.Remove(player.coachGuid);
			UpdateElifootOptions();
		}
		unfollowingButton.SetActive(value: false);
		followingButton.SetActive(value: true);
		SetNumberFollowers();
	}

	public void UnFollow()
	{
		if (!rankingView.guidsToFollow.Contains(player.coachGuid) && !rankingView.guidsToUnfollow.Contains(player.coachGuid))
		{
			rankingView.guidsToUnfollow.Add(player.coachGuid);
			UpdateElifootOptions();
		}
		else if (rankingView.guidsToFollow.Contains(player.coachGuid))
		{
			rankingView.guidsToFollow.Remove(player.coachGuid);
			UpdateElifootOptions();
		}
		unfollowingButton.SetActive(value: true);
		followingButton.SetActive(value: false);
		SetNumberFollowers();
	}

	public void UpdateElifootOptions()
	{
		ElifootOptions.followGuidsToSendToServer = string.Join(",", rankingView.guidsToFollow.ToArray());
		ElifootOptions.unfollowGuidsToSendToServer = string.Join(",", rankingView.guidsToUnfollow.ToArray());
		ElifootOptions.SaveOptions();
	}

	public void ToggleFollowing()
	{
		if (followingButton.activeSelf)
		{
			UnFollow();
		}
		else if (unfollowingButton.activeSelf)
		{
			Follow();
		}
	}
}
