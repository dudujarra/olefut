using UnityEngine;
using UnityEngine.UI;

public class PlayAudio : MonoBehaviour
{
	public GameObject fileBrowser;

	private GameObject browserInstance;

	public Sprite captionIcon;

	private AudioSource _source;

	private Text playerText;

	private void Start()
	{
		_source = base.transform.GetComponent<AudioSource>();
		playerText = base.transform.Find("PlayerText").GetComponent<Text>();
	}

	public void OpenFileBrowser()
	{
		if (browserInstance == null)
		{
			browserInstance = Object.Instantiate(fileBrowser);
			browserInstance.GetComponent<FileBrowser>().SetBrowserWindow(OnPathSelected, Application.persistentDataPath, fullPath: true);
			browserInstance.GetComponent<FileBrowser>().SetBrowserCaption("Audio file browser...");
			browserInstance.GetComponent<FileBrowser>().SetBrowserIcon(captionIcon);
			string[] browserWindowFilter = new string[3] { ".wav", ".mp3", ".ogg" };
			browserInstance.GetComponent<FileBrowser>().SetBrowserWindowFilter(browserWindowFilter);
		}
	}

	private void OnPathSelected(string path)
	{
		playerText.text = FileManagement.GetFileName(path);
		AudioClip audioClip = FileManagement.ImportAudio(path, enc: false, checkSA: false, fullPath: true);
		if (audioClip != null)
		{
			_source.clip = audioClip;
			_source.Play();
		}
		else
		{
			playerText.text = "-";
		}
	}

	public void Play()
	{
		if (_source.clip != null)
		{
			_source.Play();
		}
		else
		{
			playerText.text = "-";
		}
	}

	public void Pause()
	{
		if (_source.isPlaying)
		{
			_source.Pause();
		}
	}

	public void Stop()
	{
		if (_source.isPlaying)
		{
			_source.Stop();
		}
	}
}
