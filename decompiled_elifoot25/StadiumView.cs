using System;
using UnityEngine;
using UnityEngine.UI;

public class StadiumView : EliView
{
	public Text seatNumberValue;

	public Text seatCostHeader;

	public Text seatCostValue;

	public Text availableCashValue;

	public GameObject buyButton;

	private Team team;

	private Action onCloseView;

	public void Initialize(Team team, Action onCloseView)
	{
		base.gameObject.SetActive(value: true);
		this.onCloseView = onCloseView;
		this.team = team;
		UpdateView();
	}

	private void UpdateView()
	{
		Button component = buyButton.GetComponent<Button>();
		seatNumberValue.text = team.stadium.NumberSeats.ToString();
		if (team.stadium.MayIncreaseNumberSeats())
		{
			seatCostHeader.text = LanguageController.instance.Get_Translation("STADIUM_SEATCOST", DataManager.STADIUM_SEATS_BLOCK_SIZE);
			seatCostValue.gameObject.SetActive(value: true);
			seatCostValue.text = Util.MoneyString(team.stadium.GetNewBenchPrice());
			component.interactable = team.Money() >= team.stadium.GetNewBenchPrice();
		}
		else
		{
			seatCostHeader.text = LanguageController.instance.Get_Translation("STADIUM_FULL");
			seatCostValue.gameObject.SetActive(value: false);
			component.interactable = false;
		}
		availableCashValue.text = Util.MoneyString(team.Money());
	}

	public void OnBuySeatsPressed()
	{
		if (team.stadium.NumberSeats < DataManager.STADIUM_MAX_NUMBER_SEATS && team.Money() >= team.stadium.GetNewBenchPrice())
		{
			ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("STADIUM_TITLE"), LanguageController.instance.Get_Translation("STADIUM_CONFIRMBUY"), BuyNewBench, null);
		}
	}

	public void BuyNewBench()
	{
		team.MoneyTransaction(-1 * team.stadium.GetNewBenchPrice(), TransactionType.Stadium, false);
		team.stadium.IncreaseNumberSeats(DataManager.STADIUM_SEATS_BLOCK_SIZE);
		UpdateView();
	}

	public void BackPressed()
	{
		if (onCloseView != null)
		{
			onCloseView();
		}
		Close();
	}
}
