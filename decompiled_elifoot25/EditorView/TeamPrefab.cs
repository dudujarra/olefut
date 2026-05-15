using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace EditorView;

public class TeamPrefab : MonoBehaviour
{
	public DbTeams teams;

	public DbTeams teamsPackage;

	public Button button;

	public Image background;

	public GameObject invalidTeamsDetectedIcon;

	public Sprite whiteSquareSprite;

	[Header("Info")]
	public Image teamLogoOrShirt;

	public Text teamName;

	public Text teamLongName;

	public Text Level;

	[ReadOnly]
	public int teamIndex;

	private Color oddColor;

	private Color evenColor;

	internal Sprite teamLogoOrShirtSprite;

	internal Color teamLogoOrShirtColor;

	internal string teamNameText;

	internal string teamLongNameText;

	internal string levelText;

	internal int teamIndexValue;

	internal Action<int, DbTeams> buttonAction;

	private EliLabel teamNameLabel;

	private EliLabel teamLongNameLabel;

	private EliLabel levelLabel;

	private RectTransform teamNameRectTransform;

	private RectTransform teamLongNameRectTransform;

	private RectTransform teamLogoOrShirtRectTransform;

	private void Awake()
	{
		teamNameLabel = teamName.GetComponent<EliLabel>();
		teamLongNameLabel = teamLongName.GetComponent<EliLabel>();
		levelLabel = Level.GetComponent<EliLabel>();
		teamNameRectTransform = teamName.GetComponent<RectTransform>();
		teamLongNameRectTransform = teamLongName.GetComponent<RectTransform>();
		teamLogoOrShirtRectTransform = teamLogoOrShirt.transform.parent.GetComponent<RectTransform>();
	}

	internal void Initialize(Sprite teamLogoOrShirt, Color? standardShirtColor, string teamName, string teamLongName, string level, int teamIndex, Action<int, DbTeams> buttonAction)
	{
		teamLogoOrShirtSprite = teamLogoOrShirt ?? whiteSquareSprite;
		teamLogoOrShirtColor = (standardShirtColor.HasValue ? standardShirtColor.Value : Color.white);
		teamNameText = teamName;
		teamLongNameText = teamLongName;
		levelText = level;
		teamIndexValue = teamIndex;
		this.buttonAction = buttonAction;
		oddColor = ConfigManager.instance.COLOR_OBSCURE_LIST_LIGHT;
		evenColor = ConfigManager.instance.COLOR_OBSCURE_LIST_DARK;
		background.color = ((base.transform.GetSiblingIndex() % 2 == 0) ? evenColor : oddColor);
		invalidTeamsDetectedIcon.SetActive(!teams.AllTeams[teamIndex].isTeamValid);
		this.teamLogoOrShirt.sprite = teamLogoOrShirt;
		this.teamLogoOrShirt.color = (standardShirtColor.HasValue ? standardShirtColor.Value : Color.white);
		this.teamName.text = teamName;
		this.teamLongName.text = teamLongName;
		Level.text = level;
		this.teamIndex = teamIndex;
		button.onClick.AddListener(delegate
		{
			StartCoroutine(TeamClicked());
		});
	}

	private IEnumerator TeamClicked()
	{
		yield return ScreenController.instance.IShowLoadingView();
		yield return new WaitForEndOfFrame();
		buttonAction(teamIndex, teams);
	}

	internal void Initialize(TeamPrefabData teamPrefabData)
	{
		Initialize(teamPrefabData.teamLogoOrShirtSprite, teamPrefabData.teamLogoOrShirtColor, teamPrefabData.teamNameText, teamPrefabData.teamLongNameText, teamPrefabData.levelText, teamPrefabData.teamIndexValue, teamPrefabData.buttonAction);
	}

	internal void SetTextSize(bool landscape)
	{
		if (landscape)
		{
			teamNameRectTransform.anchorMin = new Vector2(0.1f, 0f);
			teamNameRectTransform.anchorMax = new Vector2(0.3f, 1f);
			teamNameRectTransform.offsetMin = new Vector2(0f, 0f);
			teamNameRectTransform.offsetMax = new Vector2(0f, 0f);
			teamNameLabel.dynamicScale = 50;
			teamLongNameRectTransform.anchorMin = new Vector2(0.3f, 0f);
			teamLongNameRectTransform.anchorMax = new Vector2(0.9f, 1f);
			teamLongNameRectTransform.offsetMin = new Vector2(0f, 0f);
			teamLongNameRectTransform.offsetMax = new Vector2(0f, 0f);
			teamLongNameLabel.dynamicScale = 45;
			teamLogoOrShirtRectTransform.anchorMin = new Vector2(0f, 0f);
			teamLogoOrShirtRectTransform.anchorMax = new Vector2(0.1f, 1f);
			teamLogoOrShirtRectTransform.offsetMin = new Vector2(0f, 0f);
			teamLogoOrShirtRectTransform.offsetMax = new Vector2(0f, 0f);
			levelLabel.dynamicScale = 60;
		}
		else
		{
			teamNameRectTransform.anchorMin = new Vector2(0.15f, 0.5f);
			teamNameRectTransform.anchorMax = new Vector2(0.9f, 1f);
			teamNameRectTransform.offsetMin = new Vector2(0f, 0f);
			teamNameRectTransform.offsetMax = new Vector2(0f, 0f);
			teamNameLabel.dynamicScale = 35;
			teamLongNameRectTransform.anchorMin = new Vector2(0.15f, 0f);
			teamLongNameRectTransform.anchorMax = new Vector2(0.9f, 0.5f);
			teamLongNameRectTransform.offsetMin = new Vector2(0f, 0f);
			teamLongNameRectTransform.offsetMax = new Vector2(0f, 0f);
			teamLongNameLabel.dynamicScale = 30;
			teamLogoOrShirtRectTransform.anchorMin = new Vector2(0f, 0f);
			teamLogoOrShirtRectTransform.anchorMax = new Vector2(0.15f, 1f);
			teamLogoOrShirtRectTransform.offsetMin = new Vector2(0f, 0f);
			teamLogoOrShirtRectTransform.offsetMax = new Vector2(0f, 0f);
			levelLabel.dynamicScale = 40;
		}
		if (!(this == null))
		{
			StartCoroutine(ReloadElementConfig());
		}
	}

	private IEnumerator ReloadElementConfig()
	{
		yield return new WaitForEndOfFrame();
		if (!(this == null))
		{
			teamNameLabel.ReloadElementConfig();
			teamLongNameLabel.ReloadElementConfig();
			levelLabel.ReloadElementConfig();
		}
	}
}
