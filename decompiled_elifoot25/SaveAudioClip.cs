using UnityEngine;

public class SaveAudioClip : MonoBehaviour
{
	private AudioSource source;

	private void Start()
	{
		source = base.gameObject.GetComponent<AudioSource>();
	}

	private void Update()
	{
	}

	public void SaveLoadedAudioClip()
	{
		if (source.clip != null)
		{
			FileManagement.SaveAudio("MyFile.wav", source.clip);
		}
	}
}
