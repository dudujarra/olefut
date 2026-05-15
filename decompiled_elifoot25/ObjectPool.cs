using System;
using System.Collections.Generic;
using UnityEngine;

public class ObjectPool : MonoBehaviour
{
	[SerializeField]
	private GameObject prefab;

	private readonly Queue<GameObject> prefabPool = new Queue<GameObject>();

	public GameObject GetPrefab()
	{
		CheckIfPoolIsNotEmpty();
		return DequeuePrefab();
	}

	public T GetPrefabOfType<T>()
	{
		CheckIfPoolIsNotEmpty();
		return (T)Convert.ChangeType(DequeuePrefab(), typeof(T));
	}

	private void CheckIfPoolIsNotEmpty()
	{
		if (prefabPool.Count == 0)
		{
			CreateObjectToPool(1);
		}
	}

	private GameObject DequeuePrefab()
	{
		GameObject obj = prefabPool.Dequeue();
		obj.SetActive(value: true);
		return obj;
	}

	public List<GameObject> GetSomePrefabs(int number)
	{
		CheckIfPoolHaveEnoughPrefabs(number);
		List<GameObject> list = new List<GameObject>();
		for (int i = 0; i < number; i++)
		{
			list.Add(DequeuePrefab());
		}
		return list;
	}

	public List<T> GetSomePrefabsOfType<T>(int number)
	{
		CheckIfPoolHaveEnoughPrefabs(number);
		List<T> list = new List<T>();
		for (int i = 0; i < number; i++)
		{
			list.Add((T)Convert.ChangeType(DequeuePrefab(), typeof(T)));
		}
		return list;
	}

	private void CheckIfPoolHaveEnoughPrefabs(int number)
	{
		if (number <= 0)
		{
			throw new Exception("ObjectPool.GetSomePrefabs number needs to be greater than 0");
		}
		if (prefabPool.Count < number)
		{
			CreateObjectToPool(number - prefabPool.Count);
		}
	}

	private void CreateObjectToPool(int number)
	{
		for (int i = 0; i < number; i++)
		{
			prefabPool.Enqueue(UnityEngine.Object.Instantiate(prefab, base.transform));
		}
	}

	public void ReturnPrefabToPool(GameObject prefabToReturn)
	{
		prefabToReturn.SetActive(value: false);
		prefabPool.Enqueue(prefabToReturn);
	}

	public void SetNewPrefab(GameObject newPrefab)
	{
		prefab = newPrefab;
	}
}
