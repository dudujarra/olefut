using System;
using UnityEngine;

[Serializable]
public class Division : EliObject
{
	private int mainIndex;

	private string name;

	private string shortName;

	public int number;

	private DivisionStructure structure;

	private DivisionNamesRule namesRule;

	public ListOfPlayers strikers = new ListOfPlayers();

	public int targetSkillFirst;

	public double deltaSkillByPosition;

	private long teamInitMoney;

	private Competition competition;

	public ListOfTeams teams { get; } = new ListOfTeams();

	public long TeamInitMoney => teamInitMoney;

	public Competition Competition
	{
		get
		{
			return competition;
		}
		set
		{
			if (competition != null && competition != value)
			{
				throw new Exception("Competition already set for division.");
			}
			competition = value;
		}
	}

	public Division(Competition competition, int number, int mainIndex)
		: base(generateID: false)
	{
		this.competition = competition;
		this.number = number;
		structure = competition.configuration.divisionStructure;
		namesRule = competition.configuration.divisionNamesRule;
		this.mainIndex = mainIndex;
	}

	public int GetTargetSkillForPosition(int position)
	{
		return Mathf.Clamp((int)((double)targetSkillFirst - (double)((float)position - 1f) * deltaSkillByPosition), DataManager.PLAYER_SKILL_MIN, DataManager.PLAYER_SKILL_MAX);
	}

	public void Initialize()
	{
	}

	public override void LanguageChanged()
	{
		base.LanguageChanged();
		SetName();
		SetShortName();
	}

	public void AddTeam(Team team)
	{
		teams.Add(team);
		team.AddDivision(this);
	}

	public void InsertTeam(int index, Team team)
	{
		teams.Insert(index, team);
		team.AddDivision(this);
	}

	public void RemoveTeam(Team team)
	{
		teams.Remove(team);
		team.RemoveDivision(this);
	}

	public void RemoveAllTeams()
	{
		foreach (Team item in new ListOfTeams(teams))
		{
			RemoveTeam(item);
		}
	}

	public bool HasHumanCoach()
	{
		foreach (Team team in teams)
		{
			if (team.Coach.human)
			{
				return true;
			}
		}
		return false;
	}

	public bool HasPresentCoach(ElifootOptions.SimulationFlag simulationFlag)
	{
		foreach (Team team in teams)
		{
			if (team.Coach.Present(simulationFlag))
			{
				return true;
			}
		}
		return false;
	}

	private string DivisionNumberString()
	{
		string text = null;
		return competition.configuration.divisionNamesRule switch
		{
			DivisionNamesRule.Division => number.ToString(), 
			DivisionNamesRule.Group => Convert.ToChar(64 + number).ToString(), 
			_ => number.ToString(), 
		};
	}

	public override string GetName()
	{
		if (name == null)
		{
			SetName();
		}
		return name;
	}

	private void SetName()
	{
		string text = null;
		string text2 = "";
		switch (competition.configuration.divisionStructure)
		{
		case DivisionStructure.Hierarchic:
			text2 = competition.competitionType switch
			{
				CompetitionType.NationalLeague => competition.country.GetName(), 
				CompetitionType.RegionalLeague => competition.region.GetName(), 
				_ => competition.GetName(), 
			};
			text = LanguageController.instance.Get_Translation("DIVISION_NAME_HIERARCHIC_FULL", text2, DivisionNumberString(), Convert.ToChar(64 + number));
			break;
		case DivisionStructure.Groups:
			text = LanguageController.instance.Get_Translation("DIVISION_NAME_GROUP_FULL", competition.GetName(), DivisionNumberString());
			break;
		default:
			text = LanguageController.instance.Get_Translation("DIVISION_NAME_HIERARCHIC_FULL", competition.GetName(), DivisionNumberString(), Convert.ToChar(64 + number));
			break;
		}
		name = text;
	}

	public string GetShortName()
	{
		if (shortName == null)
		{
			SetShortName();
		}
		return shortName;
	}

