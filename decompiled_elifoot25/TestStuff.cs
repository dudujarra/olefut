using UnityEngine;

public class TestStuff : MonoBehaviour
{
	private void Start()
	{
		Debug.Log(new Msg(Msg.Test.Sim).Value);
	}
}
