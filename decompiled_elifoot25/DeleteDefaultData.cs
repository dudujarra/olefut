using UnityEngine;

public class DeleteDefaultData : MonoBehaviour
{
	public void DeleteData()
	{
		FileManagement.DeleteFile("data.txt");
	}
}
