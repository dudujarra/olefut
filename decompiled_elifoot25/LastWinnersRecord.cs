using System;

[Serializable]
public class LastWinnersRecord : EliObject
{
	public int year;

	public Podium podium;

	public LastWinnersRecord(int year, Podium fromPodium)
		: base(generateID: false)
	{
		this.year = year;
		podium.CopyFrom(fromPodium);
	}

	public override void PostLoad()
	{
		podium.PostLoad();
	}
}
