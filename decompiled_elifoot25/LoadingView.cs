using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class LoadingView : EliView
{
	public Text description;

	public Image icon;

	public Sprite[] animationSprites;

	private TextLabelID myTextLabelID;

	public virtual void Initialize(string description = null)
	{
		if (description != null)
		{
			myTextLabelID = this.description.gameObject.GetComponentInChildren<TextLabelID>();
			if (myTextLabelID != null)
			{
				myTextLabelID.labelID = null;
				this.description.text = LanguageController.instance.Get_Translation(description);
			}
		}
		base.gameObject.SetActive(value: true);
		StartCoroutine(PlayAnimation());
	}

	private IEnumerator PlayAnimation()
	{
		int animationIndex = 0;
		do
		{
			icon.sprite = animationSprites[animationIndex++];
			if (animationIndex >= animationSprites.Length)
			{
				animationIndex = 0;
			}
			yield return new WaitForSeconds(0f);
		}
		while (!(this == null) && !(icon == null));
	}

	public override void Update()
	{
		base.Update();
		if (base.transform.GetSiblingIndex() != base.transform.parent.childCount - 1)
		{
			base.transform.SetAsLastSibling();
		}
	}
}
