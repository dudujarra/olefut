using UnityEngine;

public class MsgDlgImgView : MsgDlgView
{
	private Sprite imageSprite;

	public void Initialize(MsgDlgType messageType, string title, string message, Sprite imageSprite, AudioSource messageSound, MsgDlgReturnObj returnObj, params DlgViewButtonInfo[] buttons)
	{
		this.imageSprite = imageSprite;
		Initialize(messageType, title, message, returnObj, buttons);
		SoundManager.instance.PlaySound(messageSound, vibration: false, overrideOthers: true);
	}

	protected override void FillView()
	{
		base.FillView();
		icon.sprite = imageSprite;
	}
}
