using System.Text;
using UnityEngine;

public static class SystemInfoHelper
{
	public static void AppendToParameters(ListOfParameters list)
	{
		list.RegisterReadOnlyParameter("ELIFOOT_DEVICE_ID", Util.GetDeviceID(allowReadFromCache: true), TextAnchor.MiddleRight);
		list.RegisterReadOnlyParameter("ELIFOOT_GAME_VERSION", DataManager.instance.GetGameVersion(), TextAnchor.MiddleRight);
		list.RegisterReadOnlyParameter("SYSTEM_DEVICE_NAME", SystemInfo.deviceName, TextAnchor.MiddleRight);
		list.RegisterReadOnlyParameter("SYSTEM_DEVICE_TYPE", SystemInfo.deviceType.ToString(), TextAnchor.MiddleRight);
		list.RegisterReadOnlyParameter("SYSTEM_DEVICE_MODEL", SystemInfo.deviceModel, TextAnchor.MiddleRight);
	}

	public static string BuildPlainText()
	{
		LanguageController instance = LanguageController.instance;
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.Append(instance.Get_Translation("ELIFOOT_DEVICE_ID")).Append(": ").Append(Util.GetDeviceID(allowReadFromCache: true))
			.Append('\n');
		stringBuilder.Append(instance.Get_Translation("ELIFOOT_GAME_VERSION")).Append(": ").Append(DataManager.instance.GetGameVersion())
			.Append('\n');
		stringBuilder.Append(instance.Get_Translation("SYSTEM_DEVICE_NAME")).Append(": ").Append(SystemInfo.deviceName)
			.Append('\n');
		stringBuilder.Append(instance.Get_Translation("SYSTEM_DEVICE_TYPE")).Append(": ").Append(SystemInfo.deviceType.ToString())
			.Append('\n');
		stringBuilder.Append(instance.Get_Translation("SYSTEM_DEVICE_MODEL")).Append(": ").Append(SystemInfo.deviceModel)
			.Append('\n');
		return stringBuilder.ToString();
	}
}
