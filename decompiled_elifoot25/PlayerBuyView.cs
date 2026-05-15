using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class PlayerBuyView : EliView
{
	[Header("Search Panel")]
	public GameObject searchPanelObj;

	public GameObject optionsGroup;

	public InputField playerNameInputField;

	public Slider minSkillSlider;

	public Text minSkillValue;

	public Slider maxSkillSlider;

	public Text maxSkillValue;

	public Text txtPositionValue;

	public Text txtPositionDesc;

	public Text txtBehaviourValue;

	public Text txtBehaviourDesc;

	public Toggle starPlayerToggle;

	public Toggle nationalityToggle;

	[Header("PlayerBuy Panel")]
	public GameObject playerBuyObj;

	public Transform playersGroupParent;

	public Text txtSortField;

	public Text txtSortOrder;

	public RectTransform arrowRotation;

	public Text moneyTotal;

	public Text searchLimit;

	public GameObject playerPrefab;

	private Coach coach;

	private ListOfPlayers playersFound;

	private static bool[] positionSelected;

	private static bool[] behaviourSelected;

	private static bool[] sortFieldSelected;

	private Action onCloseView;

	private List<EliLabel> playersLabels = new List<EliLabel>();

	public void Initialize(Coach coach, Action onCloseView)
	{
		this.coach = coach;
		coach.searchOptions = coach.searchOptions ?? new Coach.PlayerSearchOptions();
		this.onCloseView = onCloseView;
		ResetView();
		DarkenSearchPanel();
		FillSearchFields();
		FillSortHeaders();
		SetSearchPanelVisible();
	}

	private void DarkenSearchPanel()
	{
		bool darkenThis = false;
		bool darkenNext = false;
		int childCount = optionsGroup.transform.childCount;
		for (int i = 0; i < childCount; i++)
		{
			GameObject gameObject = optionsGroup.transform.GetChild(i).gameObject;
			if (gameObject.activeSelf)
			{
				DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			}
		}
	}

	private void FillSearchFields()
	{
		Slider slider = maxSkillSlider;
		float minValue = (minSkillSlider.minValue = DataManager.PLAYER_SKILL_MIN);
		slider.minValue = minValue;
		Slider slider2 = maxSkillSlider;
		minValue = (minSkillSlider.maxValue = DataManager.PLAYER_SKILL_MAX);
		slider2.maxValue = minValue;
		minSkillSlider.value = coach.searchOptions.minSkill;
		minSkillValue.text = ((int)minSkillSlider.value).ToString();
		maxSkillSlider.value = coach.searchOptions.maxSkill;
		maxSkillValue.text = ((int)maxSkillSlider.value).ToString();
		playerNameInputField.text = coach.searchOptions.playerName;
		FillSearchPosition();
		FillSearchBehaviour();
		starPlayerToggle.isOn = coach.searchOptions.starPlayer;
		nationalityToggle.isOn = coach.searchOptions.filterByNationality;
	}

	private void FillSortHeaders()
	{
		txtSortField.text = LanguageController.instance.Get_Translation("SORT_FIELD_" + coach.searchOptions.sortCriteria.sortField.ToString().ToUpper());
		txtSortOrder.text = LanguageController.instance.Get_Translation("SORT_ORDER_" + coach.searchOptions.sortCriteria.sortOrder.ToString().ToUpper());
		bool flag = coach.searchOptions.sortCriteria.sortOrder == Coach.PlayerSearchOptions.SortOrder.Ascending;
		arrowRotation.eulerAngles = new Vector3(0f, 0f, flag ? 180 : 0);
	}

	public override void ResetView()
	{
		moneyTotal.text = LanguageController.instance.Get_Translation("PLAYERBUY_MONEYTOTAL", Util.MoneyString(coach.MyTeam.Money()));
		searchLimit.text = LanguageController.instance.Get_Translation("PLAYERBUY_SEARCHLIMIT", DataManager.PLAYERSEARCH_SIZE_MAX);
	}

	public void OnMinSkillValueChange()
	{
		minSkillValue.text = ((int)minSkillSlider.value).ToString();
		if (minSkillSlider.value > maxSkillSlider.value)
		{
			maxSkillSlider.value = minSkillSlider.value;
		}
	}

	public void OnMaxSkillValueChange()
	{
		maxSkillValue.text = ((int)maxSkillSlider.value).ToString();
		if (maxSkillSlider.value < minSkillSlider.value)
		{
			minSkillSlider.value = maxSkillSlider.value;
		}
	}

	public void PositionPressed()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		positionSelected = new bool[Enum.GetValues(typeof(PlayerPosition)).Length + 1];
		int num = 0;
		positionSelected[num] = !coach.searchOptions.filterByPosition;
		foreach (PlayerPosition value in Enum.GetValues(typeof(PlayerPosition)))
		{
			num++;
			positionSelected[num] = coach.searchOptions.filterByPosition && coach.searchOptions.playerPosition == value;
		}
		ManagePositionFields(Util.ManageOption.CreateParameter, ref listOfParameters);
		ScreenController.instance.ShowParameterEditor("ID:PLAYERBUY_POSITION", listOfParameters, OnPositionChosen, showLoadingView: false);
	}

	private void ManagePositionFields(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		for (int i = 0; i < positionSelected.Length; i++)
		{
			string key;
			string displayName;
			if (i == 0)
			{
				key = "any";
				string text = "PLAYERBUY_ANY";
				displayName = LanguageController.instance.Get_Translation(text);
			}
			else
			{
				PlayerPosition position = (PlayerPosition)(i - 1);
				key = position.ToString();
				displayName = Player.GetPositionDesc(position);
			}
			positionSelected[i] = (bool)Util.ManageOneOption(mode, key, displayName, null, null, positionSelected[i], false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.RadioButton, EliParameterPermissions.EditablePublic);
		}
	}

	private void OnPositionChosen(ListOfParameters listOfParameters)
	{
		ManagePositionFields(Util.ManageOption.ReadParameter, ref listOfParameters);
		for (int i = 0; i < positionSelected.Length; i++)
		{
			if (positionSelected[i])
			{
				if (i == 0)
				{
					coach.searchOptions.filterByPosition = false;
					continue;
				}
				coach.searchOptions.filterByPosition = true;
				coach.searchOptions.playerPosition = (PlayerPosition)(i - 1);
			}
		}
		FillSearchPosition();
	}

	private void FillSearchPosition()
	{
		txtPositionDesc.text = (coach.searchOptions.filterByPosition ? Player.GetPositionDesc(coach.searchOptions.playerPosition) : LanguageController.instance.Get_Translation("PLAYERBUY_ANY"));
		int num = (int)(coach.searchOptions.filterByPosition ? (coach.searchOptions.playerPosition + 1) : PlayerPosition.Keeper);
		txtPositionValue.text = num.ToString();
	}

	public void BehaviourPressed()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		behaviourSelected = new bool[Enum.GetValues(typeof(PlayerBehaviour)).Length + 1];
		int num = 0;
		behaviourSelected[num] = !coach.searchOptions.filterByBehaviour;
		foreach (PlayerBehaviour value in Enum.GetValues(typeof(PlayerBehaviour)))
		{
			num++;
			behaviourSelected[num] = coach.searchOptions.filterByBehaviour && coach.searchOptions.playerBehaviour == value;
		}
		ManageBehaviourFields(Util.ManageOption.CreateParameter, ref listOfParameters);
		ScreenController.instance.ShowParameterEditor("ID:PLAYERBUY_BEHAVIOUR", listOfParameters, OnBehaviourChosen, showLoadingView: false);
	}

	private void ManageBehaviourFields(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		for (int i = 0; i < behaviourSelected.Length; i++)
		{
			string key;
			string displayName;
			if (i == 0)
			{
				key = "any";
				string text = "PLAYERBUY_ANY";
				displayName = LanguageController.instance.Get_Translation(text);
			}
			else
			{
				PlayerBehaviour behaviour = (Enum.IsDefined(typeof(PlayerBehaviour), i) ? ((PlayerBehaviour)i) : PlayerBehaviour.Standard);
				key = behaviour.ToString();
				displayName = Player.GetBehaviourDesc(behaviour);
			}
			behaviourSelected[i] = (bool)Util.ManageOneOption(mode, key, displayName, null, null, behaviourSelected[i], false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.RadioButton, EliParameterPermissions.EditablePublic);
		}
	}

	private void OnBehaviourChosen(ListOfParameters listOfParameters)
	{
		ManageBehaviourFields(Util.ManageOption.ReadParameter, ref listOfParameters);
		for (int i = 0; i < behaviourSelected.Length; i++)
		{
			if (behaviourSelected[i])
			{
				if (i == 0)
				{
					coach.searchOptions.filterByBehaviour = false;
					continue;
				}
				coach.searchOptions.filterByBehaviour = true;
				coach.searchOptions.playerBehaviour = (Enum.IsDefined(typeof(PlayerBehaviour), i) ? ((PlayerBehaviour)i) : PlayerBehaviour.Standard);
			}
		}
		FillSearchBehaviour();
	}

	private void FillSearchBehaviour()
	{
		txtBehaviourDesc.text = (coach.searchOptions.filterByBehaviour ? Player.GetBehaviourDesc(coach.searchOptions.playerBehaviour) : LanguageController.instance.Get_Translation("PLAYERBUY_ANY"));
		int num = (int)(coach.searchOptions.filterByBehaviour ? (coach.searchOptions.playerBehaviour + 1) : ((PlayerBehaviour)0));
		txtBehaviourValue.text = num.ToString();
	}

	public void ApplySearch()
	{
		coach.searchOptions.playerName = playerNameInputField.text;
		coach.searchOptions.starPlayer = starPlayerToggle.isOn;
		coach.searchOptions.filterByNationality = nationalityToggle.isOn;
		if (!int.TryParse(txtPositionValue.text, out var result))
		{
			result = 0;
		}
		if (result == 0)
		{
			coach.searchOptions.filterByPosition = false;
		}
		else
		{
			coach.searchOptions.filterByPosition = true;
			int num = result - 1;
			coach.searchOptions.playerPosition = (Enum.IsDefined(typeof(PlayerPosition), num) ? ((PlayerPosition)num) : PlayerPosition.Keeper);
		}
		if (!int.TryParse(txtBehaviourValue.text, out var result2))
		{
			result2 = 0;
		}
		if (result2 == 0)
		{
			coach.searchOptions.filterByBehaviour = false;
		}
		else
		{
			coach.searchOptions.filterByBehaviour = true;
			coach.searchOptions.playerBehaviour = (PlayerBehaviour)(result2 - 1);
		}
		coach.searchOptions.maxSkill = (int)maxSkillSlider.value;
		coach.searchOptions.minSkill = (int)minSkillSlider.value;
		playersFound = DataManager.instance.allPlayers.GetPlayersBySearch(coach.searchOptions, coach.MyTeam, DataManager.PLAYERSEARCH_SIZE_MAX);
		if (playersFound.Count > 0)
		{
			SetPlayersFoundPanelVisible();
			RefreshPlayerList();
		}
		else
		{
			string description = LanguageController.instance.Get_Translation("PLAYERBUY_NOPLAYERSFOUND");
			ScreenController.instance.ShowInfoPopUp(description, SearchPressed);
		}
	}

	private void SetPlayersFoundPanelVisible()
	{
		ResetView();
		playerBuyObj.SetActive(value: true);
		searchPanelObj.SetActive(value: false);
	}

	public void OnSortFieldClick()
	{
		if ((int)coach.searchOptions.sortCriteria.sortField < Enum.GetNames(typeof(Coach.PlayerSearchOptions.SortField)).Length - 1)
		{
			coach.searchOptions.sortCriteria.sortField++;
		}
		else
		{
			coach.searchOptions.sortCriteria.sortField = Coach.PlayerSearchOptions.SortField.Name;
		}
		FillSortHeaders();
		RefreshPlayerList();
	}

	public void OnSortFieldAllOptions()
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		sortFieldSelected = new bool[Enum.GetValues(typeof(Coach.PlayerSearchOptions.SortField)).Length];
		int num = 0;
		foreach (Coach.PlayerSearchOptions.SortField value in Enum.GetValues(typeof(Coach.PlayerSearchOptions.SortField)))
		{
			sortFieldSelected[num] = coach.searchOptions.sortCriteria.sortField == value;
			num++;
		}
		ManageSortFields(Util.ManageOption.CreateParameter, ref listOfParameters);
		ScreenController.instance.ShowParameterEditor("ID:SORT_FIELD_TITLE", listOfParameters, OnSortFieldSelected, showLoadingView: false);
	}

	private void ManageSortFields(Util.ManageOption mode, ref ListOfParameters listOfParameters)
	{
		for (int i = 0; i < sortFieldSelected.Length; i++)
		{
			Coach.PlayerSearchOptions.SortField sortField = (Coach.PlayerSearchOptions.SortField)i;
			string text = sortField.ToString();
			string text2 = $"SORT_FIELD_{text.ToUpper()}";
			string displayName = LanguageController.instance.Get_Translation(text2);
			sortFieldSelected[i] = (bool)Util.ManageOneOption(mode, text, displayName, null, null, sortFieldSelected[i], false, PermissionLevel.L0_None, ref listOfParameters, EliParameterPermissions.RadioButton, EliParameterPermissions.EditablePublic);
		}
	}

	private void OnSortFieldSelected(ListOfParameters listOfParameters)
	{
		ManageSortFields(Util.ManageOption.ReadParameter, ref listOfParameters);
		for (int i = 0; i < sortFieldSelected.Length; i++)
		{
			if (sortFieldSelected[i])
			{
				Coach.PlayerSearchOptions.SortField sortField = (Coach.PlayerSearchOptions.SortField)i;
				if (sortField != coach.searchOptions.sortCriteria.sortField)
				{
					coach.searchOptions.sortCriteria.sortField = sortField;
					FillSortHeaders();
					RefreshPlayerList();
					break;
				}
			}
		}
	}

	public void OnSortOrderClick()
	{
		bool flag = coach.searchOptions.sortCriteria.sortOrder == Coach.PlayerSearchOptions.SortOrder.Ascending;
		coach.searchOptions.sortCriteria.sortOrder = (flag ? Coach.PlayerSearchOptions.SortOrder.Descending : Coach.PlayerSearchOptions.SortOrder.Ascending);
		FillSortHeaders();
		RefreshPlayerList();
	}

	private void RefreshPlayerList()
	{
		if (playersFound == null)
		{
			return;
		}
		playersFound.SortByPlayerSearchOptions(coach.searchOptions.sortCriteria);
		for (int i = 0; i < playersGroupParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(playersGroupParent.GetChild(i).gameObject);
		}
		playersLabels = new List<EliLabel>();
		bool darkenNext = false;
		bool darkenThis = false;
		for (int j = 0; j < playersFound.Count; j++)
		{
			Player player = playersFound.Player(j);
			GameObject gameObject = UnityEngine.Object.Instantiate(playerPrefab, playersGroupParent, worldPositionStays: false);
			DarkenListBackgroundObj(gameObject, ref darkenThis, ref darkenNext);
			gameObject.GetComponent<PlayerBuyPrefab>();
			player.FillPrefabForBuy(gameObject.GetComponent<PlayerBuyPrefab>(), player, includeTeam: true, delegate
			{
				PlayerSelected(player);
			});
		}
	}

	private void PlayerSelected(Player player)
	{
		coach.MyTeam.TryBuyPlayerHuman(player, delegate
		{
			BuyPlayerConfirmed(player);
		}, null);
	}

	private void BuyPlayerConfirmed(Player player)
	{
		string description = LanguageController.instance.Get_Translation("PLAYERBUY_BOUGHT", player.GetName());
		ScreenController.instance.ShowInfoPopUp(description, ApplySearch);
		ResetView();
		RefreshPlayerList();
	}

	public void SearchPressed()
	{
		SetSearchPanelVisible();
	}

	private void SetSearchPanelVisible()
	{
		searchPanelObj.SetActive(value: true);
		playerBuyObj.SetActive(value: false);
	}

	public void BackPressed()
	{
		onCloseView?.Invoke();
		Close();
	}
}
