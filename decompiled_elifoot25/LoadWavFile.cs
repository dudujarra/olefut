using System.IO;
using UnityEngine;
using UnityEngine.UI;

public class LoadWavFile : MonoBehaviour
{
	private AudioSource source;

	private Text loadDisplay;

	private InputField inputFile;

	private void Start()
	{
		source = base.gameObject.GetComponent<AudioSource>();
		loadDisplay = base.transform.Find("LoadDisplay").Find("Text").GetComponent<Text>();
		inputFile = base.transform.Find("InputField").GetComponent<InputField>();
	}

	private void Update()
	{
	}

	public void Play()
	{
		source.Play();
	}

	public void Pause()
	{
		source.Pause();
	}

	public void Stop()
	{
		source.Stop();
	}

	public void DeleteClip()
	{
		source.clip = null;
		File.Delete(Application.persistentDataPath + "/MyFile.wav");
	}

	public void SaveClip()
	{
		byte[] bytes = OpenWavParser.AudioClipToByteArray(source.clip);
		File.WriteAllBytes(Application.persistentDataPath + "/MyFile.wav", bytes);
	}

	public void LoadDefaultFile()
	{
		string path = Application.persistentDataPath + "/MyFile.wav";
		if (File.Exists(path))
		{
			byte[] wavFile = File.ReadAllBytes(path);
			source.clip = OpenWavParser.ByteArrayToAudioClip(wavFile);
			loadDisplay.text = "Samples: " + source.clip.samples;
		}
		else
		{
			loadDisplay.text = "File not found";
		}
	}

	public void LoadCustomFile()
	{
		if (File.Exists(inputFile.text))
		{
			byte[] wavFile = File.ReadAllBytes(inputFile.text);
			source.clip = OpenWavParser.ByteArrayToAudioClip(wavFile);
			loadDisplay.text = "Samples: " + source.clip.samples;
		}
		else
		{
			loadDisplay.text = "File not found";
		}
	}
}
