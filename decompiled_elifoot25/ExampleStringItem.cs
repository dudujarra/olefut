using Picker;
using UnityEngine.UI;

public class ExampleStringItem : MassivePickerItem
{
	protected Text m_Text;

	protected override void Awake()
	{
		base.Awake();
		m_Text = GetComponent<Text>();
	}

	public override void SetItemContents(MassivePickerScrollRect scrollRect, int itemIndex)
	{
		if (m_Text != null)
		{
			m_Text.text = "Item" + itemIndex;
		}
	}
}
