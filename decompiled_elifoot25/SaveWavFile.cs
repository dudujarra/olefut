using System.IO;
using UnityEngine;
using UnityEngine.UI;

public class SaveWavFile : MonoBehaviour
{
	private AudioSource source;

	private MicController mic;

	private Text button;

	private Text recordDisplay;

	private float recordingTimer;

	private void Start()
	{
		MonoBehaviour.print(Application.persistentDataPath);
		source = base.gameObject.GetComponent<AudioSource>();
		mic = base.gameObject.GetComponent<MicController>();
		button = base.transform.Find("Button_Mic").Find("Text").GetComponent<Text>();
		recordDisplay = base.transform.Find("RecordDisplay").Find("Text").GetComponent<Text>();
	}

	private void Update()
	{
		if (mic.IsWorking)
		{
			recordingTimer -= Time.deltaTime;
			recordDisplay.text = "Remaining: " + recordingTimer.ToString("0.0");
			if (recordingTimer <= 0f)
			{
				recordingTimer = 0f;
				recordDisplay.text = "Time samples: " + source.timeSamples;
				StartRecording();
			}
		}
	}

	public void StartRecording()
	{
		if (mic.IsWorking)
		{
			button.text = "Start recording";
			mic.WorkStop();
			recordingTimer = 0f;
			recordDisplay.text = "Time samples: " + source.timeSamples;
		}
		else
		{
			button.text = "Stop recording";
			mic.WorkStart();
			recordingTimer = 5f;
			recordDisplay.text = "Remaining: " + recordingTimer.ToString("0.0");
		}
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
}
