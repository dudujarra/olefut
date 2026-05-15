using System.Collections;
using UnityEngine;

public class PlayerMarketView : EliView
{
	public Transform playerMarketGroupParent;

	public GameObject playerMarketPrefab;

	private EliLimitedList playerMarketList;

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private bool backPressed;

	public void Initialize(EliLimitedList playerMarketList)
	{
		this.playerMarketList = playerMarketList;
		FillPlayerList();
	}

	private void FillPlayerList()
	{
		ClearList();
		bool darkenNext = false;
		bool darkenThis = false;
		for (int num = playerMarketList.Count - 1; num >= 0; num--)
		{
			GameObject obj = Object.Instantiate(playerMarketPrefab, playerMarketGroupParent);
			DarkenListBackgroundObj(obj, ref darkenThis, ref darkenNext);
			PlayerTransferEvent playerTransferEvent = playerMarketList[num] as PlayerTransferEvent;
			Util.GetGameObjectText(obj, "PlayerName").text = playerTransferEvent.player.GetName();
			Util.GetGameObjectText(obj, "Position/Position").text = playerTransferEvent.player.PositionCode();
			Util.GetGameObjectImage(obj, "Position/PositionBackground").color = playerTransferEvent.player.PositionColor();
			Util.GetGameObjectText(obj, "Skill").text = playerTransferEvent.skill.ToString();
			Util.GetGameObjectText(obj, "Nationality").text = playerTransferEvent.player.country.GetName();
			Util.GetGameObjectText(obj, "FromTeam").text = playerTransferEvent.fromTeam.ShortName;
			Util.GetGameObjectText(obj, "ToTeam").text = playerTransferEvent.toTeam.ShortName;
			Util.GetGameObjectText(obj, "Price").text = Util.MoneyString(playerTransferEvent.price);
			Util.GetGameObjectText(obj, "FromTeam").color = playerTransferEvent.fromTeam.GetCoachTextColor();
			Util.GetGameObjectText(obj, "ToTeam").color = playerTransferEvent.toTeam.GetCoachTextColor();
		}
	}

	private void ClearList()
	{
		for (int i = 0; i < playerMarketGroupParent.childCount; i++)
		{
			Object.Destroy(playerMarketGroupParent.GetChild(i).gameObject);
		}
	}

	public void BackButtonPressed()
	{
		backPressed = true;
		Close();
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}

	public void StartTimeToClose(float seconds)
	{
		secondsToClose = seconds;
		secondsTimer = secondsToClose;
		if (secondsToClose > 0f)
		{
			StartCoroutine(TimeToClose());
		}
	}

	private IEnumerator TimeToClose()
	{
		while (secondsTimer > 0f)
		{
			if (!pauseTimer)
			{
				secondsTimer -= Time.deltaTime;
			}
			yield return 0;
		}
		BackButtonPressed();
	}
}
