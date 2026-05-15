using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class PlayerListView : EliView
{
	private enum PlayerListViewMode
	{
		normal,
		sale
	}

	[Header("Team")]
	public Image teamShirt;

	public Text teamName;

	[Header("Player List")]
	public CanvasGroup playersCanvasGroup;

	public RectTransform playersViewport;

	public RectTransform playerGroupParent;

	public GameObject playerPrefabNormal;

	public GameObject playerPrefabSale;

	[Header("Footer Buttons")]
	public GameObject balanceButton;

	public GameObject bankButton;

	public GameObject standingsButton;

	[Header("Player Icons")]
	public Sprite injuryIcon;

	public Sprite redCardIcon;

	public Sprite yellowCardIcon;

	public Sprite secondYellowCardIcon;

	public Sprite soldIcon;

	private Team myTeam;

	private Team baseTeam;

	private Player basePlayer;

	private PlayerListViewMode viewMode;

	private Dictionary<Player, GameObject> playerObjList = new Dictionary<Player, GameObject>();

	private Player selectedPlayer;

	private Action onClose;

	private List<EliLabel> playersLabels = new List<EliLabel>();

	public void Initialize(Team team, Team baseTeam, Player basePlayer = null, bool showMoreInfoButton = false, Action onClose = null)
	{
		myTeam = team;
		this.baseTeam = baseTeam;
		this.basePlayer = basePlayer;
		selectedPlayer = null;
		teamName.text = team.Name;
		balanceButton.SetActive(showMoreInfoButton);
		bankButton.SetActive(showMoreInfoButton);
		standingsButton.SetActive(showMoreInfoButton);
		viewMode = ((this.baseTeam != null && myTeam != this.baseTeam) ? PlayerListViewMode.sale : PlayerListViewMode.normal);
		team.DrawLogoOnImage(teamShirt);
		this.onClose = (Action)Delegate.Combine(this.onClose, onClose);
		StartCoroutine(FillPlayerList());
	}

	private IEnumerator FillPlayerList()
	{
		for (int i = 0; i < playerGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(playerGroupParent.GetChild(i).gameObject);
		}
		ListOfPlayers listOfPlayers = new ListOfPlayers(myTeam.Players);
		listOfPlayers.SortByPosition();
		playerObjList.Clear();
		bool darkenNext = false;
		bool darkenThis = false;
		GameObject original = ((viewMode == PlayerListViewMode.normal) ? playerPrefabNormal : playerPrefabSale);
		int first = 0;
		int num = 0;
		foreach (Player item in listOfPlayers)
		{
			GameObject gameObject = UnityEngine.Object.Instantiate(original, playerGroupParent);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			playerObjList.Add(item, gameObject);
			UpdatePlayerObject(gameObject, item);
			if (basePlayer == item)
			{
				first = num;
			}
			num++;
		}
		yield return StartCoroutine(GoToPositionInScroll(first, 0, playersCanvasGroup, playersViewport, playerGroupParent, playerPrefabSale));
		OnRectTransformDimensionsChange();
	}

	internal override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		if (playersLabels != null && playersLabels.Count != 0)
		{
			for (int i = 0; i < playersLabels.Count; i++)
			{
				playersLabels[i].ReloadElementConfig();
			}
		}
	}

	private void UpdatePlayerObject(GameObject playerObj, Player player)
	{
		switch (viewMode)
		{
		case PlayerListViewMode.normal:
		{
			playerObj.transform.Find("Position/Position").GetComponent<Text>().text = player.PositionCode();
			playerObj.transform.Find("Position/PositionBackground").GetComponent<Image>().color = player.PositionColor();
			playerObj.transform.Find("Name").GetComponent<Text>().text = player.GetName();
			playerObj.transform.Find("Nationality").GetComponent<Text>().text = player.country.GetName();
			playerObj.transform.Find("Behaviour").GetComponent<Text>().text = player.BehaviourDesc();
			playerObj.transform.Find("Skill").GetComponent<Text>().text = player.skill.ToString();
			Transform transform = playerObj.transform.Find("Value");
			if (transform != null)
			{
				transform.GetComponent<Text>().text = ((player.directSellPrice > 0) ? Util.MoneyString(player.directSellPrice) : "");
			}
			Text component = playerObj.transform.Find("GoalsScored/Text").GetComponent<Text>();
			component.text = player.playerSeason.GoalsScoredTotal.ToString();
			if (component.text == "0")
			{
				playerObj.transform.Find("GoalsScored").gameObject.SetActive(value: false);
			}
			Text component2 = playerObj.transform.Find("Suspended/Text").GetComponent<Text>();
			component2.text = "";
			Image component3 = playerObj.transform.Find("Suspended/Icon").GetComponent<Image>();
			component3.enabled = false;
			if (player.Injured > 0)
			{
				component3.enabled = true;
				component3.sprite = injuryIcon;
				component2.text = player.Injured.ToString();
			}
			if (player.Suspended > 0)
			{
				component3.enabled = true;
				component3.sprite = redCardIcon;
				component2.text = player.Suspended.ToString();
			}
			if (player.SoldToTeam != null)
			{
				Image component4 = playerObj.transform.Find("Icon").GetComponent<Image>();
				component4.enabled = true;
				component4.sprite = soldIcon;
			}
			Util.SetGameObjectActive(playerObj, "Icon", setActive: false);
			break;
		}
		case PlayerListViewMode.sale:
		{
			playerObj.GetComponent<PlayerBuyPrefab>();
			bool flag = player.Team.IsPlayerForSale(player);
			player.FillPrefabForBuy(playerObj.GetComponent<PlayerBuyPrefab>(), player, includeTeam: false, flag ? ((Action)delegate
			{
				PlayerSelected(player);
			}) : null);
			break;
		}
		}
	}

	private void PlayerSelected(Player player)
	{
		selectedPlayer = player;
		baseTeam.TryBuyPlayerHuman(selectedPlayer, BuyPlayerConfirmed, null);
	}

	private void BuyPlayerConfirmed()
	{
		UpdatePlayerObject(selectedPlayer);
		string description = LanguageController.instance.Get_Translation("PLAYERBUY_BOUGHT", selectedPlayer.Name);
		ScreenController.instance.ShowInfoPopUp(description, RecalculatePlayerPrices);
	}

	private void UpdatePlayerObject(Player player)
	{
		GameObject gameObject = playerObjList[player];
		if (!(gameObject == null))
		{
			UpdatePlayerObject(gameObject, player);
		}
	}

	private void RecalculatePlayerPrices()
	{
		myTeam.UpdateDirectSellPrices();
		UpdatePlayerList();
	}

	private void UpdatePlayerList()
	{
		foreach (Player player in myTeam.Players)
		{
			UpdatePlayerObject(player);
		}
	}

	public void BackPressed()
	{
		onClose?.Invoke();
		Close();
	}

	public void BalancePressed()
	{
		ScreenController.instance.ShowBalanceView(myTeam);
	}

	public void BankPressed()
	{
		ScreenController.instance.ShowBankAccount(myTeam.TeamBank);
	}

	public void StandingsPressed()
	{
		StartCoroutine(ScreenController.instance.ShowStandingsView(myTeam.FindCompetition(CompetitionType.NationalLeague), 0, myTeam));
	}
}
