using System;
using System.Collections;
using System.Linq;
using UnityEngine;

public class BestStrikersView : EliView
{
	[Header("Extra Components")]
	public ParametersView parametersView;

	public TopHScrollController topHScrollController;

	private float prefabHeight;

	private float secondsToClose;

	private float secondsTimer;

	private bool pauseTimer;

	private bool backPressed;

	public void Initialize(Competition baseCompetition, float prefabHeight)
	{
		DataManager.UpdateStrikers(forceUpdate: false, onlyTopGoals: false, setPrizes: false);
		this.prefabHeight = prefabHeight;
		topHScrollController.Initialize(DataManager.instance.allCompetitions, baseCompetition, RefreshView);
	}

	private void RefreshView(Competition competition)
	{
		FillBestStrikers(competition);
	}

	private void FillBestStrikers(Competition competition)
	{
		for (int num = parametersView.parameterGroupParent.childCount - 1; num >= 0; num--)
		{
			parametersView.DisablePrefab(parametersView.parameterGroupParent.GetChild(num));
		}
		ListOfParameters strikersSeasonListOfParameters = GetStrikersSeasonListOfParameters(competition);
		parametersView.ClearListOfParameters();
		bool darkenNext = false;
		bool darkenThis = false;
		for (int i = 0; i < strikersSeasonListOfParameters.Count; i++)
		{
			EliParameter parameter = strikersSeasonListOfParameters.EliParameter(i);
			parametersView.FillParameterObj(parameter, prefabHeight, fullRedraw: true, ref darkenThis, ref darkenNext);
		}
	}

	private ListOfParameters GetStrikersSeasonListOfParameters(Competition competition)
	{
		ListOfParameters listOfParameters = new ListOfParameters();
		switch (competition.configuration.strikersCriteria)
		{
		case CompetitionStrikersCriteria.Global:
			listOfParameters.StartSection(competition.GetName());
			if (competition.strikers.Count == 0)
			{
				listOfParameters.RegisterReadOnlyParameter(LanguageController.instance.Get_Translation("BESTSTRIKERS_EMPTY"), null);
				break;
			}
			foreach (Player striker in competition.strikers)
			{
				string text = "";
				text = ((!striker.Team.MyCompetitions().Contains(competition)) ? striker.GetName() : $"{striker.GetName()} ({striker.Team.ShortName})");
				listOfParameters.RegisterReadOnlyParameter(text, striker.playerSeason.GetGoals(competition), TextAnchor.MiddleRight);
			}
			break;
		case CompetitionStrikersCriteria.PerDivision:
			listOfParameters.StartSection(competition.GetName());
			foreach (Division division in competition.divisions)
			{
				listOfParameters.StartSubSection(division.GetShortName());
				if (division.strikers.Count == 0)
				{
					listOfParameters.RegisterReadOnlyParameter(LanguageController.instance.Get_Translation("BESTSTRIKERS_EMPTY"), null);
					continue;
				}
				foreach (Player striker2 in division.strikers)
				{
					string displayName = ((striker2.Team.MyDivision(competition) != division) ? striker2.GetName() : $"{striker2.GetName()} ({striker2.Team.ShortName})");
					listOfParameters.RegisterReadOnlyParameter(displayName, striker2.playerSeason.GetGoals(competition), TextAnchor.MiddleRight);
				}
			}
			break;
		default:
			throw new Exception("CompetitionStrikersCriteria not defined - GameManager.GetStrikersSeasonListOfParameters()");
		case CompetitionStrikersCriteria.None:
			break;
		}
		return listOfParameters;
	}

	public void BackButtonPressed()
	{
		backPressed = true;
		Close();
	}

	public void StartTimeToClose(float seconds)
	{
		secondsToClose = seconds;
		secondsTimer = secondsToClose;
		if (secondsToClose > 0f)
		{
			StartCoroutine(TimeToClose());
		}
	}

	private IEnumerator TimeToClose()
	{
		while (secondsTimer > 0f)
		{
			if (!pauseTimer)
			{
				secondsTimer -= Time.deltaTime;
			}
			yield return 0;
			if (this == null)
			{
				yield break;
			}
		}
		if (!(this == null))
		{
			BackButtonPressed();
		}
	}

	public IEnumerator WaitForInput()
	{
		while (!backPressed)
		{
			yield return 0;
		}
	}

	public override void Update()
	{
		if (Input.GetMouseButtonDown(0))
		{
			secondsTimer = secondsToClose;
		}
		base.Update();
	}
}
