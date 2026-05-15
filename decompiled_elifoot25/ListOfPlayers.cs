using System;
using System.Collections.Generic;

[Serializable]
public class ListOfPlayers : EliList
{
	[NonSerialized]
	private Team myTeam;

	public Team MyTeam
	{
		set
		{
			myTeam = value;
		}
	}

	public void Add(Player player)
	{
		Add((EliObject)player);
		if (myTeam != null)
		{
			myTeam.PlayerWasAdded(player);
		}
	}

	public bool Remove(Player player)
	{
		bool result = Remove((EliObject)player);
		if (myTeam != null)
		{
			myTeam.PlayerWasRemoved(player);
		}
		return result;
	}

	public new void RemoveAt(int index)
	{
		if (myTeam == null)
		{
			base.RemoveAt(index);
			return;
		}
		Player player = myTeam.Players.Player(index);
		base.RemoveAt(index);
		myTeam.PlayerWasRemoved(player);
	}

	public void RemoveNullPlayers()
	{
		for (int i = 0; i < base.Count; i++)
		{
			if (base[i] == null)
			{
				Remove(base[i]);
			}
		}
	}

	public void RemovePlayers(ListOfPlayers otherList)
	{
		foreach (Player other in otherList)
		{
			Remove(other);
		}
	}

	public void AddWithEvent(Match match, Team team, Player player, int gameTime)
	{
		Add(player);
		GenerateMatchEvent(match, team, player, MatchEventType.PlayerIn, gameTime);
	}

	public bool RemoveWithEvent(Match match, Team team, Player player, int gameTime)
	{
		bool result = Remove((EliObject)player);
		GenerateMatchEvent(match, team, player, MatchEventType.PlayerOut, gameTime);
		return result;
	}

	public void ChangePlayers(int first, int second)
	{
		Player value = (Player)base[second];
		base[second] = base[first];
		base[first] = value;
	}

	private void GenerateMatchEvent(Match match, Team team, Player player, MatchEventType matchEventType, int gameTime)
	{
		Match.MatchEvent item = new Match.MatchEvent(matchEventType, gameTime, team, player, -1, -1, match.CheckTeamPlaysHome(team));
		match.eventList.Add(item);
	}

	public new void Clear()
	{
		if (myTeam != null)
		{
			foreach (Player player in myTeam.Players)
			{
				myTeam.PlayerWasRemoved(player);
			}
		}
		base.Clear();
	}

	public void Insert(int index, Player player)
	{
		Insert(index, (EliObject)player);
		if (myTeam != null)
		{
			myTeam.PlayerWasAdded(player);
		}
	}

	public Player Player(int index)
	{
		return (Player)base[index];
	}

	public Player FindPlayerByID(int id)
	{
		return (Player)Find((EliObject pObj) => ((Player)pObj).ID == id);
	}

	public Player GetFirstPlayerByPosition(PlayerPosition position)
	{
		return (Player)Find((EliObject pObj) => ((Player)pObj).Position == position);
	}

	public void SortByPosition()
	{
		Sort((EliObject p1, EliObject p2) => (((Player)p1).Position.CompareTo(((Player)p2).Position) == 0) ? ((Player)p1).Name.CompareTo(((Player)p2).Name) : ((Player)p1).Position.CompareTo(((Player)p2).Position));
	}

