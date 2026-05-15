using System.Collections;
using UnityEngine;

public class MatchResumeView : EliView
{
	public MatchResumePrefab matchResumePrefab;

	public ShareScreenshot shareScreenshot;

	public GameObject nextButton;

	public GameObject shareButton;

	public GameObject videoAdButton;

	[HideInInspector]
	public bool isDone;

	private ListOfMatches listOfMatches;

	private int matchIndex;

	private readonly string shareTitle = "Elifoot";

	private readonly string shareDescription = "Results";

	private bool videoAdWasActive;

	private float secondsToClose = 10f;

	private float secondsTimer;

	private bool pauseTimer;

	public void Initialize(ListOfMatches listOfMatches)
	{
		this.listOfMatches = listOfMatches;
		SearchNext_HasPresentCoachTeam(0);
		StartTimeToNext();
	}

	public void SearchNext_HasPresentCoachTeam(int startingIndex)
	{
		matchIndex = -1;
		for (int i = startingIndex; i < listOfMatches.Count; i++)
		{
			if (listOfMatches.Match(i).HasPresentCoach())
			{
				matchResumePrefab.Initialize(listOfMatches.Match(i));
				matchIndex = i;
				videoAdButton.SetActive(value: false);
				break;
			}
		}
		if (matchIndex == -1)
		{
			DataManager.instance.recordedMatches.Clear();
			isDone = true;
		}
	}

	private bool CanDoubleMoney(Match match)
	{
		return false;
	}

	public void NextButton()
	{
		StartTimeToNext();
		matchResumePrefab.CheckFiveStraightWins();
		SearchNext_HasPresentCoachTeam(matchIndex + 1);
	}

	public void ShareButton()
	{
		DisableButtonsForSS();
		shareScreenshot.Share(shareTitle, shareDescription, EnableButtonsForSS);
	}

	private void DisableButtonsForSS()
	{
		nextButton.SetActive(value: false);
		shareButton.SetActive(value: false);
		videoAdWasActive = videoAdButton.activeSelf;
		videoAdButton.SetActive(value: false);
	}

	private void EnableButtonsForSS()
	{
		nextButton.SetActive(value: true);
		shareButton.SetActive(value: true);
		videoAdButton.SetActive(videoAdWasActive);
	}

	public void StartTimeToNext()
	{
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
		NextButton();
	}

	public override void Update()
	{
		if (Input.GetMouseButtonDown(0))
		{
			secondsTimer = secondsToClose;
		}
		base.Update();
	}
}
