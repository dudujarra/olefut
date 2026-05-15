using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace EditorView;

public class PlayerPrefab : MonoBehaviour
{
	[Header("Old References")]
	[SerializeField]
	private Button button;

	[SerializeField]
	private Image background;

	[SerializeField]
	private Text positionText;

	[SerializeField]
	private Image flag;

	[SerializeField]
	private Text countryText;

	[SerializeField]
	private Text playerName;

	[SerializeField]
	private GameObject isStar;

	[Header("Positions")]
	[SerializeField]
	private EditPlayerPrefab.Position[] positions;

	[Header("Behaviour")]
	[SerializeField]
	private GameObject fairplay;

	[SerializeField]
	private GameObject gentlemen;

	[SerializeField]
	private GameObject standard;

	[SerializeField]
	private GameObject agressive;

	[SerializeField]
	private GameObject fighter;

	[SerializeField]
	private GameObject rascal;

	[SerializeField]
	private Text fairplayText;

	[SerializeField]
	private Text gentlemenText;

	[SerializeField]
	private Text standardText;

	[SerializeField]
	private Text agressiveText;

	[SerializeField]
	private Text fighterText;

	[SerializeField]
	private Text rascalText;

	private Color oddColor;

	private Color evenColor;

	private DbTeams.DbPlayer player;

	private LayoutElement playerNameLayoutElement;

	private RectTransform backgroundRectTransform;

	private EliImage isStarImage;

	private void Awake()
	{
		fairplayText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.FairPlay.ToString().ToUpper());
		gentlemenText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Gentleman.ToString().ToUpper());
		standardText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Standard.ToString().ToUpper());
		agressiveText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Aggressive.ToString().ToUpper());
		fighterText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Fighter.ToString().ToUpper());
		rascalText.text = LanguageController.instance.Get_Translation("PLAYER_BEHAVIOUR_" + PlayerBehaviour.Rascal.ToString().ToUpper());
		backgroundRectTransform = background.GetComponent<RectTransform>();
		isStarImage = isStar.GetComponent<EliImage>();
	}

	internal void Initialize(int index, DbTeams.DbPlayer player, Sprite flag, bool firstTime, Action<int> action, string position, string country, List<string> positionsText)
	{
		this.player = player;
		oddColor = ConfigManager.instance.COLOR_OBSCURE_LIST_LIGHT;
		evenColor = ConfigManager.instance.COLOR_OBSCURE_LIST_DARK;
		if (firstTime)
		{
			background.color = ((base.transform.GetSiblingIndex() % 2 == 0) ? oddColor : evenColor);
		}
		else
		{
			background.color = ((base.transform.GetSiblingIndex() % 2 == 0) ? evenColor : oddColor);
		}
		backgroundRectTransform.anchorMin = new Vector2(0f, 0f);
		backgroundRectTransform.anchorMax = new Vector2(1f, 1f);
		backgroundRectTransform.offsetMin = new Vector2(0f, 0f);
		backgroundRectTransform.offsetMax = new Vector2(0f, 0f);
		positionText.text = position;
		this.flag.sprite = flag;
		playerName.text = player.name;
		if (player.isStar)
		{
			isStar.SetActive(value: true);
			isStarImage.baseStyle = "Icon";
			isStarImage.imageStyle = "Star";
			isStarImage.ReloadElementConfig();
		}
		else
		{
			isStar.SetActive(value: false);
		}
		if (action != null)
		{
			button.onClick.RemoveAllListeners();
			button.onClick.AddListener(delegate
			{
				action(index);
			});
		}
		else
		{
			button.enabled = false;
		}
		countryText.text = country;
		for (int num = 0; num < positions.Length; num++)
		{
			if (player.position == (PlayerPosition)num)
			{
				positions[num].background.color = Player.GetBackgroundColor(player.position);
				positions[num].twoLetters.text = positionsText[num];
				positions[num].toggle.gameObject.SetActive(value: true);
			}
			else
			{
				positions[num].toggle.gameObject.SetActive(value: false);
			}
		}
		fairplay.SetActive(player.behaviour == PlayerBehaviour.FairPlay);
		gentlemen.SetActive(player.behaviour == PlayerBehaviour.Gentleman);
		standard.SetActive(player.behaviour == PlayerBehaviour.Standard);
		agressive.SetActive(player.behaviour == PlayerBehaviour.Aggressive);
		fighter.SetActive(player.behaviour == PlayerBehaviour.Fighter);
		rascal.SetActive(player.behaviour == PlayerBehaviour.Rascal);
		ToggleExtraInfo();
	}

	private void ToggleExtraInfo()
	{
		if (Screen.width > 1700)
		{
			if (playerNameLayoutElement == null)
			{
				playerNameLayoutElement = playerName.GetComponent<LayoutElement>();
			}
			playerNameLayoutElement.preferredWidth = 450f;
			countryText.gameObject.SetActive(value: true);
			positionText.gameObject.SetActive(value: true);
		}
		else
		{
			if (playerNameLayoutElement == null)
			{
				playerNameLayoutElement = playerName.GetComponent<LayoutElement>();
			}
			playerNameLayoutElement.preferredWidth = 400f;
			countryText.gameObject.SetActive(value: false);
			positionText.gameObject.SetActive(value: false);
		}
	}

	private void OnRectTransformDimensionsChange()
	{
		ToggleExtraInfo();
	}
}
