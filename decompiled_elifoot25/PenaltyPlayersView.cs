using UnityEngine;
using UnityEngine.UI;
using UnityEngine.UI.Extensions;

public class PenaltyPlayersView : EliView
{
	[Header("Team")]
	public Text teamName;

	public Image teamShirt;

	[Header("List")]
	public ReorderableList reorderableList;

	public Transform playersList;

	public GameObject playerPrefab;

	public bool isDone;

	private Team team;

	private SubstitutePrefab firstSelectedPlayer;

	private SubstitutePrefab secondSelectedPlayer;

	public void Initialize(Team _team)
	{
		team = _team;
		teamName.text = team.Name;
		team.DrawLogoOnImage(teamShirt);
		FillPenaltyPlayers();
		DrawPenaltiesPlayers();
		reorderableList.OnElementDropped.AddListener(PlayersChanged);
	}

	private void FillPenaltyPlayers()
	{
		team.teamMatch.penaltyPlayers = new ListOfPlayers();
		Team.TeamMatch.PlayerSpot[] selectedPlayersSpots = team.teamMatch.selectedPlayersSpots;
		for (int i = 0; i < selectedPlayersSpots.Length; i++)
		{
			Team.TeamMatch.PlayerSpot playerSpot = selectedPlayersSpots[i];
			if (playerSpot.player != null)
			{
				team.teamMatch.penaltyPlayers.Add(playerSpot.player);
			}
		}
		team.teamMatch.penaltyPlayers.SortByGoalSkillDesc();
	}

	private void ClearList()
	{
		for (int i = 0; i < playersList.childCount; i++)
		{
			Object.Destroy(playersList.GetChild(i).gameObject);
		}
	}

	private void DrawPenaltiesPlayers()
	{
		ClearList();
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < team.teamMatch.penaltyPlayers.Count; i++)
		{
			CreatePenaltyPlayerPrefab(team.teamMatch.penaltyPlayers.Player(i), ref darkenThis, ref darkenNext);
		}
	}

	private void CreatePenaltyPlayerPrefab(Player player, ref bool darkenThis, ref bool darkenNext)
	{
		GameObject gameObject = Object.Instantiate(playerPrefab, playersList, worldPositionStays: false);
		DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
		RectTransform component = gameObject.GetComponent<RectTransform>();
		component.sizeDelta = new Vector2(component.sizeDelta.x, 80f);
		gameObject.GetComponent<SubstitutePrefab>().Initialize(player, PlayerList.Penalty, OnPlayerSelected);
	}

	private void OnPlayerSelected(SubstitutePrefab prefab)
	{
		if (firstSelectedPlayer == null)
		{
			firstSelectedPlayer = prefab;
			prefab.Select();
		}
		else if (prefab == firstSelectedPlayer)
		{
			DiselectSelectedPlayers();
		}
		else
		{
			secondSelectedPlayer = prefab;
			SwapPlayers();
		}
	}

	private void SwapPlayers()
	{
		team.SubstitutePlayers(firstSelectedPlayer.playerList, secondSelectedPlayer.playerList, firstSelectedPlayer.GetListIndex(), secondSelectedPlayer.GetListIndex());
		Player player = firstSelectedPlayer.player;
		firstSelectedPlayer.TradeAnimation(secondSelectedPlayer.player);
		secondSelectedPlayer.TradeAnimation(player);
		DiselectSelectedPlayers();
	}

	private void DiselectSelectedPlayers()
	{
		if (firstSelectedPlayer != null)
		{
			firstSelectedPlayer.Diselect();
		}
		firstSelectedPlayer = null;
		secondSelectedPlayer = null;
	}

	private void PlayersChanged(ReorderableList.ReorderableListEventStruct droppedStruct)
	{
		team.teamMatch.ReorderPenaltyPlayers(droppedStruct.FromIndex, droppedStruct.ToIndex);
		Invoke("RedrawPrefabBackgrounds", 0.01f);
	}

	private void RedrawPrefabBackgrounds()
	{
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < playersList.childCount; i++)
		{
			DarkenListBackgroundObj(playersList.GetChild(i).gameObject, ref darkenThis, ref darkenNext);
		}
	}

	public void OkPressed()
	{
		isDone = true;
		Close();
	}
}
