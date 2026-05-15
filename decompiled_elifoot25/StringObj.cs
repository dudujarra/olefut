public class StringObj
{
	private string value;

	public string Value
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

	public StringObj(string value)
	{
		this.value = value;
	}
}
