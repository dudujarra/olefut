using System;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;
using UnityEngine.UI;

public class LoadGifImage : MonoBehaviour
{
	public class GifFrame
	{
		public int Width;

		public int Height;

		public Color32[] Data;
	}

	internal sealed class GIFMaker
	{
		private static int workerId = 1;

		private Thread m_Thread;

		private int m_Id;

		internal List<GifFrame> m_Frames;

		internal string m_FilePath;

		internal Action<int, float> m_OnFileSaveProgress;

		internal GIFMaker(System.Threading.ThreadPriority priority)
		{
			m_Id = workerId++;
			m_Thread = new Thread(Run);
			m_Thread.Priority = priority;
		}

		internal void Start()
		{
			m_Thread.Start();
		}

		private void Run()
		{
			for (int i = 0; i < m_Frames.Count; i++)
			{
				_ = m_Frames[i];
				if (m_OnFileSaveProgress != null)
				{
					float arg = (float)i / (float)m_Frames.Count;
					m_OnFileSaveProgress(m_Id, arg);
				}
			}
		}
	}

	private static LoadGifImage _instance;

	public Image imageGIF;

	public Queue<RenderTexture> m_Frames;

	[NonSerialized]
	public List<Texture2D> m_listText = new List<Texture2D>();

	[NonSerialized]
	public List<Sprite> m_sprite = new List<Sprite>();

	public static LoadGifImage Instance
	{
		get
		{
			if (_instance == null)
			{
				_instance = new LoadGifImage();
			}
			return _instance;
		}
	}

	protected LoadGifImage()
	{
	}

	protected void Awake()
	{
		_instance = this;
	}

	public void ClearData()
	{
		m_sprite.Clear();
		m_listText.Clear();
		imageGIF.sprite = null;
	}
}
