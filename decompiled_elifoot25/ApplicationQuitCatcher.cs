using UnityEngine;

public class ApplicationQuitCatcher : MonoBehaviour
{
	private bool isQuitting;

	private void Start()
	{
		Application.wantsToQuit += WantsToQuit;
	}

	private bool WantsToQuit()
	{
		if (!isQuitting)
		{
			ScreenController.instance.ShowDialogPopUp("QUIT_TITLE", "QUIT_CONFIRM", ReallyQuit, delegate
			{
				isQuitting = false;
			});
			isQuitting = true;
		}
		return false;
	}

	private void ReallyQuit()
	{
		Application.wantsToQuit -= WantsToQuit;
		Application.Quit();
	}
}
