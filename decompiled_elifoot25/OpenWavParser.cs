using System;
using System.Collections.Generic;
using UnityEngine;

public static class OpenWavParser
{
	public static AudioClip ByteArrayToAudioClip(byte[] wavFile, string name = "", bool stream = false)
	{
		int num = BitConverter.ToInt32(wavFile, 16);
		int num2 = BitConverter.ToInt16(wavFile, 20);
		int channels = BitConverter.ToInt16(wavFile, 22);
		int frequency = BitConverter.ToInt32(wavFile, 24);
		int num3 = BitConverter.ToInt16(wavFile, 34);
		int num4 = 20 + num;
		for (int i = num4; i < wavFile.Length; i++)
		{
			if (wavFile[i] == 100 && wavFile[i + 1] == 97 && wavFile[i + 2] == 116 && wavFile[i + 3] == 97)
			{
				num4 = i + 4;
				break;
			}
		}
		int num5 = BitConverter.ToInt32(wavFile, num4);
		num4 += 4;
		int num6 = num3 / 8;
		int num7 = num5 / num6;
		if (num2 == 1)
		{
			float[] array = new float[num7];
			for (int j = 0; j < num7; j++)
			{
				int startIndex = num4 + j * num6;
				float num8 = (float)BitConverter.ToInt16(wavFile, startIndex) / 32768f;
				array[j] = num8;
			}
			AudioClip audioClip = AudioClip.Create(name, num7, channels, frequency, stream);
			audioClip.SetData(array, 0);
			return audioClip;
		}
		Debug.LogError("[OpenWavParser.ByteArrayToAudioClip] Compressed wav format not supported.");
		return null;
	}

	public static byte[] AudioClipToByteArray(AudioClip clip)
	{
		float[] array = new float[clip.samples];
		clip.GetData(array, 0);
		List<byte> list = new List<byte>();
		list.AddRange(new byte[4] { 82, 73, 70, 70 });
		list.AddRange(BitConverter.GetBytes(array.Length * 2 + 44 - 8));
		list.AddRange(new byte[4] { 87, 65, 86, 69 });
		list.AddRange(new byte[4] { 102, 109, 116, 32 });
		list.AddRange(BitConverter.GetBytes(16));
		list.AddRange(BitConverter.GetBytes((ushort)1));
		list.AddRange(BitConverter.GetBytes((ushort)clip.channels));
		list.AddRange(BitConverter.GetBytes(clip.frequency));
		list.AddRange(BitConverter.GetBytes(clip.frequency * clip.channels * 2));
		list.AddRange(BitConverter.GetBytes((ushort)(clip.channels * 2)));
		list.AddRange(BitConverter.GetBytes((ushort)16));
		list.AddRange(new byte[4] { 100, 97, 116, 97 });
		list.AddRange(BitConverter.GetBytes(array.Length * 2));
		for (int i = 0; i < array.Length; i++)
		{
			short value = (short)(array[i] * 32768f);
			list.AddRange(BitConverter.GetBytes(value));
		}
		return list.ToArray();
	}
}
