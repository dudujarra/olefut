using UnityEngine;
using UnityEngine.SceneManagement;

public class InitLoader : MonoBehaviour
{
	private void Start()
	{
		LanguageController.instance.StartController();
		Invoke("LoadMainScene", 0.1f);
	}

	private void LoadMainScene()
	{
		SceneManager.LoadScene("_Main", LoadSceneMode.Single);
	}
}
