using System;
using System.Collections.Generic;
using System.Linq;

[Serializable]
public class ListOfCompetitions : EliList
{
	public ListOfCompetitions(bool exclusive = false)
		: base(exclusive)
	{
	}

	public Competition Competition(int index)
	{
		return (Competition)base[index];
	}

	public void BeginSeason()
	{
		ForEach(delegate(EliObject x)
		{
			((Competition)x).BeginSeason();
		});
	}

	public void EndOfSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Competition obj = (Competition)enumerator.Current;
			obj.EndOfSeason();
			obj.CheckNextYearTeams();
		}
	}

	public void CheckWinners()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Competition)enumerator.Current).CheckWinner();
		}
	}

	public void Initialize()
	{
		foreach (Competition item in this.ToList())
		{
			item.Initialize();
		}
	}

	public bool HasHumanCoach()
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (((Competition)enumerator.Current).HasHumanCoach())
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
				if (((Competition)enumerator.Current).HasPresentCoach(simulationFlag))
				{
					return true;
				}
			}
		}
		return false;
	}

	public ListOfCompetitions(List<EliObject> other)
	{
		Clear();
		foreach (EliObject item in other)
		{
			Add((Competition)item);
		}
	}

	public void PostLoad(string saveGameVersion)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Competition)enumerator.Current).PostLoad(saveGameVersion);
		}
	}

	public void PostDay()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Competition)enumerator.Current).PostDay();
		}
	}

	public Competition FindCompetition(CompetitionType competitionType, Country country = null)
	{
		return (Competition)Find(delegate(EliObject x)
		{
			Competition competition = (Competition)x;
			return competition.competitionType == competitionType && (competition.country == null || (competition.country != null && competition.country == country));
		});
	}

	public ListOfDivisions GetDivisions(CompetitionType competitionType)
	{
		ListOfDivisions listOfDivisions = new ListOfDivisions();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Competition competition = (Competition)enumerator.Current;
			if (competition.competitionType == competitionType)
			{
				listOfDivisions.AddRange(competition.divisions);
			}
		}
		return listOfDivisions;
	}

	public ListOfDivisions GetDivisions(GlobalCalendarEntry calEntry)
	{
		ListOfDivisions listOfDivisions = new ListOfDivisions();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Competition competition = (Competition)enumerator.Current;
			if ((calEntry.competition != null) ? (calEntry.competition == competition) : (calEntry.competitionType == competition.competitionType))
			{
				listOfDivisions.AddRange(competition.divisions);
			}
		}
		return listOfDivisions;
	}

	public ListOfDivisions GetLastMainDivisions()
	{
		ListOfDivisions ret = new ListOfDivisions(exclusive: true);
		ForEach(delegate(EliObject x)
		{
			Competition competition = (Competition)x;
			if (competition.competitionType == CompetitionType.NationalLeague && competition.divisions.Count > 0)
			{
				ret.Add(competition.divisions.Last());
			}
		});
		return ret;
	}

	public ListOfCompetitions GetCompetitionsByPhase(CompetitionPhase competitionPhase)
	{
		ListOfCompetitions listOfCompetitions = new ListOfCompetitions();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Competition competition = (Competition)enumerator.Current;
			if (competition.configuration.competitionPhasesPlayed[(int)competitionPhase])
			{
				listOfCompetitions.Add(competition);
			}
		}
		return listOfCompetitions;
	}

	public ListOfCompetitions GetActiveCompetitionsByPhase(CompetitionPhase competitionPhase)
	{
		ListOfCompetitions listOfCompetitions = new ListOfCompetitions();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Competition competition = (Competition)enumerator.Current;
			if (!competition.terminated && competition.configuration.competitionPhasesPlayed[(int)competitionPhase])
			{
				listOfCompetitions.Add(competition);
			}
		}
		return listOfCompetitions;
	}

	public ListOfCompetitions GetCompetitionsWithRecordedWinners()
	{
		ListOfCompetitions listOfCompetitions = new ListOfCompetitions();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Competition competition = (Competition)enumerator.Current;
			if (competition.lastWinners.Count > 0)
			{
				listOfCompetitions.Add(competition);
			}
		}
		return listOfCompetitions;
	}

	public void SortBySortOrderAndName()
	{
		Sort(delegate(EliObject c1, EliObject c2)
		{
			Competition competition = (Competition)c1;
			Competition competition2 = (Competition)c2;
			int num = competition.configuration.sortOrder.CompareTo(competition2.configuration.sortOrder);
			if (num == 0)
			{
				num = competition.GetName().CompareTo(competition2.GetName());
			}
			return num;
		});
	}

	public Competition FindCompetitionByID(long id)
	{
		return (Competition)Find((EliObject tObj) => ((Competition)tObj).ID == id);
	}
}
