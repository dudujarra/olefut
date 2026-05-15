using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Purchasing;

public class InAppPurchases : MonoBehaviour, IStoreListener
{
	public enum GameItemType
	{
		None,
		TeamMoney,
		Coins,
		Union,
		Premium,
		Sponsorship,
		Vip
	}

	public enum IAPGroupId
	{
		Null,
		TeamMoney,
		Coins,
		PowerUps
	}

	[Serializable]
	public struct IAPGroupDef
	{
		public IAPGroupId groupID;

		public string label;

		public bool allowGroupBreak;

		private string nameOfGroup;

		public string NameOfGroup
		{
			get
			{
				if (string.IsNullOrEmpty(nameOfGroup))
				{
					nameOfGroup = LanguageController.instance.Get_Translation(label);
				}
				return nameOfGroup;
			}
		}
	}

	[Serializable]
	public struct GameItemTypeInfo(GameItemType type, IAPGroupId groupID, bool isTeamItem, bool hasBigDescription, StoreItem.Visibility sameTypeVisibiliy, StoreItem.Visibility incompatibleTypeVisibiliy, List<GameItemType> incompatibleGameItemTypes, PermissionLevel restrictRegLevel = PermissionLevel.LZ_Infinite)
	{
		public GameItemType type = type;

		public IAPGroupId groupID = groupID;

		public bool isTeamItem = isTeamItem;

		public bool hasBigDescription = hasBigDescription;

		public StoreItem.Visibility sameTypeVisibility = sameTypeVisibiliy;

		public StoreItem.Visibility incompatibleTypeVisibiliy = incompatibleTypeVisibiliy;

		public List<GameItemType> incompatibleGameItemTypes = incompatibleGameItemTypes;

		public PermissionLevel restrictRegLevel = restrictRegLevel;
	}

	[Serializable]
	public class ExternalItemConfig
	{
		public string sku;

		public ProductType ProductType;

		public GameItemType gameItemType;

		public int gameValue;

		public Action<bool> OnValueChange;

		public int numberOfIcons;

		private IAPGroupId groupID;

		public IAPGroupId GroupID
		{
			get
			{
				if (groupID == IAPGroupId.Null)
				{
					groupID = instance.groupsOrder.Find((GameItemTypeInfo g) => g.type == gameItemType).groupID;
				}
				return groupID;
			}
		}

		public bool HasBigDescription
		{
			get
			{
				bool flag = false;
				try
				{
					return instance.groupsOrder.Find((GameItemTypeInfo g) => g.type == gameItemType).hasBigDescription;
				}
				catch
				{
					return false;
				}
			}
		}

		public ExternalItemConfig(string sku, ProductType ProductType, GameItemType gameItemType, int gameValue, bool hasBigDescription, int numberOfIcons, Action<bool> OnValueChange = null)
		{
			this.sku = sku;
			this.ProductType = ProductType;
			this.gameItemType = gameItemType;
			this.gameValue = gameValue;
			this.numberOfIcons = numberOfIcons;
			this.OnValueChange = OnValueChange;
		}

		public Sprite Icon()
		{
			return instance.PackIcon(gameItemType);
		}

		public string GameValueDesc()
		{
			string text = null;
			if (gameItemType == GameItemType.TeamMoney)
			{
				return Util.MoneyString(gameValue);
			}
			return gameValue.ToString();
		}
	}

	public class InternalItemConfig
	{
		public string sku;

		public ProductType productType;

		public GameItemType gameItemType;

		public int coinPrice;

		public int gameValue;

		public int numberOfIcons;

		public InternalItemConfig(string sku, ProductType productType, GameItemType gameItemType, int coinPrice, int gameValue, int numberOfIcons)
		{
			this.sku = sku;
			this.productType = productType;
			this.gameItemType = gameItemType;
			this.coinPrice = coinPrice;
			this.gameValue = gameValue;
			this.numberOfIcons = numberOfIcons;
		}

