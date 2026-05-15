using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Purchasing;
using UnityEngine.UI;

public class StoreView : EliView
{
	[Serializable]
	public class GroupOfStoreItems
	{
		private string title;

		public bool allowGroupBreak;

		[ReadOnly]
		public List<StoreItem> storeItems = new List<StoreItem>();

		public string Title => title;

		public void SetTitle()
		{
			StoreItem firstItem = storeItems[0];
			if (storeItems.FindAll((StoreItem g) => g.GetGameItemType() == firstItem.GetGameItemType()).Count == storeItems.Count)
			{
				title = LanguageController.instance.Get_Translation($"STORE_ITEM_{firstItem.GetGameItemType()}");
				return;
			}
			title = InAppPurchases.instance.groups.Find((InAppPurchases.IAPGroupDef g) => g.groupID == firstItem.GetGroupID()).NameOfGroup;
		}
	}

	[Header("View General")]
	public Text balanceText;

	public RectTransform itemGroupParent;

	public StoreTitlePrefab storeTitlePrefab;

	public StoreItemsRowPrefab storeItemsRowPrefab;

	[Header("Footer")]
	public Text lblSubscription;

	public Button okButton1;

	public Button okButton2;

	public Button restoreButton;

	[Header("Buy Panel")]
	public GameObject buyPanel;

	public Text buyPanelTitle;

	public Text buyPanelDescription;

	public Button buyPanelBuyButton;

	public static StoreView myOwnView;

	public GameObject myBackgroundObj;

	public GameObject myViewObj;

	public readonly int MAX_STORE_ITEMS_PER_ROW = 3;

	private readonly int IAPS_HORIZONTAL_SPACING = 20;

	private Team myTeam;

	private Action onExit;

	private string notInitializeMsg = "#>Store not initialized!";

	private string notEnoughCoinsMsg = "#>You don't have enough coins.";

	private string boughtSuccessMsg = "#>Bought Successfully!";

	private readonly float TIMEOUT_LIMIT = 5f;

	private float timeOutInitialization;

	private bool shallSaveGame;

	private InAppPurchases.GameItemType filterGameItemType;

	private List<StoreItem> allStoreItems;

	[SerializeField]
	[ReadOnly]
	private List<GroupOfStoreItems> groupsOfStoreItems = new List<GroupOfStoreItems>();

	public void Initialize(Team myTeam, Action onExit, InAppPurchases.GameItemType autoSelectGameItemType = InAppPurchases.GameItemType.None, InAppPurchases.GameItemType filterGameItemType = InAppPurchases.GameItemType.None)
	{
		myBackgroundObj.SetActive(value: true);
		myViewObj.SetActive(value: true);
		base.transform.SetAsLastSibling();
		this.onExit = onExit;
		this.myTeam = myTeam;
		this.filterGameItemType = filterGameItemType;
		ConstructIAPGroups();
		ResetView();
		ClearItems();
		StartCoroutine(CheckIAPInitialization(autoSelectGameItemType));
		okButton1.gameObject.SetActive(value: true);
		okButton2.gameObject.SetActive(value: false);
		restoreButton.gameObject.SetActive(value: false);
	}

	private void ConstructIAPGroups()
	{
		InAppPurchases.GameItemType[] toArray = new InAppPurchases.GameItemType[0];
		if (myTeam != null)
		{
			Extensions.AddItemInArray(ref toArray, InAppPurchases.GameItemType.TeamMoney);
		}
		allStoreItems = InAppPurchases.instance.GetAllStoreItems(toArray, myTeam != null, filterGameItemType);
		groupsOfStoreItems.Clear();
		CheckDisabledItems();
		CreateIAPGroups();
		BreakExtensiveGroups();
		DefineAllGroupTitles();
		SortGroupsByBought();
		bool active = allStoreItems.Find((StoreItem iap) => iap.GetProductType() == ProductType.Subscription) != null;
		lblSubscription.gameObject.SetActive(active);
	}

