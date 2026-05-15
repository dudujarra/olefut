using UnityEngine;

public class Set_FM_Mode : MonoBehaviour
{
	private void Start()
	{
		FileManagement.stringConversion = FM_StringMode.UTF8;
	}
}
