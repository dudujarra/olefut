using System;
using System.Collections;
using UnityEngine;

public class LoadingCircle : MonoBehaviour
{
	public bool isLoading;

	private RectTransform rectComponent;

	private float rotateSpeed = 200f;

	private int maxLoadingCount = 1000;

	private IEnumerator CircleProgress()
	{
		int loadingCount = 0;
		Debug.Log("[" + DateTime.Now.ToString() + "] Start Loading!!");
		while (isLoading && loadingCount < maxLoadingCount)
		{
			rectComponent.Rotate(0f, 0f, rotateSpeed * Time.deltaTime);
			loadingCount++;
			yield return new WaitForSeconds(0.3f);
		}
		isLoading = false;
		Debug.Log("[" + DateTime.Now.ToString() + "] Stop Loading!!");
		yield return null;
	}

	public void SetLoading(bool loading)
	{
		isLoading = loading;
		if (isLoading)
		{
			rectComponent = GetComponent<RectTransform>();
			StartCoroutine(CircleProgress());
		}
		else
		{
			StopCoroutine(CircleProgress());
		}
	}
}