		public string GameValueDesc()
		{
			string text = null;
			if (gameItemType == GameItemType.TeamMoney)
			{
				return Util.MoneyString(gameValue);
			}
			return gameValue.ToString();
		}

		public string Title()
		{
			return LanguageController.instance.Get_Translation($"INTERNAL_ITEM_{gameItemType.ToString().ToUpper()}_TITLE", GameValueDesc());
		}

		public string Description()
		{
			return LanguageController.instance.Get_Translation($"INTERNAL_ITEM_{gameItemType.ToString().ToUpper()}_DESCRIPTION", GameValueDesc());
		}

		public Sprite Icon()
		{
			return instance.PackIcon(gameItemType);
		}
	}

	public class InternalItemPack
	{
		public string title;

		public string description;

		public int coinPrice;

		public string valueDesc;

		public string sku;

		public ProductType productType;

		public GameItemType gameItemType;

		public int gameValue;

		public int numberOfIcons;

		private IAPGroupId groupID;

		public IAPGroupId GroupID
		{
			get
			{
				if (groupID == IAPGroupId.Null)
				{
					groupID = instance.groupsOrder.Find((GameItemTypeInfo g) => g.type == gameItemType).groupID;
				}
				return groupID;
			}
		}

		public bool HasBigDescription
		{
			get
			{
				bool flag = false;
				try
				{
					return instance.groupsOrder.Find((GameItemTypeInfo g) => g.type == gameItemType).hasBigDescription;
				}
				catch
				{
					return false;
				}
			}
		}

		public InternalItemPack(InternalItemConfig itemConfig)
		{
			title = itemConfig.Title();
			description = itemConfig.Description();
			coinPrice = itemConfig.coinPrice;
			sku = itemConfig.sku;
			productType = itemConfig.productType;
			gameItemType = itemConfig.gameItemType;
			gameValue = itemConfig.gameValue;
			numberOfIcons = itemConfig.numberOfIcons;
			valueDesc = itemConfig.GameValueDesc();
		}

		public string CoinPriceStr()
		{
			return LanguageController.instance.Get_Translation("INTERNAL_ITEM_COINSPRICE", coinPrice);
		}

		public Sprite Icon()
		{
			return instance.PackIcon(gameItemType);
		}
	}

	public enum labelType
	{
		Title,
		Description
	}

	[Header("IAP Icons")]
	public Sprite iapIconMoney;

	public Sprite iapIconCoins;

	public Sprite iapIconUnion;

	public Sprite iapIconPremium;

	public Sprite iapIconSponsorship;

	public Sprite iapIconVIP;

	public readonly List<IAPGroupDef> groups = new List<IAPGroupDef>
	{
		new IAPGroupDef
		{
			groupID = IAPGroupId.TeamMoney,
			label = "INAPP_GROUP_TEAM_MONEY",
			allowGroupBreak = true
		},
		new IAPGroupDef
		{
			groupID = IAPGroupId.Coins,
			label = "INAPP_GROUP_COINS",
			allowGroupBreak = true
		},
		new IAPGroupDef
		{
			groupID = IAPGroupId.PowerUps,
			label = "INAPP_GROUP_POWER-UPS",
			allowGroupBreak = true
		}
	};

