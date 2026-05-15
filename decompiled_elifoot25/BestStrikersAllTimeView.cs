using UnityEngine;

public class BestStrikersAllTimeView : EliView
{
	public RectTransform strikersList;

	public BestStrikerAllTimePrefab playerPrefab20;

	private Team baseTeam;

	public void Initialize(Team baseTeam)
	{
		this.baseTeam = baseTeam;
		ListOfPlayers bestStrikersEver = GetBestStrikersEver();
		if (bestStrikersEver.Count == 0 || IfNoGoalsYet(bestStrikersEver))
		{
			ScreenController.instance.ShowInfoPopUp(LanguageController.instance.Get_Translation("BESTSTRIKERS_EMPTY"), null);
			Close();
		}
		else
		{
			FillList(bestStrikersEver);
		}
	}

	private bool IfNoGoalsYet(ListOfPlayers beststrikers)
	{
		foreach (Player beststriker in beststrikers)
		{
			if (beststriker.history.goalsScored > 0)
			{
				return false;
			}
		}
		return true;
	}

	private ListOfPlayers GetBestStrikersEver()
	{
		ListOfPlayers listOfPlayers = new ListOfPlayers(DataManager.instance.allPlayers);
		listOfPlayers.SortByHistoryGoalsDesc();
		return new ListOfPlayers(listOfPlayers.GetRange(0, Mathf.Min(listOfPlayers.Count, 50)));
	}

	private void FillList(ListOfPlayers beststrikers)
	{
		ClearList();
		bool darkenNext = false;
		bool darkenThis = false;
		foreach (Player beststriker in beststrikers)
		{
			if (beststriker.history.goalsScored > 0)
			{
				BestStrikerAllTimePrefab bestStrikerAllTimePrefab = Object.Instantiate(playerPrefab20, strikersList);
				bestStrikerAllTimePrefab.Initialize(beststriker, OnPlayerClicked, OnTeamClicked);
				DarkenListBackgroundObj(bestStrikerAllTimePrefab.gameObject, ref darkenThis, ref darkenNext);
			}
		}
	}

	private void ClearList()
	{
		for (int i = 0; i < strikersList.childCount; i++)
		{
			Object.Destroy(strikersList.GetChild(i).gameObject);
		}
	}

	private void OnPlayerClicked(Player player)
	{
		if (player.Team != null)
		{
			OnTeamClicked(player.Team, player);
		}
	}

	private void OnTeamClicked(Team team, Player player)
	{
		ScreenController.instance.ShowPlayerListView(team, baseTeam, player);
	}
}
