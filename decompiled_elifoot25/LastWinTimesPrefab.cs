using UnityEngine;
using UnityEngine.UI;

public class LastWinTimesPrefab : MonoBehaviour
{
	public Button coachOrTeamOrCompetitionButton;

	public Text coachOrTeamOrCompetition;

	public Text timesWon;

	public void Initialize(Coach coach, int timesWon)
	{
		Initialize(coach.Name, timesWon, coach);
	}

	public void Initialize(Team team, int timesWon)
	{
		Initialize(team.Name, timesWon, null, team);
	}

	public void Initialize(Competition competition, int timesWon)
	{
		Initialize(competition.GetShortName(), timesWon, null, null, competition);
	}

	private void Initialize(string coachOrTeamOrCompetition, int timesWon, Coach coach = null, Team team = null, Competition competition = null)
	{
		this.coachOrTeamOrCompetition.text = coachOrTeamOrCompetition;
		if (coach != null)
		{
			this.coachOrTeamOrCompetition.color = coach.GetCoachTextColor();
		}
		this.timesWon.text = timesWon.ToString("0");
		if (coach != null)
		{
			coachOrTeamOrCompetitionButton.onClick.AddListener(delegate
			{
				ScreenController.instance.ShowTitlesPopUp(coach);
			});
		}
		else if (team != null)
		{
			coachOrTeamOrCompetitionButton.onClick.AddListener(delegate
			{
				ScreenController.instance.ShowTitlesPopUp(team);
			});
		}
		else
		{
			coachOrTeamOrCompetitionButton.enabled = false;
		}
	}
}
