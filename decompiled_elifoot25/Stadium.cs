using System;
using UnityEngine;

[Serializable]
public class Stadium : EliObject
{
	private int numberSeats;

	private double occupancyRate = 0.5;

	public double OccupancyRate => occupancyRate;

	public int NumberSeats => numberSeats;

	public Stadium()
		: base(generateID: false)
	{
	}

	public void UpdateOccupancyRate(long attendance)
	{
		occupancyRate *= 0.8999999761581421;
		occupancyRate += 0.1f * (float)attendance / (float)numberSeats;
	}

	private void CheckValidNumberSeats()
	{
		numberSeats = numberSeats / DataManager.STADIUM_SEATS_BLOCK_SIZE * DataManager.STADIUM_SEATS_BLOCK_SIZE;
		numberSeats = Mathf.Clamp(numberSeats, DataManager.STADIUM_SEATS_BLOCK_SIZE, DataManager.STADIUM_MAX_NUMBER_SEATS);
	}

	public long GetNewBenchPrice()
	{
		if (numberSeats < 20000)
		{
			return DataManager.STADIUM_SEATS_BASE_BLOCK_PRICE;
		}
		if (numberSeats < 50000)
		{
			return DataManager.STADIUM_SEATS_BASE_BLOCK_PRICE * 2;
		}
		if (numberSeats < 70000)
		{
			return DataManager.STADIUM_SEATS_BASE_BLOCK_PRICE * 3;
		}
		return DataManager.STADIUM_SEATS_BASE_BLOCK_PRICE * 4;
	}

	public bool MayIncreaseNumberSeats()
	{
		return numberSeats < DataManager.STADIUM_MAX_NUMBER_SEATS;
	}

	public void SetInitialNumberSeats(int level)
	{
		numberSeats = (int)(1.0 * (double)level / (double)DataManager.PLAYER_SKILL_MAX * (double)DataManager.STADIUM_MAX_NUMBER_SEATS * 0.5);
		CheckValidNumberSeats();
	}

	public void IncreaseNumberSeats(int increase)
	{
		numberSeats += increase;
		CheckValidNumberSeats();
	}
}
