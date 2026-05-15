using System;

[Serializable]
public class Bank : BankBase
{
	public void InitBank(long money)
	{
		AddTransaction(money, TransactionType.InitialMoney, "ID:BANK_INITIAL_MONEY");
	}
}
