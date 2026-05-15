using System.Collections;

public class PauseView : EliView
{
	private bool backPressed;

	private Team myTeam;

	public void Initialize()
	{
		base.gameObject.SetActive(value: true);
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}

	public void OKPressed()
	{
		backPressed = true;
		Close();
	}

	public void OptionsPressed()
	{
		ScreenController.instance.ShowOptionsView(null);
	}

	public void CoachesPressed()
	{
		ScreenController.instance.ShowCoachesView(CoachManagerViewMode.InGame);
	}
}