	private void CreateIAPGroups()
	{
		InAppPurchases.IAPGroupId iAPGroupId = InAppPurchases.IAPGroupId.Null;
		GroupOfStoreItems groupOfStoreItems = null;
		foreach (StoreItem storeItem in allStoreItems)
		{
			if (storeItem.MyVisibility == StoreItem.Visibility.Hidden)
			{
				continue;
			}
			if (storeItem.GetGroupID() != iAPGroupId)
			{
				InAppPurchases.IAPGroupDef iAPGroupDef = InAppPurchases.instance.groups.Find((InAppPurchases.IAPGroupDef g) => g.groupID == storeItem.GetGroupID());
				groupOfStoreItems = new GroupOfStoreItems
				{
					allowGroupBreak = iAPGroupDef.allowGroupBreak
				};
				groupsOfStoreItems.Add(groupOfStoreItems);
				iAPGroupId = storeItem.GetGroupID();
			}
			groupOfStoreItems.storeItems.Add(storeItem);
		}
	}

	private void BreakExtensiveGroups()
	{
		for (int i = 0; i < groupsOfStoreItems.Count; i++)
		{
			GroupOfStoreItems groupOfStoreItems = groupsOfStoreItems[i];
			if (!groupOfStoreItems.allowGroupBreak || groupOfStoreItems.storeItems.Count <= MAX_STORE_ITEMS_PER_ROW)
			{
				continue;
			}
			foreach (StoreItem storeItem in groupOfStoreItems.storeItems)
			{
				List<StoreItem> list = groupOfStoreItems.storeItems.FindAll((StoreItem g) => g.GetGameItemType() == storeItem.GetGameItemType());
				if (list.Count != groupOfStoreItems.storeItems.Count && list.Count >= MAX_STORE_ITEMS_PER_ROW)
				{
					groupOfStoreItems = new GroupOfStoreItems
					{
						storeItems = list
					};
					groupsOfStoreItems.Insert(i, groupOfStoreItems);
					groupOfStoreItems = groupsOfStoreItems[i + 1];
					for (int num = list.Count - 1; num >= 0; num--)
					{
						groupOfStoreItems.storeItems.Remove(list[num]);
					}
					break;
				}
			}
		}
	}

	private void DefineAllGroupTitles()
	{
		foreach (GroupOfStoreItems groupsOfStoreItem in groupsOfStoreItems)
		{
			groupsOfStoreItem.SetTitle();
		}
	}

	private void SortGroupsByBought()
	{
		groupsOfStoreItems.Sort(delegate(GroupOfStoreItems g1, GroupOfStoreItems g2)
		{
			List<StoreItem> list = g1.storeItems.FindAll((StoreItem storeItem) => storeItem.IsOwned());
			List<StoreItem> list2 = g2.storeItems.FindAll((StoreItem storeItem) => storeItem.IsOwned());
			bool flag = list.Count == g1.storeItems.Count;
			bool value = list2.Count == g2.storeItems.Count;
			return flag.CompareTo(value);
		});
	}

	private void CheckDisabledItems()
	{
		List<InAppPurchases.GameItemType> list = new List<InAppPurchases.GameItemType>();
		foreach (StoreItem allStoreItem in allStoreItems)
		{
			InAppPurchases.GameItemType gameItemType = allStoreItem.GetGameItemType();
			CheckRestrictedLevelItems(gameItemType);
			if (!list.Contains(gameItemType) && allStoreItem.IsOwned())
			{
				CheckSameTypeItems(gameItemType);
				CheckIncompatibleTypeItems(gameItemType);
				list.Add(gameItemType);
			}
		}
	}

	private void CheckRestrictedLevelItems(InAppPurchases.GameItemType gameItemType)
	{
		PermissionLevel regLevel = Registration.RegLevel;
		foreach (StoreItem item in allStoreItems.FindAll((StoreItem i) => i.GetGameItemType() == gameItemType))
		{
			if (!item.IsOwned() && InAppPurchases.instance.groupsOrder.Find((InAppPurchases.GameItemTypeInfo g) => g.type == gameItemType).restrictRegLevel <= regLevel)
			{
				item.MyVisibility = StoreItem.Visibility.Hidden;
			}
		}
	}

