using System;

[Serializable]
public class Transaction : EliObject
{
	private TransactionType type;

	private object[] parameters;

	private long amount;

	private long currentBalance;

	public TransactionType Type
	{
		get
		{
			return type;
		}
		set
		{
			type = value;
		}
	}

	public long Amount
	{
		get
		{
			return amount;
		}
		set
		{
			amount = value;
		}
	}

	public long CurrentBalance
	{
		get
		{
			return currentBalance;
		}
		set
		{
			currentBalance = value;
		}
	}

	public Transaction(TransactionType type, long amount, long currentBalance, params object[] args)
		: base(generateID: false)
	{
		this.type = type;
		this.amount = amount;
		this.currentBalance = currentBalance;
		parameters = args;
	}

	public string GetDescription()
	{
		string format = LanguageController.instance.Get_Translation("TEAM_BALANCE_" + type.ToString().ToUpperInvariant());
		object[] array = new object[parameters.Length];
		if (type == TransactionType.Prize)
		{
			if (array.Length >= 1)
			{
				array[0] = ((Coach.CoachEvent)parameters[0]).GetTransactionText();
			}
		}
		else
		{
			for (int i = 0; i < array.Length; i++)
			{
				array[i] = LanguageController.instance.Get_Translation(parameters[i].ToString());
			}
		}
		return string.Format(format, array);
	}
}
