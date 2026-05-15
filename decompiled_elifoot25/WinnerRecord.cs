using System;

[Serializable]
public class WinnerRecord : EliObject
{
	private readonly int year;

	[NonSerialized]
	private readonly Competition competition;

	[NonSerialized]
	private readonly Team team;

	[NonSerialized]
	private readonly Coach coach;

	public WinnerRecord(int year, Competition competition, Team team, Coach coach)
		: base(generateID: false)
	{
		this.year = year;
		this.competition = competition;
		this.team = team;
		this.coach = coach;
	}
}
