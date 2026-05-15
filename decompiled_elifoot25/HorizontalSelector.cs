using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.Events;

public class HorizontalSelector : MonoBehaviour
{
	private TextMeshProUGUI label;

	private TextMeshProUGUI labeHelper;

	private Animator selectorAnimator;

	[Header("SETTINGS")]
	private int index;

	public int defaultIndex;

	[Header("ELEMENTS")]
	public List<string> elements = new List<string>();

	[Header("EVENT")]
	public UnityEvent onValueChanged;

	private void Start()
	{
		selectorAnimator = base.gameObject.GetComponent<Animator>();
		label = base.transform.Find("Text").GetComponent<TextMeshProUGUI>();
		labeHelper = base.transform.Find("Text Helper").GetComponent<TextMeshProUGUI>();
		label.text = elements[defaultIndex];
		labeHelper.text = label.text;
	}

	public void PreviousClick()
	{
		labeHelper.text = label.text;
		if (index == 0)
		{
			index = elements.Count - 1;
		}
		else
		{
			index--;
		}
		onValueChanged.Invoke();
		label.text = elements[index];
		selectorAnimator.Play(null);
		selectorAnimator.StopPlayback();
		selectorAnimator.Play("Previous");
	}

	public void ForwardClick()
	{
		labeHelper.text = label.text;
		if (index + 1 >= elements.Count)
		{
			index = 0;
		}
		else
		{
			index++;
		}
		onValueChanged.Invoke();
		label.text = elements[index];
		selectorAnimator.Play(null);
		selectorAnimator.StopPlayback();
		selectorAnimator.Play("Forward");
	}
}
