using System.Collections;
using UnityEngine;

public class CoachNewsView : EliView
{
	[Header("News List")]
	public Transform newsGroupParent;

	public GameObject newsPrefab;

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private bool backPressed;

	private EliList localNews;

	public void Initialize(EliList news)
	{
		localNews = news;
		LoadNews();
	}

	private void LoadNews()
	{
		for (int i = 0; i < newsGroupParent.childCount; i++)
		{
			Object.Destroy(newsGroupParent.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		for (int j = 0; j < localNews.Count; j++)
		{
			Coach.CoachEventNews coachEventNews = localNews[j] as Coach.CoachEventNews;
			int numNews = coachEventNews.GetNumNews();
			for (int k = 1; k <= numNews; k++)
			{
				GameObject newsObj = Object.Instantiate(newsPrefab, newsGroupParent, worldPositionStays: false);
				DarkenListBackgroundObj(newsObj, ref darkenThis, ref darkenNext);
				coachEventNews.FillNewsPrefab(ref newsObj, k);
			}
		}
	}

	public void BackButtonPressed()
	{
		backPressed = true;
		Close();
	}

	public override void Close()
	{
		localNews.Clear();
		base.Close();
	}

	public void StartTimeToClose(float seconds)
	{
		secondsToClose = seconds;
		secondsTimer = secondsToClose;
		if (secondsToClose > 0f)
		{
			StartCoroutine(TimeToClose());
		}
	}

	private IEnumerator TimeToClose()
	{
		while (secondsTimer > 0f)
		{
			if (!pauseTimer)
			{
				secondsTimer -= Time.deltaTime;
			}
			yield return 0;
		}
		BackButtonPressed();
	}

	public override void Update()
	{
		if (Input.GetMouseButtonDown(0))
		{
			secondsTimer = secondsToClose;
		}
		base.Update();
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}
}