	public readonly List<GameItemTypeInfo> groupsOrder = new List<GameItemTypeInfo>
	{
		new GameItemTypeInfo(GameItemType.Premium, IAPGroupId.PowerUps, isTeamItem: false, hasBigDescription: true, StoreItem.Visibility.Hidden, StoreItem.Visibility.Hidden, null, PermissionLevel.L6_Premium),
		new GameItemTypeInfo(GameItemType.Vip, IAPGroupId.PowerUps, isTeamItem: false, hasBigDescription: true, StoreItem.Visibility.Hidden, StoreItem.Visibility.Hidden, new List<GameItemType> { GameItemType.Premium }, PermissionLevel.L3_VIP),
		new GameItemTypeInfo(GameItemType.Sponsorship, IAPGroupId.PowerUps, isTeamItem: false, hasBigDescription: true, StoreItem.Visibility.Hidden, StoreItem.Visibility.Hidden, null),
		new GameItemTypeInfo(GameItemType.Union, IAPGroupId.PowerUps, isTeamItem: false, hasBigDescription: true, StoreItem.Visibility.Hidden, StoreItem.Visibility.Hidden, null),
		new GameItemTypeInfo(GameItemType.Coins, IAPGroupId.Coins, isTeamItem: false, hasBigDescription: false, StoreItem.Visibility.Visible, StoreItem.Visibility.Hidden, null),
		new GameItemTypeInfo(GameItemType.TeamMoney, IAPGroupId.TeamMoney, isTeamItem: true, hasBigDescription: false, StoreItem.Visibility.Visible, StoreItem.Visibility.Hidden, null)
	};

	public static readonly ExternalItemConfig[] EXTERNAL_ITEMS_PROD = new ExternalItemConfig[0];

	public static readonly ExternalItemConfig[] EXTERNAL_ITEMS_DEV = new ExternalItemConfig[0];

	public static readonly bool hasExternalInAppStore = false;

	public static readonly InternalItemConfig[] INTERNAL_ITEMS = new InternalItemConfig[4]
	{
		new InternalItemConfig("internal.money.10", ProductType.Consumable, GameItemType.TeamMoney, 40, 10000000, 3),
		new InternalItemConfig("internal.money.30", ProductType.Consumable, GameItemType.TeamMoney, 60, 20000000, 4),
		new InternalItemConfig("internal.money.50", ProductType.Consumable, GameItemType.TeamMoney, 75, 30000000, 5),
		new InternalItemConfig("internal.money.100", ProductType.Consumable, GameItemType.TeamMoney, 100, 60000000, 5)
	};

	public const bool hasRestorePurchases = false;

	public Action<string> purchase_success;

	public Action<string> purchase_fail;

	public Action restore_success;

	public Action restore_fail;

	public Action<string> update_changes;

	[HideInInspector]
	public string DebugText;

	public static bool isRestoringPurchases;

	public static InAppPurchases instance;

	[HideInInspector]
	public bool initializeFailed;

	private static IStoreController m_StoreController;

	private static IExtensionProvider m_StoreExtensionProvider;

	private static Dictionary<string, Tuple<string, string>> itemLabels = new Dictionary<string, Tuple<string, string>>
	{
		{
			"coins",
			new Tuple<string, string>("SKU_COINS_TITLE", "SKU_COINS_DESCRIPTION")
		},
		{
			"union",
			new Tuple<string, string>("SKU_UNION_TITLE", "SKU_UNION_DESCRIPTION")
		},
		{
			"premium",
			new Tuple<string, string>("SKU_PREMIUM_TITLE", "SKU_PREMIUM_DESCRIPTION")
		},
		{
			"sponsorship",
			new Tuple<string, string>("SKU_SPONSORSHIP_TITLE", "SKU_SPONSORSHIP_DESCRIPTION")
		},
		{
			"VIP",
			new Tuple<string, string>("SKU_VIP_TITLE", "SKU_VIP_DESCRIPTION")
		}
	};

	public Sprite PackIcon(GameItemType gameItemType)
	{
		return gameItemType switch
		{
			GameItemType.Coins => iapIconCoins, 
			GameItemType.TeamMoney => iapIconMoney, 
			GameItemType.Union => iapIconUnion, 
			GameItemType.Premium => iapIconPremium, 
			GameItemType.Sponsorship => iapIconSponsorship, 
			GameItemType.Vip => iapIconVIP, 
			_ => null, 
		};
	}

	public static ExternalItemConfig[] EXTERNAL_ITEMS()
	{
		return EXTERNAL_ITEMS_PROD;
	}

