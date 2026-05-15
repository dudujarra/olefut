using UnityEngine;
using UnityEngine.UI;

namespace Picker;

public class MassiveImagePickerItem : MassivePickerItem
{
	private MassiveImagePicker m_Parent;

	private int m_ColumnIndex = -1;

	private Image m_Image;

	public override void SetItemContents(MassivePickerScrollRect scrollRect, int itemIndex)
	{
		if (m_Parent == null)
		{
			m_Parent = scrollRect.GetComponentInParent<MassiveImagePicker>();
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
		if (m_Image == null)
		{
			m_Image = GetComponent<Image>();
			if (m_Image == null)
			{
				return;
			}
		}
		Sprite itemParam = m_Parent.GetItemParam(m_ColumnIndex, itemIndex);
		m_Image.sprite = itemParam;
	}
}
