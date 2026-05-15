using UnityEngine;
using UnityEngine.UI;

public class SavedGameCoachPrefab : MonoBehaviour
{
	public Text coachName;

	public Text coachTeam;

	public void Initialize(string coachName, string coachTeam)
	{
		this.coachName.text = coachName;
		this.coachTeam.text = ((coachTeam != "") ? coachTeam : LanguageController.instance.Get_Translation("COACH_UNEMPLOYED"));
	}
}
