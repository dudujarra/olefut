using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TopMatchesHScrollController : MonoBehaviour
{
	private class MatchPage
	{
		public string pageTitle;

		public string shortTitle;

		public Sprite pageIcon;

		public ListOfMatches matches = new ListOfMatches();

		public MatchPage(string pageTitle, string shortTitle, Sprite pageIcon)
		{
			this.pageTitle = pageTitle;
			this.pageIcon = pageIcon;
			this.shortTitle = shortTitle;
		}

		public void AddMatch(Match match)
		{
			matches.Add(match);
		}
	}

	public CanvasGroup firstTopCanvasGroup;

	public RectTransform firstTopViewport;

	public RectTransform firstTopScroll;

	public TopPrefab topPrefab;

	private List<MatchPage> matchPages;

	private TopPrefab lastTopPrefabSelected;

	private Action<ListOfMatches, bool> OnPageSelected;

	private bool firstTimeRefresh1stTop = true;

	private Vector2 centeredDestination;

	private float animationSpeed = 2000f;

	public void Initialize(ListOfMatches matches, Match preSelectedMatch, Action<ListOfMatches, bool> OnPageSelected, bool inPenalties = false)
	{
		if (matches == null)
		{
			firstTopScroll.parent.parent.gameObject.SetActive(value: false);
			return;
		}
		this.OnPageSelected = OnPageSelected;
		CreateAllPages(matches);
		CheckFinishedPages(inPenalties);
		FillTopPrefabs(preSelectedMatch);
	}

	private void CreateAllPages(ListOfMatches matches)
	{
		matchPages = new List<MatchPage>();
		Dictionary<long, MatchPage> dictionary = new Dictionary<long, MatchPage>();
		Competition competition = null;
		MatchPage matchPage = null;
		foreach (Match match in matches)
		{
			if (match.competition == competition)
			{
				matchPage.AddMatch(match);
				continue;
			}
			MatchPage matchPage2 = null;
			match.competition.GetName();
			if (dictionary.ContainsKey(match.competition.ID))
			{
				matchPage2 = dictionary[match.competition.ID];
				matchPage2.AddMatch(match);
			}
			else
			{
				matchPage2 = AddMatchPage(match.competition.GetName(), match.competition.GetShortName(), match.competition.GetIcon(), match);
				dictionary.Add(match.competition.ID, matchPage2);
			}
			matchPage = matchPage2;
			competition = match.competition;
		}
		matchPages.Sort((MatchPage c1, MatchPage c2) => c1.pageTitle.CompareTo(c2.pageTitle));
	}

	private MatchPage AddMatchPage(string pageTitle, string shortName, Sprite pageIcon, Match match)
	{
		MatchPage matchPage = new MatchPage(pageTitle, shortName, pageIcon);
		matchPage.AddMatch(match);
		matchPages.Add(matchPage);
		return matchPage;
	}

	private void CheckFinishedPages(bool inPenalties)
	{
	}

	private void FillTopPrefabs(Match preSelectedMatch)
	{
		for (int i = 0; i < firstTopScroll.childCount; i++)
		{
			UnityEngine.Object.Destroy(firstTopScroll.GetChild(i).gameObject);
		}
		int num = -1;
		TopPrefab prefab = null;
		if (matchPages.Count >= 2)
		{
			int num2 = 0;
			foreach (MatchPage matchPage in matchPages)
			{
				TopPrefab topPrefab = UnityEngine.Object.Instantiate(this.topPrefab, firstTopScroll);
				topPrefab.Initialize(matchPage.pageIcon, matchPage.shortTitle, num2, SelectMatchPage);
				if (num2 == 0)
				{
					prefab = topPrefab;
				}
				foreach (Match match in matchPage.matches)
				{
					if (match == preSelectedMatch)
					{
						num = num2;
						prefab = topPrefab;
					}
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
			SelectMatchPage(prefab, num, recordAction: false);
		}
		else if (matchPages.Count > 0)
		{
			SelectMatchPage(prefab, 0, recordAction: false);
		}
		else
		{
			Debug.LogWarning("NO PAGES DONE WITH THESE MATCHES");
		}
	}

	private void SelectMatchPage(TopPrefab prefab, int index, bool recordAction)
	{
		if (prefab != null)
		{
			if (lastTopPrefabSelected != null)
			{
				lastTopPrefabSelected.DeSelect();
			}
			lastTopPrefabSelected = prefab;
			lastTopPrefabSelected.Select();
		}
		if (firstTimeRefresh1stTop)
		{
			StartCoroutine(CenterSelectedFirstTime(index, firstTopViewport, firstTopScroll));
		}
		else
		{
			CenterSelected(index, firstTopViewport, firstTopScroll);
		}
		ListOfMatches matches = matchPages[index].matches;
		OnPageSelected?.Invoke(matches, recordAction);
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
		float x = topPrefab.GetComponent<RectTransform>().sizeDelta.x;
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
