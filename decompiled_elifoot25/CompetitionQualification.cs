using System;
using UnityEngine;

[Serializable]
public class CompetitionQualification
{
	public int numTeamsMax;

	public int numTeamsMin;

	public float divisionRangeMax;

	[NonSerialized]
	private Competition forCompetition;

	public long forCompetitionID;

	[NonSerialized]
	private Competition exceptInCompetition;

	public long exceptInCompetitionID;

	public Competition ForCompetition => forCompetition;

	public Competition ExceptInCompetition => exceptInCompetition;

	public CompetitionQualification(int numTeamsMin, int numTeamsMax, float divisionRangeMax, Competition forCompetition, Competition exceptInCompetition)
	{
		this.numTeamsMin = numTeamsMin;
		this.numTeamsMax = numTeamsMax;
		this.divisionRangeMax = divisionRangeMax;
		this.forCompetition = forCompetition;
		this.exceptInCompetition = exceptInCompetition;
		forCompetitionID = forCompetition?.ID ?? 0;
		exceptInCompetitionID = exceptInCompetition?.ID ?? 0;
	}

	public void PostLoad()
	{
		forCompetition = DataManager.instance.allCompetitions.FindCompetitionByID(forCompetitionID);
		exceptInCompetition = DataManager.instance.allCompetitions.FindCompetitionByID(exceptInCompetitionID);
		if (forCompetition == null)
		{
			Debug.LogError($"Competition.PostLoad(): forCompetition==null, forCompetitionId={forCompetitionID}");
		}
	}
}
