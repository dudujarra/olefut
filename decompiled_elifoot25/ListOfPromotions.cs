using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;

[Serializable]
public class ListOfPromotions : EliList
{
	public void Initialize()
	{
	}

	public void Add(Promotion promotion)
	{
		Promotion promotion2 = (Promotion)Find((EliObject p) => ((Promotion)p).promotionId == promotion.promotionId);
		if (promotion2 == null)
		{
			Add((EliObject)promotion);
			return;
		}
		promotion2.PromotionValue = promotion.PromotionValue;
		promotion2.bodyText = promotion.bodyText;
		promotion2.caption = promotion.caption;
		promotion2.gameValue = promotion.gameValue;
		promotion2.persistent = promotion.persistent;
		promotion2.type = promotion.type;
		promotion2.Period = promotion.Period;
	}

	public void ReadFromFile()
	{
		try
		{
			string text = Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH) + "/" + DataManager.PROMOTION_FILE_NAME;
			string text2 = Path.Combine(Application.persistentDataPath, DataManager.SAVELOAD_PATH) + "/" + DataManager.PROMOTION_FILE_NAME;
			if (!File.Exists(text))
			{
				if (!File.Exists(text2))
				{
					return;
				}
				File.Move(text2, text);
				File.Delete(text2);
			}
			using Stream stream = File.Open(text, FileMode.Open, FileAccess.Read);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			while (stream.Position < stream.Length)
			{
				Promotion promotion = (Promotion)binaryFormatter.Deserialize(stream);
				Add(promotion);
			}
		}
		catch (Exception ex)
		{
			Debug.LogError("ERROR Reading promotions - " + ex.Message);
		}
	}

	public void SaveToFile()
	{
		try
		{
			if (!Directory.Exists(Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH)))
			{
				Directory.CreateDirectory(Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH));
			}
			using Stream stream = File.Open(Path.Combine(Application.persistentDataPath, DataManager.DATA_PATH) + "/" + DataManager.PROMOTION_FILE_NAME, FileMode.Create);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			using (Enumerator enumerator = GetEnumerator())
			{
				while (enumerator.MoveNext())
				{
					Promotion graph = (Promotion)enumerator.Current;
					binaryFormatter.Serialize(stream, graph);
				}
			}
			stream.Close();
		}
		catch (Exception ex)
		{
			Debug.LogError("ERROR Saving promotions - " + ex.Message);
		}
	}

	public void ApplyPromotions(bool showDialogs)
	{
		using (Enumerator enumerator = GetEnumerator())
		{
			while (enumerator.MoveNext())
			{
				((Promotion)enumerator.Current).Use(showDialogs);
			}
		}
		SaveToFile();
	}
}
