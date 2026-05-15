using System;
using UnityEngine.UI;

public class DlgViewButtonInfo
{
	public string text;

	public string iconStyle;

	public MsgDlgView.MsgDlgReturn returnValue;

	public bool closeDialog = true;

	public Action action;

	public Button myButton;

	public DlgViewButtonInfo(string text, string iconStyle, MsgDlgView.MsgDlgReturn returnValue, bool closeDialog, Action action)
	{
		this.text = text;
		this.iconStyle = iconStyle;
		this.returnValue = returnValue;
		this.closeDialog = closeDialog;
		this.action = action;
	}
}
