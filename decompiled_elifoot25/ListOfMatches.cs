using System;
using System.Collections.Generic;

[Serializable]
public class ListOfMatches : EliList
{
	public Match Match(int index)
	{
		return (Match)base[index];
	}

	public void Remove(Match match)
	{
		match.PostMatch();
		Remove((EliObject)match);
	}

	public bool HasCoachPresent(ElifootOptions.SimulationFlag simulationFlag)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Match match = (Match)enumerator.Current;
				if (match.homeTeam.Coach.Present(simulationFlag) || match.awayTeam.Coach.Present(simulationFlag))
				{
					return true;
				}
			}
		}
		return false;
	}

	public Match GetFirstMatchWithCoachPresent(ElifootOptions.SimulationFlag simulationFlag)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Match match = (Match)enumerator.Current;
				if (match.homeTeam.Coach.Present(simulationFlag) || match.awayTeam.Coach.Present(simulationFlag))
				{
					return match;
				}
			}
		}
		return null;
	}

	public Match GetFirstMatchWithCoachHuman()
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Match match = (Match)enumerator.Current;
				if (match.homeTeam.Coach.human || match.awayTeam.Coach.human)
				{
					return match;
				}
			}
		}
		return null;
	}

	public Match GetFirstMatchFromCompetitionId(string competitionId)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Match match = (Match)enumerator.Current;
				if (match.competition.ID.ToString() == competitionId)
				{
					return match;
				}
			}
		}
		return null;
	}

	public bool HasCoachHuman()
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Match match = (Match)enumerator.Current;
				if (match.homeTeam.Coach.human || match.awayTeam.Coach.human)
				{
					return true;
				}
			}
		}
		return false;
	}

	public void PreMatch()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Match)enumerator.Current).PreMatch();
		}
	}

	public void PostMatch()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Match)enumerator.Current).PostMatch();
		}
	}

	public void SortByCoachPresent(ElifootOptions.SimulationFlag simulationFlag)
	{
		Sort((EliObject m1, EliObject m2) => CompareCoachPresent((Match)m1, (Match)m2, simulationFlag));
	}

	private int CompareCoachPresent(Match m1, Match m2, ElifootOptions.SimulationFlag simulationFlag)
	{
		int num = ((!m1.homeTeam.Coach.Present(simulationFlag) && !m1.awayTeam.Coach.Present(simulationFlag)) ? ((m1.homeTeam.Coach.human || m1.awayTeam.Coach.human) ? 1 : 0) : 2);
		int num2 = ((!m2.homeTeam.Coach.Present(simulationFlag) && !m2.awayTeam.Coach.Present(simulationFlag)) ? ((m2.homeTeam.Coach.human || m2.awayTeam.Coach.human) ? 1 : 0) : 2);
		if (num == num2)
		{
			return m1.homeTeam.averageSkill.CompareTo(m2.homeTeam.averageSkill);
		}
		if (num <= num2)
		{
			return 1;
		}
		return -1;
	}
}
