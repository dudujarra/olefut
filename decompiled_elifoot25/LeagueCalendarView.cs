using UnityEngine;
using UnityEngine.UI;

public class LeagueCalendarView : EliView
{
	public GameObject calendarRecordPrefab;

	[Header("View General")]
	public GameObject myNameObj;

	public GameObject opponentNameObj;

	public Transform myTeamGroupParent;

	public Transform opponentTeamGroupParent;

	private Team myTeam;

	private Team opponentTeam;

	private EliList calendarTable;

	private string goalSeparator;

	public void Initialize(Team myTeam, Team opponentTeam, EliList calendarTable)
	{
		SetTeamName(myTeam, myNameObj);
		SetTeamName(opponentTeam, opponentNameObj);
		this.myTeam = myTeam;
		this.opponentTeam = opponentTeam;
		this.calendarTable = calendarTable;
		goalSeparator = LanguageController.instance.Get_Translation("GEN_GOAL_SEPARATOR");
		FillOpponents(this.myTeam, myTeamGroupParent, calendarTable, isCurrentTeam: true);
		FillOpponents(this.opponentTeam, opponentTeamGroupParent, calendarTable, isCurrentTeam: false);
	}

	private void SetTeamName(Team team, GameObject teamNameObj)
	{
		Util.GetGameObjectText(teamNameObj, "Team").text = team.Name;
		Image gameObjectImage = Util.GetGameObjectImage(teamNameObj, "Shirt");
		team.DrawLogoOnImage(gameObjectImage);
	}

	private void FillOpponents(Team team, Transform teamGroup, EliList calendarTable, bool isCurrentTeam)
	{
		for (int i = 0; i < teamGroup.childCount; i++)
		{
			Object.Destroy(teamGroup.GetChild(i).gameObject);
		}
		if (calendarTable == null)
		{
			return;
		}
		bool darkenNext = false;
		bool darkenThis = false;
		foreach (CalendarTableEntry item in calendarTable)
		{
			GameObject gameObject = Object.Instantiate(calendarRecordPrefab, teamGroup);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			if (isCurrentTeam)
			{
				FillOpponent(gameObject, teamGroup, team, item.team1, item.home1, item.goalsFor1, item.goalsAgainst1, item.played);
			}
			else
			{
				FillOpponent(gameObject, teamGroup, team, item.team2, item.home2, item.goalsFor2, item.goalsAgainst2, item.played);
			}
		}
	}

	private void FillOpponent(GameObject myObject, Transform teamGroup, Team currentTeam, Team opponentTeam, bool isHome, int goalsFor, int goalsAgainst, bool played)
	{
		if (opponentTeam != null)
		{
			Util.GetGameObjectText(myObject, "Team").text = opponentTeam.Name;
			Util.GetGameObjectText(myObject, "Team").color = opponentTeam.GetCoachTextColor();
			Image gameObjectImage = Util.GetGameObjectImage(myObject, "Shirt");
			opponentTeam.DrawLogoOnImage(gameObjectImage);
			string text = (isHome ? "LEAGUECALENDAR_HOME" : "LEAGUECALENDAR_AWAY");
			Util.GetGameObjectText(myObject, "HomeAway").text = LanguageController.instance.Get_Translation(text);
			Text gameObjectText = Util.GetGameObjectText(myObject, "GoalsFor");
			Text gameObjectText2 = Util.GetGameObjectText(myObject, "GoalsAgainst");
			Text gameObjectText3 = Util.GetGameObjectText(myObject, "GoalsSeparator");
			gameObjectText.text = (played ? goalsFor.ToString() : "");
			gameObjectText3.text = (played ? goalSeparator : "");
			gameObjectText2.text = (played ? goalsAgainst.ToString() : "");
		}
	}
}
