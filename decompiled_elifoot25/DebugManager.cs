using UnityEngine;

public class DebugManager : MonoBehaviour
{
	[SerializeField]
	public bool debugGeneral;

	[SerializeField]
	public bool debugSuperLeague;

	[SerializeField]
	public bool debugStandingsView;

	[SerializeField]
	public bool debugParametersView;

	[SerializeField]
	public bool debugCoachesView;

	[SerializeField]
	public bool debugPoolManager;

	[SerializeField]
	public bool debugImageGallery;

	[SerializeField]
	public bool debugUpdateTeams;

	[SerializeField]
	public bool debugTeamSimilarity;

	[SerializeField]
	public bool debugAds;

	public static DebugManager Instance { get; private set; }

	private void Awake()
	{
		if (Instance != null && Instance != this)
		{
			Object.Destroy(this);
		}
		else
		{
			Instance = this;
		}
	}

	public void Log(DebugType type, string scriptName, string functionName, int checkPoint)
	{
		Log(type, $"{scriptName}:{functionName}() - Check point: {checkPoint}");
	}

	public void Log(DebugType type, string scriptName, string functionName, int checkPoint, string debugText)
	{
		Log(type, $"{scriptName}:{functionName}() - Check point: {checkPoint}\n{debugText}");
	}

	public void Log(DebugType type, string scriptName, string functionName, FunctionLocation location, string debugText)
	{
		Log(type, scriptName + ":" + functionName + "() - " + location.ToString().ToUpper() + "\n" + debugText);
	}

	public void Log(DebugType type, string scriptName, string functionName, FunctionLocation location)
	{
		Log(type, scriptName + ":" + functionName + "() - " + location.ToString().ToUpper());
	}

	public void Log(DebugType type, string debugText)
	{
		switch (type)
		{
		case DebugType.General:
			if (debugGeneral)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.SuperLeague:
			if (debugSuperLeague)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.StandingsView:
			if (debugStandingsView)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.ParametersView:
			if (debugParametersView)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.CoachesView:
			if (debugCoachesView)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.PoolManager:
			if (debugPoolManager)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.ImageGallery:
			if (debugImageGallery)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.UpdateTeams:
			if (debugUpdateTeams)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.TeamSimilarity:
			if (debugTeamSimilarity)
			{
				DebugLog(type, debugText);
			}
			break;
		case DebugType.Ads:
			if (debugAds)
			{
				DebugLog(type, debugText);
			}
			break;
		default:
			DebugLog(type, $"Trying to debug the type '{type}' without it being implemented");
			break;
		}
	}

	private void DebugLog(DebugType type, string message)
	{
	}
}
