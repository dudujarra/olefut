using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class TitlesPopUp : EliView
{
	public Text title;

	public RectTransform list;

	public LastWinTimesPrefab prefab;

	public void Initialize(Coach coach)
	{
		title.text = coach.Name;
		title.color = coach.GetCoachTextColor();
		FillList(coach.competitionsWon);
	}

	public void Initialize(Team team)
	{
		title.text = team.ShortName;
		FillList(team.competitionsWon);
	}

	private void FillList(Dictionary<Competition, int> competitionsWon)
	{
		for (int i = 0; i < list.childCount; i++)
		{
			Object.Destroy(list.GetChild(i).gameObject);
		}
		foreach (KeyValuePair<Competition, int> item in competitionsWon)
		{
			Object.Instantiate(prefab, list).Initialize(item.Key, item.Value);
		}
	}
}