	private void CheckSameTypeItems(InAppPurchases.GameItemType gameItemType)
	{
		foreach (StoreItem item in allStoreItems.FindAll((StoreItem i) => i.GetGameItemType() == gameItemType))
		{
			if (!item.IsOwned())
			{
				item.MyVisibility = InAppPurchases.instance.groupsOrder.Find((InAppPurchases.GameItemTypeInfo g) => g.type == gameItemType).sameTypeVisibility;
			}
		}
	}

	private void CheckIncompatibleTypeItems(InAppPurchases.GameItemType gameItemType)
	{
		List<InAppPurchases.GameItemTypeInfo> allIncompatibleGameItemTypes = InAppPurchases.instance.groupsOrder.FindAll((InAppPurchases.GameItemTypeInfo t) => t.incompatibleGameItemTypes != null && t.incompatibleGameItemTypes.Contains(gameItemType));
		foreach (StoreItem item in allStoreItems.FindAll((StoreItem i) => allIncompatibleGameItemTypes.Any((InAppPurchases.GameItemTypeInfo a) => a.type == i.GetGameItemType())))
		{
			if (!item.IsOwned())
			{
				item.MyVisibility = InAppPurchases.instance.groupsOrder.Find((InAppPurchases.GameItemTypeInfo g) => g.type == gameItemType).incompatibleTypeVisibiliy;
			}
		}
	}

	public override void ResetView()
	{
		base.ResetView();
		balanceText.text = LanguageController.instance.Get_Translation("STORE_COINBALANCE", ElifootOptions.totalCoins.ToString());
		notInitializeMsg = LanguageController.instance.Get_Translation("STORE_NOTINITIALIZED");
		notEnoughCoinsMsg = LanguageController.instance.Get_Translation("STORE_NOTENOUGHCOINS");
		boughtSuccessMsg = LanguageController.instance.Get_Translation("STORE_BOUGHTSUCCESSMSG");
	}

	private void ClearItems()
	{
		for (int i = 0; i < itemGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(itemGroupParent.GetChild(i).gameObject);
		}
	}

	private IEnumerator CheckIAPInitialization(InAppPurchases.GameItemType autoSelectGameItemType = InAppPurchases.GameItemType.None)
	{
		ElifootOptions.showStoreAptoideWarning = false;
		ElifootOptions.SaveOptions();
		ScreenController.instance.ShowLoadingView();
		DateTime startTime = DateTime.Now;
		if (Application.internetReachability == NetworkReachability.NotReachable)
		{
			yield return 0;
		}
		else
		{
			yield return new WaitUntil(() => InAppPurchases.instance.IsInitialized() || InAppPurchases.instance.initializeFailed || DateTime.Now > startTime.AddSeconds(5.0));
		}
		ScreenController.instance.HideLoadingView();
		if (itemGroupParent.childCount != 0)
		{
			RedrawStoreItems();
		}
		else
		{
			FillStoreItems();
		}
		if (autoSelectGameItemType != InAppPurchases.GameItemType.None)
		{
			AutoBuyIAP(autoSelectGameItemType);
		}
	}

	private bool StoreResponse()
	{
		if (InAppPurchases.instance.IsInitialized() || InAppPurchases.instance.initializeFailed)
		{
			return true;
		}
		timeOutInitialization += Time.deltaTime;
		if (timeOutInitialization >= TIMEOUT_LIMIT)
		{
			return true;
		}
		return false;
	}

	private void AutoBuyIAP(InAppPurchases.GameItemType autoSelectGameItemType)
	{
		if (!InAppPurchases.instance.IsInitialized())
		{
			return;
		}
		InAppPurchases.ExternalItemConfig[] array = InAppPurchases.EXTERNAL_ITEMS();
		foreach (InAppPurchases.ExternalItemConfig externalItemConfig in array)
		{
			if (!InAppPurchases.instance.IsOwned(externalItemConfig.sku) & (externalItemConfig.gameItemType == autoSelectGameItemType))
			{
				CheckExternalItemPack(externalItemConfig.sku);
				break;
			}
		}
	}

