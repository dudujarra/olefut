using System;
using UnityEngine;
using UnityEngine.UI;

public class BankLoanView : EliView
{
	[Header("Total Money")]
	public Text txtTeamMoney;

	[Header("Bank")]
	public Text txtBankMaxLoan;

	[Header("Loan")]
	public GameObject loanObj;

	public Text loanValue;

	public Slider loanSlider;

	public Image loanSliderFillImage;

	public EliImage loanSliderFillEliImage;

	public Text loanSliderMinValue;

	public Text loanSliderMaxValue;

	public Text txtLoanInterestPercentage;

	public Text txtLoanInterestValue;

	[Header("Footer")]
	public Button okButton;

	private Team team;

	private Action onCloseView;

	private long curMaxLoan;

	private bool canShowToastMessage = true;

	public void Initialize(Team team, Action onCloseView)
	{
		this.team = team;
		this.onCloseView = onCloseView;
		curMaxLoan = team.GetMaxLoan();
		FillTeamMoneyAndBank();
		PrepareLoanSlider();
		loanSlider.onValueChanged.AddListener(OnSliderValueChanged);
	}

	private void FillTeamMoneyAndBank()
	{
		txtTeamMoney.text = Util.MoneyString(team.Money());
		txtBankMaxLoan.text = LanguageController.instance.Get_Translation("BANK_LOAN_MAX", Util.MoneyString(curMaxLoan));
		loanValue.text = Util.MoneyString(team.BankLoanValue);
	}

	private void PrepareLoanSlider()
	{
		if (team.BankLoanValue == 0L && curMaxLoan == 0L)
		{
			loanObj.SetActive(value: false);
			okButton.gameObject.SetActive(value: false);
			ScreenController.instance.ShowToastMessage("ID:BANK_LOAN_UNAVAILABLE", 240f, 4f);
			return;
		}
		if (team.teamMatch.bankLoanChanged)
		{
			loanObj.SetActive(value: false);
			okButton.gameObject.SetActive(value: false);
			ScreenController.instance.ShowToastMessage("ID:BANK_LOAN_NEXT_ROUND", 240f, 4f);
			return;
		}
		loanSlider.minValue = 0f;
		loanSlider.maxValue = ((curMaxLoan > team.BankLoanValue) ? curMaxLoan : team.BankLoanValue) / 1000000;
		loanSliderMinValue.text = Util.MoneyString(0L);
		loanSliderMaxValue.text = Util.MoneyString(curMaxLoan);
		loanSlider.value = team.BankLoanValue / 1000000;
		OnSliderValueChanged(team.BankLoanValue / 1000000);
	}

	private void OnSliderValueChanged(float amount)
	{
		long num = (long)(int)amount * 1000000L;
		if (team.Money() + num - team.BankLoanValue < 0)
		{
			loanSlider.value = Mathf.FloorToInt((float)(team.BankLoanValue - team.Money()) / 1000000f);
			loanSliderFillImage.color = Color.red;
			ShowWarningMessage();
			return;
		}
		loanValue.text = Util.MoneyString(num);
		long bankInterestValue = team.GetBankInterestValue(num);
		txtLoanInterestPercentage.text = LanguageController.instance.Get_Translation("BANK_INTEREST_PERCENTAGE", 1f);
		string text = Util.MoneyString(bankInterestValue);
		txtLoanInterestValue.text = LanguageController.instance.Get_Translation("BANK_INTEREST_DESC", text);
		txtLoanInterestValue.enabled = bankInterestValue > 0;
		txtTeamMoney.text = Util.MoneyString(team.Money() + num - team.BankLoanValue);
		loanSliderFillEliImage.ReloadElementConfig();
	}

	private void ShowWarningMessage()
	{
		if (canShowToastMessage)
		{
			ScreenController.instance.ShowToastMessage("ID:BANK_LOAN_UNABLE_PAYBACK", 240f, 4f);
			canShowToastMessage = false;
			Invoke("CanShowToastMessage", 2f);
		}
	}

	private void CanShowToastMessage()
	{
		canShowToastMessage = true;
	}

	public void OkPressed()
	{
		if (loanSlider.value != (float)(team.BankLoanValue / 1000000))
		{
			ShowConfirmationPopUp();
		}
		else
		{
			Close();
		}
	}

	private void ShowConfirmationPopUp()
	{
		string title = LanguageController.instance.Get_Translation("ID:BANK_CONFIRM_LOAN");
		string text = "";
		long num = (long)(int)loanSlider.value * 1000000L;
		string text2 = Util.MoneyString(team.GetBankInterestValue(num));
		text = ((team.BankLoanValue == 0L) ? LanguageController.instance.Get_Translation("BANK_LOAN_RESUME_NEW", Util.MoneyString(num), text2, 1f) : ((num > team.BankLoanValue) ? LanguageController.instance.Get_Translation("BANK_LOAN_RESUME_INCREASE", Util.MoneyString(num - team.BankLoanValue), Util.MoneyString(num), text2, 1f) : ((!(loanSlider.value > 0f)) ? LanguageController.instance.Get_Translation("ID:BANK_LOAN_PAYBACK_TOTAL") : LanguageController.instance.Get_Translation("BANK_LOAN_RESUME_DECREASE", Util.MoneyString(team.BankLoanValue - num), Util.MoneyString(num), text2, 1f))));
		ScreenController.instance.ShowDialogPopUp(title, text, ConfirmChanges, null);
	}

	private void ConfirmChanges()
	{
		long num = (long)(int)loanSlider.value * 1000000L;
		team.GetBankInterestValue(num);
		if (loanSlider.value > (float)(team.BankLoanValue / 1000000))
		{
			team.ApplyForLoan(num - team.BankLoanValue);
		}
		else
		{
			team.PayLoan(team.BankLoanValue - num);
		}
		team.teamMatch.bankLoanChanged = true;
		onCloseView?.Invoke();
		Close();
	}
}
