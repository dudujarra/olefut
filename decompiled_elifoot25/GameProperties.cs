using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

[Serializable]
public class GameProperties
{
	public GameDay gameDay = new GameDay();

	public int currentSeasonNumber = 1;

	public GlobalCalendar globalCalendar = new GlobalCalendar();

	public int[] divConfigIndex = new int[Enum.GetValues(typeof(CompetitionType)).Length];

	public long lastUsedID;

	public static string gameId = Guid.NewGuid().ToString();

	public bool isSocialGame;

	public EliLimitedList playerTransferEventList;

	public EliLimitedList coachEventNews;

	[NonSerialized]
	private List<string> strPlayerTransferEventList;

	private List<string> strCoachEventNews = new List<string>();

	private int playerTransferEventListMaxLength;

	private int coachEventNewsMaxLength;

	private int lastWinnersMaxLength;

	public List<string> lastCompetitionIdsViewed = new List<string>();

	public List<long> favoriteCompetitions = new List<long>();

	public bool playRegionalLeagues = true;

	public bool playInternationalLeagues = true;

	public bool playSuperLeague;

	public void Save(BinaryFormatter bin, Stream stream, string saveGameVersion)
	{
		BeforeSave(saveGameVersion);
		DoSave(bin, stream, saveGameVersion);
	}

	private void BeforeSave(string saveGameVersion)
	{
		switch (saveGameVersion)
		{
		case "20200801":
		case "20200817":
		case "20200825":
		case "20201104":
		case "20201110":
		case "20201127":
		case "20210130":
		case "20210421":
		case "20220516":
		case "20220918":
		case "20251104":
			strPlayerTransferEventList = new List<string>();
			foreach (PlayerTransferEvent playerTransferEvent in playerTransferEventList)
			{
				strPlayerTransferEventList.Add(playerTransferEvent.ToSaveString());
			}
			playerTransferEventListMaxLength = playerTransferEventList.MaxLength;
			strCoachEventNews = new List<string>();
			foreach (Coach.CoachEventNews item in this.coachEventNews)
			{
				strCoachEventNews.Add(item.ToSaveString());
			}
			coachEventNewsMaxLength = coachEventNews.MaxLength;
			break;
		}
	}

	private void DoSave(BinaryFormatter bin, Stream stream, string saveGameVersion)
	{
		switch (saveGameVersion)
		{
		case "20200801":
		case "20200817":
		case "20200825":
		case "20201104":
		case "20201110":
		case "20201127":
		case "20210130":
		case "20210421":
		case "20220516":
		case "20220918":
		case "20251104":
			DataManager.instance.properties.BeforeSave(saveGameVersion);
			bin.Serialize(stream, DataManager.instance.properties.gameDay);
			bin.Serialize(stream, DataManager.instance.properties.currentSeasonNumber);
			bin.Serialize(stream, DataManager.instance.properties.globalCalendar);
			bin.Serialize(stream, DataManager.instance.properties.divConfigIndex);
			bin.Serialize(stream, DataManager.instance.properties.lastUsedID);
			bin.Serialize(stream, DataManager.instance.properties.isSocialGame);
			bin.Serialize(stream, gameId);
			bin.Serialize(stream, DataManager.instance.properties.playerTransferEventListMaxLength);
			bin.Serialize(stream, DataManager.instance.properties.strPlayerTransferEventList);
			bin.Serialize(stream, DataManager.instance.properties.coachEventNewsMaxLength);
			bin.Serialize(stream, DataManager.instance.properties.strCoachEventNews);
			if (saveGameVersion.CompareTo("20201127") == 0)
			{
				bin.Serialize(stream, DataManager.instance.properties.lastCompetitionIdsViewed);
			}
			bin.Serialize(stream, DataManager.instance.properties.favoriteCompetitions);
			bin.Serialize(stream, DataManager.instance.properties.playRegionalLeagues);
			bin.Serialize(stream, DataManager.instance.properties.playInternationalLeagues);
			bin.Serialize(stream, DataManager.instance.properties.playSuperLeague);
			break;
		}
	}

