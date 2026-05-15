using System;

[Serializable]
public class TeamCalendar : EliList
{
	public TeamCalendarEntry TeamCalendarEntry(int index)
	{
		return (TeamCalendarEntry)base[index];
	}

	public TeamCalendarEntry FindEntry(GlobalCalendarEntry globalCalEntry)
	{
		return (TeamCalendarEntry)Find((EliObject tObj) => ((TeamCalendarEntry)tObj).index == globalCalEntry.index);
	}
}
