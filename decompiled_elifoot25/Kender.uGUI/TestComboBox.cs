using System;
using UnityEngine;

namespace Kender.uGUI;

public class TestComboBox : MonoBehaviour
{
	public ComboBox comboBox;

	public Sprite image;

	private void Start()
	{
		ComboBoxItem itemMakeBig = new ComboBoxItem("Make me big!");
		ComboBoxItem itemMakeNormal = new ComboBoxItem("Normal", image, disabled: true);
		ComboBoxItem itemMakeSmall = new ComboBoxItem("Make me small!");
		ComboBoxItem comboBoxItem = itemMakeBig;
		comboBoxItem.OnSelect = (Action)Delegate.Combine(comboBoxItem.OnSelect, (Action)delegate
		{
			comboBox.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, 180f);
			comboBox.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, 40f);
			comboBox.UpdateGraphics();
			itemMakeBig.Caption = "Big";
			itemMakeBig.IsDisabled = true;
			itemMakeNormal.Caption = "Make me normal!";
			itemMakeNormal.IsDisabled = false;
			itemMakeSmall.Caption = "Make me small!";
			itemMakeSmall.IsDisabled = false;
		});
		ComboBoxItem comboBoxItem2 = itemMakeNormal;
		comboBoxItem2.OnSelect = (Action)Delegate.Combine(comboBoxItem2.OnSelect, (Action)delegate
		{
			comboBox.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, 160f);
			comboBox.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, 30f);
			comboBox.UpdateGraphics();
			itemMakeBig.Caption = "Make me big!";
			itemMakeBig.IsDisabled = false;
			itemMakeNormal.Caption = "Normal";
			itemMakeNormal.IsDisabled = true;
			itemMakeSmall.Caption = "Make me small!";
			itemMakeSmall.IsDisabled = false;
		});
		ComboBoxItem comboBoxItem3 = itemMakeSmall;
		comboBoxItem3.OnSelect = (Action)Delegate.Combine(comboBoxItem3.OnSelect, (Action)delegate
		{
			comboBox.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, 160f);
			comboBox.GetComponent<RectTransform>().SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, 20f);
			comboBox.UpdateGraphics();
			itemMakeBig.Caption = "Make me big!";
			itemMakeBig.IsDisabled = false;
			itemMakeNormal.Caption = "Make me normal!";
			itemMakeNormal.IsDisabled = false;
			itemMakeSmall.Caption = "Small";
			itemMakeSmall.IsDisabled = true;
		});
		comboBox.AddItems(itemMakeBig, itemMakeNormal, itemMakeSmall);
		comboBox.SelectedIndex = 1;
		ComboBox obj = comboBox;
		obj.OnSelectionChanged = (Action<int>)Delegate.Combine(obj.OnSelectionChanged, (Action<int>)delegate
		{
			Camera.main.backgroundColor = new Color32((byte)UnityEngine.Random.Range(0, 256), (byte)UnityEngine.Random.Range(0, 256), (byte)UnityEngine.Random.Range(0, 256), byte.MaxValue);
		});
	}
}
