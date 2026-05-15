using System;

[Serializable]
public struct Podium(int numberOfPlaces)
{
	private TeamCoach[] teamsAndCoaches = new TeamCoach[numberOfPlaces];

	public void SetPlace(int place, Team team, Coach coach)
	{
		teamsAndCoaches[place - 1].Team = team;
		teamsAndCoaches[place - 1].Coach = coach;
	}

	public TeamCoach GetPlace(int place)
	{
		return teamsAndCoaches[place - 1];
	}

	public void CopyFrom(Podium other)
	{
		teamsAndCoaches = new TeamCoach[other.teamsAndCoaches.Length];
		for (int i = 0; i < teamsAndCoaches.Length; i++)
		{
			teamsAndCoaches[i] = other.teamsAndCoaches[i];
		}
	}

	public TeamCoach GetWinner()
	{
		return GetPlace(1);
	}

	public TeamCoach GetSecond()
	{
		return GetPlace(2);
	}

	public TeamCoach GetThird()
	{
		return GetPlace(3);
	}

	public bool HasPlace(int place)
	{
		if (teamsAndCoaches.Length >= place && teamsAndCoaches[place - 1].Team != null)
		{
			return teamsAndCoaches[place - 1].Coach != null;
		}
		return false;
	}

	public void PostLoad()
	{
		for (int i = 0; i < teamsAndCoaches.Length; i++)
		{
			teamsAndCoaches[i].PostLoad();
		}
	}
}
