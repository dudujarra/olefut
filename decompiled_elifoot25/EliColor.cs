using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Image))]
public class EliColor : EliComponent
{
	[Header("EliColor")]
	public string imageStyle = "";

	private Image image;

	private void Awake()
	{
		image = GetComponent<Image>();
	}

	private void Start()
	{
		ReloadElementConfig();
	}

	public override void ReloadElementConfig()
	{
	}
}
