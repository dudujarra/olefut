using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TopLastYearsHScrollController : MonoBehaviour
{
	private class YearPage
	{
		public int pageYear;

		public List<CompetitionYearWinners> competitionYearWinners = new List<CompetitionYearWinners>();

		public YearPage(int pageYear)
		{
			this.pageYear = pageYear;
		}

		public void AddCompetitionYearWinners(CompetitionYearWinners competitionYearWinners)
		{
			this.competitionYearWinners.Add(competitionYearWinners);
		}
	}

	public CanvasGroup firstTopCanvasGroup;

	public RectTransform firstTopViewport;

	public RectTransform firstTopScroll;

	public TopYearPrefab topYearPrefab;

	private List<YearPage> yearPages;

	private TopYearPrefab lastTopYearPrefabSelected;

	private Action<int, List<CompetitionYearWinners>> OnYearSelected;

	private bool firstTimeRefresh1stTop = true;

	private Vector2 centeredDestination;

	private float animationSpeed = 2000f;

	public void Initialize(ListOfCompetitions competitions, int preSelectedYear, Action<int, List<CompetitionYearWinners>> OnYearSelected)
	{
		if (competitions == null)
		{
			firstTopScroll.parent.parent.gameObject.SetActive(value: false);
			return;
		}
		this.OnYearSelected = OnYearSelected;
		CreateAllYears(competitions);
		FillTopPrefabs(preSelectedYear);
	}

	private void CreateAllYears(ListOfCompetitions competitions)
	{
		competitions.SortBySortOrderAndName();
		yearPages = new List<YearPage>();
		foreach (Competition competition in competitions)
		{
			foreach (LastWinnersRecord lastWinnersRecord in competition.lastWinners)
			{
				YearPage yearPage = yearPages.Find((YearPage prefab) => prefab.pageYear == lastWinnersRecord.year);
				if (yearPage == null)
				{
					AddYearPage(lastWinnersRecord.year, competition, lastWinnersRecord.podium);
				}
				else
				{
					yearPage.AddCompetitionYearWinners(new CompetitionYearWinners(competition, lastWinnersRecord.podium));
				}
			}
		}
		yearPages.Sort((YearPage c1, YearPage c2) => c2.pageYear.CompareTo(c1.pageYear));
	}

	private void AddYearPage(int pageYear, Competition competition, Podium podium)
	{
		YearPage yearPage = new YearPage(pageYear);
		yearPage.AddCompetitionYearWinners(new CompetitionYearWinners(competition, podium));
		yearPages.Add(yearPage);
	}

	private void FillTopPrefabs(int preSelectedYear)
	{
		for (int i = 0; i < firstTopScroll.childCount; i++)
		{
			UnityEngine.Object.Destroy(firstTopScroll.GetChild(i).gameObject);
		}
		int num = -1;
		TopYearPrefab prefab = null;
		if (yearPages.Count >= 2)
		{
			int num2 = 0;
			foreach (YearPage yearPage in yearPages)
			{
				TopYearPrefab topYearPrefab = UnityEngine.Object.Instantiate(this.topYearPrefab, firstTopScroll);
				topYearPrefab.Initialize(yearPage.pageYear, num2, SelectYearPage);
				if (num2 == 0)
				{
					prefab = topYearPrefab;
				}
				if (yearPage.pageYear == preSelectedYear)
				{
					num = num2;
					prefab = topYearPrefab;
				}
				num2++;
			}
			firstTopScroll.parent.parent.gameObject.SetActive(value: true);
		}
		else
		{
			firstTopScroll.parent.parent.gameObject.SetActive(value: false);
		}
		if (num != -1)
		{
			SelectYearPage(prefab, num);
		}
		else if (yearPages.Count > 0)
		{
			SelectYearPage(prefab, 0);
		}
		else
		{
			Debug.LogWarning("NO PAGES DONE WITH THESE COMPETITIONS");
		}
	}

	private void SelectYearPage(TopYearPrefab prefab, int index)
	{
		if (prefab != null)
		{
			if (lastTopYearPrefabSelected != null)
			{
				lastTopYearPrefabSelected.DeSelect();
			}
			lastTopYearPrefabSelected = prefab;
			lastTopYearPrefabSelected.Select();
		}
		if (firstTimeRefresh1stTop)
		{
			StartCoroutine(CenterSelectedFirstTime(index, firstTopViewport, firstTopScroll));
		}
		else
		{
			CenterSelected(index, firstTopViewport, firstTopScroll);
		}
		int pageYear = yearPages[index].pageYear;
		List<CompetitionYearWinners> competitionYearWinners = yearPages[index].competitionYearWinners;
		OnYearSelected?.Invoke(pageYear, competitionYearWinners);
	}

	public IEnumerator CenterSelectedFirstTime(int index, RectTransform viewport, RectTransform content)
	{
		if (firstTimeRefresh1stTop)
		{
			firstTopCanvasGroup.alpha = 0f;
			yield return new WaitForEndOfFrame();
		}
		CenterSelected(index, viewport, content);
		if (firstTimeRefresh1stTop)
		{
			firstTopCanvasGroup.alpha = 1f;
		}
	}

	public void CenterSelected(int index, RectTransform viewport, RectTransform content)
	{
		float x = topYearPrefab.GetComponent<RectTransform>().sizeDelta.x;
		float num = viewport.rect.width / x;
		float num2 = x * ((float)index + 0.5f - num / 2f) + (float)(index * 5);
		if (num2 > content.rect.width - viewport.rect.width)
		{
			num2 = Mathf.Max(0f, content.rect.width - viewport.rect.width);
		}
		else if (num2 < 0f)
		{
			num2 = 0f;
		}
		centeredDestination = new Vector2(0f - num2, 0f);
		base.enabled = true;
	}

	private void Update()
	{
		if (firstTimeRefresh1stTop)
		{
			firstTopScroll.anchoredPosition = centeredDestination;
			firstTimeRefresh1stTop = false;
		}
		else
		{
			firstTopScroll.anchoredPosition = Vector2.MoveTowards(firstTopScroll.anchoredPosition, centeredDestination, animationSpeed * Time.deltaTime);
		}
		if (firstTopScroll.anchoredPosition == centeredDestination)
		{
			base.enabled = false;
		}
	}
}
