using System;

[Serializable]
public class TicketIncome : EliObject
{
	public readonly Competition competition;

	public readonly Team opponentTeam;

	public readonly long ticketPrice;

	public readonly long attendance;

	public readonly long amount;

	public TicketIncome(Team opponentTeam, Competition competition, long ticketPrice, long attendance, long amount)
		: base(generateID: false)
	{
		this.opponentTeam = opponentTeam;
		this.competition = competition;
		this.ticketPrice = ticketPrice;
		this.attendance = attendance;
		this.amount = amount;
	}
}
