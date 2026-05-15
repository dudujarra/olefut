using System;

[Serializable]
public class EliObject
{
	public static long lastUsedID;

	private long objID;

	public long ID => objID;

	public EliObject(bool generateID)
	{
		objID = ((!generateID) ? (-1) : (++lastUsedID));
	}

	public virtual void PostLoad()
	{
	}

	public virtual void PostDay()
	{
	}

	public virtual string GetName()
	{
		return ToString();
	}

	public virtual int GetSelectionWeight(int criteria)
	{
		return 1;
	}

	public virtual void LanguageChanged()
	{
	}

	protected virtual string GetDumpHeader()
	{
		return "Dump header";
	}

	protected virtual string GetDumpRow()
	{
		return "Dump row";
	}
}
