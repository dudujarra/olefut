using System;
using UnityEngine;
using UnityEngine.UI;

public class CoachPrefab : MonoBehaviour
{
	public Image logoOrShirt;

	public GameObject noAccountIcon;

	public Text coachName;

	public Text inVacation;

	public Text teamName;

	public GameObject vacationButton;

	public GameObject removeButton;

	public Coach myCoach;

	private bool canSaveGame;

	private Action onChange;

	private Action ignoreAccountCreation;

	public void Initialize(Coach coach, bool canSaveGame, Action onChange, Action ignoreAccountCreation)
	{
		myCoach = coach;
		this.canSaveGame = canSaveGame;
		this.onChange = onChange;
		this.ignoreAccountCreation = ignoreAccountCreation;
		FillPrefab();
	}

	private void FillPrefab()
	{
		myCoach.DrawLogoOnImage(logoOrShirt);
		coachName.text = myCoach.Name;
		coachName.color = myCoach.GetCoachTextColor();
		teamName.text = ((myCoach.MyTeam == null) ? "" : myCoach.MyTeam.Name);
		UpdateVacationStatus();
		UpdateNoAccountIcon();
	}

	private void UpdateVacationStatus()
	{
		inVacation.text = (myCoach.onVacation ? LanguageController.instance.Get_Translation("COACH_VACATION") : "");
		removeButton.SetActive(!myCoach.onVacation);
	}

	public void UpdateNoAccountIcon()
	{
		noAccountIcon.SetActive(!myCoach.HasAccount());
	}

	public void UpdateAccount(Account account)
	{
		myCoach.Account = account;
		coachName.text = myCoach.Name;
	}

	public void RemoveCoach()
	{
		myCoach.human = false;
		UnityEngine.Object.Destroy(base.gameObject);
		onChange?.Invoke();
	}

	public void VacationPressed()
	{
		myCoach.onVacation = !myCoach.onVacation;
		UpdateVacationStatus();
		onChange?.Invoke();
	}

	public void OnCoachPress()
	{
		if (!myCoach.HasAccount())
		{
			ScreenController.instance.ShowAccountView(AccountView.ViewMode.CreateAccountForExistingCoach, myCoach.Account, OnCoachComplete, ignoreAccountCreation);
		}
	}

	private void OnCoachComplete(Account account)
	{
		myCoach.Account = account;
		myCoach.Name = account.coachName;
		FillPrefab();
		onChange?.Invoke();
	}

	public bool IsInVacation()
	{
		if (myCoach == null)
		{
			return false;
		}
		return myCoach.onVacation;
	}

	public bool IsActive()
	{
		if (myCoach == null)
		{
			return false;
		}
		if (!myCoach.human)
		{
			return false;
		}
		return true;
	}

	public void SetVacationButton(bool isOn)
	{
		vacationButton.SetActive(isOn);
	}

	public void SetRemoveButton(bool isOn)
	{
		removeButton.SetActive(isOn);
	}
}
