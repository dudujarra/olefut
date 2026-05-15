using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Purchasing;
using UnityEngine.UI;

public class StoreItemPrefab : MonoBehaviour
{
	public Button button;

	public AddTargetGraphics buttonAddOns;

	public List<Image> Icons = new List<Image>();

	public Text description;

	public Text price;

	private StoreItem storeItem;

	private Action onClick;

	public void Initialize(StoreItem storeItem, Action onClick)
	{
		this.storeItem = storeItem;
		this.onClick = onClick;
		DrawPrefab();
	}

	public void RedrawPrefab()
	{
		DrawPrefab();
	}

	private void DrawPrefab()
	{
		DrawIcons();
		DrawDescription();
		DrawPriceLabel();
	}

	private void DrawIcons()
	{
		Sprite icon = storeItem.GetIcon();
		for (int i = 0; i < Icons.Count; i++)
		{
			Icons[i].sprite = icon;
			Icons[i].enabled = storeItem.GetIconsNumber() > i;
		}
	}

	private void DrawDescription()
	{
		description.text = storeItem.GetStoreTitle();
	}

	private void DrawPriceLabel()
	{
		ProductType? productType = storeItem.GetProductType();
		if (!productType.HasValue || productType == ProductType.Consumable)
		{
			NormalIAP();
		}
		else if (productType == ProductType.NonConsumable)
		{
			SpecialIAP("EXTRAS_BOUGHT");
		}
		else if (productType == ProductType.Subscription)
		{
			SpecialIAP("EXTRAS_ACTIVE");
			price.text += "*";
		}
	}

	private void NormalIAP()
	{
		price.text = storeItem.GetProductPrice();
		if (storeItem.MyVisibility == StoreItem.Visibility.Disabled || storeItem.MyVisibility == StoreItem.Visibility.Hidden)
		{
			button.interactable = false;
			buttonAddOns.ChangeToDisabledState();
		}
		else if (onClick != null)
		{
			button.interactable = true;
			buttonAddOns.ChangeToNormalState();
			button.onClick.RemoveAllListeners();
			button.onClick.AddListener(delegate
			{
				onClick();
			});
		}
	}

	private void SpecialIAP(string translation)
	{
		if (storeItem.IsOwned())
		{
			price.text = LanguageController.instance.Get_Translation(translation);
			if (!ElifootOptions.inApps.HasAvailableInApp(storeItem.GetSku()))
			{
				ElifootOptions.inApps.hasPurchases = true;
				ElifootOptions.inApps.Add(storeItem.GetSku());
				ElifootOptions.SaveOptions();
			}
		}
		else
		{
			NormalIAP();
			if (ElifootOptions.inApps.HasAvailableInApp(storeItem.GetSku()))
			{
				ElifootOptions.inApps.Delete(storeItem.GetSku());
				ElifootOptions.SaveOptions();
			}
		}
	}
}