	public void SortBySalaryAsc()
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p1).skill.CompareTo(((Player)p2).skill));
	}

	public void SortBySalaryDesc()
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p2).skill.CompareTo(((Player)p1).skill));
	}

	public void SortBySkill()
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p2).skill.CompareTo(((Player)p1).skill));
	}

	public void SortByGoalSkillDesc()
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p2).GoalSkill().CompareTo(((Player)p1).GoalSkill()));
	}

	public void SortByBestOfferDesc()
	{
		Sort(delegate(EliObject p1, EliObject p2)
		{
			long bestOfferValue = ((Player)p1).BestOfferValue;
			return ((Player)p2).BestOfferValue.CompareTo(bestOfferValue);
		});
	}

	public void SortByPlayerLoss()
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p1).playerLoss.CompareTo(((Player)p2).playerLoss));
	}

	public void SortBySeasonGoalsDesc(Competition competition)
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p2).playerSeason.GetGoals(competition).CompareTo(((Player)p1).playerSeason.GetGoals(competition)));
	}

	public void SortByHistoryGoalsDesc()
	{
		Sort((EliObject p1, EliObject p2) => ((Player)p2).history.goalsScored.CompareTo(((Player)p1).history.goalsScored));
	}

	public void SortByPlayerSearchOptions(Coach.PlayerSearchOptions.PlayerSearchSortCriteria sortCriteria)
	{
		Sort(delegate(EliObject ob1, EliObject ob2)
		{
			int result = 0;
			Player player;
			Player player2;
			if (sortCriteria.sortOrder == Coach.PlayerSearchOptions.SortOrder.Ascending)
			{
				player = (Player)ob1;
				player2 = (Player)ob2;
			}
			else
			{
				player = (Player)ob2;
				player2 = (Player)ob1;
			}
			switch (sortCriteria.sortField)
			{
			case Coach.PlayerSearchOptions.SortField.Name:
				result = player.Name.CompareTo(player2.Name);
				break;
			case Coach.PlayerSearchOptions.SortField.Nationality:
				result = player.country.GetName().CompareTo(player2.country.GetName());
				break;
			case Coach.PlayerSearchOptions.SortField.Position:
				result = player.Position.CompareTo(player2.Position);
				break;
			case Coach.PlayerSearchOptions.SortField.Price:
				result = player.directSellPrice.CompareTo(player2.directSellPrice);
				break;
			case Coach.PlayerSearchOptions.SortField.Skill:
				result = player.skill.CompareTo(player2.skill);
				break;
			case Coach.PlayerSearchOptions.SortField.Star:
				result = player.IsStar.CompareTo(player2.IsStar);
				break;
			case Coach.PlayerSearchOptions.SortField.Team:
				result = player.Team.Name.CompareTo(player2.Team.Name);
				break;
			case Coach.PlayerSearchOptions.SortField.Behaviour:
				result = player.Behaviour.CompareTo(player2.Behaviour);
				break;
			}
			return result;
		});
	}

	public override void PostLoad()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).PostLoad();
		}
	}

	public ListOfPlayers()
	{
	}

	public ListOfPlayers GetPlayersByPosition(PlayerPosition position)
	{
		return new ListOfPlayers(FindAll((EliObject pObj) => ((Player)pObj).Position == position));
	}

	public ListOfPlayers(ListOfPlayers other)
	{
		foreach (Player item in other)
		{
			Add(item);
		}
	}

	public ListOfPlayers(List<EliObject> other)
	{
		foreach (EliObject item in other)
		{
			Add((Player)item);
		}
	}

	public ListOfPlayers(ListOfPlayers other, int maxSize, bool onlyAvailable)
	{
		foreach (Player item in other)
		{
			if (!onlyAvailable || item.Available())
			{
				Add(item);
				if (maxSize != 0 && base.Count >= maxSize)
				{
					break;
				}
			}
		}
	}

	public ListOfPlayers GetPlayersBySearch(Coach.PlayerSearchOptions searchOptions, Team excludeTeam, int maxSize)
	{
		int currentSize = 0;
		return new ListOfPlayers(FindAll(delegate(EliObject pObj)
		{
			bool flag = ((Player)pObj).Team != excludeTeam && !((Player)pObj).Team.Coach.Present(ElifootOptions.SimulationFlag.Other);
			bool flag2 = ((Player)pObj).Team.CanSellPlayer((Player)pObj) == SellPlayer.OK;
			bool flag3 = true;
			if (searchOptions.filterByNationality)
			{
				flag3 = excludeTeam.country == ((Player)pObj).country;
			}
			bool flag4 = true;
			if (searchOptions.filterByPosition)
			{
				flag4 = ((Player)pObj).Position == searchOptions.playerPosition;
			}
			bool flag5 = true;
			if (searchOptions.filterByBehaviour)
			{
				flag5 = ((Player)pObj).Behaviour == searchOptions.playerBehaviour;
			}
			bool flag6 = false;
			bool flag7 = false;
			long num = searchOptions.priceIntervals[searchOptions.priceIntervalIndex][0];
			long num2 = searchOptions.priceIntervals[searchOptions.priceIntervalIndex][1];
			long directSellPrice = ((Player)pObj).directSellPrice;
			if (directSellPrice > 0)
			{
				if (num == -1 || num <= directSellPrice)
				{
					flag6 = true;
				}
				if (num2 == -1 || num2 >= directSellPrice)
				{
					flag7 = true;
				}
			}
			bool flag8 = flag6 && flag7;
			bool flag9 = ((Player)pObj).Name.ToLower().Contains(searchOptions.playerName.ToLower());
			bool num3 = ((Player)pObj).skill >= searchOptions.minSkill && ((Player)pObj).skill <= searchOptions.maxSkill;
			bool flag10 = ((Player)pObj).IsStar || !searchOptions.starPlayer;
			if (num3 && flag && flag2 && flag3 && flag10 && flag9 && flag8 && flag4 && flag5 && currentSize < maxSize)
			{
				currentSize++;
				return true;
			}
			return false;
		}));
	}

	public void BeginSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).BeginSeason();
		}
	}

	public void EndOfSeason()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).EndOfSeason();
		}
	}

	public void ResetMatch()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).ResetMatch();
		}
	}

	public new Player GetRandomItem()
	{
		return (Player)base.GetRandomItem();
	}

	public Player GetRandomItem(PlayerWeightCriteria weightCriteria)
	{
		return (Player)GetRandomItem((int)weightCriteria);
	}

	public void PostMatch(Competition competition, int targetPlayerSkill, bool skillChangeRestricted)
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).PostMatch(competition, targetPlayerSkill, skillChangeRestricted);
		}
	}

	public void PostDay()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).PostDay();
		}
	}

	public void ComputePlayerLoss()
	{
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			((Player)enumerator.Current).ComputeLoss();
		}
	}

	public long TotalSalaries()
	{
		long num = 0L;
		using Enumerator enumerator = GetEnumerator();
		while (enumerator.MoveNext())
		{
			Player player = (Player)enumerator.Current;
			num += player.Salary;
		}
		return num;
	}
}
