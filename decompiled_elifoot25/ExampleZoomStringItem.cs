using Picker;
using UnityEngine.UI;

public class ExampleZoomStringItem : MassiveZoomPickerItem
{
	protected Text[] m_Texts;

	protected override void Awake()
	{
		base.Awake();
		m_Texts = GetComponentsInChildren<Text>();
	}

	public override void SetItemContents(MassivePickerScrollRect scrollRect, int itemIndex)
	{
		if (m_Texts != null && m_Texts.Length != 0)
		{
			string text = "Item" + itemIndex;
			Text[] texts = m_Texts;
			for (int i = 0; i < texts.Length; i++)
			{
				texts[i].text = text;
			}
		}
	}
}
