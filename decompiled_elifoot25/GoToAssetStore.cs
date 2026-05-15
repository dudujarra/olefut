using UnityEngine;

public class GoToAssetStore : MonoBehaviour
{
	[SerializeField]
	private string url = "https://www.assetstore.unity3d.com/#!/content/67183";

	public void GoToTheAssetStore()
	{
		Application.OpenURL(url);
	}
}
