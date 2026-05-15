using System;
using UnityEngine;
using UnityEngine.UI;

public class CustomDropdown : MonoBehaviour
{
	public enum AnimationType
	{
		FADING,
		SLIDING,
		STYLISH
	}

	[Header("OBJECTS")]
	public GameObject triggerObject;

	public Text selectedText;

	public Transform itemParent;

	public GameObject itemObject;

	public GameObject scrollbar;

	private VerticalLayoutGroup itemList;

	[Header("SETTINGS")]
	public bool enableIcon = true;

	public bool enableTrigger = true;

	public bool enableScrollbar = true;

	public bool invokeAtStart;

	public AnimationType animationType;

	[Space(10f)]
	public int selectedItemIndex;

	[Space(10f)]
	private Animator dropdownAnimator;

	private Text setItemText;

	private Image setItemImage;

	private Sprite imageHelper;

	private string textHelper;

	private bool isOn;

	private void Awake()
	{
		dropdownAnimator = GetComponent<Animator>();
		itemList = itemParent.GetComponent<VerticalLayoutGroup>();
	}

	public void FillTactics(Action<int> onFormationPressed)
	{
		selectedText.text = FormationsData.GetFormationName(selectedItemIndex);
		for (int i = 0; i < itemParent.childCount; i++)
		{
			UnityEngine.Object.Destroy(itemParent.GetChild(i).gameObject);
		}
		for (int j = 0; j < FormationsData.gameFormations.Length; j++)
		{
			GameObject gameObject = UnityEngine.Object.Instantiate(itemObject, new Vector3(0f, 0f, 0f), Quaternion.identity);
			gameObject.transform.SetParent(itemParent, worldPositionStays: false);
			setItemText = gameObject.GetComponentInChildren<Text>();
			setItemText.text = FormationsData.GetFormationName(j);
			Button component = gameObject.GetComponent<Button>();
			int temp = j;
			component.onClick.AddListener(delegate
			{
				ChangeDropdownInfo(temp);
			});
			component.onClick.AddListener(delegate
			{
				onFormationPressed(temp);
			});
			component.onClick.AddListener(Animate);
		}
		if (enableScrollbar)
		{
			itemList.padding.right = 25;
			scrollbar.SetActive(value: true);
		}
		else
		{
			itemList.padding.right = 8;
			UnityEngine.Object.Destroy(scrollbar);
		}
	}

	public void ChangeDropdownInfo(int itemIndex)
	{
		selectedText.text = FormationsData.GetFormationName(itemIndex);
		selectedItemIndex = itemIndex;
	}

	public void Animate()
	{
		if (!isOn && animationType == AnimationType.FADING)
		{
			dropdownAnimator.Play("Fading In");
			isOn = true;
		}
		else if (isOn && animationType == AnimationType.FADING)
		{
			dropdownAnimator.Play("Fading Out");
			isOn = false;
		}
		else if (!isOn && animationType == AnimationType.SLIDING)
		{
			dropdownAnimator.Play("Sliding In");
			isOn = true;
		}
		else if (isOn && animationType == AnimationType.SLIDING)
		{
			dropdownAnimator.Play("Sliding Out");
			isOn = false;
		}
		else if (!isOn && animationType == AnimationType.STYLISH)
		{
			dropdownAnimator.Play("Stylish In");
			isOn = true;
		}
		else if (isOn && animationType == AnimationType.STYLISH)
		{
			dropdownAnimator.Play("Stylish Out");
			isOn = false;
		}
		if (enableTrigger && !isOn)
		{
			triggerObject.SetActive(value: false);
		}
		else if (enableTrigger && isOn)
		{
			triggerObject.SetActive(value: true);
		}
	}
}
