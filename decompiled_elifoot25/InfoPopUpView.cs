using System;
using UnityEngine;
using UnityEngine.UI;

public class InfoPopUpView : EliView
{
	public Text description;

	public Button okButton;

	private Action okAction;

	public void Initialize(string description, Action okAction)
	{
		this.description.text = description;
		this.okAction = okAction;
	}

	public void OkPressed()
	{
		if (okAction != null)
		{
			okAction();
		}
		UnityEngine.Object.Destroy(base.gameObject);
	}
}
