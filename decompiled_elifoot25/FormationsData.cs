using System;

public static class FormationsData
{
	public static readonly Formation[] gameFormations = new Formation[12]
	{
		new Formation
		{
			name = "3-3-4",
			subName = "OFFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.RightWing,
				PlayerPosition.Striker,
				PlayerPosition.Striker,
				PlayerPosition.LeftWing
			}
		},
		new Formation
		{
			name = "3-4-3",
			subName = "OFFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.RightWing,
				PlayerPosition.Striker,
				PlayerPosition.LeftWing
			}
		},
		new Formation
		{
			name = "3-5-2",
			subName = "DEFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.Striker,
				PlayerPosition.Striker
			}
		},
		new Formation
		{
			name = "4-3-3",
			subName = "DEFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Sweeper,
				PlayerPosition.Midfield,
				PlayerPosition.Midfield,
				PlayerPosition.RightWing,
				PlayerPosition.Striker,
				PlayerPosition.LeftWing
			}
		},
		new Formation
		{
			name = "4-3-3",
			subName = "OFFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.RightWing,
				PlayerPosition.Striker,
				PlayerPosition.LeftWing
			}
		},
		new Formation
		{
			name = "4-4-2",
			subName = "CLASSIC",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.RightWing,
				PlayerPosition.LeftWing
			}
		},
		new Formation
		{
			name = "4-4-2",
			subName = "DIAMOND",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.Striker,
				PlayerPosition.Striker
			}
		},
		new Formation
		{
			name = "4-4-2",
			subName = "OFFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Sweeper,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.Striker,
				PlayerPosition.Striker
			}
		},
		new Formation
		{
			name = "4-2-4",
			subName = "OFFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Midfield,
				PlayerPosition.Midfield,
				PlayerPosition.RightWing,
				PlayerPosition.LeftWing,
				PlayerPosition.Striker,
				PlayerPosition.Striker
			}
		},
		new Formation
		{
			name = "5-3-2",
			subName = "DEFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.RightWing,
				PlayerPosition.LeftWing
			}
		},
		new Formation
		{
			name = "5-4-1",
			subName = "DEFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Stopper,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield,
				PlayerPosition.Striker
			}
		},
		new Formation
		{
			name = "6-4-0",
			subName = "DEFENSIVE",
			positions = new PlayerPosition[11]
			{
				PlayerPosition.Keeper,
				PlayerPosition.RightBack,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.Stopper,
				PlayerPosition.LeftBack,
				PlayerPosition.Sweeper,
				PlayerPosition.RightMidfield,
				PlayerPosition.Midfield,
				PlayerPosition.LeftMidfield
			}
		}
	};

	public static int GetFormationIndex(Formation formation)
	{
		for (int i = 0; i < gameFormations.Length; i++)
		{
			if (gameFormations[i].FullName == formation.FullName)
			{
				return i;
			}
		}
		return -1;
	}

	public static string GetFormationName(int formationIndex)
	{
		return gameFormations[formationIndex].FullName;
	}

	public static Formation[] GetNewShuffledFormations()
	{
		Formation[] array = new Formation[gameFormations.Length];
		Array.Copy(gameFormations, array, gameFormations.Length);
		int num = array.Length;
		while (num > 1)
		{
			num--;
			int randomInt = Util.GetRandomInt(num + 1);
			Formation formation = array[randomInt];
			array[randomInt] = array[num];
			array[num] = formation;
		}
		return array;
	}
}
