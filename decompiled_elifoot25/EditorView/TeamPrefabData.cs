using System;
using UnityEngine;

namespace EditorView;

public class TeamPrefabData
{
	public Sprite teamLogoOrShirtSprite;

	public Color teamLogoOrShirtColor;

	public string teamNameText;

	public string teamLongNameText;

	public string levelText;

	public int teamIndexValue;

	public Action<int, DbTeams> buttonAction;

	public TeamPrefabData(TeamPrefab teamPrefab)
	{
		teamLogoOrShirtSprite = teamPrefab.teamLogoOrShirtSprite;
		teamLogoOrShirtColor = teamPrefab.teamLogoOrShirtColor;
		teamNameText = teamPrefab.teamNameText;
		teamLongNameText = teamPrefab.teamLongNameText;
		levelText = teamPrefab.levelText;
		teamIndexValue = teamPrefab.teamIndexValue;
		buttonAction = teamPrefab.buttonAction;
	}
}
