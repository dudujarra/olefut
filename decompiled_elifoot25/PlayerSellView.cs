using System;
using UnityEngine;
using UnityEngine.UI;

public class PlayerSellView : EliView
{
	public Text moneyTotal;

	public GameObject backButton;

	public Sprite injuryIcon;

	public Sprite redCardIcon;

	public Transform playerGroupParent;

	public GameObject playerPrefab;

	private Team team;

	private Player selectedPlayer;

	private bool mustSell;

	private Action onCloseView;

	public void Initialize(Team team, bool mustSell, Action onCloseView)
	{
		this.team = team;
		this.mustSell = mustSell;
		this.onCloseView = onCloseView;
		ResetView();
		FillPlayerList();
	}

	public override void ResetView()
	{
		moneyTotal.text = LanguageController.instance.Get_Translation("PLAYERBUY_MONEYTOTAL", Util.MoneyString(team.Money()));
		backButton.SetActive(!mustSell);
	}

	private void FillPlayerList()
	{
		for (int i = 0; i < playerGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(playerGroupParent.GetChild(i).gameObject);
		}
		team.Players.SortByPosition();
		bool darkenNext = false;
		bool darkenThis = false;
		for (int j = 0; j < team.Players.Count; j++)
		{
			Player player = team.Players.Player(j);
			GameObject gameObject = UnityEngine.Object.Instantiate(playerPrefab, playerGroupParent);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<PlayerSellPrefab>().Initialize(player, delegate
			{
				PlayerSelected(player);
			});
		}
	}

	private void PlayerSelected(Player player)
	{
		SellPlayer sellPlayer = team.CanSellPlayer(player);
		if (sellPlayer != SellPlayer.OK)
		{
			string title = LanguageController.instance.Get_Translation("PLAYER_SELL_TITLE");
			string text = LanguageController.instance.Get_Translation("CANSELLPLAYER_" + sellPlayer.ToString().ToUpper());
			string description = LanguageController.instance.Get_Translation("PLAYER_SELL_UNABLE", text);
			ScreenController.instance.ShowDialogPopUp(title, description, null);
		}
		else if (player.BestOfferTeam != null && player.BestOfferValue != 0L)
		{
			selectedPlayer = player;
			ScreenController.instance.ShowDialogPlayerSellTypePopUp(player, OnSellingTypeSelected, forcedSell: false);
		}
		else
		{
			ScreenController.instance.ShowInfoPopUp("PLAYER_SELL_FORCED", delegate
			{
				GoToAuction(player);
			});
		}
	}

	private void OnSellingTypeSelected(int option)
	{
		if (selectedPlayer != null)
		{
			switch (option)
			{
			case 0:
				DirectSell(selectedPlayer);
				break;
			case 1:
				GoToAuction(selectedPlayer);
				break;
			}
		}
	}

	private void DirectSell(Player player)
	{
		long newSalary = player.BestOfferTeam.AverageSalaryForSkill(player.skill);
		DataManager.PlayerTraded(player, team, player.BestOfferTeam, player.BestOfferValue, newSalary);
		string description = LanguageController.instance.Get_Translation("PLAYERSELL_SOLD", player.GetName(), player.BestOfferTeam.Name);
		ScreenController.instance.ShowInfoPopUp(description, null);
		PlayerBought();
	}

	private void GoToAuction(Player player)
	{
		StartCoroutine(ScreenController.instance.ShowAuctionView(player, 0L, humanSellingPlayer: true, mustSell, PlayerBought));
	}

	private void PlayerBought()
	{
		mustSell = false;
		UpdateView();
	}

	private void UpdateView()
	{
		ResetView();
		for (int i = 0; i < playerGroupParent.childCount; i++)
		{
			Player player = team.Players.Player(i);
			playerGroupParent.GetChild(i).GetComponent<PlayerSellPrefab>().Initialize(player, delegate
			{
				PlayerSelected(player);
			});
		}
	}

	public void BackPressed()
	{
		onCloseView?.Invoke();
		Close();
	}
}
