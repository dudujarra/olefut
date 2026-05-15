using System;
using Unity.Services.Core;
using Unity.Services.Core.Environments;
using UnityEngine;
using UnityEngine.UI;

namespace Samples.Purchasing.Core.InitializeGamingServices;

public class InitializeGamingServices : MonoBehaviour
{
	public Text informationText;

	private const string k_Environment = "production";

	private void Awake()
	{
		Initialize(OnSuccess, OnError);
	}

	private void Initialize(Action onSuccess, Action<string> onError)
	{
		try
		{
			UnityServices.InitializeAsync(new InitializationOptions().SetEnvironmentName("production")).ContinueWith(delegate
			{
				onSuccess();
			});
		}
		catch (Exception ex)
		{
			onError(ex.Message);
		}
	}

	private void OnSuccess()
	{
		string text = "Congratulations!\nUnity Gaming Services has been successfully initialized.";
		informationText.text = text;
		Debug.Log(text);
	}

	private void OnError(string message)
	{
		string text = "Unity Gaming Services failed to initialize with error: " + message + ".";
		informationText.text = text;
		Debug.LogError(text);
	}

	private void Start()
	{
		if (UnityServices.State == ServicesInitializationState.Uninitialized)
		{
			Debug.LogError("Error: Unity Gaming Services not initialized.\nTo initialize Unity Gaming Services, open the file \"InitializeGamingServices.cs\" and uncomment the line \"Initialize(OnSuccess, OnError);\" in the \"Awake\" method.");
		}
	}
}
