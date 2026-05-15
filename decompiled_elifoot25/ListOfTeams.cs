using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using UnityEngine;

[Serializable]
public class ListOfTeams : EliList
{
	public void Add(Team team)
	{
		Add((EliObject)team);
	}

	public void AddTeams(ListOfTeams teams)
	{
		AddRange(teams);
	}

	public Team Team(int index)
	{
		if (index >= base.Count)
		{
			return null;
		}
		return (Team)base[index];
	}

	public virtual void Initialize()
	{
	}

	public Team FindTeamByName(string name)
	{
		return (Team)Find((EliObject tObj) => ((Team)tObj).Name == name);
	}

	public Team FindTeamByID(long id)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Team team = (Team)enumerator.Current;
				if (team.ID == id)
				{
					return team;
				}
			}
		}
		return null;
	}

	public Team FindTeamByLeagueRoundPosition(Competition competition, int index, int pos)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Team team = (Team)enumerator.Current;
				if (team.CompetitionData(competition).leagueRoundPositions[index] == pos)
				{
					return team;
				}
			}
		}
		return null;
	}

	public ListOfTeams GetAllNonHumanTeams()
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			if (!team.Coach.human)
			{
				listOfTeams.Add(team);
			}
		}
		return listOfTeams;
	}

	public ListOfTeams GetAllHumanTeams()
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			if (team.Coach.human)
			{
				listOfTeams.Add(team);
			}
		}
		return listOfTeams;
	}

	public ListOfTeams GetTeamsForHumanCoaches()
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			if (team.CanShowInNewGame())
			{
				listOfTeams.Add(team);
			}
		}
		return listOfTeams;
	}

	public ListOfTeams GetAllPresentCoach(ElifootOptions.SimulationFlag simulationFlag)
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			if (team.Coach.Present(simulationFlag))
			{
				listOfTeams.Add(team);
			}
		}
		return listOfTeams;
	}

	public ListOfTeams GetAllTeamsWithThisCompetitionWonSorted(Competition competition)
	{
		ListOfTeams allTeamsWithThisCompetitionWon = GetAllTeamsWithThisCompetitionWon(competition);
		allTeamsWithThisCompetitionWon.SortByCompetitionWonTimes(competition);
		return allTeamsWithThisCompetitionWon;
	}

	private ListOfTeams GetAllTeamsWithThisCompetitionWon(Competition competition)
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			if (team.competitionsWon.ContainsKey(competition))
			{
				listOfTeams.Add(team);
			}
		}
		return listOfTeams;
	}

	private void SortByCompetitionWonTimes(Competition competition)
	{
		Sort((EliObject c1, EliObject c2) => ((Team)c2).competitionsWon[competition].CompareTo(((Team)c1).competitionsWon[competition]));
	}

	public Team FindHumanTeam()
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Team team = (Team)enumerator.Current;
				if (team.Coach.human)
				{
					return team;
				}
			}
		}
		return null;
	}

	public void RemoveTeam(Team team, bool removeFromAllPlayers)
	{
		if (removeFromAllPlayers)
		{
			DataManager.instance.allPlayers.RemoveAll((EliObject p) => team.Players.Contains(p));
		}
		Remove(team);
	}

	public void SortByInitOrder(bool includeRegionCode)
	{
		Sort(delegate(EliObject o1, EliObject o2)
		{
			Team team = (Team)o1;
			Team team2 = (Team)o2;
			string text = team.RegionCode();
			string text2 = team2.RegionCode();
			int num = 0;
			num = team.country.CompareTo(team2.country);
			if (includeRegionCode)
			{
				if (num == 0)
				{
					if (text == null)
					{
						if (text2 != null)
						{
							return 1;
						}
					}
					else if (text2 == null)
					{
						return -1;
					}
				}
				if (num == 0 && text != null && text2 != null)
				{
					num = text.CompareTo(text2);
				}
			}
			if (num == 0)
			{
				num = team2.initLevel.CompareTo(team.initLevel);
			}
			return num;
		});
	}

	public void SortByHumanAndSkillDesc()
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			Team team = (Team)t1;
			Team team2 = (Team)t2;
			return (team.Coach.human != team2.Coach.human) ? ((!team.Coach.human) ? 1 : (-1)) : team2.averageSkill.CompareTo(team.averageSkill);
		});
	}

	public void SortByHumanAndInitLevelDesc()
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			Team team = (Team)t1;
			Team team2 = (Team)t2;
			return (team.Coach.human != team2.Coach.human) ? ((!team.Coach.human) ? 1 : (-1)) : team2.initLevel.CompareTo(team.initLevel);
		});
	}

	public void SortByInitLevelDesc()
	{
		Sort((EliObject t1, EliObject t2) => ((Team)t2).initLevel.CompareTo(((Team)t1).initLevel));
	}

	public void SortByAverageSkillDesc()
	{
		Sort((EliObject t1, EliObject t2) => ((Team)t2).averageSkill.CompareTo(((Team)t1).averageSkill));
	}

	public void SortByCupOrder(Competition competition)
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			TeamCompetitionData teamCompetitionData = ((Team)t1).CompetitionData(competition);
			TeamCompetitionData teamCompetitionData2 = ((Team)t2).CompetitionData(competition);
			if (teamCompetitionData.isInCup == teamCompetitionData2.isInCup)
			{
				return teamCompetitionData.cupOrder.CompareTo(teamCompetitionData2.cupOrder);
			}
			if (teamCompetitionData.isInCup == DataManager.IsInCup.Playing)
			{
				return -1;
			}
			return (teamCompetitionData2.isInCup == DataManager.IsInCup.Playing) ? 1 : 0;
		});
	}

	public void SortByLeaguePosition(Competition competition)
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			Team obj = (Team)t1;
			Team team = (Team)t2;
			if (obj.CompetitionData(competition) == null)
			{
				Debugger.Break();
				UnityEngine.Debug.LogWarning("SortByLeaguePosition ERROR");
			}
			int leaguePosition = obj.CompetitionData(competition).leaguePosition;
			int leaguePosition2 = team.CompetitionData(competition).leaguePosition;
			return leaguePosition.CompareTo(leaguePosition2);
		});
	}

	public void SortBySeasonPoints(Competition competition)
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			int num = CompareByPoints(competition, t1, t2);
			if (num == 0)
			{
				num = CompareByGoalDiference(competition, t1, t2);
			}
			if (num == 0)
			{
				num = CompareByGoalsFor(competition, t1, t2);
			}
			if (num == 0)
			{
				num = CompareByWins(competition, t1, t2);
			}
			if (num == 0)
			{
				num = CompareByLeaguePosition(competition, t1, t2);
			}
			if (num == 0)
			{
				num = CompareByID(t1, t2);
			}
			return num;
		});
	}

	public ListOfTeams SortByShortName()
	{
		Sort((EliObject t1, EliObject t2) => ((Team)t1).ShortName.CompareTo(((Team)t2).ShortName));
		return this;
	}

	public ListOfTeams SortByName()
	{
		Sort((EliObject t1, EliObject t2) => ((Team)t1).Name.CompareTo(((Team)t2).Name));
		return this;
	}

	public ListOfTeams SortByCountryName()
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			int num = 0;
			Team team = (Team)t1;
			Team team2 = (Team)t2;
			try
			{
				if (team2 == null)
				{
					return -1;
				}
				if (team == null)
				{
					return 1;
				}
				if (team2.country == null)
				{
					return -1;
				}
				if (team.country == null)
				{
					return 1;
				}
				if (team.country.CountryCode == team2.country.CountryCode)
				{
					return team.ShortName.CompareTo(team2.ShortName);
				}
				return team.country.GetName().CompareTo(team2.country.GetName());
			}
			catch (Exception)
			{
				return 0;
			}
		});
		return this;
	}

	public ListOfTeams SortByCountryRegionName()
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			int num = 0;
			Team team = (Team)t1;
			Team team2 = (Team)t2;
			try
			{
				if (team == null && team2 == null)
				{
					return 0;
				}
				if (team2 == null)
				{
					return -1;
				}
				if (team == null)
				{
					return 1;
				}
				if (team.country == null && team2.country == null)
				{
					return 0;
				}
				if (team2.country == null)
				{
					return -1;
				}
				if (team.country == null)
				{
					return 1;
				}
				if (team.country.CountryCode == team2.country.CountryCode)
				{
					if (team.country.playRegional)
					{
						if (team.region == null && team2.region == null)
						{
							return team.ShortName.CompareTo(team2.ShortName);
						}
						if (team.region == null || team2.region == null)
						{
							return (team2.region != null) ? 1 : (-1);
						}
						if (team.region.regionCode == team2.region.regionCode)
						{
							return team.ShortName.CompareTo(team2.ShortName);
						}
						return team.region.GetName().CompareTo(team2.region.GetName());
					}
					return team.ShortName.CompareTo(team2.ShortName);
				}
				return team.country.GetName().CompareTo(team2.country.GetName());
			}
			catch (Exception)
			{
				return 0;
			}
		});
		return this;
	}

	public ListOfTeams SortByNumberOfPlayers()
	{
		Sort((EliObject t1, EliObject t2) => ((Team)t1).Players.Count.CompareTo(((Team)t2).Players.Count));
		return this;
	}

	public void SortByLeagueRoundPosition(GlobalCalendarEntry calEntry, int roundIndex)
	{
		if (calEntry.competition == null)
		{
			SortByLeagueRoundPosition(calEntry.competitionType, roundIndex);
		}
		else
		{
			SortByLeagueRoundPosition(calEntry.competition, roundIndex);
		}
	}

	private void SortByLeagueRoundPosition(CompetitionType competitionType, int roundIndex)
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			Team obj = (Team)t1;
			Team team = (Team)t2;
			int num = obj.CompetitionData(competitionType).leagueRoundPositions[roundIndex];
			int value = team.CompetitionData(competitionType).leagueRoundPositions[roundIndex];
			return num.CompareTo(value);
		});
	}

	private void SortByLeagueRoundPosition(Competition competition, int roundIndex)
	{
		Sort(delegate(EliObject t1, EliObject t2)
		{
			Team obj = (Team)t1;
			Team team = (Team)t2;
			int num = obj.CompetitionData(competition).leagueRoundPositions[roundIndex];
			int value = team.CompetitionData(competition).leagueRoundPositions[roundIndex];
			return num.CompareTo(value);
		});
	}

	private int CompareByPoints(Competition competition, EliObject t1, EliObject t2)
	{
		TeamCompetitionData teamCompetitionData = ((Team)t1).CompetitionData(competition);
		TeamCompetitionData teamCompetitionData2 = ((Team)t2).CompetitionData(competition);
		int points = teamCompetitionData.points;
		int points2 = teamCompetitionData2.points;
		return points2.CompareTo(points);
	}

	private int CompareByGoalDiference(Competition competition, EliObject t1, EliObject t2)
	{
		TeamCompetitionData teamCompetitionData = ((Team)t1).CompetitionData(competition);
		TeamCompetitionData teamCompetitionData2 = ((Team)t2).CompetitionData(competition);
		int value = teamCompetitionData.goalsFor - teamCompetitionData.goalsAgainst;
		return (teamCompetitionData2.goalsFor - teamCompetitionData2.goalsAgainst).CompareTo(value);
	}

	private int CompareByGoalsFor(Competition competition, EliObject t1, EliObject t2)
	{
		TeamCompetitionData teamCompetitionData = ((Team)t1).CompetitionData(competition);
		TeamCompetitionData teamCompetitionData2 = ((Team)t2).CompetitionData(competition);
		int goalsFor = teamCompetitionData.goalsFor;
		int goalsFor2 = teamCompetitionData2.goalsFor;
		return goalsFor2.CompareTo(goalsFor);
	}

	private int CompareByWins(Competition competition, EliObject t1, EliObject t2)
	{
		TeamCompetitionData teamCompetitionData = ((Team)t1).CompetitionData(competition);
		TeamCompetitionData teamCompetitionData2 = ((Team)t2).CompetitionData(competition);
		int matchesWon = teamCompetitionData.matchesWon;
		int matchesWon2 = teamCompetitionData2.matchesWon;
		return matchesWon2.CompareTo(matchesWon);
	}

	private int CompareByLeaguePosition(Competition competition, EliObject t1, EliObject t2)
	{
		TeamCompetitionData teamCompetitionData = ((Team)t1).CompetitionData(competition);
		TeamCompetitionData teamCompetitionData2 = ((Team)t2).CompetitionData(competition);
		int leaguePosition = teamCompetitionData.leaguePosition;
		int leaguePosition2 = teamCompetitionData2.leaguePosition;
		return leaguePosition.CompareTo(leaguePosition2);
	}

	private int CompareByID(EliObject t1, EliObject t2)
	{
		long iD = t1.ID;
		long iD2 = t2.ID;
		return iD.CompareTo(iD2);
	}

	public bool HasHumanCoach()
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (((Team)enumerator.Current).Coach.human)
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
				if (((Team)enumerator.Current).Coach.Present(simulationFlag))
				{
					return true;
				}
			}
		}
		return false;
	}

	public bool CanBuyPlayer(Player player, long price)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				if (((Team)enumerator.Current).CanBuyPlayer(player, price) == BuyPlayer.OK)
				{
					return true;
				}
			}
		}
		return false;
	}

	public override void PostLoad()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).PostLoad();
		}
	}

	public void BeginSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).BeginSeason();
		}
	}

	public void EndOfSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).EndOfSeason();
		}
	}

	public void ResetMatch()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).ResetMatch();
		}
	}

	public void SubtractOneFromCoachStartingIndex()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			team.findSubstituteCoachStartingIndex = ((team.findSubstituteCoachStartingIndex > 0) ? (team.findSubstituteCoachStartingIndex - 1) : 0);
		}
	}

	public new Team GetRandomItem()
	{
		return (Team)base.GetRandomItem();
	}

	public Team GetRandomItem(TeamWeightCriteria weightCriteria)
	{
		return (Team)GetRandomItem((int)weightCriteria);
	}

	public ListOfTeams()
	{
	}

	public ListOfTeams(ListOfTeams other)
	{
		foreach (Team item in other)
		{
			Add(item);
		}
	}

	public ListOfTeams(List<EliObject> other)
	{
		foreach (EliObject item in other)
		{
			Add((Team)item);
		}
	}

	public void PostDay()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).PostDay();
		}
	}

	public long NumBankTransactions()
	{
		long num = 0L;
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			num += team.NumBankTransactions();
		}
		return num;
	}

	public long NumTicketIncomeEntries()
	{
		long num = 0L;
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Team team = (Team)enumerator.Current;
			num += team.teamTicketIncomeList.Count();
		}
		return num;
	}

	public void SetHistoryDataLength()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).SetHistoryDataLength();
		}
	}

	public void CheckCoachTeamPointers()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Team)enumerator.Current).CheckCoachTeamPointer();
		}
	}

	public float AverageMoneyRatio()
	{
		float num = 0f;
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				Team team = (Team)enumerator.Current;
				num += team.moneyRatio;
			}
		}
		num /= (float)base.Count;
		return Mathf.Max(0f, num);
	}

	public int NumTeamsWithDebt()
	{
		return this.Count((EliObject t) => ((Team)t).TeamBank.Money < 0);
	}

	public void ComputeTargetSkills(int targetSkillFirst)
	{
		float num = targetSkillFirst;
		ListOfTeams listOfTeams = new ListOfTeams(this);
		listOfTeams.SortByAverageSkillDesc();
		if (listOfTeams.Count <= 50)
		{
			float num2 = num / (float)base.Count;
			{
				foreach (Team item in listOfTeams)
				{
					item.TargetPlayerSkill = (int)num;
					num -= num2;
				}
				return;
			}
		}
		int num3 = 0;
		num = Math.Max(num, 0.2f * (float)DataManager.PLAYER_SKILL_MAX);
		float num4 = (num - 0.2f * (float)DataManager.PLAYER_SKILL_MAX) / 50f;
		float num5 = 0.2f * (float)DataManager.PLAYER_SKILL_MAX / (float)(base.Count - 50);
		foreach (Team item2 in listOfTeams)
		{
			item2.TargetPlayerSkill = (int)num;
			num -= ((num3 < 50) ? num4 : num5);
			num3++;
		}
	}
}