	private void FillStoreItems()
	{
		ClearItems();
		if (!InAppPurchases.instance.IsInitialized())
		{
			return;
		}
		float prefabSize = (itemGroupParent.rect.width - (float)(IAPS_HORIZONTAL_SPACING * (MAX_STORE_ITEMS_PER_ROW + 1))) / (float)MAX_STORE_ITEMS_PER_ROW;
		foreach (GroupOfStoreItems groupsOfStoreItem in groupsOfStoreItems)
		{
			UnityEngine.Object.Instantiate(storeTitlePrefab, itemGroupParent).Initialize(groupsOfStoreItem.Title);
			int num = Mathf.CeilToInt((float)groupsOfStoreItem.storeItems.Count / (float)MAX_STORE_ITEMS_PER_ROW);
			for (int i = 0; i < num; i++)
			{
				int numberOfPrefabs = Mathf.Min(MAX_STORE_ITEMS_PER_ROW, groupsOfStoreItem.storeItems.Count - i * MAX_STORE_ITEMS_PER_ROW);
				StoreItemsRowPrefab storeItemsRowPrefab = UnityEngine.Object.Instantiate(this.storeItemsRowPrefab, itemGroupParent);
				storeItemsRowPrefab.Initialize(numberOfPrefabs, prefabSize);
				for (int j = 0; j < storeItemsRowPrefab.itemsList.Count; j++)
				{
					StoreItem item = groupsOfStoreItem.storeItems[i * MAX_STORE_ITEMS_PER_ROW + j];
					switch (item.type)
					{
					case StoreItem.StoreItemType.External:
						storeItemsRowPrefab.itemsList[j].Initialize(item, delegate
						{
							CheckExternalItemPack(item.GetSku());
						});
						break;
					case StoreItem.StoreItemType.Internal:
						storeItemsRowPrefab.itemsList[j].Initialize(item, delegate
						{
							CheckInternalItemPack(item.InternalItemPack);
						});
						break;
					default:
						throw new Exception("rowPrefab couldn't be Initialized");
					}
				}
			}
		}
	}

	private void RedrawStoreItems()
	{
		InAppPurchases.GameItemType[] toArray = null;
		if (myTeam != null)
		{
			Extensions.AddItemInArray(ref toArray, InAppPurchases.GameItemType.TeamMoney);
		}
		if (!InAppPurchases.instance.IsInitialized())
		{
			return;
		}
		if (InAppPurchases.instance.GetAllStoreItems(toArray, myTeam != null).Count == allStoreItems.Count)
		{
			CheckDisabledItems();
			for (int i = 0; i < itemGroupParent.childCount; i++)
			{
				StoreItemsRowPrefab component = itemGroupParent.GetChild(i).GetComponent<StoreItemsRowPrefab>();
				if (component != null)
				{
					component.RedrawAllPrefabs();
				}
			}
		}
		else
		{
			ConstructIAPGroups();
			FillStoreItems();
		}
	}

	private void CheckExternalItemPack(string product_id)
	{
		InAppPurchases.ExternalItemConfig externalItemConfig = InAppPurchases.instance.GetExternalItemConfig(product_id);
		string productName = InAppPurchases.instance.GetProductName(product_id);
		string text = "INAPP_BIG_DESCRIPTION_TEMPLATE_" + externalItemConfig.ProductType.ToString().ToUpper();
		if (externalItemConfig.HasBigDescription)
		{
			string text2 = "INAPP_BIG_DESCRIPTION_" + externalItemConfig.gameItemType.ToString().ToUpper();
			string productPrice = InAppPurchases.instance.GetProductPrice(product_id);
			string text3 = externalItemConfig.gameValue.ToString();
			string text4 = LanguageController.instance.Get_Translation(text2);
			string description = LanguageController.instance.Get_Translation(text, text4, productPrice, text3);
			ScreenController.instance.ShowScrollableTextView(productName, description, delegate
			{
				BuyExternalItemPack(product_id);
			}, null);
		}
		else
		{
			buyPanel.SetActive(value: true);
			buyPanelTitle.text = productName;
			buyPanelDescription.text = InAppPurchases.instance.GetProductDescription(product_id);
			buyPanelBuyButton.onClick.RemoveAllListeners();
			buyPanelBuyButton.onClick.AddListener(delegate
			{
				BuyExternalItemPack(product_id);
			});
		}
	}

