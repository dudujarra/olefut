using System.Collections.Generic;
using UnityEngine;

public static class TextureExtension
{
	public struct Point(short aX, short aY)
	{
		public short x = aX;

		public short y = aY;

		public Point(int aX, int aY)
			: this((short)aX, (short)aY)
		{
		}
	}

	public static void FloodFillArea(this Texture2D aTex, int aX, int aY, Color aFillColor)
	{
		int width = aTex.width;
		int height = aTex.height;
		Color[] pixels = aTex.GetPixels();
		Color color = pixels[aX + aY * width];
		Queue<Point> queue = new Queue<Point>();
		queue.Enqueue(new Point(aX, aY));
		while (queue.Count > 0)
		{
			Point point = queue.Dequeue();
			for (int i = point.x; i < width; i++)
			{
				Color color2 = pixels[i + point.y * width];
				if (color2 != color || color2 == aFillColor)
				{
					break;
				}
				pixels[i + point.y * width] = aFillColor;
				if (point.y + 1 < height)
				{
					color2 = pixels[i + point.y * width + width];
					if (color2 == color && color2 != aFillColor)
					{
						queue.Enqueue(new Point(i, point.y + 1));
					}
				}
				if (point.y - 1 >= 0)
				{
					color2 = pixels[i + point.y * width - width];
					if (color2 == color && color2 != aFillColor)
					{
						queue.Enqueue(new Point(i, point.y - 1));
					}
				}
			}
			for (int num = point.x - 1; num >= 0; num--)
			{
				Color color3 = pixels[num + point.y * width];
				if (color3 != color || color3 == aFillColor)
				{
					break;
				}
				pixels[num + point.y * width] = aFillColor;
				if (point.y + 1 < height)
				{
					color3 = pixels[num + point.y * width + width];
					if (color3 == color && color3 != aFillColor)
					{
						queue.Enqueue(new Point(num, point.y + 1));
					}
				}
				if (point.y - 1 >= 0)
				{
					color3 = pixels[num + point.y * width - width];
					if (color3 == color && color3 != aFillColor)
					{
						queue.Enqueue(new Point(num, point.y - 1));
					}
				}
			}
		}
		aTex.SetPixels(pixels);
	}

	public static void FloodFillBorder(this Texture2D aTex, int aX, int aY, Color aFillColor, Color aBorderColor)
	{
		int width = aTex.width;
		int height = aTex.height;
		Color[] pixels = aTex.GetPixels();
		byte[] array = new byte[pixels.Length];
		Queue<Point> queue = new Queue<Point>();
		queue.Enqueue(new Point(aX, aY));
		while (queue.Count > 0)
		{
			Point point = queue.Dequeue();
			for (int i = point.x; i < width && array[i + point.y * width] <= 0 && !(pixels[i + point.y * width] == aBorderColor); i++)
			{
				pixels[i + point.y * width] = aFillColor;
				array[i + point.y * width] = 1;
				if (point.y + 1 < height && array[i + point.y * width + width] == 0 && pixels[i + point.y * width + width] != aBorderColor)
				{
					queue.Enqueue(new Point(i, point.y + 1));
				}
				if (point.y - 1 >= 0 && array[i + point.y * width - width] == 0 && pixels[i + point.y * width - width] != aBorderColor)
				{
					queue.Enqueue(new Point(i, point.y - 1));
				}
			}
			int num = point.x - 1;
			while (num >= 0 && array[num + point.y * width] <= 0 && !(pixels[num + point.y * width] == aBorderColor))
			{
				pixels[num + point.y * width] = aFillColor;
				array[num + point.y * width] = 1;
				if (point.y + 1 < height && array[num + point.y * width + width] == 0 && pixels[num + point.y * width + width] != aBorderColor)
				{
					queue.Enqueue(new Point(num, point.y + 1));
				}
				if (point.y - 1 >= 0 && array[num + point.y * width - width] == 0 && pixels[num + point.y * width - width] != aBorderColor)
				{
					queue.Enqueue(new Point(num, point.y - 1));
				}
				num--;
			}
		}
		aTex.SetPixels(pixels);
	}
}
