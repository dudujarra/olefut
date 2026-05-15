using System.Collections;
using UnityEngine;

public class ScoreView : EliView
{
	public bool backPressed;

	public GameObject coachObj;

	public void Initialize()
	{
		ResetView();
		FillCoachScore();
		Update();
	}

	public override void ResetView()
	{
		base.ResetView();
	}

	private void FillCoachScore()
	{
		Coach coach = DataManager.instance.allCoaches.FindHumanCoach();
		Util.GetGameObjectText(coachObj, "Name").text = coach.Name;
		Util.GetGameObjectText(coachObj, "CurrentScore").text = LanguageController.instance.Get_Translation("COACHSCORE_CURRENTSCORE", coach.totalSocialPoints.ToString());
		Util.GetGameObjectText(coachObj, "SeasonScore").text = LanguageController.instance.Get_Translation("COACHSCORE_SEASONSCORE", coach.coachSeason.SeasonPoints.ToString());
		Util.GetGameObjectText(coachObj, "NewScore").text = LanguageController.instance.Get_Translation("COACHSCORE_NEWSCORE", coach.CurrentSocialPoints().ToString());
	}

	public void ClosePressed()
	{
		backPressed = true;
		Close();
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}
}
