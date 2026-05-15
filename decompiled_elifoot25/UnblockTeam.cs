using System;

[Serializable]
public class UnblockTeam : UnblockTeamBase
{
	public void Use(ListOfTeams theseTeams)
	{
		foreach (Team item in new ListOfTeams(theseTeams.FindAll((EliObject t) => Applies((Team)t, this))))
		{
			item.unblocked = true;
		}
	}

	private bool Applies(Team team, UnblockTeam unblockTeam)
	{
		bool flag = true;
		if (!string.IsNullOrEmpty(unblockTeam.CountryCode3))
		{
			flag &= string.Equals(unblockTeam.CountryCode3, team.country.CountryCode);
			if (flag && unblockTeam.RegionCode != null)
			{
				flag &= string.Equals(unblockTeam.RegionCode, team.region?.regionCode);
			}
		}
		if (flag && unblockTeam.DbTeamID != null)
		{
			flag &= string.Equals(unblockTeam.DbTeamID, team.DbTeamId);
		}
		if (flag && unblockTeam.TeamShortName != null)
		{
			flag &= string.Equals(unblockTeam.TeamShortName, team.ShortName);
		}
		return flag;
	}
}
