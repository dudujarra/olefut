using System;

namespace UnityEngine.Purchasing.Security;

public class GooglePlayTangle
{
	private static byte[] data = Convert.FromBase64String("piUrJBSmJS4mpiUlJKzrTPcNeqyRuh9hMKR3kHnq3osAToFA02Yqb9TN2dl9Jgq4bRB61UE5jHJiGQV1RkXhg7LGjKl5E5IpV9xLF9wv2ugEYV5fYN/uaWQG6CBDaBDXscli1Kyzvs6BZUeHqVaEdO3vS/JaoDMvHI5Mei7kbxUmRIrHVBKTM3OB4/vOW1NAVht9cMe+WDKDvGbYpt837YXBl5InWi21ybAG206OrcOzISKx6H1W3Sq/q5odOLrjMA9KxS4Ah0xCrdp9A36nMfmHOBB8YJOSxHM4QfnWPzyk5oLZ6cZJgO0aP4jQ7C4HFKYlBhQpIi0Oomyi0yklJSUhJCce/qYDu4+hiirM1/a78Ychp9y3xxt19lwUOnkt7yYnJSQl");

	private static int[] order = new int[15]
	{
		1, 7, 2, 5, 9, 9, 11, 13, 11, 12,
		10, 11, 13, 13, 14
	};

	private static int key = 36;

	public static readonly bool IsPopulated = true;

	public static byte[] Data()
	{
		if (!IsPopulated)
		{
			return null;
		}
		return Obfuscator.DeObfuscate(data, order, key);
	}
}
