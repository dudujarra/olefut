using System;
using System.Collections.Generic;

[Serializable]
public class ListOfDivisions : EliList
{
	public Division Division(int index)
	{
		return (Division)base[index];
	}

	public void BeginSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Division)enumerator.Current).BeginSeason();
		}
	}

	public bool ContainsTeam(Team team)
	{
		return Find((EliObject x) => ((Division)x).ContainsTeam(team)) != null;
	}

	public void RemoveAllTeams()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Division)enumerator.Current).RemoveAllTeams();
		}
	}

	public bool HasHumanCoach()
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (((Division)enumerator.Current).HasHumanCoach())
				{
					return true;
				}
			}
		}
		return false;
	}

	public bool HasPresentCoach(ElifootOptions.SimulationFlag simulationFlag)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (((Division)enumerator.Current).HasPresentCoach(simulationFlag))
				{
					return true;
				}
			}
		}
		return false;
	}

	public void EndOfSeason(Competition competition)
	{
		for (int i = 0; i < base.Count; i++)
		{
			Division(i).teams.SortByLeaguePosition(competition);
		}
		int num = Calendars.numberTeamsSwapping[DataManager.instance.properties.divConfigIndex[(int)competition.competitionType]];
		for (int j = 0; j < base.Count - 1; j++)
		{
			Division division = Division(j);
			Division withDivision = Division(j + 1);
			division.SwapTeams(withDivision, num);
		}
		if (base.Count != 0)
		{
			Division division2 = (Division)Last();
			competition.supernumeraryTeams.SortByHumanAndSkillDesc();
			for (int k = 0; k < Math.Min(competition.supernumeraryTeams.Count, num); k++)
			{
				Team team = division2.teams.Team(division2.teams.Count - num);
				division2.RemoveTeam(team);
				competition.supernumeraryTeams.Add(team);
				team.Coach.AddEvent(Coach.CoachEvent.CoachEventType.Excluded, competition, division2);
				team = competition.supernumeraryTeams.Team(0);
				competition.supernumeraryTeams.RemoveAt(0);
				division2.AddTeam(team);
				team.Coach.AddEvent(Coach.CoachEvent.CoachEventType.DivisionUp, competition, division2);
			}
		}
	}

	public ListOfDivisions(List<EliObject> other, bool exclusive = false)
		: base(exclusive)
	{
		Clear();
		foreach (EliObject item in other)
		{
			Add((Division)item);
		}
	}

	public ListOfDivisions(bool exclusive = false)
		: base(exclusive)
	{
	}

	public override void PostLoad()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Division)enumerator.Current).PostLoad();
		}
	}

	public void PostDay()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Division)enumerator.Current).PostDay();
		}
	}

	public void Initialize()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Division)enumerator.Current).Initialize();
		}
	}

	public void SetTargetSkill()
	{
		float num = DataManager.PLAYER_SKILL_MAX;
		float num2 = num / (float)base.Count;
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Division division = (Division)enumerator.Current;
			division.targetSkillFirst = (int)num;
			division.deltaSkillByPosition = num2 / (float)division.teams.Count;
			num -= num2;
		}
	}

	public ListOfCompetitions GetCompetitions()
	{
		ListOfCompetitions listOfCompetitions = new ListOfCompetitions();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Division division = (Division)enumerator.Current;
			listOfCompetitions.Add(division.Competition);
		}
		return listOfCompetitions;
	}
}
