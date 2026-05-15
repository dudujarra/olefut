using UnityEngine;

public class CoachHistoryView : EliView
{
	[Header("List")]
	public Transform historyGroup;

	public GameObject historyPrefab;

	private EliLimitedList history;

	public void Initialize(EliLimitedList history)
	{
		this.history = history;
		FillHistory();
	}

	private void FillHistory()
	{
		EliLimitedList eliLimitedList = new EliLimitedList(history.Count);
		for (int num = history.Count - 1; num >= 0; num--)
		{
			eliLimitedList.Add(history[num]);
		}
		for (int i = 0; i < historyGroup.childCount; i++)
		{
			Object.Destroy(historyGroup.GetChild(i).gameObject);
		}
		bool darkenNext = false;
		bool darkenThis = false;
		for (int j = 0; j < eliLimitedList.Count; j++)
		{
			GameObject obj = Object.Instantiate(historyPrefab, historyGroup);
			DarkenListBackgroundObj(obj, ref darkenThis, ref darkenNext);
			Coach.CoachEvent coachEvent = eliLimitedList[j] as Coach.CoachEvent;
			Util.GetGameObjectImage(obj, "Icon").sprite = coachEvent.GetMessageImage();
			Util.GetGameObjectText(obj, "Year").text = coachEvent.seasonNumber.ToString();
			Util.GetGameObjectText(obj, "Desc").text = coachEvent.GetShortDescription(CoachEventShortDescription.Desc, lineBreaks: true);
			Util.GetGameObjectText(obj, "Event").text = coachEvent.GetShortDescription(CoachEventShortDescription.Event);
		}
	}

	public void BackButtonPressed()
	{
		Close();
	}
}
