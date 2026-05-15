using System;

[Serializable]
public class BankBase : EliObject
{
	public EliLimitedList transactions;

	private long money;

	public long Money => money;

	public BankBase()
		: base(generateID: false)
	{
		money = 0L;
		if (DataManager.instance != null)
		{
			transactions = new EliLimitedList(DataManager.TRANSACTIONS_LENGTH_HUMAN_MAX);
		}
	}

	private void AddMoney(long amount)
	{
		long num = amount + money;
		money = ((num > DataManager.BANK_AMOUNT_MAX) ? DataManager.BANK_AMOUNT_MAX : num);
	}

	public void AddTransaction(long amount, TransactionType type, params object[] args)
	{
		AddMoney(amount);
		Transaction item = new Transaction(type, amount, money, args);
		transactions.Add(item);
	}
}