	private InternalItemPack[] INTERNAL_ITEM_PACKS()
	{
		InternalItemConfig[] iNTERNAL_ITEMS = INTERNAL_ITEMS;
		InternalItemPack[] array = new InternalItemPack[iNTERNAL_ITEMS.Length];
		for (int i = 0; i < iNTERNAL_ITEMS.Length; i++)
		{
			array[i] = new InternalItemPack(iNTERNAL_ITEMS[i]);
		}
		return array;
	}

	public void InitializePurchasing()
	{
		try
		{
			if (!IsInitialized())
			{
				ConfigurationBuilder configurationBuilder = ConfigurationBuilder.Instance(StandardPurchasingModule.Instance());
				ExternalItemConfig[] array = EXTERNAL_ITEMS();
				for (int i = 0; i < array.Length; i++)
				{
					configurationBuilder.AddProduct(array[i].sku, array[i].ProductType);
				}
				UnityPurchasing.Initialize(this, configurationBuilder);
			}
		}
		catch (Exception ex)
		{
			Debug.Log("Error in InAppPurchases.InitializePurchasing().\n" + ex.ToString());
		}
	}

	private void Awake()
	{
		if (instance == null)
		{
			instance = this;
			UnityEngine.Object.DontDestroyOnLoad(base.gameObject);
		}
		else
		{
			UnityEngine.Object.Destroy(base.gameObject);
		}
	}

	private void Start()
	{
		if (m_StoreController == null)
		{
			InitializePurchasing();
		}
	}

	public void OnInitialized(IStoreController controller, IExtensionProvider extensions)
	{
		DebugText = "OnInitialized: PASS";
		m_StoreController = controller;
		m_StoreExtensionProvider = extensions;
		ExternalItemConfig[] array = EXTERNAL_ITEMS();
		for (int i = 0; i < array.Length; i++)
		{
		}
	}

	public bool IsInitialized()
	{
		if (m_StoreController != null)
		{
			return m_StoreExtensionProvider != null;
		}
		return false;
	}

	public bool IsItemInitialized(string productId)
	{
		if (m_StoreController != null)
		{
			return m_StoreController.products.WithID(productId) != null;
		}
		return false;
	}

	public void OnInitializeFailed(InitializationFailureReason error)
	{
		initializeFailed = true;
		DebugText = "OnInitializeFailed InitializationFailureReason:" + error;
	}

	public void OnInitializeFailed(InitializationFailureReason error, string message)
	{
		initializeFailed = true;
		DebugText = $"OnInitializeFailed InitializationFailureReason: {error}\n{message}";
	}

	public List<StoreItem> GetAllStoreItems(GameItemType[] priorityTypes, bool includeTeamItems = false, GameItemType showTypeOnly = GameItemType.None)
	{
		ExternalItemConfig[] array = EXTERNAL_ITEMS();
		InternalItemPack[] array2 = INTERNAL_ITEM_PACKS();
		List<StoreItem> list = new List<StoreItem>();
		if (priorityTypes == null)
		{
			priorityTypes = new GameItemType[0];
		}
		for (int i = 1; i <= 2; i++)
		{
			ExternalItemConfig[] array3 = array;
			foreach (ExternalItemConfig externalItem in array3)
			{
				if (((i == 1 && priorityTypes.Contains(externalItem.gameItemType)) ^ (i == 2 && !priorityTypes.Contains(externalItem.gameItemType))) && IsItemBuyable(externalItem.sku) && (showTypeOnly == GameItemType.None || externalItem.gameItemType == showTypeOnly))
				{
					GameItemTypeInfo gameItemTypeInfo = groupsOrder.Find((GameItemTypeInfo g) => g.type == externalItem.gameItemType);
					if (includeTeamItems || !gameItemTypeInfo.isTeamItem)
					{
						list.Add(new StoreItem(externalItem));
					}
				}
			}
			InternalItemPack[] array4 = array2;
			foreach (InternalItemPack internalItem in array4)
			{
				if (((i == 1 && priorityTypes.Contains(internalItem.gameItemType)) ^ (i == 2 && !priorityTypes.Contains(internalItem.gameItemType))) && (showTypeOnly == GameItemType.None || internalItem.gameItemType == showTypeOnly))
				{
					GameItemTypeInfo gameItemTypeInfo2 = groupsOrder.Find((GameItemTypeInfo g) => g.type == internalItem.gameItemType);
					if (includeTeamItems || !gameItemTypeInfo2.isTeamItem)
					{
						list.Add(new StoreItem(internalItem));
					}
				}
			}
		}
		list.Sort(delegate(StoreItem storeItem, StoreItem storeItem2)
		{
			int num = groupsOrder.Find((GameItemTypeInfo g) => g.type == storeItem.GetGameItemType()).groupID.CompareTo(groupsOrder.Find((GameItemTypeInfo g) => g.type == storeItem2.GetGameItemType()).groupID);
			return (num != 0) ? num : groupsOrder.FindIndex((GameItemTypeInfo g) => g.type == storeItem.GetGameItemType()).CompareTo(groupsOrder.FindIndex((GameItemTypeInfo g) => g.type == storeItem2.GetGameItemType()));
		});
		return list;
	}

