using UnityEngine;
using UnityEngine.UI;

public class MatchResumePrefab : MonoBehaviour
{
	public GameObject matchEventPrefab;

	[Header("Teams Info")]
	public Image team1BackColor;

	public Image team2BackColor;

	public Image team1Logo;

	public Image team2Logo;

	public Text team1Name;

	public Text team2Name;

	public Text team1CoachName;

	public Text team2CoachName;

	public GameObject team1CoachHumanIcon;

	public GameObject team2CoachHumanIcon;

	public Text team1Score;

	public Text team2Score;

	public GameObject team1RedCardInGame;

	public GameObject team2RedCardInGame;

	public GameObject ScoreVS;

	public Text team1PenaltyScore;

	public Text team2PenaltyScore;

	public GameObject PenaltyScoreVS;

	public Text team1FirstHandScore;

	public Text team2FirstHandScore;

	public GameObject FirstHandScoreVS;

	[SerializeField]
	private Text competitionName;

	[SerializeField]
	private TextLabelID attendanceLabel;

	[Header("Stadium Info")]
	public Text stadiumNumber;

	public Text stadiumTickerSales;

	private Match match;

	public void Initialize(Match match)
	{
		this.match = match;
		for (int i = 0; i < base.transform.childCount; i++)
		{
			Object.Destroy(base.transform.GetChild(i).gameObject);
		}
		competitionName.text = match.competition.GetShortName();
		attendanceLabel.labelID = (match.CanShowTicketSales() ? "MATCH_ATTENDANCE_INCOME" : "MATCH_ATTENDANCE");
		team1Logo.sprite = ((match.homeTeam.MyLogo != null) ? match.homeTeam.MyLogo : match.homeTeam.MyShirt);
		if (match.homeTeam.MyLogo == null && match.homeTeam.UsesStandardShirt)
		{
			team1Logo.color = Util.ParseColor(match.homeTeam.backgroundColor);
		}
		team1Name.text = match.homeTeam.ShortName;
		if (match.homeTeam.Coach != null)
		{
			team1CoachName.text = match.homeTeam.Coach.Name;
			team1CoachHumanIcon.SetActive(match.homeTeam.Coach.human);
		}
		team1Score.text = match.homeTeam.teamMatch.goals.ToString("0");
		team2Logo.sprite = ((match.awayTeam.MyLogo != null) ? match.awayTeam.MyLogo : match.awayTeam.MyShirt);
		if (match.awayTeam.MyLogo == null && match.awayTeam.UsesStandardShirt)
		{
			team2Logo.color = Util.ParseColor(match.awayTeam.backgroundColor);
		}
		team2Name.text = match.awayTeam.ShortName;
		if (match.awayTeam.Coach != null)
		{
			team2CoachName.text = match.awayTeam.Coach.Name;
			team2CoachHumanIcon.SetActive(match.awayTeam.Coach.human);
		}
		team2Score.text = match.awayTeam.teamMatch.goals.ToString("0");
		team1RedCardInGame.SetActive(match.homeTeam.teamMatch.hasRedCard);
		team2RedCardInGame.SetActive(match.awayTeam.teamMatch.hasRedCard);
		if (WasDecidedByPenalties())
		{
			team1PenaltyScore.text = match.homeTeam.teamMatch.penaltyShootoutGoals.ToString("0");
			team2PenaltyScore.text = match.awayTeam.teamMatch.penaltyShootoutGoals.ToString("0");
		}
		else
		{
			team1PenaltyScore.text = "";
			team2PenaltyScore.text = "";
			PenaltyScoreVS.SetActive(value: false);
		}
		if (match.calEntry.matchType == MatchType.CupSecondLeg)
		{
			team1FirstHandScore.text = match.homeTeam.CompetitionData(match.competition).goalsFirstLeg.ToString("0");
			team2FirstHandScore.text = match.awayTeam.CompetitionData(match.competition).goalsFirstLeg.ToString("0");
		}
		else
		{
			team1FirstHandScore.text = "";
			team2FirstHandScore.text = "";
			FirstHandScoreVS.SetActive(value: false);
		}
		for (int num = match.eventList.Count - 1; num >= 0; num--)
		{
			Match.MatchEvent matchEvent = match.eventList[num];
			Transform obj = Object.Instantiate(matchEventPrefab, base.transform).transform;
			obj.SetSiblingIndex(obj.GetSiblingIndex() - 1);
			obj.GetComponent<MatchEventPrefab>().Initialize(matchEvent.isHome, matchEvent.player.GetName(), matchEvent.gameTime.ToString(), matchEvent.GetSprite(), matchEvent.GetGoalsDescription(useEventColorCodes: false), matchEvent.ShowGoals());
		}
		stadiumNumber.text = Util.AttendanceString(match.attendance);
		stadiumTickerSales.text = Util.MoneyString(match.TicketSales());
		stadiumTickerSales.gameObject.SetActive(match.CanShowTicketSales());
	}

	private bool WasDecidedByPenalties()
	{
		Team.TeamMatch teamMatch = match.homeTeam.teamMatch;
		Team.TeamMatch teamMatch2 = match.awayTeam.teamMatch;
		if ((teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Won && teamMatch2.penaltyShootoutStatus == PenaltyShootoutStatus.Lost) || (teamMatch2.penaltyShootoutStatus == PenaltyShootoutStatus.Won && teamMatch.penaltyShootoutStatus == PenaltyShootoutStatus.Lost))
		{
			return true;
		}
		return false;
	}

	public bool CheckFiveStraightWins()
	{
		return false;
	}

	public void GiveDoubleMoney()
	{
		match.PayTicketsToTeams(VideoAdsSeen: true);
		stadiumTickerSales.text = Util.MoneyString(match.TicketSales()) + " x2";
	}
}
