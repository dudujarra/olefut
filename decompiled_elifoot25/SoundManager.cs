using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SoundManager : MonoBehaviour
{
	public static SoundManager instance;

	private int volumeSound = 100;

	private int volumeMusic = 100;

	private AudioSource currentMusic;

	private List<AudioSource> currentSounds = new List<AudioSource>();

	private bool soundEnabled = true;

	public bool vibrationEnabled = true;

	public int VolumeMusic
	{
		get
		{
			return volumeMusic;
		}
		set
		{
			if (volumeMusic != value)
			{
				SetMusicVolume(value);
			}
		}
	}

	public int VolumeSound
	{
		get
		{
			return volumeSound;
		}
		set
		{
			if (volumeSound != value)
			{
				SetSoundVolume(value);
			}
		}
	}

	public bool SoundEnabled
	{
		get
		{
			return soundEnabled;
		}
		set
		{
			soundEnabled = value;
			if (currentMusic != null)
			{
				if (soundEnabled)
				{
					currentMusic.UnPause();
				}
				else
				{
					currentMusic.Pause();
				}
			}
		}
	}

	public bool SetVolumeMusic(object value)
	{
		VolumeMusic = (int)value;
		return true;
	}

	public bool SetVolumeSound(object value)
	{
		VolumeSound = (int)value;
		return true;
	}

	public bool SetSoundEnabled(object enabled)
	{
		SoundEnabled = (bool)enabled;
		return true;
	}

	public bool SetVibrationEnabled(object enabled)
	{
		return true;
	}

	private void Awake()
	{
		if (instance == null)
		{
			Object.DontDestroyOnLoad(base.gameObject);
			instance = this;
		}
		else
		{
			Object.Destroy(base.gameObject);
		}
	}

	public void PlaySound(AudioSource soundSource, bool vibration = false, bool overrideOthers = false)
	{
		if (!soundEnabled || !(soundSource != null))
		{
			return;
		}
		if (overrideOthers)
		{
			foreach (AudioSource currentSound in currentSounds)
			{
				currentSound.Stop();
			}
			currentSounds.Clear();
		}
		soundSource.volume = (float)volumeSound / 100f;
		soundSource.Play();
		if (!currentSounds.Contains(soundSource))
		{
			currentSounds.Add(soundSource);
		}
	}

	public void PlayMusic(AudioSource musicSource)
	{
		StartCoroutine(PlayMusicRoutine(musicSource));
	}

	public void FadeCurrentMusic()
	{
		StartCoroutine(FadeOutMusic(currentMusic));
		currentMusic = null;
	}

	public void StopCurrentMusic()
	{
		if (currentMusic != null)
		{
			currentMusic.Stop();
		}
		currentMusic = null;
	}

	private IEnumerator PlayMusicRoutine(AudioSource musicSource)
	{
		if (currentMusic != null)
		{
			yield return StartCoroutine(FadeOutMusic(currentMusic));
		}
		currentMusic = musicSource;
		StartCoroutine(FadeInMusic(currentMusic));
	}

	private IEnumerator FadeOutMusic(AudioSource music)
	{
		if (!(music == null))
		{
			float num = (music.volume = (float)volumeMusic / 100f);
			float startVolume = num;
			float endVolume = 0f;
			float i = 0f;
			while (i < 1f)
			{
				i += Time.deltaTime;
				music.volume = Mathf.Lerp(startVolume, endVolume, i);
				yield return 0;
			}
			music.Stop();
		}
	}

	private IEnumerator FadeInMusic(AudioSource music)
	{
		if (!(music == null))
		{
			float num = (music.volume = 0f);
			float startVolume = num;
			float endVolume = (float)volumeMusic / 100f;
			float i = 0f;
			music.Play();
			if (!soundEnabled)
			{
				currentMusic.Pause();
			}
			while (i < 1f)
			{
				i += Time.deltaTime;
				music.volume = Mathf.Lerp(startVolume, endVolume, i);
				yield return 0;
			}
		}
	}

	public void SetSoundVolume(int volumeSound)
	{
		this.volumeSound = volumeSound;
	}

	public void SetMusicVolume(int volumeMusic)
	{
		this.volumeMusic = volumeMusic;
		if (currentMusic != null)
		{
			currentMusic.volume = (float)volumeMusic / 100f;
		}
	}

	private void Update()
	{
	}
}