	public bool IsItemBuyable(string productId)
	{
		if (IsAvailable(productId) && GetProductName(productId) != "" && GetProductPrice(productId) != "")
		{
			return true;
		}
		return false;
	}

	public string GetProductPrice(string productId)
	{
		if (!IsItemInitialized(productId))
		{
			return "";
		}
		string localizedPriceString = m_StoreController.products.WithID(productId).metadata.localizedPriceString;
		if (localizedPriceString == "$0.01")
		{
			return "";
		}
		return localizedPriceString;
	}

	public string GetProductName(string productId)
	{
		if (!IsItemInitialized(productId))
		{
			return "";
		}
		string text = m_StoreController.products.WithID(productId).metadata.localizedTitle;
		if (string.IsNullOrEmpty(text))
		{
			return "";
		}
		if (text.StartsWith("/*", StringComparison.Ordinal))
		{
			return "";
		}
		if (string.IsNullOrEmpty(text))
		{
			text = GetItemLabelFromSku(productId, labelType.Title);
		}
		return RemoveParentheses(text);
	}

	public string RemoveParentheses(string title)
	{
		if (title.Contains("(Elifoot"))
		{
			title = title[..title.IndexOf('(')];
		}
		return title;
	}

	public string GetProductDescription(string productId)
	{
		if (!IsItemInitialized(productId))
		{
			return "";
		}
		string text = m_StoreController.products.WithID(productId).metadata.localizedDescription;
		if (string.IsNullOrEmpty(text))
		{
			text = GetItemLabelFromSku(productId, labelType.Description);
		}
		return text;
	}

	public ProductType? GetProductType(string productId)
	{
		if (!IsItemInitialized(productId))
		{
			return null;
		}
		return m_StoreController.products.WithID(productId).definition.type;
	}

	public GameItemType GetGameItemType(string productId)
	{
		ExternalItemConfig[] array = EXTERNAL_ITEMS();
		for (int i = 0; i < array.Length; i++)
		{
			if (productId == array[i].sku)
			{
				return array[i].gameItemType;
			}
		}
		return GameItemType.None;
	}

	public ExternalItemConfig GetExternalItemConfig(string productId)
	{
		ExternalItemConfig[] array = EXTERNAL_ITEMS();
		for (int i = 0; i < array.Length; i++)
		{
			if (productId == array[i].sku)
			{
				return array[i];
			}
		}
		return null;
	}

	public int GetProductGameValue(string productId)
	{
		ExternalItemConfig[] array = EXTERNAL_ITEMS();
		for (int i = 0; i < array.Length; i++)
		{
			if (productId == array[i].sku)
			{
				return array[i].gameValue;
			}
		}
		return 0;
	}

