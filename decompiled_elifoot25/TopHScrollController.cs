using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TopHScrollController : MonoBehaviour
{
	public class TopPrefabData
	{
		public string name;

		public Sprite flag;

		public bool isInternacional;

		public ListOfCompetitions competitions = new ListOfCompetitions();

		public TopPrefabData(string name, Sprite flag, bool internacional)
		{
			this.name = name;
			this.flag = flag;
			isInternacional = internacional;
		}

		public void AddCompetition(Competition competition)
		{
			competitions.Add(competition);
		}
	}

	public CanvasGroup firstTopCanvasGroup;

	public RectTransform firstTopViewport;

	public RectTransform firstTopScroll;

	public CanvasGroup secondTopCanvasGroup;

	public RectTransform secondTopViewport;

	public RectTransform secondTopScroll;

	public TopPrefab topPrefab;

	private List<TopPrefabData> topPrefabDatas = new List<TopPrefabData>();

	private int selectedTopIndex;

	private TopPrefab lastFirstTopPrefab;

	private TopPrefab lastSecondTopPrefab;

	private Action<Competition> OnCompetitionSelected;

	private bool firstTimeRefresh1stTop = true;

	private bool firstTimeRefresh2ndTop = true;

	private Vector2 firstCenteredDestination;

	private Vector2 secondCenteredDestination;

	private float animationSpeed = 2000f;

	public void Initialize(ListOfCompetitions competitions, Competition preSelectedCompetition, Action<Competition> OnCompetitionSelected)
	{
		if (competitions == null)
		{
			firstTopScroll.parent.parent.gameObject.SetActive(value: false);
			secondTopScroll.parent.parent.gameObject.SetActive(value: false);
		}
		else
		{
			this.OnCompetitionSelected = OnCompetitionSelected;
			CreateAllData(competitions);
			FillFirstTopPrefabs(preSelectedCompetition);
		}
	}

	private void CreateAllData(ListOfCompetitions competitions)
	{
		competitions.SortBySortOrderAndName();
		foreach (Competition competition in competitions)
		{
			if (competition.confederation != null)
			{
				TopPrefabData foundData = topPrefabDatas.Find((TopPrefabData prefab) => prefab.isInternacional);
				AddCompetition(foundData, internacional: true, competition);
			}
			else
			{
				TopPrefabData foundData2 = topPrefabDatas.Find((TopPrefabData prefab) => prefab.name == competition.country.GetName());
				AddCompetition(foundData2, internacional: false, competition);
			}
		}
		topPrefabDatas.Sort(delegate(TopPrefabData c1, TopPrefabData c2)
		{
			int num = c1.isInternacional.CompareTo(c2.isInternacional);
			if (num == 0)
			{
				num = c1.name.CompareTo(c2.name);
			}
			return num;
		});
	}

	private void AddCompetition(TopPrefabData foundData, bool internacional, Competition competition)
	{
		if (foundData == null)
		{
			TopPrefabData topPrefabData = new TopPrefabData(internacional ? LanguageController.instance.Get_Translation("COMPETITION_TYPE_INTERNATIONALCOMPETITION") : competition.country.GetName(), competition.GetIcon(), internacional);
			topPrefabData.AddCompetition(competition);
			topPrefabDatas.Add(topPrefabData);
		}
		else
		{
			foundData.AddCompetition(competition);
		}
	}

	private void FillFirstTopPrefabs(Competition preSelectedCompetition)
	{
		for (int i = 0; i < firstTopScroll.childCount; i++)
		{
			UnityEngine.Object.Destroy(firstTopScroll.GetChild(i).gameObject);
		}
		int num = -1;
		int num2 = -1;
		TopPrefab prefab = null;
		if (topPrefabDatas.Count >= 2)
		{
			int num3 = 0;
			foreach (TopPrefabData topPrefabData in topPrefabDatas)
			{
				TopPrefab topPrefab = UnityEngine.Object.Instantiate(this.topPrefab, firstTopScroll);
				topPrefab.Initialize(topPrefabData.flag, topPrefabData.name, num3, TopPrefabPressed);
				if (num3 == 0)
				{
					prefab = topPrefab;
				}
				foreach (Competition competition in topPrefabData.competitions)
				{
					if (competition == preSelectedCompetition)
					{
						num = num3;
						prefab = topPrefab;
					}
					else if (preSelectedCompetition != null && competition.country == preSelectedCompetition.country)
					{
						num2 = num3;
						prefab = topPrefab;
					}
				}
				num3++;
			}
			firstTopScroll.parent.parent.gameObject.SetActive(value: true);
		}
		else
		{
			firstTopScroll.parent.parent.gameObject.SetActive(value: false);
		}
		if (num != -1)
		{
			TopPrefabPressed(prefab, num, recordAction: false, preSelectedCompetition);
		}
		else if (num2 != -1)
		{
			TopPrefabPressed(prefab, num2, recordAction: false, preSelectedCompetition);
		}
		else if (topPrefabDatas.Count > 0)
		{
			TopPrefabPressed(prefab, 0, recordAction: false, preSelectedCompetition);
		}
		else
		{
			Debug.LogWarning("NO COUNTRIES FOUND IN THESE COMPETITIONS");
		}
	}

	private void TopPrefabPressed(TopPrefab prefab, int index, bool recordAction)
	{
		TopPrefabPressed(prefab, index, recordAction, null);
	}

	private void TopPrefabPressed(TopPrefab prefab, int index, bool recordAction, Competition preSelectedCompetition = null)
	{
		if (prefab != null)
		{
			if (lastFirstTopPrefab != null)
			{
				lastFirstTopPrefab.DeSelect();
			}
			lastFirstTopPrefab = prefab;
			lastFirstTopPrefab.Select();
		}
		if (firstTimeRefresh1stTop)
		{
			StartCoroutine(CenterSelectedFirstTime(index, firstTopViewport, firstTopScroll));
		}
		else
		{
			CenterSelected(index, firstTopViewport, firstTopScroll, first: true);
		}
		selectedTopIndex = index;
		FillSecondTopPrefabs(topPrefabDatas[index].competitions, preSelectedCompetition);
	}

	private void FillSecondTopPrefabs(ListOfCompetitions competitions, Competition preSelectedCompetition = null)
	{
		for (int i = 0; i < secondTopScroll.childCount; i++)
		{
			UnityEngine.Object.Destroy(secondTopScroll.GetChild(i).gameObject);
		}
		int num = -1;
		TopPrefab prefab = null;
		if (competitions.Count >= 2)
		{
			int num2 = 0;
			foreach (Competition competition in competitions)
			{
				TopPrefab topPrefab = UnityEngine.Object.Instantiate(this.topPrefab, secondTopScroll);
				topPrefab.Initialize(competition.GetIcon(), competition.GetName(), num2, SelectCompetition);
				if (num2 == 0)
				{
					prefab = topPrefab;
				}
				if (competition == preSelectedCompetition)
				{
					num = num2;
					prefab = topPrefab;
				}
				num2++;
			}
			secondTopScroll.parent.parent.gameObject.SetActive(value: true);
		}
		else
		{
			secondTopScroll.parent.parent.gameObject.SetActive(value: false);
		}
		if (num != -1)
		{
			SelectCompetition(prefab, num, recordAction: false);
		}
		else if (competitions.Count > 0)
		{
			SelectCompetition(prefab, 0, recordAction: false);
		}
		else
		{
			Debug.LogWarning("NO COMPETITIONS FOUND IN THIS COUNTRY: " + topPrefabDatas[selectedTopIndex].name);
		}
	}

	private void SelectCompetition(TopPrefab prefab, int index, bool recordAction)
	{
		if (prefab != null)
		{
			if (lastSecondTopPrefab != null)
			{
				lastSecondTopPrefab.DeSelect();
			}
			lastSecondTopPrefab = prefab;
			lastSecondTopPrefab.Select();
		}
		if (firstTimeRefresh2ndTop)
		{
			StartCoroutine(CenterSelectedFirstTime2(index, secondTopViewport, secondTopScroll));
		}
		else
		{
			CenterSelected(index, secondTopViewport, secondTopScroll, first: false);
		}
		Competition obj = topPrefabDatas[selectedTopIndex].competitions.Competition(index);
		OnCompetitionSelected?.Invoke(obj);
	}

	private IEnumerator CenterSelectedFirstTime(int index, RectTransform viewport, RectTransform content)
	{
		if (firstTimeRefresh1stTop)
		{
			firstTopCanvasGroup.alpha = 0f;
			yield return new WaitForEndOfFrame();
		}
		CenterSelected(index, viewport, content, first: true);
		if (firstTimeRefresh1stTop)
		{
			firstTopCanvasGroup.alpha = 1f;
		}
	}

	private IEnumerator CenterSelectedFirstTime2(int index, RectTransform viewport, RectTransform content)
	{
		if (firstTimeRefresh2ndTop)
		{
			secondTopCanvasGroup.alpha = 0f;
			yield return new WaitForEndOfFrame();
		}
		CenterSelected(index, viewport, content, first: false);
		if (firstTimeRefresh2ndTop)
		{
			secondTopCanvasGroup.alpha = 1f;
		}
	}

	private void CenterSelected(int index, RectTransform viewport, RectTransform content, bool first)
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
		if (first)
		{
			firstCenteredDestination = new Vector2(0f - num2, 0f);
		}
		else
		{
			secondCenteredDestination = new Vector2(0f - num2, 0f);
		}
		base.enabled = true;
	}

	private void Update()
	{
		if (firstTimeRefresh1stTop || firstTimeRefresh2ndTop)
		{
			firstTopScroll.anchoredPosition = firstCenteredDestination;
			secondTopScroll.anchoredPosition = secondCenteredDestination;
			firstTimeRefresh1stTop = false;
			firstTimeRefresh2ndTop = false;
		}
		else
		{
			firstTopScroll.anchoredPosition = Vector2.MoveTowards(firstTopScroll.anchoredPosition, firstCenteredDestination, animationSpeed * Time.deltaTime);
			secondTopScroll.anchoredPosition = Vector2.MoveTowards(secondTopScroll.anchoredPosition, secondCenteredDestination, animationSpeed * Time.deltaTime);
		}
		if (firstTopScroll.anchoredPosition == firstCenteredDestination && secondTopScroll.anchoredPosition == secondCenteredDestination)
		{
			base.enabled = false;
		}
	}
}
