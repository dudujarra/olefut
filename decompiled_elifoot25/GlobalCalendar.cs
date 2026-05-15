using System;

[Serializable]
public class GlobalCalendar : EliList
{
	public GlobalCalendarEntry GlobalCalendarEntry(int index)
	{
		return (GlobalCalendarEntry)base[index];
	}

	public string CurrentCalendarDayDesc()
	{
		if (DataManager.instance.properties.gameDay.currentCalendarDay >= base.Count)
		{
			return LanguageController.instance.Get_Translation("ENDOFSEASON_TITLE");
		}
		return GlobalCalendarEntry(DataManager.instance.properties.gameDay.currentCalendarDay).GetTitle();
	}
}