	private void CheckInternalItemPack(InAppPurchases.InternalItemPack pack)
	{
		if (ElifootOptions.totalCoins < pack.coinPrice)
		{
			ScreenController.instance.ShowInfoPopUp(notEnoughCoinsMsg, null);
		}
		else if (pack.HasBigDescription)
		{
			string text = "INAPP_BIG_DESCRIPTION_" + pack.productType.ToString().ToUpper() + "_" + pack.gameItemType.ToString().ToUpper();
			string text2 = LanguageController.instance.Get_Translation("INTERNAL_ITEM_COINSPRICE", pack.coinPrice);
			string text3 = pack.gameValue.ToString();
			string text4 = LanguageController.instance.Get_Translation(text, text2, text3);
			string text5 = "INAPP_BIG_DESCRIPTION_TEMPLATE_" + pack.productType.ToString().ToUpper();
			string description = LanguageController.instance.Get_Translation(text5, text4, text2, text3);
			ScreenController.instance.ShowScrollableTextView(pack.title, description, delegate
			{
				BuyInternalItemPack(pack);
			}, null);
		}
		else
		{
			buyPanel.SetActive(value: true);
			buyPanelTitle.text = pack.title;
			buyPanelDescription.text = pack.description;
			buyPanelBuyButton.onClick.RemoveAllListeners();
			buyPanelBuyButton.onClick.AddListener(delegate
			{
				BuyInternalItemPack(pack);
			});
		}
	}

	private void BuyExternalItemPack(string product_id)
	{
		InAppPurchases.instance.BuyProductID(product_id);
	}

	private void BuyInternalItemPack(InAppPurchases.InternalItemPack pack)
	{
		ElifootOptions.totalCoins -= pack.coinPrice;
		ProcessPurchase(pack.productType, pack.gameItemType, pack.sku, pack.gameValue, showConfirmation: true);
	}

	private void AddTeamMoney(long amount)
	{
		myTeam.MoneyTransaction(amount, TransactionType.Other, false, "STORE_MONEYBOUGHTTRANSACTION");
	}

	private void AfterPurchase(InAppPurchases.GameItemType gameItemType)
	{
		if (InAppPurchases.instance.groupsOrder.Find((InAppPurchases.GameItemTypeInfo g) => g.type == gameItemType).isTeamItem)
		{
			shallSaveGame = true;
		}
	}

	private void OnEnable()
	{
		InAppPurchases instance = InAppPurchases.instance;
		instance.purchase_success = (Action<string>)Delegate.Combine(instance.purchase_success, new Action<string>(OnPurchaseSuccess));
		InAppPurchases instance2 = InAppPurchases.instance;
		instance2.purchase_fail = (Action<string>)Delegate.Combine(instance2.purchase_fail, new Action<string>(OnPurchaseFail));
		InAppPurchases instance3 = InAppPurchases.instance;
		instance3.restore_success = (Action)Delegate.Combine(instance3.restore_success, new Action(OnTransactionRestoreSuccess));
		InAppPurchases instance4 = InAppPurchases.instance;
		instance4.restore_fail = (Action)Delegate.Combine(instance4.restore_fail, new Action(OnTransactionRestoreFail));
	}

	private void OnDisable()
	{
		StopAllCoroutines();
		InAppPurchases instance = InAppPurchases.instance;
		instance.purchase_success = (Action<string>)Delegate.Remove(instance.purchase_success, new Action<string>(OnPurchaseSuccess));
		InAppPurchases instance2 = InAppPurchases.instance;
		instance2.purchase_fail = (Action<string>)Delegate.Remove(instance2.purchase_fail, new Action<string>(OnPurchaseFail));
		InAppPurchases instance3 = InAppPurchases.instance;
		instance3.restore_success = (Action)Delegate.Remove(instance3.restore_success, new Action(OnTransactionRestoreSuccess));
		InAppPurchases instance4 = InAppPurchases.instance;
		instance4.restore_fail = (Action)Delegate.Remove(instance4.restore_fail, new Action(OnTransactionRestoreFail));
	}

