using System;
using UnityEngine;
using UnityEngine.UI;

public class LoadingWithProgressView : LoadingView
{
	[SerializeField]
	private Text progressPercentage;

	[SerializeField]
	private Image progressBar;

	[SerializeField]
	private Button closeButton;

	public void Initialize(string description = null, bool canCancel = false, Action onCancelAction = null)
	{
		base.Initialize(description);
		UpdateProgress(0f);
		closeButton.gameObject.SetActive(canCancel);
		if (onCancelAction != null)
		{
			closeButton.onClick.AddListener(delegate
			{
				onCancelAction?.Invoke();
			});
		}
	}

	public void UpdateProgress(float amount)
	{
		amount = Mathf.Min(amount, 100f);
		progressPercentage.text = amount.ToString("0") + "%";
		progressBar.fillAmount = amount / 100f;
	}
}
