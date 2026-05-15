using UnityEngine;

public class LocalNotifications : MonoBehaviour
{
	public static LocalNotifications instance;

	[HideInInspector]
	public string timeNotPlayedChannelId = "1";

	private void Awake()
	{
		instance = this;
		Object.DontDestroyOnLoad(this);
	}

	private void Start()
	{
	}

	public void ScheduleLocalNotification(string channelId, string title, string description, double timeInSeconds)
	{
	}
}