	private void OnPurchaseSuccess(string product_id)
	{
		ScreenController.instance.HideLoadingView();
		ProcessPurchase(InAppPurchases.instance.GetProductType(product_id), InAppPurchases.instance.GetGameItemType(product_id), product_id, InAppPurchases.instance.GetProductGameValue(product_id), !InAppPurchases.isRestoringPurchases);
		ElifootOptions.inApps.PurchaseSuccess();
		StartCoroutine(CheckIAPInitialization());
	}

	private void ProcessPurchase(ProductType? myProductType, InAppPurchases.GameItemType myGameItemType, string myProductId, long myGameValue, bool showConfirmation)
	{
		buyPanel.SetActive(value: false);
		switch (myProductType)
		{
		case ProductType.NonConsumable:
		case ProductType.Subscription:
			if (!ElifootOptions.inApps.HasAvailableInApp(myProductId))
			{
				ElifootOptions.inApps.Add(myProductId);
			}
			break;
		case ProductType.Consumable:
			switch (myGameItemType)
			{
			case InAppPurchases.GameItemType.Coins:
				ElifootOptions.totalCoins += (int)myGameValue;
				break;
			case InAppPurchases.GameItemType.TeamMoney:
				AddTeamMoney(myGameValue);
				break;
			default:
				throw new Exception("StoreView.ProcessPurchase(), consumable item unkown.");
			}
			break;
		}
		if (showConfirmation)
		{
			ScreenController.instance.ShowInfoPopUp(boughtSuccessMsg, null);
		}
		balanceText.text = string.Format(LanguageController.instance.Get_Translation("STORE_COINBALANCE"), ElifootOptions.totalCoins.ToString());
		ElifootOptions.SaveOptions();
		if (InAppPurchases.instance.groupsOrder.Find((InAppPurchases.GameItemTypeInfo g) => g.type == myGameItemType).isTeamItem)
		{
			shallSaveGame = true;
		}
		InAppPurchases.instance.update_changes?.Invoke(null);
	}

	private void OnPurchaseFail(string product_id)
	{
		ScreenController.instance.HideLoadingView();
	}

	private void OnTransactionRestoreSuccess()
	{
		ScreenController.instance.HideLoadingView();
		InAppPurchases.isRestoringPurchases = false;
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("STORE_RESTORETITLE"), LanguageController.instance.Get_Translation("STORE_RESTORESUCCESS"), null);
		StartCoroutine(CheckIAPInitialization());
		StartCoroutine(SaveGame());
	}

	private void OnTransactionRestoreFail()
	{
		ScreenController.instance.HideLoadingView();
		InAppPurchases.isRestoringPurchases = false;
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("STORE_RESTORETITLE"), LanguageController.instance.Get_Translation("STORE_RESTOREFAIL"), null);
		StartCoroutine(CheckIAPInitialization());
	}

	private IEnumerator SaveGame(Action afterSave = null)
	{
		if (myTeam != null)
		{
			ScreenController.instance.ShowLoadingView(LanguageController.instance.Get_Translation("GAME_AUTO_SAVING"));
			yield return new WaitForEndOfFrame();
			yield return new WaitForEndOfFrame();
			DataManager.instance.SaveGame(isAutoSave: true, forcedSave: false);
			ScreenController.instance.HideLoadingView();
		}
		afterSave?.Invoke();
	}

	public void OKPressed()
	{
		onExit?.Invoke();
		if (shallSaveGame)
		{
			StartCoroutine(SaveGame(Close));
		}
		else
		{
			Close();
		}
	}

	public override void Close()
	{
		myBackgroundObj.SetActive(value: false);
		myViewObj.SetActive(value: false);
	}

	public void ReloadPressed()
	{
		ScreenController.instance.ShowDialogPopUp(LanguageController.instance.Get_Translation("STORE_RESTORETITLE"), LanguageController.instance.Get_Translation("STORE_RESTORECONFIRM"), OnRestoreConfirm, null);
	}

	private void OnRestoreConfirm()
	{
		ScreenController.instance.ShowLoadingView();
		InAppPurchases.instance.RestorePurchases();
	}

	public void BackBuyButton()
	{
		buyPanel.SetActive(value: false);
	}
}