	public bool IsAvailable(string productId)
	{
		if (string.IsNullOrEmpty(GetProductPrice(productId)))
		{
			return false;
		}
		if (string.IsNullOrEmpty(GetProductName(productId)))
		{
			return false;
		}
		return m_StoreController.products.WithID(productId).availableToPurchase;
	}

	public bool IsOwned(string productId)
	{
		if (!IsItemInitialized(productId))
		{
			return false;
		}
		if (m_StoreController.products.WithID(productId).hasReceipt)
		{
			return GetProductType(productId) != ProductType.Consumable;
		}
		return false;
	}

	public bool HasAvailableExternalItem(GameItemType gameItemType)
	{
		if (m_StoreController == null)
		{
			return false;
		}
		ExternalItemConfig[] array = EXTERNAL_ITEMS();
		for (int i = 0; i < array.Length; i++)
		{
			if (IsItemBuyable(array[i].sku) & (gameItemType == array[i].gameItemType) & IsItemInitialized(array[i].sku) & !m_StoreController.products.WithID(array[i].sku).hasReceipt & IsTypeCompatible(gameItemType))
			{
				return true;
			}
		}
		return false;
	}

	private bool IsTypeCompatible(GameItemType gameItemType)
	{
		GameItemTypeInfo gameItemTypeInfo = groupsOrder.Find((GameItemTypeInfo g) => g.type == gameItemType);
		if (gameItemTypeInfo.incompatibleGameItemTypes == null)
		{
			return true;
		}
		foreach (StoreItem allStoreItem in GetAllStoreItems(null))
		{
			if (gameItemTypeInfo.incompatibleGameItemTypes.Contains(allStoreItem.GetGameItemType()) && allStoreItem.IsOwned())
			{
				return false;
			}
		}
		return true;
	}

	public void BuyProductID(string productId)
	{
		if (!IsInitialized() || !IsItemInitialized(productId))
		{
			purchase_fail?.Invoke(productId);
			DebugText += "\nBuyProductID FAIL. Not initialized.";
			return;
		}
		Product product = m_StoreController.products.WithID(productId);
		if (product != null && product.availableToPurchase)
		{
			m_StoreController.InitiatePurchase(product);
			return;
		}
		purchase_fail?.Invoke(productId);
		DebugText += "\nBuyProductID: FAIL. Not purchasing product, either is not found or is not available for purchase";
	}

	public PurchaseProcessingResult ProcessPurchase(PurchaseEventArgs args)
	{
		DebugText += "\nProcessPurchase";
		purchase_success?.Invoke(args.purchasedProduct.definition.storeSpecificId);
		return PurchaseProcessingResult.Complete;
	}

	public void OnPurchaseFailed(Product product, PurchaseFailureReason failureReason)
	{
		purchase_fail?.Invoke(product.definition.storeSpecificId);
		DebugText = DebugText + "\n" + $"OnPurchaseFailed: FAIL. Product: '{product.definition.storeSpecificId}', PurchaseFailureReason: {failureReason}";
	}

	public void RestorePurchases()
	{
		if (!IsInitialized())
		{
			restore_fail?.Invoke();
			DebugText += "\nRestorePurchases FAIL. Not initialized.";
		}
		else
		{
			DebugText += "\nNo such thing as Restore Puchases not available for current platform.";
		}
	}

	public static string GetItemLabelFromSku(string sku, labelType labelType)
	{
		string result = sku;
		string text = sku.Split('.')[^1];
		foreach (KeyValuePair<string, Tuple<string, string>> itemLabel in itemLabels)
		{
			if (text.StartsWith(itemLabel.Key))
			{
				string text2 = sku;
				switch (labelType)
				{
				case labelType.Title:
					text2 = itemLabel.Value.first;
					break;
				case labelType.Description:
					text2 = itemLabel.Value.second;
					break;
				}
				result = LanguageController.instance.Get_Translation(text2, text.Remove(0, itemLabel.Key.Length));
			}
		}
		return result;
	}
}
