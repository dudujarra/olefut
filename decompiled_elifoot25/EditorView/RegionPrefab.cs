using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace EditorView;

public class RegionPrefab : MonoBehaviour
{
	public DbCountries countries;

	public Button button;

	public Image flag;

	public Text regionName;

	public Text numberOfTeams;

	public GameObject invalidTeamsDetectedIcon;

	[HideInInspector]
	public string regionCode;

	[HideInInspector]
	public int regionIndex;

	private EliLabel regionNameLabel;

	private EliLabel numberOfTeamsLabel;

	private void Awake()
	{
		regionNameLabel = regionName.GetComponent<EliLabel>();
		numberOfTeamsLabel = numberOfTeams.GetComponent<EliLabel>();
	}

	internal void Initialize(Sprite flag, string regionCode, string regionName, int regionIndex, string numberOfTeams, bool hasInvalidTeams, Action<int> buttonAction)
	{
		this.regionCode = regionCode;
		this.regionIndex = regionIndex;
		this.flag.sprite = flag;
		this.regionName.text = regionName;
		this.numberOfTeams.text = numberOfTeams;
		invalidTeamsDetectedIcon.SetActive(hasInvalidTeams);
		button.onClick.AddListener(delegate
		{
			buttonAction(this.regionIndex);
		});
	}

	internal void SetTextSize(bool landscape)
	{
		if (landscape)
		{
			regionNameLabel.dynamicScale = 16;
			numberOfTeamsLabel.dynamicScale = 20;
		}
		else
		{
			regionNameLabel.dynamicScale = 12;
			numberOfTeamsLabel.dynamicScale = 15;
		}
		StartCoroutine(ReloadElementConfig());
	}

	private IEnumerator ReloadElementConfig()
	{
		yield return new WaitForEndOfFrame();
		if (!(this == null))
		{
			regionNameLabel.ReloadElementConfig();
			numberOfTeamsLabel.ReloadElementConfig();
		}
	}
}
