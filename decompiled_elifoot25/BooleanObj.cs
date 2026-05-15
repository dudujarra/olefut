public class BooleanObj
{
	private bool value;

	public bool Value
	{
		get
		{
			return value;
		}
		set
		{
			this.value = value;
		}
	}

	public BooleanObj(bool value)
	{
		this.value = value;
	}

	public override string ToString()
	{
		return value.ToString();
	}
}
