using UnityEngine;
using UnityEngine.UI;

public class BankView : EliView
{
	public Transform transactionGroupParent;

	public GameObject transactionPrefab;

	private Bank bank;

	public void Initialize(Bank bank)
	{
		this.bank = bank;
		FillTransactionList();
	}

	private void FillTransactionList()
	{
		foreach (Transform item in transactionGroupParent.transform)
		{
			if (item != transactionGroupParent.transform)
			{
				Object.Destroy(item.gameObject);
			}
		}
		bool darkenNext = false;
		bool darkenThis = false;
		for (int num = bank.transactions.Count - 1; num >= 0; num--)
		{
			GameObject gameObject = Object.Instantiate(transactionPrefab, transactionGroupParent);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			Transaction transaction = (Transaction)bank.transactions[num];
			gameObject.transform.Find("Description").GetComponent<Text>().text = transaction.GetDescription();
			gameObject.transform.Find("Balance").GetComponent<Text>().text = Util.MoneyString(transaction.CurrentBalance);
			gameObject.transform.Find("Movement").GetComponent<Text>().text = Util.MoneyString(transaction.Amount);
		}
	}

	public void BackPressed()
	{
		Close();
	}
}
