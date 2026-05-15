using UnityEngine;
using UnityEngine.UI;

public class CheckExistence : MonoBehaviour
{
	private Dropdown selectedFile;

	private Image dropdownColor;

	private void Start()
	{
		selectedFile = base.transform.Find("Dropdown").GetComponent<Dropdown>();
		dropdownColor = base.transform.Find("Dropdown").GetComponent<Image>();
	}

	public void CheckFileExistence()
	{
		if (FileManagement.HasKey(selectedFile.captionText.text))
		{
			dropdownColor.color = Color.green;
		}
		else
		{
			dropdownColor.color = Color.red;
		}
	}

	public void ResetColor()
	{
		dropdownColor.color = Color.white;
	}

	public void DeleteFile()
	{
		FileManagement.DeleteKey(selectedFile.captionText.text);
		dropdownColor.color = Color.white;
	}

	public void DeleteAllFiles()
	{
		FileManagement.DeleteAll();
		dropdownColor.color = Color.white;
	}
}
