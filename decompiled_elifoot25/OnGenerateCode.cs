using Kender.uGUI;
using UnityEngine;
using UnityEngine.UI;

public class OnGenerateCode : MonoBehaviour
{
	public Text txtCode;

	public Text codeName;

	public ComboBox cbCertificate;

	public void OnClick()
	{
		string text = codeName.text;
		string caption = cbCertificate.Items[cbCertificate.SelectedIndex].Caption;
		txtCode.text = GetRegistrationCode(text, caption);
	}

	private string GetRegistrationCode(string name, string key)
	{
		int num = int.MaxValue;
		string text = "";
		string text2 = key + name;
		if (text2.Length % 2 == 1)
		{
			text2 += "0";
		}
		long num2 = 65535L;
		for (int i = 0; i < text2.Length; i += 2)
		{
			int num3 = text2[i] % 10;
			int num4 = text2[i + 1] % 10;
			long num5 = 10 * num3 + num4;
			num2 ^= num5;
			for (num5 = 1L; num5 <= 8; num5++)
			{
				long num6 = 0L;
				if (num2 % 2 == 1)
				{
					num6 = 1879142401L;
				}
				num2 = (num2 / 2) & num;
				num2 ^= num6;
			}
		}
		string text3 = num2.ToString("X8");
		for (int j = 0; j < text3.Length; j++)
		{
			text += text3[j] % 10;
		}
		return text;
	}
}
