using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class MsgDlgView : EliView
{
	public enum MsgDlgType
	{
		Info,
		YesNo,
		Custom
	}

	public enum MsgDlgReturn
	{
		Void,
		OK,
		Yes,
		No,
		Custom1,
		Custom2,
		Custom3,
		Custom4,
		Custom5
	}

	public Text titleText;

	[Space]
	public Text mainText;

	public Image icon;

	[Space]
	public Transform viewFooter;

	public GameObject footerButtonPrefab;

	private MsgDlgType messageType;

	private MsgDlgReturnObj returnValueObj;

	private string title;

	private string message;

	public void Initialize(MsgDlgType messageType, string title, string message, MsgDlgReturnObj returnValueObj, params DlgViewButtonInfo[] buttons)
	{
		base.gameObject.SetActive(value: true);
		this.title = title;
		this.message = message;
		this.returnValueObj = returnValueObj;
		this.messageType = messageType;
		switch (messageType)
		{
		case MsgDlgType.Info:
		{
			DlgViewButtonInfo itemToAdd3 = new DlgViewButtonInfo(null, "Back", MsgDlgReturn.OK, closeDialog: true, null);
			Extensions.AddItemInArray(ref buttons, itemToAdd3);
			break;
		}
		case MsgDlgType.YesNo:
		{
			DlgViewButtonInfo itemToAdd = new DlgViewButtonInfo(null, "Yes", MsgDlgReturn.Yes, closeDialog: true, null);
			Extensions.AddItemInArray(ref buttons, itemToAdd);
			DlgViewButtonInfo itemToAdd2 = new DlgViewButtonInfo(null, "No", MsgDlgReturn.No, closeDialog: true, null);
			Extensions.AddItemInArray(ref buttons, itemToAdd2);
			break;
		}
		}
		DlgViewButtonInfo[] array = buttons;
		foreach (DlgViewButtonInfo buttonInfo in array)
		{
			if (viewFooter != null && footerButtonPrefab != null)
			{
				GameObject gameObject = Object.Instantiate(footerButtonPrefab, viewFooter);
				gameObject.name = "Button" + buttonInfo.returnValue;
				gameObject.GetComponent<EliImage>().imageStyle = "Fill";
				Util.GetComponent(gameObject, "Icon").gameObject.GetComponent<EliImage>().imageStyle = buttonInfo.iconStyle;
				buttonInfo.myButton = gameObject.GetComponent<Button>();
				gameObject.GetComponent<Button>().onClick.AddListener(delegate
				{
					OnButtonPressed(buttonInfo);
				});
				continue;
			}
			Debug.LogError("Not supposed to happen! Please Fix! -> Put the 'viewFooter' and 'footerButtonPrefab'");
			GameObject gameObject2 = new GameObject();
			gameObject2.transform.parent = base.transform;
			gameObject2.AddComponent<RectTransform>();
			Button button = gameObject2.AddComponent<Button>();
			gameObject2.AddComponent<Image>();
			buttonInfo.myButton = button;
			button.onClick.AddListener(delegate
			{
				OnButtonPressed(buttonInfo);
			});
			GameObject gameObject3 = new GameObject();
			gameObject3.AddComponent<Text>();
			gameObject3.transform.SetParent(gameObject2.transform);
			gameObject2.GetComponent<RectTransform>().localScale = new Vector3(1f, 1f, 1f);
			gameObject2.name = "Button" + buttonInfo.returnValue;
			if (!string.IsNullOrEmpty(buttonInfo.text))
			{
				gameObject3.GetComponent<Text>().text = gameObject2.name;
				gameObject3.GetComponent<Text>().font = new Font();
				gameObject3.GetComponent<Text>().text = buttonInfo.text;
				gameObject3.GetComponent<Text>().resizeTextForBestFit = true;
				gameObject3.GetComponent<Text>().alignment = TextAnchor.MiddleCenter;
				gameObject3.name = "Text";
			}
			gameObject2.AddComponent<EliButton>().baseStyle = "BaseButton";
			EliImage eliImage = gameObject2.AddComponent<EliImage>();
			eliImage.baseStyle = "Icon";
			eliImage.imageStyle = buttonInfo.iconStyle;
		}
		FillView();
	}

	protected virtual void FillView()
	{
		titleText.text = title;
		mainText.text = message;
	}

	public void OnYesPressed()
	{
		returnValueObj.Value = MsgDlgReturn.Yes;
		Close();
	}

	public void OnNoPressed()
	{
		returnValueObj.Value = MsgDlgReturn.No;
		Close();
	}

	public void OnDonePressed()
	{
		returnValueObj.Value = MsgDlgReturn.OK;
		Close();
	}

	private void OnButtonPressed2(MsgDlgReturn returnValue)
	{
		returnValueObj.Value = returnValue;
		Close();
	}

	private void OnButtonPressed(DlgViewButtonInfo buttonInfo)
	{
		if (buttonInfo.closeDialog)
		{
			returnValueObj.Value = buttonInfo.returnValue;
			Close();
		}
		if (buttonInfo.action != null)
		{
			buttonInfo.action();
		}
	}

	public IEnumerator WaitForInput()
	{
		while (returnValueObj.Value == MsgDlgReturn.Void)
		{
			yield return 0;
		}
	}
}
