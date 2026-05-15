public class TinyXmlReader
{
	private string xmlString = "";

	private int idx;

	public string tagName = "";

	public bool isOpeningTag;

	public string content = "";

	public TinyXmlReader(string newXmlString)
	{
		xmlString = newXmlString;
	}

	private int IndexOf(char _c, int _i)
	{
		for (int i = _i; i < xmlString.Length; i++)
		{
			if (xmlString[i] == _c)
			{
				return i;
			}
		}
		return -1;
	}

	public bool Read()
	{
		if (idx > -1)
		{
			idx = xmlString.IndexOf("<", idx);
		}
		if (idx == -1)
		{
			return false;
		}
		idx++;
		int num = IndexOf('>', idx);
		int num2 = IndexOf(' ', idx);
		if (num2 == -1 || num < num2)
		{
			num2 = num;
		}
		if (num == -1)
		{
			return false;
		}
		tagName = xmlString.Substring(idx, num2 - idx);
		idx = num;
		if (tagName.StartsWith("/"))
		{
			isOpeningTag = false;
			tagName = tagName.Remove(0, 1);
		}
		else
		{
			isOpeningTag = true;
		}
		if (isOpeningTag)
		{
			int num3 = xmlString.IndexOf("<", idx);
			if (num3 == -1)
			{
				return false;
			}
			content = xmlString.Substring(idx + 1, num3 - idx - 1);
			content = content.Trim();
		}
		return true;
	}

	public bool Read(string endingTag)
	{
		bool result = Read();
		if (tagName == endingTag && !isOpeningTag)
		{
			result = false;
		}
		return result;
	}
}
