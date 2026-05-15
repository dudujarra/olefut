using UnityEngine.UI;

namespace Picker;

public class MassiveStringPickerItem : MassivePickerItem
{
	private MassiveStringPicker m_Parent;

	private int m_ColumnIndex = -1;

	private Text[] m_Texts;

	public override void SetItemContents(MassivePickerScrollRect scrollRect, int itemIndex)
	{
		if (m_Parent == null)
		{
			m_Parent = scrollRect.GetComponentInParent<MassiveStringPicker>();
			if (m_Parent == null)
			{
				return;
			}
		}
		if (m_ColumnIndex < 0)
		{
			m_ColumnIndex = m_Parent.GetColumnIndex(scrollRect);
			if (m_ColumnIndex < 0)
			{
				return;
			}
		}
		if (m_Texts == null)
		{
			m_Texts = GetComponentsInChildren<Text>();
			if (m_Texts == null)
			{
				return;
			}
		}
		string itemParam = m_Parent.GetItemParam(m_ColumnIndex, itemIndex);
		Text[] texts = m_Texts;
		for (int i = 0; i < texts.Length; i++)
		{
			texts[i].text = itemParam;
		}
	}
}
