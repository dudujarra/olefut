using UnityEngine;
using UnityEngine.UI;

public class LoadAudioFile : MonoBehaviour
{
	private AudioSource audioSource;

	private Text wavText;

	private Text mp3Text;

	private Text oggText;

	private void Start()
	{
		audioSource = base.gameObject.GetComponent<AudioSource>();
		wavText = base.transform.Find("WavText").GetComponent<Text>();
		mp3Text = base.transform.Find("Mp3Text").GetComponent<Text>();
		oggText = base.transform.Find("OggText").GetComponent<Text>();
	}

	public void PlaySound(string extension)
	{
		string file = "Example." + extension;
		Text text = null;
		switch (extension)
		{
		case "wav":
			text = wavText;
			break;
		case "mp3":
			text = mp3Text;
			break;
		case "ogg":
			text = oggText;
			break;
		}
		if (FileManagement.FileExists(file))
		{
			audioSource.clip = FileManagement.ImportAudio(file);
			if (audioSource.clip != null)
			{
				audioSource.Play();
				text.text = "OK.";
			}
			else
			{
				text.text = "Not supported.";
			}
		}
		else
		{
			text.text = "Not found.";
		}
	}
}
