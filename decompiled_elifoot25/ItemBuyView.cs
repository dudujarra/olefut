using System;
using UnityEngine;
using UnityEngine.UI;

public class ItemBuyView : EliView
{
	[Header("View things")]
	public Text coinsAvailable;

	public GameObject itemIconObj;

	public Image itemIconImage;

	public Text itemTitle;

	public Text itemDescription;

	public Text itemPrice;

	public EliLabel itemPriceEliLabel;

	private ItemToBuy itemToBuy;

	private Action onBuyAction;

	private string toastSuccessMessage;

	private Color insufficientCoinsColor = new Color32(byte.MaxValue, 0, 0, byte.MaxValue);

	public void Initialize(ItemToBuy itemToBuy, Action onBuyAction, string toastSuccessMessageTag = "")
	{
		this.itemToBuy = itemToBuy;
		this.onBuyAction = onBuyAction;
		toastSuccessMessage = LanguageController.instance.Get_Translation(toastSuccessMessageTag);
		ResetView();
	}

	public override void ResetView()
	{
		coinsAvailable.text = ElifootOptions.totalCoins.ToString();
		itemIconObj.SetActive(itemToBuy.image != null);
		itemIconImage.sprite = itemToBuy.image;
		itemIconImage.color = itemToBuy.imageColor;
		itemTitle.text = itemToBuy.title;
		itemDescription.text = itemToBuy.Description;
		itemPrice.text = itemToBuy.coinsCost.ToString();
		if (HasEnoughtCoins())
		{
			itemPriceEliLabel.enabled = true;
			itemPriceEliLabel.ReloadElementConfig();
		}
		else
		{
			itemPriceEliLabel.enabled = false;
			itemPrice.color = insufficientCoinsColor;
		}
	}

	private bool HasEnoughtCoins()
	{
		return ElifootOptions.totalCoins >= itemToBuy.coinsCost;
	}

	public void AddCoins()
	{
		ScreenController.instance.ShowStoreViewOneType(null, InAppPurchases.GameItemType.Coins);
	}

	public void BuyButton()
	{
		if (HasEnoughtCoins())
		{
			ElifootOptions.totalCoins -= itemToBuy.coinsCost;
			ElifootOptions.SaveOptions();
			if (!string.IsNullOrEmpty(toastSuccessMessage))
			{
				ScreenController.instance.ShowToastMessage(toastSuccessMessage, 240f, 4f);
			}
			onBuyAction?.Invoke();
			Close();
		}
		else
		{
			ScreenController.instance.ShowDialogPopUp("INSUFFICIENT_COINS_TITLE", "INSUFFICIENT_COINS_DESC", AddCoins, null);
		}
	}

	public override void OnInAppUpdateChanges(string callbackMsg)
	{
		coinsAvailable.text = ElifootOptions.totalCoins.ToString();
	}
}