	public void DoLoad(BinaryFormatter bin, Stream stream, string saveGameVersion)
	{
		int num = 0;
		switch (saveGameVersion)
		{
		case "20200801":
		case "20200817":
		case "20200825":
		case "20201104":
		case "20201110":
		case "20201127":
		case "20210130":
		case "20210421":
		case "20220516":
		case "20220918":
		case "20251104":
			DataManager.instance.properties.gameDay = (GameDay)bin.Deserialize(stream);
			DataManager.instance.properties.currentSeasonNumber = (int)bin.Deserialize(stream);
			DataManager.instance.properties.globalCalendar = (GlobalCalendar)bin.Deserialize(stream);
			if (saveGameVersion.CompareTo("20210130") <= 0)
			{
				num = (int)bin.Deserialize(stream);
				DataManager.instance.properties.divConfigIndex[0] = num;
			}
			else
			{
				DataManager.instance.properties.divConfigIndex = (int[])bin.Deserialize(stream);
			}
			DataManager.instance.properties.lastUsedID = (long)bin.Deserialize(stream);
			if (saveGameVersion.CompareTo("20251104") < 0)
			{
				_ = (long)bin.Deserialize(stream);
			}
			DataManager.instance.properties.isSocialGame = (bool)bin.Deserialize(stream);
			gameId = (string)bin.Deserialize(stream);
			DataManager.instance.properties.playerTransferEventListMaxLength = (int)bin.Deserialize(stream);
			DataManager.instance.properties.strPlayerTransferEventList = (List<string>)bin.Deserialize(stream);
			DataManager.instance.properties.coachEventNewsMaxLength = (int)bin.Deserialize(stream);
			DataManager.instance.properties.coachEventNewsMaxLength = 100000;
			DataManager.instance.properties.strCoachEventNews = (List<string>)bin.Deserialize(stream);
			if (saveGameVersion.CompareTo("20201127") == 0)
			{
				DataManager.instance.properties.lastCompetitionIdsViewed = (List<string>)bin.Deserialize(stream);
			}
			if (saveGameVersion.CompareTo("20210130") >= 0)
			{
				DataManager.instance.properties.favoriteCompetitions = (List<long>)bin.Deserialize(stream);
			}
			if (saveGameVersion.CompareTo("20210130") <= 0)
			{
				Array.Clear(divConfigIndex, 0, divConfigIndex.Length);
				divConfigIndex[0] = num;
			}
			if (saveGameVersion.CompareTo("20220516") >= 0)
			{
				DataManager.instance.properties.playRegionalLeagues = (bool)bin.Deserialize(stream);
				DataManager.instance.properties.playInternationalLeagues = (bool)bin.Deserialize(stream);
				DataManager.instance.properties.playSuperLeague = (bool)bin.Deserialize(stream);
			}
			break;
		}
	}

	public void AfterLoad(string saveGameVersion)
	{
		switch (saveGameVersion)
		{
		case "20200801":
		case "20200817":
		case "20200825":
		case "20201104":
		case "20201110":
		case "20201127":
		case "20210130":
		case "20210421":
		case "20220516":
		case "20220918":
		case "20251104":
			playerTransferEventList = new EliLimitedList(playerTransferEventListMaxLength);
			foreach (string strPlayerTransferEvent in strPlayerTransferEventList)
			{
				playerTransferEventList.Add(new PlayerTransferEvent(strPlayerTransferEvent));
			}
			strPlayerTransferEventList = null;
			coachEventNews = new EliLimitedList(coachEventNewsMaxLength);
			foreach (string item in strCoachEventNews)
			{
				coachEventNews.Add(new Coach.CoachEventNews(item));
			}
			strCoachEventNews = null;
			break;
		}
	}

	public void Reset()
	{
		currentSeasonNumber = Math.Max(2015, DateTime.Now.Year);
		gameDay.Reset();
		lastUsedID = 0L;
		isSocialGame = false;
	}

	public void AddFavoriteCompetition(Competition competition)
	{
		favoriteCompetitions.Remove(competition.ID);
		favoriteCompetitions.Add(competition.ID);
	}
}
