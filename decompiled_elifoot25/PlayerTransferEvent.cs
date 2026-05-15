using System;

[Serializable]
public class PlayerTransferEvent : EliObject
{
	public int seasonNumber;

	public int skill;

	public Player player;

	public Team fromTeam;

	public Team toTeam;

	public long price;

	public long newSalary;

	public PlayerTransferEvent(Player player, Team fromTeam, Team toTeam, long price, int seasonNumber, long newSalary)
		: base(generateID: false)
	{
		this.player = player;
		this.fromTeam = fromTeam;
		this.toTeam = toTeam;
		skill = player.skill;
		this.price = price;
		this.seasonNumber = seasonNumber;
		this.newSalary = newSalary;
	}

	public string ToSaveString()
	{
		return $"{player.ID};{fromTeam.ID};{toTeam.ID};{skill};{price};{seasonNumber};{newSalary}";
	}

	public PlayerTransferEvent(string s)
		: base(generateID: false)
	{
		string[] stringArray = s.Split(';');
		int id = int.Parse(Util.StringInArray(stringArray, 0, "-1"));
		int num = int.Parse(Util.StringInArray(stringArray, 1, "-1"));
		int num2 = int.Parse(Util.StringInArray(stringArray, 2, "-1"));
		int num3 = int.Parse(Util.StringInArray(stringArray, 3, "0"));
		long num4 = long.Parse(Util.StringInArray(stringArray, 4, "0"));
		int num5 = int.Parse(Util.StringInArray(stringArray, 5, "0"));
		long num6 = long.Parse(Util.StringInArray(stringArray, 6, "0"));
		player = DataManager.instance.allPlayers.FindPlayerByID(id);
		fromTeam = DataManager.instance.allTeams.FindTeamByID(num);
		toTeam = DataManager.instance.allTeams.FindTeamByID(num2);
		skill = num3;
		price = num4;
		seasonNumber = num5;
		newSalary = num6;
	}

	public string GetDescription()
	{
		return string.Format(LanguageController.instance.Get_Translation("PLAYER_TRANSFER"), seasonNumber, player, fromTeam, toTeam, skill, price);
	}

	protected override string GetDumpHeader()
	{
		return "Player;Skill;Nac;From team;To team;Price;New salary";
	}

	protected override string GetDumpRow()
	{
		return Util.MakeCSV(';', player.Name, player.skill, player.country.GetName(), fromTeam.Name, toTeam.Name, price, newSalary);
	}
}
