using System;
using UnityEngine;
using UnityEngine.UI;

public class EditPlayerPrefab : EliView
{
	[Serializable]
	public struct Position
	{
		public Toggle toggle;

		public Image background;

		public Text twoLetters;
	}

	[Header("Top")]
	public InputField playerNameField;

	public Toggle isStar;

	[Header("Position and Behaviour Holders")]
	[SerializeField]
	private Transform verticalPositionsAndBehaviourHolder;

	[SerializeField]
	private Transform horizontalPositionsAndBehaviourHolder;

	[SerializeField]
	private Transform positionsHolder;

	[SerializeField]
	private Transform behaviourHolder;

	[Header("Positions")]
	public Position[] positions;

	public Text fieldPosition;

	[Header("Behaviour")]
	public Toggle fairplay;

	public Toggle gentlemen;

	public Toggle standard;

	public Toggle agressive;

	public Toggle fighter;

	public Toggle rascal;

	public Text fairplayText;

	public Text gentlemenText;

	public Text standardText;

	public Text agressiveText;

	public Text fighterText;

	public Text rascalText;

	[Header("Country")]
	public Image countryFlag;

	public Text countryText;

	public Sprite DefaultFlag;

	[Header("Footer")]
	public Button deleteButton;

	public AddTargetGraphics deleteButtonAddedGraphics;

	public Button transferButton;

	public AddTargetGraphics transferButtonAddedGraphics;

	public Button vButton;

	public AddTargetGraphics vButtonAddedGraphics;

	[Header("Add on PopUps")]
	public GameObject areYouSure;

	public GameObject countryRegionTeamPopUp;

	[Header("Scripts")]
	public DbTeams teams;

	public DbTeams teamsPackage;

	public DbCountries countries;

	[HideInInspector]
	public CountryRegionTeamPopUp countryRegionTeamInstantiated;

	private Action onClose;

	private Action onPlayerUpdate;

	private int teamIndex;

	private int playerIndex;

	private PlayerPosition positionIndex;

	private PlayerBehaviour behaviourIndex;

	private int countryIndex;

	private HorizontalOrVerticalLayoutGroup currentLayoutGroup;

	public void Initialize(int teamindex, int playerIndex, Action onClose, Action onPlayerUpdate)
	{
		if (DataManager.instance.dbTeamsMode == DataManager.DbTeamsMode.PackageMode)
		{
			teams = teamsPackage;
		}
		this.onClose = onClose;
		this.onPlayerUpdate = onPlayerUpdate;
		teamIndex = teamindex;
		this.playerIndex = playerIndex;
		playerNameField.characterLimit = DataManager.PLAYER_NAME_LENGTH_MAX;
		if (playerIndex != -1)
		{
			positionIndex = teams.AllTeams[teamIndex].players[playerIndex].position;
			behaviourIndex = teams.AllTeams[teamIndex].players[playerIndex].behaviour;
			countryIndex = teams.AllTeams[teamIndex].players[playerIndex].CountryIndex;
			Invoke("CheckValidChoices", 0.01f);
			PutPlayerInfo(teams.AllTeams[teamIndex].players[playerIndex].name, teams.AllTeams[teamIndex].players[playerIndex].isStar, positionIndex, behaviourIndex);
		}
		else
		{
			countryIndex = teams.AllTeams[teamindex].CountryIndex;
			deleteButton.interactable = false;
			transferButton.interactable = false;
			vButton.interactable = false;
			Invoke("DisableButtons", 0.01f);
			PutPlayerInfo("", isstar: false, null, null);
		}
		ResetView();
	}

	private void DisableButtons()
	{
		deleteButtonAddedGraphics.ChangeToDisabledState();
		transferButtonAddedGraphics.ChangeToDisabledState();
		vButtonAddedGraphics.ChangeToDisabledState();
	}

