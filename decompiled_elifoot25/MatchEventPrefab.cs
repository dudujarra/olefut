using UnityEngine;
using UnityEngine.UI;

public class MatchEventPrefab : MonoBehaviour
{
	public Image background;

	[Header("Home Team")]
	public GameObject team1;

	public Image team1Player_EventIcon;

	public Text team1Player_CurrentScore;

	public Text team1Player_Name;

	public Text team1Player_EventTime;

	[Header("Away Team")]
	public GameObject team2;

	public Image team2Player_EventIcon;

	public Text team2Player_CurrentScore;

	public Text team2Player_Name;

	public Text team2Player_EventTime;

	private Color oddColor;

	private Color evenColor;

	public void Initialize(bool isPlayer1, string playerName, string eventTime, Sprite eventIcon, string score, bool showGoals)
	{
		oddColor = ConfigManager.instance.COLOR_OBSCURE_LIST_LIGHT;
		evenColor = ConfigManager.instance.COLOR_OBSCURE_LIST_DARK;
		background.color = ((base.transform.GetSiblingIndex() % 2 == 0) ? evenColor : oddColor);
		if (isPlayer1)
		{
			team1.SetActive(value: true);
			team2.SetActive(value: false);
			team1Player_EventIcon.sprite = eventIcon;
			team1Player_Name.text = playerName;
			team1Player_EventTime.text = eventTime + "'";
			if (!showGoals)
			{
				team1Player_CurrentScore.gameObject.SetActive(value: false);
			}
			else
			{
				team1Player_CurrentScore.text = score;
			}
		}
		else
		{
			team1.SetActive(value: false);
			team2.SetActive(value: true);
			team2Player_EventIcon.sprite = eventIcon;
			team2Player_Name.text = playerName;
			team2Player_EventTime.text = eventTime + "'";
			if (!showGoals)
			{
				team2Player_CurrentScore.gameObject.SetActive(value: false);
			}
			else
			{
				team2Player_CurrentScore.text = score;
			}
		}
	}
}
