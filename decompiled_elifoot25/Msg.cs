public class Msg
{
	public enum Test
	{
		Sim,
		Nao,
		Talvez
	}

	public Test Value { get; set; }

	public Msg(Test testObj)
	{
		Value = testObj;
		Value = Test.Nao;
	}
}
