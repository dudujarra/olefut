using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Video;

namespace MediaPicker;

public class PlayMovie : MonoBehaviour
{
	public Text moviePath;

	public RawImage rawImage;

	public GameObject playButton;

	private VideoPlayer videoPlayer;

	public Text currentMinutes;

	public Text currentSeconds;

	public Text totalMinutes;

	public Text totalSeconds;

	private Texture2D thumbnailTexture;

	private AspectRatioFitter aspectRatioFitter;

	private AudioSource audioSource;

	private Image playImage;

	private bool isPlayingMovie;

	private bool isFirstPlay = true;

	private void Start()
	{
		playImage = playButton.GetComponent<Image>();
		aspectRatioFitter = rawImage.GetComponent<AspectRatioFitter>();
		isPlayingMovie = false;
		currentMinutes.gameObject.SetActive(value: false);
		currentSeconds.gameObject.SetActive(value: false);
		totalMinutes.gameObject.SetActive(value: false);
		totalSeconds.gameObject.SetActive(value: false);
		base.gameObject.AddComponent<Button>().onClick.AddListener(delegate
		{
			MoviePlayFullScreen();
		});
	}

	public void SetThumbnailTexture(Texture2D texture)
	{
		thumbnailTexture = texture;
		SizeToFitImage(thumbnailTexture);
	}

	public void SizeToFitImage(Texture2D texture2D)
	{
		rawImage.texture = texture2D;
		Vector2 vector = new Vector2(texture2D.width, texture2D.height);
		aspectRatioFitter = rawImage.GetComponent<AspectRatioFitter>();
		aspectRatioFitter.aspectMode = AspectRatioFitter.AspectMode.None;
		aspectRatioFitter.aspectRatio = vector.x / vector.y;
	}

	private void SetupVideoPlayer()
	{
		SizeToFitImage(thumbnailTexture);
		videoPlayer = base.gameObject.AddComponent<VideoPlayer>();
		videoPlayer.source = VideoSource.Url;
		videoPlayer.url = moviePath.text;
		audioSource = base.gameObject.AddComponent<AudioSource>();
		videoPlayer.playOnAwake = false;
		audioSource.playOnAwake = false;
		audioSource.Pause();
		audioSource.mute = true;
		videoPlayer.Prepare();
	}

	private IEnumerator AfterPlayPrepare()
	{
		isFirstPlay = true;
		SetupVideoPlayer();
		while (!videoPlayer.isPrepared)
		{
			yield return null;
		}
		rawImage.texture = videoPlayer.texture;
		videoPlayer.EnableAudioTrack(0, enabled: true);
		videoPlayer.SetTargetAudioSource(0, audioSource);
		videoPlayer.audioOutputMode = VideoAudioOutputMode.AudioSource;
		audioSource.mute = false;
		if (videoPlayer.isPrepared && aspectRatioFitter != null)
		{
			aspectRatioFitter.aspectRatio = (float)videoPlayer.texture.width / (float)videoPlayer.texture.height;
		}
		SetTotalTimeUI();
		SetCurrentTimeUI();
		videoPlayer.Play();
		audioSource.Play();
		isPlayingMovie = true;
		isFirstPlay = true;
		Color color = playImage.color;
		color.a = 0.01f;
		playImage.color = color;
		currentMinutes.gameObject.SetActive(value: true);
		currentSeconds.gameObject.SetActive(value: true);
		Debug.Log("[AfterPlayPrepare] Done Preparing Video");
		yield return null;
	}

	private IEnumerator PlayPrepare()
	{
		SetupVideoPlayer();
		videoPlayer.playOnAwake = true;
		videoPlayer.waitForFirstFrame = true;
		while (!videoPlayer.isPrepared)
		{
			yield return null;
		}
		rawImage.texture = videoPlayer.texture;
		if (videoPlayer.isPlaying)
		{
			videoPlayer.Pause();
			audioSource.Pause();
		}
		if (videoPlayer.isPrepared && aspectRatioFitter != null)
		{
			aspectRatioFitter.aspectRatio = (float)videoPlayer.texture.width / (float)videoPlayer.texture.height;
		}
		SetTotalTimeUI();
		SetCurrentTimeUI();
		isPlayingMovie = false;
		yield return null;
		Debug.Log("[PlayPrepare] Done Preparing Video");
		SizeToFitImage(thumbnailTexture);
	}

	private void OnNewFrame(VideoPlayer source, long frameIdx)
	{
		rawImage.texture = (Texture2D)source.texture;
	}

	private void Update()
	{
		if (videoPlayer != null && videoPlayer.isPlaying && isPlayingMovie)
		{
			SetCurrentTimeUI();
			checkPlayOver();
		}
	}

