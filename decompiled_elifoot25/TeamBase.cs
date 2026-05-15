using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

[Serializable]
public class TeamBase : EliObject
{
	private ListOfPlayers players;

	private Coach coach;

	private string shortName;

	private string originalName;

	private string changedName;

	public int morale;

	private int targetPlayerSkill = Util.Average(DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);

	protected long totalSalaries;

	private Dictionary<Competition, Division> myDivisions = new Dictionary<Competition, Division>();

	private Dictionary<Competition, TeamCompetitionData> competitionData = new Dictionary<Competition, TeamCompetitionData>();

	public ListOfPlayers Players
	{
		get
		{
			return players;
		}
		set
		{
			players = value;
			players.MyTeam = (Team)this;
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
			if (coach != null && coach.MyTeam == this)
			{
				coach.MyTeam = null;
			}
			ResetMorale();
			coach = value;
			if (coach != null)
			{
				coach.MyTeam = (Team)this;
				((Team)this).SetHistoryDataLength();
			}
		}
	}

	public string ShortName
	{
		get
		{
			return shortName;
		}
		set
		{
			if (value != null)
			{
				shortName = value.Substring(0, Mathf.Min(value.Length, DataManager.TEAM_MININAME_LENGTH_MAX));
			}
		}
	}

	public string OriginalName => originalName;

	public string ChangedName => changedName;

	public string Name
	{
		get
		{
			if (changedName != null)
			{
				return changedName;
			}
			return originalName;
		}
		set
		{
			if (value != null)
			{
				value = value.Substring(0, Mathf.Min(value.Length, DataManager.TEAM_NAME_LENGTH_MAX));
			}
			if (ShortName == null)
			{
				ShortName = value;
			}
			if (originalName == null)
			{
				originalName = value;
			}
			if (value == originalName)
			{
				changedName = null;
			}
			else
			{
				changedName = value;
			}
		}
	}

	public string ScreenName
	{
		get
		{
			string newValue = '\u00a0'.ToString();
			return Name.Replace(" ", newValue);
		}
	}

	public int TargetPlayerSkill
	{
		get
		{
			return targetPlayerSkill;
		}
		set
		{
			targetPlayerSkill = Mathf.Clamp(value, DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
		}
	}

	public void ResetMorale()
	{
		morale = DataManager.TEAM_MORALE_DEFAULT;
	}

	public Division MyDivision(Competition competition)
	{
		if (competition == null || !myDivisions.ContainsKey(competition))
		{
			return null;
		}
		return myDivisions[competition];
	}

	public void AddDivision(Competition competition, Division division)
	{
		myDivisions.Add(competition, division);
	}

	public void AddDivision(Division division)
	{
		myDivisions.Add(division.Competition, division);
	}

	public void RemoveDivision(Division division)
	{
		myDivisions.Remove(division.Competition);
	}

	public Dictionary<Competition, TeamCompetitionData>.KeyCollection MyCompetitions()
	{
		return competitionData.Keys;
	}

	public TeamCompetitionData CompetitionData(Division division)
	{
		return CompetitionData(division.Competition);
	}

	public TeamCompetitionData CompetitionData(Competition competition)
	{
		if (competition == null || !competitionData.ContainsKey(competition))
		{
			return null;
		}
		return competitionData[competition];
	}

	public TeamCompetitionData CompetitionData(CompetitionType competitionType)
	{
		Competition competition = FindCompetition(competitionType);
		if (competition == null)
		{
			return null;
		}
		return CompetitionData(competition);
	}

	public TeamCompetitionData CompetitionData(GlobalCalendarEntry globalCalendarEntry)
	{
		if (globalCalendarEntry.competition == null)
		{
			return CompetitionData(globalCalendarEntry.competitionType);
		}
		return CompetitionData(globalCalendarEntry.competition);
	}

	public void AddCompetition(Competition competition)
	{
		competitionData.Add(competition, new TeamCompetitionData());
	}

	public void RemoveCompetition(Competition competition)
	{
		competitionData.Remove(competition);
	}

	public void ResetCompetitionData()
	{
		foreach (KeyValuePair<Competition, TeamCompetitionData> competitionDatum in competitionData)
		{
			competitionDatum.Value.Reset();
		}
	}

	public Competition FindCompetition(CompetitionType competitionType)
	{
		return competitionData.Keys.FirstOrDefault((Competition x) => x.competitionType == competitionType);
	}

	public Competition FindCompetition(GlobalCalendarEntry globalCalendarEntry)
	{
		if (globalCalendarEntry.competition == null)
		{
			return FindCompetition(globalCalendarEntry.competitionType);
		}
		return globalCalendarEntry.competition;
	}

	public int TotalSeasonGoals()
	{
		return competitionData.Values.Sum((TeamCompetitionData x) => x.goalsFor);
	}

	public TeamBase()
		: base(generateID: true)
	{
	}
}
