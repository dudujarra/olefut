using System;
using System.Collections.Generic;
using UnityEngine;

public class SavedGamesShortInfo : MonoBehaviour
{
	[Serializable]
	public struct SavedGame
	{
		public List<CoachData> coachesData;

		public Date date;

		public string savedGameFileName;
	}

	[Serializable]
	public struct CoachData
	{
		public string coachName;

		public string team;
	}

	[Serializable]
	public struct Date
	{
		public int year;

		public int month;

		public int day;

		public int hour;

		public int minute;

		public int second;

		public DateTime GetAsDateTime()
		{
			return new DateTime(year, month, day, hour, minute, second);
		}
	}
}
