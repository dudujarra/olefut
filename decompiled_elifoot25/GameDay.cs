using System;

[Serializable]
public class GameDay
{
	public bool strikersUpdated;

	public int currentCalendarDay;

	public GameDay()
	{
		Reset();
	}

	public void Reset()
	{
		strikersUpdated = false;
	}
}
