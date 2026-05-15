using System;
using UnityEngine;
using UnityEngine.UI;

public class SavedGamePrefab : MonoBehaviour
{
	[Header("Header")]
	public Text fileNameText;

	public Text date;

	public Button savedGameButton;

	public Button deleteButton;

	public GameObject gameVersionPanel;

	public Text gameVersionText;

	[Header("Coaches List")]
	public RectTransform coachesGroup;

	public SavedGameCoachPrefab coachPrefab;

	public void Initialize(string fileName, SavedGamesShortInfo.SavedGame? savedGameInfo, string savedGameVersion, Action savedGameAction, Action deleteAction, bool isTempAutoSave = false)
	{
		fileNameText.text = fileName;
		if (!savedGameInfo.HasValue || savedGameInfo.Value.date.year == 0)
		{
			date.text = "";
		}
		else
		{
			date.text = savedGameInfo.Value.date.day.ToString("00") + "/" + savedGameInfo.Value.date.month.ToString("00") + "/" + savedGameInfo.Value.date.year.ToString("0000");
		}
		if (deleteAction == null)
		{
			deleteButton.gameObject.SetActive(value: false);
		}
		else
		{
			deleteButton.onClick.AddListener(deleteAction.Invoke);
		}
		gameVersionPanel.SetActive(value: false);
		FillCoaches(savedGameInfo);
		savedGameButton.onClick.AddListener(savedGameAction.Invoke);
	}

	private void FillCoaches(SavedGamesShortInfo.SavedGame? savedGameInfo)
	{
		for (int i = 0; i < coachesGroup.childCount; i++)
		{
			UnityEngine.Object.Destroy(coachesGroup.GetChild(i).gameObject);
		}
		if (savedGameInfo.HasValue && savedGameInfo.Value.coachesData != null)
		{
			foreach (SavedGamesShortInfo.CoachData coachesDatum in savedGameInfo.Value.coachesData)
			{
				UnityEngine.Object.Instantiate(coachPrefab, coachesGroup).Initialize(coachesDatum.coachName, coachesDatum.team);
			}
		}
		coachesGroup.ForceUpdateRectTransforms();
	}
}
