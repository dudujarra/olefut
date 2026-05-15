using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class AuctionView : EliView
{
	public enum ViewStatus
	{
		SellingPlayer,
		WaitingProposal,
		Running,
		PlayerSold
	}

	[Header("Player team")]
	public Image teamLogo;

	public Text teamName;

	[Header("Player Info")]
	public Text playerName;

	public Image playerPositionBackground;

	public Text playerPosition;

	public Text playerGoals;

	public GameObject playerInjuryObj;

	public Text playerInjury;

	public Image playerCountryFlag;

	public Text playerCountry;

	public Text playerBehaviour;

	public Text playerSkill;

	public Text playerBasePrice;

	public Slider playerSellSlider;

	public Text playerNewSalary;

	[Header("Status panel")]
	public GameObject statusPanel;

	public Text information;

	[Header("Human proposal panel")]
	public GameObject proposalPanel;

	public Image proposalPanelTeamLogo;

	public Text proposalPanelTeam;

	public Text proposalPanelCoach;

	public Text proposalPanelTeamMoney;

	public Text proposalPanelTeamProposal;

	public Slider proposalPanelSlider;

	[Header("Footer")]
	public GameObject okButton;

	public GameObject cancelButton;

	public bool isDone;

	private ViewStatus viewStatus;

	private Player player;

	private long playerBaseValue;

	private Team bestOfferTeam;

	private long bestOfferValue;

	private bool forcedSell;

	private Team proposingTeam;

	private Action onCloseView;

	public void Initialize(Player player, long baseValue, bool humanSellingPlayer = false, bool forcedSell = false, Action onCloseView = null)
	{
		this.player = player;
		playerBaseValue = baseValue;
		this.forcedSell = forcedSell;
		this.onCloseView = onCloseView;
		ResetView();
		if (humanSellingPlayer)
		{
			if (forcedSell)
			{
				StartAuction(baseValue);
			}
			else
			{
				UpdateViewState(ViewStatus.SellingPlayer);
				playerSellSlider.minValue = baseValue;
				playerSellSlider.maxValue = Mathf.Max(0f, player.FairPrice() * 2);
				playerSellSlider.value = playerSellSlider.minValue;
				SliderBasePriceChanged(playerSellSlider.value);
			}
		}
		else
		{
			UpdateViewState(ViewStatus.Running);
			StartCoroutine(ComputeAllProposals());
		}
		playerSellSlider.onValueChanged.AddListener(SliderBasePriceChanged);
		proposalPanelSlider.onValueChanged.AddListener(SliderProposalChanged);
	}

	private void StartAuction(long playerBaseValue)
	{
		this.playerBaseValue = playerBaseValue;
		UpdateViewState(ViewStatus.Running);
		StartCoroutine(ComputeAllProposals());
	}

	private void UpdateViewState(ViewStatus newViewStatus)
	{
		viewStatus = newViewStatus;
		playerSellSlider.gameObject.SetActive(viewStatus == ViewStatus.SellingPlayer);
		statusPanel.SetActive(viewStatus == ViewStatus.PlayerSold);
		information.text = "";
		proposalPanel.SetActive(viewStatus == ViewStatus.WaitingProposal);
		okButton.SetActive(viewStatus == ViewStatus.SellingPlayer || viewStatus == ViewStatus.WaitingProposal || viewStatus == ViewStatus.PlayerSold);
		cancelButton.SetActive(viewStatus == ViewStatus.SellingPlayer || viewStatus == ViewStatus.WaitingProposal);
	}

	public override void ResetView()
	{
		UpdatePlayerInfo();
	}

	private void UpdatePlayerInfo()
	{
		player.Team.DrawLogoOnImage(teamLogo);
		teamName.text = player.Team.Name;
		playerName.text = player.GetName();
		playerPositionBackground.color = player.PositionColor();
		playerPosition.text = player.PositionCode();
		playerGoals.text = player.playerSeason.TotalGoalsInSeason().ToString();
		playerInjuryObj.SetActive(player.Injured > 0);
		playerInjury.text = player.Injured.ToString();
		playerCountryFlag.sprite = player.country.flag;
		playerCountry.text = player.country.GetName();
		playerBehaviour.text = player.BehaviourDesc();
		playerSkill.text = player.skill.ToString();
		playerBasePrice.text = Util.MoneyString(playerBaseValue);
		playerNewSalary.text = LanguageController.instance.Get_Translation("GEN_NEW_SALARY", Util.MoneyString(player.MyFairSalary()));
	}

	private void SliderBasePriceChanged(float value)
	{
		playerBasePrice.text = Util.MoneyString((long)value);
	}

	private void SliderProposalChanged(float value)
	{
		proposalPanelTeamProposal.text = Util.MoneyString((long)value);
	}

	private IEnumerator ComputeAllProposals()
	{
		ListOfTeams listOfTeams = new ListOfTeams(DataManager.instance.allTeams);
		listOfTeams.Shuffle();
		foreach (Team item in listOfTeams)
		{
			if (!TeamCanPropose(item))
			{
				continue;
			}
			if (item.Coach.Present(ElifootOptions.SimulationFlag.TeamManagement))
			{
				UpdateViewState(ViewStatus.WaitingProposal);
				HumanPropose(item);
				yield return new WaitUntil(() => viewStatus == ViewStatus.Running);
			}
			else
			{
				PCPropose(item);
			}
		}
		ShowEndResults();
		yield return 0;
	}

	private bool TeamCanPropose(Team team)
	{
		if (team.CanBuyPlayer(player, playerBaseValue) != BuyPlayer.OK)
		{
			return false;
		}
		if (team == player.Team)
		{
			return false;
		}
		return true;
	}

	private void HumanPropose(Team team)
	{
		proposingTeam = team;
		team.DrawLogoOnImage(proposalPanelTeamLogo);
		proposalPanelTeam.text = team.Name;
		proposalPanelCoach.text = team.Coach.Name;
		proposalPanelTeamMoney.text = LanguageController.instance.Get_Translation("PLAYERBUY_MONEYTOTAL", Util.MoneyString(team.Money()));
		proposalPanelSlider.minValue = playerBaseValue;
		proposalPanelSlider.maxValue = team.Money();
		proposalPanelSlider.value = proposalPanelSlider.minValue;
		SliderProposalChanged(proposalPanelSlider.value);
	}

	private bool PCPropose(Team team)
	{
		long offerForPlayer = team.GetOfferForPlayer(player, playerBaseValue, player.MyFairSalary(), player.FairPrice());
		if (offerForPlayer >= playerBaseValue)
		{
			Propose(team, offerForPlayer);
			return true;
		}
		return false;
	}

	private void Propose(Team team, long thisOffer)
	{
		if (thisOffer > bestOfferValue)
		{
			bestOfferValue = thisOffer;
			bestOfferTeam = team;
		}
	}

	private void ShowEndResults()
	{
		UpdateViewState(ViewStatus.PlayerSold);
		if (bestOfferValue != 0L)
		{
			information.text = LanguageController.instance.Get_Translation("PLAYER_SOLD_TEAM", bestOfferTeam.Name, Util.MoneyString(bestOfferValue));
			long newSalary = bestOfferTeam.AverageSalaryForSkill(player.skill);
			DataManager.PlayerTraded(player, player.Team, bestOfferTeam, bestOfferValue, newSalary);
		}
		else
		{
			information.text = LanguageController.instance.Get_Translation("PLAYER_NO_PROPOSALS", player.GetName());
			if (!forcedSell)
			{
				player.LockedFor = 1;
			}
		}
	}

	public void OkPressed()
	{
		if (viewStatus == ViewStatus.WaitingProposal)
		{
			UpdateViewState(ViewStatus.Running);
			Propose(proposingTeam, (long)proposalPanelSlider.value);
		}
		if (viewStatus == ViewStatus.SellingPlayer)
		{
			StartAuction((long)playerSellSlider.value);
		}
		else if (viewStatus == ViewStatus.PlayerSold)
		{
			onCloseView?.Invoke();
			isDone = true;
		}
	}

	public void CancelPressed()
	{
		if (viewStatus == ViewStatus.WaitingProposal)
		{
			UpdateViewState(ViewStatus.Running);
		}
		else
		{
			isDone = true;
		}
	}
}
