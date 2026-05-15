using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class MicController : MonoBehaviour
{
	public bool IsWorking = true;

	private bool _lastValueOfIsWorking;

	public bool RaltimeOutput = true;

	private bool _lastValueOfRaltimeOutput;

	private AudioSource _audioSource;

	private float _lastVolume;

	private void Start()
	{
		_audioSource = GetComponent<AudioSource>();
		if (IsWorking)
		{
			WorkStart();
		}
	}

	private void Update()
	{
		CheckIfIsWorkingChanged();
		CheckIfRealtimeOutputChanged();
	}

	private void CheckIfIsWorkingChanged()
	{
		if (_lastValueOfIsWorking != IsWorking)
		{
			if (IsWorking)
			{
				WorkStart();
			}
			else
			{
				WorkStop();
			}
		}
		_lastValueOfIsWorking = IsWorking;
	}

	private void CheckIfRealtimeOutputChanged()
	{
		if (_lastValueOfRaltimeOutput != RaltimeOutput)
		{
			DisableSound(RaltimeOutput);
		}
		_lastValueOfRaltimeOutput = RaltimeOutput;
	}

	private void DisableSound(bool SoundOn)
	{
		if (SoundOn)
		{
			if (_lastVolume > 0f)
			{
				_audioSource.volume = _lastVolume;
			}
			else
			{
				_audioSource.volume = 1f;
			}
		}
		else
		{
			_lastVolume = _audioSource.volume;
			_audioSource.volume = 0f;
		}
	}

	public void WorkStart()
	{
		IsWorking = true;
		_audioSource.clip = Microphone.Start(null, loop: true, 10, 44100);
		_audioSource.loop = true;
		while (Microphone.GetPosition(null) <= 0)
		{
			_audioSource.Play();
		}
	}

	public void WorkStop()
	{
		IsWorking = false;
		Microphone.End(null);
		_audioSource.loop = false;
	}
}
