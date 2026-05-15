using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace EditorView;

public class CountryPrefab : MonoBehaviour
{
	public DbCountries countries;

	public Button button;

	public Image flag;

	public Text countryName;

	public Text numberOfTeams;

	public GameObject invalidTeamsDetectedIcon;

	public DbCountries.DbCountry dbCountry;

	[HideInInspector]
	public string countryCode;

	[HideInInspector]
	public int countryIndex;

	private EliLabel countryNameLabel;

	private EliLabel numberOfTeamsLabel;

	private void Awake()
	{
		countryNameLabel = countryName.GetComponent<EliLabel>();
		numberOfTeamsLabel = numberOfTeams.GetComponent<EliLabel>();
	}

	internal void Initialize(DbCountries.DbCountry dbCountry, Sprite flag, string countryCode, string countryName, int countryIndex, string numberOfTeams, bool hasInvalidTeams, Action<int> buttonAction)
	{
		this.countryCode = countryCode;
		this.countryIndex = countryIndex;
		this.dbCountry = dbCountry;
		this.flag.sprite = flag;
		this.flag.enabled = this.flag.sprite != null;
		this.countryName.text = countryName;
		this.numberOfTeams.text = numberOfTeams;
		invalidTeamsDetectedIcon.SetActive(hasInvalidTeams);
		button.onClick.AddListener(delegate
		{
			buttonAction(this.countryIndex);
		});
	}

	internal void SetTextSize(bool landscape)
	{
		if (landscape)
		{
			countryNameLabel.dynamicScale = 16;
			numberOfTeamsLabel.dynamicScale = 20;
		}
		else
		{
			countryNameLabel.dynamicScale = 12;
			numberOfTeamsLabel.dynamicScale = 15;
		}
		StartCoroutine(ReloadElementConfig());
	}

	private IEnumerator ReloadElementConfig()
	{
		yield return new WaitForEndOfFrame();
		if (!(this == null))
		{
			countryNameLabel.ReloadElementConfig();
			numberOfTeamsLabel.ReloadElementConfig();
		}
	}
}
