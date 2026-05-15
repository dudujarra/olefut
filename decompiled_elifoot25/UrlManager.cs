using System.Collections;
using UnityEngine;

public class UrlManager : MonoBehaviour
{
	public static UrlManager instance;

	private void Awake()
	{
		if (instance != null)
		{
			Object.Destroy(base.gameObject);
			return;
		}
		Object.DontDestroyOnLoad(base.gameObject);
		instance = this;
	}

	private static string GetUrlStandardParameters()
	{
		return "";
	}

	public virtual IEnumerator CheckConnectionToMasterServer(BooleanObj canConnect)
	{
		yield return 0;
	}
}
