using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class CountryRegionTeamPrefab : MonoBehaviour
{
	public Image background;

	public Image flagOrLogo;

	public Text nameText;

	public Sprite NoFlag;

	public Button button;

	private Color oddColor;

	private Color evenColor;

	public void Initialize(Sprite flagOrLogo, Color32 iconColor, string nametext, UnityAction action)
	{
		oddColor = ConfigManager.instance.COLOR_OBSCURE_LIST_LIGHT;
		evenColor = ConfigManager.instance.COLOR_OBSCURE_LIST_DARK;
		background.color = ((base.transform.GetSiblingIndex() % 2 == 0) ? evenColor : oddColor);
		this.flagOrLogo.sprite = ((flagOrLogo != null) ? flagOrLogo : NoFlag);
		this.flagOrLogo.color = iconColor;
		nameText.text = nametext;
		button.onClick.AddListener(action);
	}
}