	private void SetCurrentTimeUI()
	{
		string text = Mathf.Floor((int)videoPlayer.time / 60).ToString("00") + ":";
		string text2 = ((int)videoPlayer.time % 60).ToString("00");
		currentMinutes.text = text;
		currentSeconds.text = text2;
	}

	private void SetTotalTimeUI()
	{
		totalMinutes.gameObject.SetActive(value: true);
		totalSeconds.gameObject.SetActive(value: true);
		string text = Mathf.Floor((int)((float)videoPlayer.frameCount / videoPlayer.frameRate) / 60).ToString("00") + ":";
		string text2 = ((int)((float)videoPlayer.frameCount / videoPlayer.frameRate) % 60).ToString("00");
		totalMinutes.text = text;
		totalSeconds.text = text2;
	}

	public void MoviePlay()
	{
		Debug.Log("[MoviePlay] moviePath: " + moviePath.text);
		if (videoPlayer == null)
		{
			if (MediaPickerController.Instance.currentPlayMovieGo != null && MediaPickerController.Instance.currentPlayMovieGo != base.gameObject)
			{
				MediaPickerController.Instance.currentPlayMovieGo.GetComponent<PlayMovie>().MovieStopOnly();
				MediaPickerController.Instance.currentPlayMovieGo = base.gameObject;
			}
			isPlayingMovie = true;
			StartCoroutine(AfterPlayPrepare());
			MediaPickerController.Instance.currentPlayMovieGo = base.gameObject;
			return;
		}
		if (!isPlayingMovie)
		{
			if (MediaPickerController.Instance.currentPlayMovieGo != null && MediaPickerController.Instance.currentPlayMovieGo != base.gameObject)
			{
				MediaPickerController.Instance.currentPlayMovieGo.GetComponent<PlayMovie>().MovieStopOnly();
				MediaPickerController.Instance.currentPlayMovieGo = base.gameObject;
			}
			isPlayingMovie = true;
			if (isFirstPlay)
			{
				StartCoroutine(AfterPlayPrepare());
			}
			else
			{
				videoPlayer.Play();
				audioSource.Play();
			}
			audioSource.mute = false;
			Color color = playImage.color;
			color.a = 0.01f;
			playImage.color = color;
			currentMinutes.gameObject.SetActive(value: true);
			currentSeconds.gameObject.SetActive(value: true);
		}
		else
		{
			MoviePauseForPlay();
		}
		isFirstPlay = false;
	}

	public void MoviePauseForPlay()
	{
		videoPlayer.Pause();
		audioSource.Pause();
		isPlayingMovie = false;
		Color color = playImage.color;
		color.a = 1f;
		playImage.color = color;
		Resources.UnloadUnusedAssets();
	}

	private void MoviePlayFullScreen()
	{
		Debug.Log("[MoviePlayFullScreen] url: " + videoPlayer.url + ", text: " + moviePath.text);
		if (moviePath.text == null)
		{
			moviePath.text = videoPlayer.url;
		}
		if (videoPlayer != null && videoPlayer.isPlaying)
		{
			videoPlayer.Stop();
			audioSource.Stop();
		}
		isPlayingMovie = false;
		isFirstPlay = true;
		Color color = playImage.color;
		color.a = 1f;
		playImage.color = color;
		StartCoroutine(PlayVideoCoroutine(moviePath.text));
		UIManager.Instance.SetSceneState(UIManager.SceneState.MediaPopup);
	}

	private IEnumerator PlayVideoCoroutine(string videoPath)
	{
		yield return 0;
	}

	private void MovieStop()
	{
		if (videoPlayer != null)
		{
			videoPlayer.Stop();
			audioSource.Stop();
			Color color = playImage.color;
			color.a = 1f;
			playImage.color = color;
			isPlayingMovie = false;
			isFirstPlay = true;
			currentMinutes.gameObject.SetActive(value: false);
			currentSeconds.gameObject.SetActive(value: false);
		}
		Debug.Log("[MovieStop]");
		StartCoroutine(PlayPrepare());
	}

	public void MovieStopOnly()
	{
		if (videoPlayer != null)
		{
			videoPlayer.Stop();
			audioSource.Stop();
			videoPlayer = null;
			audioSource = null;
			Color color = playImage.color;
			color.a = 1f;
			playImage.color = color;
			isPlayingMovie = false;
			isFirstPlay = true;
			currentMinutes.gameObject.SetActive(value: false);
			currentSeconds.gameObject.SetActive(value: false);
		}
		SizeToFitImage(thumbnailTexture);
		Resources.UnloadUnusedAssets();
	}

	private void checkPlayOver()
	{
		long frame = videoPlayer.frame;
		long num = Convert.ToInt64(videoPlayer.frameCount);
		if (frame >= num)
		{
			MovieStop();
			UIManager.Instance.SetSceneState(UIManager.SceneState.MainGridScene);
		}
	}
}
