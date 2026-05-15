using System;

[Serializable]
public struct EndOfSeasonActions(bool removeAllTeams, bool clearTeamsInPhases)
{
	public bool removeAllTeams = removeAllTeams;

	public bool clearTeamsInPhases = clearTeamsInPhases;
}
