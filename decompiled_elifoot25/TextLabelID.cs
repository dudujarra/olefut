using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Text))]
public class TextLabelID : EliComponent
{
	[Header("TextLabelID")]
	public string labelID;

	private Text textObj;

	private void Awake()
	{
		textObj = GetComponent<Text>();
	}

	private void Start()
	{
		ReloadElementConfig();
	}

	public override void ReloadElementConfig()
	{
		if (textObj == null)
		{
			Awake();
		}
		if (labelID != null)
		{
			labelID = labelID.Trim();
		}
		if (labelID == "")
		{
			Debug.LogWarning("1007: TextLabelId: No translation for \"" + labelID + "\" in \n" + Util.GetGameObjectPath(base.gameObject));
		}
		if (textObj != null && !string.IsNullOrEmpty(labelID) && textObj.text != null)
		{
			string text = $"ID:{labelID}";
			textObj.text = LanguageController.instance?.Get_Translation(text);
			if (labelID == textObj.text)
			{
				Debug.LogWarning("1008: TextLabelId: No translation for \"" + labelID + "\" in \n" + Util.GetGameObjectPath(base.gameObject));
			}
		}
	}
}
