using System.Collections.Generic;
using UnityEngine;

public class LastYearWinnersView : EliView
{
	[Header("Last Winners")]
	public Transform lastWinnersGroup;

	public GameObject lastWinnersPrefab;

	[Header("Extra Components")]
	public TopLastYearsHScrollController topLastYearsHScrollController;

	private static int lastYearSearched;

	public void Initialize(int baseYear = 0)
	{
		ListOfCompetitions competitionsWithRecordedWinners = DataManager.instance.allCompetitions.GetCompetitionsWithRecordedWinners();
		int preSelectedYear = ((baseYear == 0) ? lastYearSearched : baseYear);
		topLastYearsHScrollController.Initialize(competitionsWithRecordedWinners, preSelectedYear, RefreshView);
	}

	private void RefreshView(int year, List<CompetitionYearWinners> competitionsWithPodium)
	{
		lastYearSearched = year;
		FillCompetitions(competitionsWithPodium);
	}

	private void FillCompetitions(List<CompetitionYearWinners> competitionsWithPodium)
	{
		for (int i = 0; i < lastWinnersGroup.childCount; i++)
		{
			Object.Destroy(lastWinnersGroup.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		foreach (CompetitionYearWinners item in competitionsWithPodium)
		{
			GameObject gameObject = Object.Instantiate(lastWinnersPrefab, lastWinnersGroup);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<LastWinnersPrefab>().Initialize(item.competition, item.podium, Close);
		}
	}
}
