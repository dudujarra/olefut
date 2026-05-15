using System;
using UnityEngine;
using UnityEngine.UI;

public class PlayerDetailsView : ParametersView
{
	public enum ReturnAction
	{
		Close,
		Previous,
		Next,
		Buy,
		Sell,
		ChangeSalary,
		Heal,
		RemoveSuspension
	}

	private Player myPlayer;

	private ParametersView parametersView;

	private ListOfParameters playerParameters = new ListOfParameters();

	private Action<PlayerDetailsView, Player, ReturnAction> onReturnAction;

	private bool canEdit;

	internal void Initialize(Player player, Action<PlayerDetailsView, Player, ReturnAction> onReturnAction, bool canEdit = true)
	{
		parametersView = base.gameObject.GetComponent<ParametersView>();
		myPlayer = player;
		this.onReturnAction = onReturnAction;
		this.canEdit = canEdit;
		FillPlayerParameters();
		parametersView.Initialize(LanguageController.instance.Get_Translation("PLAYER_DETAILS_TITLE"), playerParameters, null, showLoadingView: false, GridViewMode.Reduced);
		if (canEdit)
		{
			parametersView.previousButton.SetActive(value: true);
			parametersView.previousButton.gameObject.GetComponent<Button>().onClick.AddListener(OnPreviousPressed);
			parametersView.nextButton.gameObject.SetActive(value: true);
			parametersView.nextButton.gameObject.GetComponent<Button>().onClick.AddListener(OnNextPressed);
		}
		base.gameObject.SetActive(value: true);
	}

	private void FillPlayerParameters()
	{
		playerParameters.Clear();
		playerParameters.StartSection("GEN_PLAYER");
		playerParameters.RegisterReadOnlyParameter("GEN_NAME", myPlayer.Name);
		playerParameters.RegisterReadOnlyParameter("GEN_POSITION", myPlayer.PositionDesc());
		playerParameters.RegisterReadOnlyParameter("GEN_SKILL", myPlayer.skill);
		playerParameters.RegisterReadOnlyParameter("GEN_NATIONALITY", myPlayer.country.GetName());
		playerParameters.RegisterReadOnlyParameter("GEN_BEHAVIOUR", myPlayer.BehaviourDesc());
		playerParameters.StartSection("GEN_FINANCIAL_DATA");
		string text = Util.MoneyString(myPlayer.BestOfferValue);
		if (canEdit)
		{
			Sprite sellIcon = myPlayer.GetSellIcon(myPlayer.Team);
			Action onButtonPressed = ((myPlayer.Team.CanSellPlayer(myPlayer) != SellPlayer.OK) ? new Action(OnLockedIconPressed) : new Action(OnSellPressed));
			bool active = myPlayer.BestOfferValue > 0 && myPlayer.BestOfferTeam != null;
			playerParameters.RegisterButtonParameter("ID:PLAYER_BEST_OFFER", new EliParameter.ButtonConfig(text, active, sellIcon, onButtonPressed));
		}
		else
		{
			playerParameters.RegisterReadOnlyParameter("ID:PLAYER_MARKET_VALUE", text);
		}
		if (canEdit)
		{
			Sprite changeSalaryIcon = myPlayer.GetChangeSalaryIcon(myPlayer.Team);
			Action onButtonPressed2 = ((!myPlayer.CanChangeSalary(spontaneous: false)) ? new Action(OnLockedIconPressed) : new Action(OnChangeSalaryPressed));
			playerParameters.RegisterButtonParameter("ID:GEN_SALARY", new EliParameter.ButtonConfig(Util.MoneyString(myPlayer.Salary), active: true, changeSalaryIcon, onButtonPressed2));
		}
		else
		{
			playerParameters.RegisterReadOnlyParameter("ID:GEN_SALARY", Util.MoneyString(myPlayer.Salary));
		}
		playerParameters.StartSection("PLAYER_CONDITION");
		bool flag = false;
		Action onButtonPressed3 = null;
		Action onButtonPressed4 = null;
		string text2 = ((myPlayer.Injured <= 0) ? LanguageController.instance.Get_Translation("GEN_NO") : LanguageController.instance.SingularOrPlural(myPlayer.Injured, "GEN_1_MATCH", "GEN_X_MATCHES", myPlayer.Injured));
		if (canEdit)
		{
			playerParameters.RegisterButtonParameter("PLAYER_INJURED", new EliParameter.ButtonConfig(text2, flag && myPlayer.Injured > 0, myPlayer.GetHealInjuryIcon(), onButtonPressed3));
		}
		else
		{
			playerParameters.RegisterReadOnlyParameter("PLAYER_INJURED", text2);
		}
		string text3 = ((myPlayer.Suspended <= 0) ? LanguageController.instance.Get_Translation("GEN_NO") : LanguageController.instance.SingularOrPlural(myPlayer.Suspended, "GEN_1_MATCH", "GEN_X_MATCHES", myPlayer.Suspended));
		if (canEdit)
		{
			playerParameters.RegisterButtonParameter("PLAYER_SUSPENDED", new EliParameter.ButtonConfig(text3, flag && myPlayer.Suspended > 0, myPlayer.GetRemoveRedCardIcon(), onButtonPressed4));
		}
		else
		{
			playerParameters.RegisterReadOnlyParameter("PLAYER_SUSPENDED", text3);
		}
		playerParameters.StartSection("GEN_SEASON");
		playerParameters.RegisterReadOnlyParameter("GEN_GOALS", myPlayer.playerSeason.TotalGoalsInSeason());
		playerParameters.StartSection("PLAYER_TITLE_HISTORY");
		playerParameters.RegisterReadOnlyParameter("GEN_MATCHES", myPlayer.history.matchesPlayed);
		playerParameters.RegisterReadOnlyParameter("GEN_GOALS", myPlayer.history.goalsScored);
		playerParameters.RegisterReadOnlyParameter("GEN_YELLOW_CARDS", myPlayer.history.yellowCards);
		playerParameters.RegisterReadOnlyParameter("GEN_RED_CARDS", myPlayer.history.redCards);
		playerParameters.RegisterReadOnlyParameter("GEN_INJURIES", myPlayer.history.injuries);
	}

	public void ReInitialize(Player player)
	{
		myPlayer = player;
		FillPlayerParameters();
		parametersView.ReInitialize(LanguageController.instance.Get_Translation("PLAYER_DETAILS_TITLE"), playerParameters);
	}

	public override void OnPreviousPressed()
	{
		onReturnAction?.Invoke(this, myPlayer, ReturnAction.Previous);
	}

	public override void OnNextPressed()
	{
		onReturnAction?.Invoke(this, myPlayer, ReturnAction.Next);
	}

	public void OnSellPressed()
	{
		onReturnAction?.Invoke(this, myPlayer, ReturnAction.Sell);
	}

	public void OnChangeSalaryPressed()
	{
		if (onReturnAction != null)
		{
			base.gameObject.SetActive(value: false);
			onReturnAction(this, myPlayer, ReturnAction.ChangeSalary);
		}
	}

	public void OnLockedIconPressed()
	{
		Player.ShowLockedLegend();
	}
}
