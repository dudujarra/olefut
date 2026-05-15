using System;
using System.Reflection;
using UnityEngine;
using UnityEngine.Purchasing;

public class StoreItem
{
	public enum StoreItemType
	{
		None,
		External,
		Internal
	}

	public enum Visibility
	{
		Visible,
		Disabled,
		Hidden
	}

	public readonly StoreItemType type;

	private InAppPurchases.ExternalItemConfig externalItemConfig;

	private InAppPurchases.InternalItemPack internalItemPack;

	private Visibility myVisibility;

	private readonly string exceptionText = "StoreItem.cs - {0}: StoreItemType '{1}' return missing.";

	public InAppPurchases.InternalItemPack InternalItemPack => internalItemPack;

	public Visibility MyVisibility
	{
		get
		{
			return myVisibility;
		}
		set
		{
			switch (value)
			{
			case Visibility.Disabled:
				if (myVisibility != Visibility.Hidden)
				{
					myVisibility = Visibility.Disabled;
				}
				break;
			case Visibility.Visible:
			case Visibility.Hidden:
				myVisibility = value;
				break;
			default:
				throw new Exception("StoreItem.Visibility.Set, case not defined for item " + value);
			}
		}
	}

	public StoreItem(InAppPurchases.ExternalItemConfig externalItemConfig)
	{
		type = StoreItemType.External;
		this.externalItemConfig = externalItemConfig;
		myVisibility = Visibility.Visible;
	}

	public StoreItem(InAppPurchases.InternalItemPack internalItemPack)
	{
		type = StoreItemType.Internal;
		this.internalItemPack = internalItemPack;
		myVisibility = Visibility.Visible;
	}

	public string GetSku()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.sku, 
			StoreItemType.Internal => "", 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public ProductType? GetProductType()
	{
		return type switch
		{
			StoreItemType.External => InAppPurchases.instance.GetProductType(externalItemConfig.sku), 
			StoreItemType.Internal => internalItemPack.productType, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public InAppPurchases.GameItemType GetGameItemType()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.gameItemType, 
			StoreItemType.Internal => internalItemPack.gameItemType, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public int GetGameValue()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.gameValue, 
			StoreItemType.Internal => internalItemPack.gameValue, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public string GetGameValueDesc()
	{
		if (GetGameItemType() == InAppPurchases.GameItemType.TeamMoney)
		{
			return Util.MoneyString(GetGameValue());
		}
		return GetGameValue().ToString();
	}

	public bool HasBigDescription()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.HasBigDescription, 
			StoreItemType.Internal => internalItemPack.HasBigDescription, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public InAppPurchases.IAPGroupId GetGroupID()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.GroupID, 
			StoreItemType.Internal => internalItemPack.GroupID, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public long GetCoinPrice()
	{
		return type switch
		{
			StoreItemType.External => 0L, 
			StoreItemType.Internal => internalItemPack.coinPrice, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public string GameValueDesc()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.GameValueDesc(), 
			StoreItemType.Internal => internalItemPack.valueDesc, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public bool IsOwned()
	{
		return type switch
		{
			StoreItemType.External => InAppPurchases.instance.IsOwned(externalItemConfig.sku), 
			StoreItemType.Internal => false, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public Sprite GetIcon()
	{
		return type switch
		{
			StoreItemType.External => InAppPurchases.instance.PackIcon(externalItemConfig.gameItemType), 
			StoreItemType.Internal => InAppPurchases.instance.PackIcon(internalItemPack.gameItemType), 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public int GetIconsNumber()
	{
		return type switch
		{
			StoreItemType.External => externalItemConfig.numberOfIcons, 
			StoreItemType.Internal => internalItemPack.numberOfIcons, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public string GetProductName()
	{
		return type switch
		{
			StoreItemType.External => LanguageController.instance.Get_Translation("STORE_ITEM_DESC_" + GetGameItemType().ToString().ToUpper(), GetGameValueDesc()), 
			StoreItemType.Internal => internalItemPack.title, 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}

	public string GetStoreTitle()
	{
		string productName = GetProductName();
		ProductType? productType = GetProductType();
		return LanguageController.instance.Get_Translation("STORE_ITEM_TITLE_" + productType.ToString().ToUpper(), productName, GetGameValueDesc());
	}

	public string GetProductPrice()
	{
		return type switch
		{
			StoreItemType.External => InAppPurchases.instance.GetProductPrice(externalItemConfig.sku), 
			StoreItemType.Internal => internalItemPack.CoinPriceStr(), 
			_ => throw new Exception(string.Format(exceptionText, MethodBase.GetCurrentMethod().Name, type.ToString())), 
		};
	}
}
