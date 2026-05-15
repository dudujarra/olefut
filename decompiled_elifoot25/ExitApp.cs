using UnityEngine;

public class ExitApp : MonoBehaviour
{
	private void Update()
	{
		if (Input.GetKeyDown(KeyCode.Escape))
		{
			Application.Quit();
			MonoBehaviour.print("Quit app");
		}
	}
}
