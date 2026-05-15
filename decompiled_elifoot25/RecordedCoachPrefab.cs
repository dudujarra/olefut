using System;
using UnityEngine;
using UnityEngine.UI;

public class RecordedCoachPrefab : MonoBehaviour
{
	public Button myButton;

	public GameObject noAccountIcon;

	public Text coachName;

	public GameObject deleteButtonObj;

	public Button deleteButton;

	public bool showNoAccountIcon;

	private bool isNewCoach;

	private Account myAccount;

	private Action onClickAction;

	private Action onDeleted;

	public void InitializeAsNewCoach(Action onClickAction)
	{
		isNewCoach = true;
		showNoAccountIcon = false;
		this.onClickAction = onClickAction ?? throw new Exception("RecordedCoachPrefab: Initialize => onClickAction cant be null");
		FillPrefab();
	}

	public void Initialize(bool showNoAccountIcon, Account coachAccount, Action onClickAction, Action onDeleted)
	{
		isNewCoach = false;
		this.showNoAccountIcon = showNoAccountIcon;
		myAccount = coachAccount ?? throw new Exception("RecordedCoachPrefab: Initialize => coachAccount cant be null");
		this.onClickAction = onClickAction ?? throw new Exception("RecordedCoachPrefab: Initialize => onClickAction cant be null");
		this.onDeleted = onDeleted;
		FillPrefab();
	}

	private void FillPrefab()
	{
		noAccountIcon.SetActive(showNoAccountIcon);
		coachName.text = (isNewCoach ? LanguageController.instance.Get_Translation("COACHES_PANEL_NEW_COACH") : myAccount.coachName);
		myButton.onClick.AddListener(delegate
		{
			SoundManager.instance.PlaySound(DataManager.instance.soundDefaultClick);
		});
		myButton.onClick.AddListener(onClickAction.Invoke);
		deleteButtonObj.SetActive(!isNewCoach);
	}

	public void DeletingRecordedCoach()
	{
		ScreenController.instance.ShowDialogPopUp("COACH_PANEL_REMOVE_COACH_TITLE", "COACH_PANEL_REMOVE_COACH_DESC", DeleteRecordedCoach, null);
	}

	private void DeleteRecordedCoach()
	{
		DataManager.instance.DeleteRecordedCoach(myAccount);
		UnityEngine.Object.Destroy(base.gameObject);
		showNoAccountIcon = false;
		onDeleted?.Invoke();
	}
}
