using System;
using System.Collections.Generic;

[Serializable]
public class ListOfCoaches : EliList
{
	public Coach Coach(int index)
	{
		if (base.Count <= index)
		{
			return null;
		}
		return (Coach)base[index];
	}

	public Coach FindCoachByID(long id)
	{
		return (Coach)Find((EliObject cObj) => ((Coach)cObj).ID == id);
	}

	public Coach FindHumanCoach()
	{
		return (Coach)Find((EliObject cObj) => ((Coach)cObj).human);
	}

	public ListOfCoaches GetAllHumanCoaches()
	{
		return new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).human));
	}

	public ListOfCoaches GetAllCoachesWithTitles()
	{
		return new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).HasAnyTitle()));
	}

	public ListOfCoaches GetAllUnemployedCoaches()
	{
		return new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).MyTeam == null));
	}

	public int CountCoachesOnVacation()
	{
		return FindAll((EliObject obj) => ((Coach)obj).onVacation).Count;
	}

	public int CountCoachesNotOnVacation()
	{
		return FindAll((EliObject obj) => !((Coach)obj).onVacation).Count;
	}

	public ListOfCoaches GetAllCoachesWithThisCompetitionWonSorted(Competition competition)
	{
		ListOfCoaches allCoachesWithThisCompetitionWon = GetAllCoachesWithThisCompetitionWon(competition);
		allCoachesWithThisCompetitionWon.SortByCompetitionWonTimes(competition);
		return allCoachesWithThisCompetitionWon;
	}

	private ListOfCoaches GetAllCoachesWithThisCompetitionWon(Competition competition)
	{
		return new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).competitionsWon.ContainsKey(competition)));
	}

	private void SortByCompetitionWonTimes(Competition competition)
	{
		Sort((EliObject c1, EliObject c2) => ((Coach)c2).competitionsWon[competition].CompareTo(((Coach)c1).competitionsWon[competition]));
	}

	public ListOfCoaches()
	{
	}

	public ListOfCoaches AvailableCoachesBasic(int limit = 0)
	{
		ListOfCoaches listOfCoaches = new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).CanHireBasic() == CanHireCoach.OK));
		listOfCoaches.SortByEmploymentPriority();
		if (limit > 0 && listOfCoaches.Count > limit)
		{
			listOfCoaches.RemoveRange(limit, listOfCoaches.Count - limit);
		}
		return listOfCoaches;
	}

	public ListOfCoaches AvailableSubstituteCoaches(Team toTheTeam, EliList pendingInvitations, params FireCoach[] flags)
	{
		return new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).CanHire(toTheTeam, pendingInvitations, flags) == CanHireCoach.OK));
	}

	public ListOfCoaches AvailableUnemployedCoaches(Team toTheTeam, params FireCoach[] flags)
	{
		Extensions.AddItemInArray(ref flags, FireCoach.Unemployed);
		return new ListOfCoaches(FindAll((EliObject cObj) => ((Coach)cObj).CanHire(toTheTeam, null, flags) == CanHireCoach.OK));
	}

	public bool HasNonPresentCoach(ElifootOptions.SimulationFlag simulationFlag)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (!((Coach)enumerator.Current).Present(simulationFlag))
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
				if (((Coach)enumerator.Current).Present(simulationFlag))
				{
					return true;
				}
			}
		}
		return false;
	}

	public ListOfCoaches(List<EliObject> other)
	{
		foreach (EliObject item in other)
		{
			Add((Coach)item);
		}
	}

	public void BeginSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Coach)enumerator.Current).BeginSeason();
		}
	}

	public void EndOfSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Coach)enumerator.Current).EndOfSeason();
		}
	}

	public override void PostLoad()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Coach)enumerator.Current).PostLoad();
		}
	}

	public void PostDay()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Coach)enumerator.Current).PostDay();
		}
	}

	public void SortByCurrentSocialPointsDesc()
	{
		Sort((EliObject c1, EliObject c2) => ((Coach)c2).CurrentSocialPoints().CompareTo(((Coach)c1).CurrentSocialPoints()));
	}

	public void SortBySkillDesc()
	{
		Sort((EliObject c1, EliObject c2) => ((Coach)c2).MySkill.CompareTo(((Coach)c1).MySkill));
	}

	public void SortByEmploymentPriority()
	{
		Sort(delegate(EliObject c1, EliObject c2)
		{
			Coach coach = (Coach)c1;
			Coach coach2 = (Coach)c2;
			bool value = coach.Present(ElifootOptions.SimulationFlag.Invitations) && coach.MyTeam == null;
			int num = (coach2.Present(ElifootOptions.SimulationFlag.Invitations) && coach2.MyTeam == null).CompareTo(value);
			if (num == 0)
			{
				num = coach2.MySkill.CompareTo(coach.MySkill);
			}
			return num;
		});
	}

	public void SortByTotalTitles()
	{
		Sort((EliObject c1, EliObject c2) => ((Coach)c2).TotalNumberOfTitles().CompareTo(((Coach)c1).TotalNumberOfTitles()));
	}

	public void SortByTitles()
	{
		Sort(delegate(EliObject c1, EliObject c2)
		{
			int value = ((Coach)c1).CompetitionRankPoints();
			return ((Coach)c2).CompetitionRankPoints().CompareTo(value);
		});
	}

	public long NumCoachEvents()
	{
		long num = 0L;
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Coach coach = (Coach)enumerator.Current;
			num += coach.coachEvents.Count;
		}
		return num;
	}

	public bool ContainsCoachGuid(string guid)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (((Coach)enumerator.Current).MyGUID == guid)
				{
					return true;
				}
			}
		}
		return false;
	}

	public void CheckTeamPointers()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Coach)enumerator.Current).CheckTeamPointer();
		}
	}
}
