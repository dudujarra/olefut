using System;

[Serializable]
public class PendingTransaction : EliObject
{
	private TransactionType type;

	private object[] parameters;

	private long amount;

	public TransactionType Type => type;

	public object[] Parameters => parameters;

	public long Amount => amount;

	public PendingTransaction(long amount, TransactionType type, params object[] args)
		: base(generateID: false)
	{
		this.type = type;
		this.amount = amount;
		parameters = args;
	}
}
