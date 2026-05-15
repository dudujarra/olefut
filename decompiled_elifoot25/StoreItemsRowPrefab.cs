using System.Collections.Generic;
using UnityEngine;

public class StoreItemsRowPrefab : MonoBehaviour
{
	[SerializeField]
	private RectTransform horizontalList;

	[SerializeField]
	private StoreItemPrefab storeItemPrefab;

	public readonly List<StoreItemPrefab> itemsList = new List<StoreItemPrefab>();

	public void Initialize(int numberOfPrefabs, float prefabSize)
	{
		for (int i = 0; i < numberOfPrefabs; i++)
		{
			StoreItemPrefab storeItemPrefab = Object.Instantiate(this.storeItemPrefab, horizontalList);
			storeItemPrefab.GetComponent<RectTransform>().sizeDelta = new Vector2(prefabSize, 0f);
			itemsList.Add(storeItemPrefab);
		}
	}

	public void RedrawAllPrefabs()
	{
		foreach (StoreItemPrefab items in itemsList)
		{
			items.RedrawPrefab();
		}
	}
}
