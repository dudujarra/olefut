using System;

[Serializable]
public struct TeamCoach
{
	[NonSerialized]
	private Team team;

	public long teamID;

	[NonSerialized]
	private Coach coach;

	public long coachID;

	public Team Team
	{
		get
		{
			return team;
		}
		set
		{
			team = value;
			teamID = ((team == null) ? 0 : team.ID);
		}
	}

	public Coach Coach
	{
		get
		{
			return coach;
		}
		set
		{
			coach = value;
			coachID = ((coach == null) ? 0 : coach.ID);
		}
	}

	public TeamCoach(Team team, Coach coach)
	{
		this.team = team;
		this.coach = coach;
		coachID = coach?.ID ?? 0;
		teamID = team?.ID ?? 0;
	}

	public void PostLoad()
	{
		team = DataManager.instance.allTeams.FindTeamByID(teamID);
		coach = DataManager.instance.allCoaches.FindCoachByID(coachID);
	}
}
