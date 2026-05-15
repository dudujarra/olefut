using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class SubstitutePrefab : MonoBehaviour, IPointerDownHandler, IEventSystemHandler, IPointerExitHandler, IPointerUpHandler
{
	public Button button;

	public Image selectedBackground;

	public Image selectedBackgroundOnButtonPressed;

	public Image positionBackground;

	public Text playerName;

	public Text position;

	public Text skill;

	public Animation anim;

	[Header("Event Icons")]
	public Image eventIcon;

	public Sprite injuryIcon;

	public Sprite redCardIcon;

	public Sprite yellowCardIcon;

	public Sprite secondYellowCardIcon;

	[HideInInspector]
	public Player player;

	[ReadOnly]
	public PlayerList playerList;

	private Color transparent = new Color32(0, 0, 0, 0);

	public void Initialize(Player player, PlayerList playerList, Action<SubstitutePrefab> OnClickAction)
	{
		this.playerList = playerList;
		this.player = player;
		button.onClick.RemoveAllListeners();
		button.onClick.AddListener(delegate
		{
			OnClickAction(this);
		});
		DrawPrefab();
	}

	private void DrawPrefab()
	{
		if (player != null)
		{
			playerName.text = player.GetName();
			position.text = player.PositionCode();
			positionBackground.color = player.PositionColor();
			skill.text = player.skill.ToString();
			if (player.playerMatch.sentOff)
			{
				eventIcon.enabled = true;
				eventIcon.sprite = ((player.playerMatch.YellowCards >= 2) ? secondYellowCardIcon : redCardIcon);
			}
			else if (player.Injured > 0)
			{
				eventIcon.enabled = true;
				eventIcon.sprite = injuryIcon;
			}
			else if (player.playerMatch.YellowCards > 0)
			{
				eventIcon.enabled = true;
				eventIcon.sprite = yellowCardIcon;
			}
			else
			{
				eventIcon.enabled = false;
			}
		}
		else
		{
			playerName.text = "";
			position.text = "";
			positionBackground.color = transparent;
			skill.text = "";
			eventIcon.enabled = false;
		}
	}

	public void SetButtonEnabled(bool enable)
	{
		button.enabled = enable;
	}

	public void TradeAnimation(Player player)
	{
		this.player = player;
		anim.Rewind();
		anim.Play();
	}

	public int GetListIndex()
	{
		return base.transform.GetSiblingIndex();
	}

	public void Select()
	{
		selectedBackground.enabled = true;
	}

	public void Diselect()
	{
		selectedBackground.enabled = false;
	}

	public void OnPointerDown(PointerEventData eventData)
	{
		if (button.enabled)
		{
			selectedBackgroundOnButtonPressed.enabled = true;
		}
	}

	public void OnPointerExit(PointerEventData eventData)
	{
		if (button.enabled)
		{
			selectedBackgroundOnButtonPressed.enabled = false;
		}
	}

	public void OnPointerUp(PointerEventData eventData)
	{
		if (button.enabled)
		{
			selectedBackgroundOnButtonPressed.enabled = false;
		}
	}
}