	private void SetShortName()
	{
		string text = null;
		shortName = competition.configuration.divisionNamesRule switch
		{
			DivisionNamesRule.Division => LanguageController.instance.Get_Translation("DIVISION_NAME", number.ToString(), Convert.ToChar(64 + number)), 
			DivisionNamesRule.Group => LanguageController.instance.Get_Translation("DIVISION_NAME_GROUP_SHORT", Convert.ToChar(64 + number)), 
			_ => LanguageController.instance.Get_Translation("DIVISION_NAME", number.ToString(), Convert.ToChar(64 + number)), 
		};
	}

	public void SwapTeams(Division withDivision, int numTeams)
	{
		ListOfTeams listOfTeams = new ListOfTeams();
		numTeams = Math.Min(numTeams, withDivision.teams.Count);
		for (int i = 0; i < numTeams; i++)
		{
			Team team = teams.Team(teams.Count - 1);
			RemoveTeam(team);
			listOfTeams.Add(team);
		}
		for (int j = 0; j < numTeams; j++)
		{
			Team team2 = withDivision.teams.Team(0);
			withDivision.RemoveTeam(team2);
			AddTeam(team2);
			team2.Coach.AddEvent(Coach.CoachEvent.CoachEventType.DivisionUp, competition, this);
		}
		while (listOfTeams.Count > 0)
		{
			Team team3 = listOfTeams.Team(0);
			withDivision.InsertTeam(0, team3);
			listOfTeams.Remove(team3);
			team3.Coach.AddEvent(Coach.CoachEvent.CoachEventType.DivisionDown, competition, withDivision);
		}
	}

	public void BeginSeason()
	{
		foreach (Team team in teams)
		{
			team.SetLeagueRoundPositions(this, teams.IndexOf(team));
		}
	}

	public bool AcceptsHumanCoaches()
	{
		return competition.competitionType == CompetitionType.NationalLeague;
	}

	public override void PostLoad()
	{
	}

	public void ComputeTeamsLeaguePosition()
	{
		teams.SortBySeasonPoints(competition);
		int num = 1;
		foreach (Team team in teams)
		{
			team.CompetitionData(competition).leaguePosition = num++;
		}
	}

	public void SetTeamsInitSkill()
	{
		int num = 0;
		int num2 = targetSkillFirst;
		foreach (Team team in teams)
		{
			num2 = (int)((double)targetSkillFirst - (double)(float)num * deltaSkillByPosition);
			team.SetInitSkill(num2);
			num++;
		}
	}

	public override void PostDay()
	{
		ComputeTeamsLeaguePosition();
	}

	public bool ContainsTeam(Team team)
	{
		return teams.IndexOf(team) >= 0;
	}

	protected override string GetDumpHeader()
	{
		return "Division;Ticket price;Teams with debt;Min cash; Max cash;Min num players;Max num players;Target skill first; Delta skill by position";
	}

	protected override string GetDumpRow()
	{
		if (teams.Count == 0)
		{
			return "";
		}
		float a2;
		float a = (a2 = teams.Team(0).moneyRatio);
		long num2;
		long num = (num2 = teams.Team(0).TeamBank.Money);
		int num4;
		int num3 = (num4 = teams.Team(0).Players.Count);
		int num5 = 0;
		foreach (Team team in teams)
		{
			if (team.TeamBank.Money < 0)
			{
				num5++;
			}
			a = Mathf.Min(a, team.moneyRatio);
			a2 = Mathf.Max(a2, team.moneyRatio);
			num = (long)Mathf.Min(num, team.TeamBank.Money);
			num2 = (long)Mathf.Max(num2, team.TeamBank.Money);
			num3 = Math.Min(num3, team.Players.Count);
			num4 = Math.Max(num4, team.Players.Count);
		}
		return Util.MakeCSV(';', GetName(), teams.NumTeamsWithDebt(), num, num2, num3, num4, targetSkillFirst, deltaSkillByPosition.ToString("0.00"));
	}
}