	public override void ResetView()
	{
		base.ResetView();
		for (int i = 0; i < positions.Length; i++)
		{
			PlayerPosition playerPosition = (PlayerPosition)i;
			positions[i].background.color = Player.GetBackgroundColor(playerPosition);
			positions[i].twoLetters.text = LanguageController.instance.Get_Translation("PLAYER_POSITION_CODE_" + playerPosition.ToString().ToUpper());
		}
		fairplayText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.FairPlay.ToString().ToUpper());
		gentlemenText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Gentleman.ToString().ToUpper());
		standardText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Standard.ToString().ToUpper());
		agressiveText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Aggressive.ToString().ToUpper());
		fighterText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Fighter.ToString().ToUpper());
		rascalText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Rascal.ToString().ToUpper());
		if (fieldPosition.text != "")
		{
			fieldPosition.text = LanguageController.instance.Get_Translation("PLAYER_POSITION_DESC_" + positionIndex.ToString().ToUpper());
		}
		SelectedCountry(countryIndex);
	}

	internal override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		if ((float)Screen.width / (float)Screen.height > 0.9f)
		{
			positionsHolder.parent = horizontalPositionsAndBehaviourHolder;
			behaviourHolder.parent = horizontalPositionsAndBehaviourHolder;
		}
		else
		{
			positionsHolder.parent = verticalPositionsAndBehaviourHolder;
			behaviourHolder.parent = verticalPositionsAndBehaviourHolder;
		}
	}

	private void PutPlayerInfo(string playerName, bool isstar, PlayerPosition? position, PlayerBehaviour? behaviour)
	{
		playerNameField.text = playerName;
		isStar.isOn = isstar;
		for (int i = 0; i < positions.Length; i++)
		{
			positions[i].toggle.isOn = position == (PlayerPosition?)i;
		}
		if (position.HasValue)
		{
			fieldPosition.text = LanguageController.instance.Get_Translation("PLAYER_POSITION_DESC_" + position.ToString().ToUpper());
		}
		else
		{
			fieldPosition.text = "";
		}
		fairplay.isOn = behaviour == PlayerBehaviour.FairPlay;
		gentlemen.isOn = behaviour == PlayerBehaviour.Gentleman;
		standard.isOn = behaviour == PlayerBehaviour.Standard;
		agressive.isOn = behaviour == PlayerBehaviour.Aggressive;
		fighter.isOn = behaviour == PlayerBehaviour.Fighter;
		rascal.isOn = behaviour == PlayerBehaviour.Rascal;
	}

	public void SelectedCountry(int countryindex)
	{
		countryIndex = countryindex;
		if (countryindex != -1)
		{
			countryFlag.sprite = countries.GetCountryFlag(countryindex);
			countryText.text = countries.allCountries[countryIndex].Name;
		}
		else
		{
			countryFlag.sprite = DefaultFlag;
			countryText.text = LanguageController.instance.Get_Translation("Select country");
		}
		CheckValidChoices();
	}

	public void CheckValidChoices()
	{
		if (playerNameField.text != "" && fieldPosition.text != "" && countryIndex != -1 && (fairplay.isOn || gentlemen.isOn || standard.isOn || agressive.isOn || fighter.isOn || rascal.isOn))
		{
			vButton.interactable = true;
			vButtonAddedGraphics.ChangeToNormalState();
		}
		else
		{
			vButton.interactable = false;
			vButtonAddedGraphics.ChangeToDisabledState();
		}
	}

	public void ChangePosition(int position)
	{
		positionIndex = (PlayerPosition)position;
		fieldPosition.text = LanguageController.instance.Get_Translation("PLAYER_POSITION_DESC_" + positionIndex.ToString().ToUpper());
		CheckValidChoices();
	}

	public void ChangeBeheviour(int behaviour)
	{
		behaviourIndex = (PlayerBehaviour)behaviour;
		CheckValidChoices();
	}

	public void ChangeCountry()
	{
		countryRegionTeamInstantiated = UnityEngine.Object.Instantiate(countryRegionTeamPopUp, base.transform).GetComponent<CountryRegionTeamPopUp>();
		countryRegionTeamInstantiated.InitializedByEditPlayer(CountryRegionTeamPopUp.Type.Country, this, transferingPlayer: false);
	}

	public override void Close()
	{
		base.Close();
		onClose?.Invoke();
	}

	private void SaveAndClose()
	{
		LoadAndSavingTeams.instance.RedoValidTeamFlags();
		LoadAndSavingTeams.instance.RedoNumberOfTeams(isUpdated: false);
		LoadAndSavingTeams.instance.SaveTeams();
		onPlayerUpdate?.Invoke();
		Close();
	}

	public void TransferPlayer()
	{
		countryRegionTeamInstantiated = UnityEngine.Object.Instantiate(countryRegionTeamPopUp, base.transform).GetComponent<CountryRegionTeamPopUp>();
		countryRegionTeamInstantiated.InitializedByEditPlayer(CountryRegionTeamPopUp.Type.Team, this, transferingPlayer: true);
	}

	public void TransferSelectedTeam(int teamindex)
	{
		int num = teamIndex;
		teamIndex = teamindex;
		int num2 = playerIndex;
		playerIndex = -1;
		SavePlayer();
		teamIndex = num;
		playerIndex = num2;
		ConfirmDeletePlayer();
	}

	public void ConfirmChanges()
	{
		SavePlayer();
		SaveAndClose();
	}

	private void SavePlayer()
	{
		DbTeams.DbPlayer dbPlayer = new DbTeams.DbPlayer
		{
			name = playerNameField.text,
			isStar = isStar.isOn,
			position = positionIndex,
			behaviour = behaviourIndex,
			CountryIndex = countryIndex,
			countryCode = countries.allCountries[countryIndex].code
		};
		DbTeams.DbTeam value = teams.AllTeams[teamIndex];
		value.wasEdited = true;
		if (playerIndex != -1)
		{
			value.players[playerIndex] = dbPlayer;
		}
		else
		{
			value.players.Add(dbPlayer);
		}
		teams.AllTeams[teamIndex] = value;
	}

	public void DeletePlayer()
	{
		areYouSure.SetActive(value: true);
	}

	public void CloseDeletePlayer()
	{
		areYouSure.SetActive(value: false);
	}

	public void ConfirmDeletePlayer()
	{
		teams.AllTeams[teamIndex].players.RemoveAt(playerIndex);
		DbTeams.DbTeam value = teams.AllTeams[teamIndex];
		value.wasEdited = true;
		teams.AllTeams[teamIndex] = value;
		SaveAndClose();
	}

	public override void Update()
	{
		base.Update();
		if (Input.GetKeyDown(KeyCode.Escape))
		{
			Back();
		}
	}

	private void Back()
	{
		if (areYouSure.activeSelf)
		{
			CloseDeletePlayer();
		}
		else if (countryRegionTeamInstantiated != null)
		{
			countryRegionTeamInstantiated.Back();
		}
		else
		{
			Close();
		}
	}
}
