using UnityEngine;

[CreateAssetMenu(fileName = "New ItemToBuy", menuName = "ScriptableObject/New ItemToBuy")]
public class ItemToBuy : ScriptableObject
{
	public Sprite image;

	public Color imageColor = Color.white;

	[SerializeField]
	private string descriptionTag;

	public string title;

	public int coinsCost;

	[Space]
	[TextArea(5, 10)]
	[SerializeField]
	private string infoOnly;

	public string Description => LanguageController.instance.Get_Translation(descriptionTag);
}
