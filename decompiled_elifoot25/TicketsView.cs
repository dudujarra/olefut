using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class TicketsView : EliView
{
	public GameObject ticketsPrefab;

	[Header("View General")]
	private List<EliObject> ticketIncomeList;

	public Transform ticketsGroupParent;

	public void Initialize(EliLimitedList ticketIncomeList)
	{
		this.ticketIncomeList = new List<EliObject>(ticketIncomeList);
		this.ticketIncomeList.Reverse();
		FillTicketList();
	}

	private void FillTicketList()
	{
		for (int i = 0; i < ticketsGroupParent.childCount; i++)
		{
			Object.Destroy(ticketsGroupParent.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		foreach (TicketIncome ticketIncome in ticketIncomeList)
		{
			GameObject gameObject = Object.Instantiate(ticketsPrefab, ticketsGroupParent);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			Team opponentTeam = ticketIncome.opponentTeam;
			Util.GetGameObjectText(gameObject, "Opponent/Name").text = opponentTeam.Name;
			if (opponentTeam.MyShirt != null)
			{
				gameObject.transform.Find("Shirt");
				Image gameObjectImage = Util.GetGameObjectImage(gameObject, "Opponent/Shirt");
				opponentTeam.DrawLogoOnImage(gameObjectImage);
			}
			gameObject.transform.Find("Match").GetComponent<Text>().text = ticketIncome.competition.GetName();
			gameObject.transform.Find("Tickets").GetComponent<Text>().text = Util.MoneyString(ticketIncome.ticketPrice);
			Text component = gameObject.transform.Find("Attendance").GetComponent<Text>();
			long attendance = ticketIncome.attendance;
			component.text = attendance.ToString("###,###,##0");
			gameObject.transform.Find("Income").GetComponent<Text>().text = Util.MoneyString(ticketIncome.amount);
		}
	}

	public void BackPressed()
	{
		Close();
	}
}
