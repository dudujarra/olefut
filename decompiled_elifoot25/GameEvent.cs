using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "GameEvent", menuName = "ScriptableObject/New Game Event", order = 1)]
public class GameEvent : ScriptableObject
{
	private Dictionary<Type, Delegate> eventTable = new Dictionary<Type, Delegate>();

	private List<Action> noParamListeners = new List<Action>();

	private Dictionary<Type, object> lastValues = new Dictionary<Type, object>();

	private bool lastNoParamEventRaised;

	internal void Raise<T>(T value)
	{
		lastValues[typeof(T)] = value;
		if (eventTable.TryGetValue(typeof(T), out var value2))
		{
			(value2 as Action<T>)?.Invoke(value);
		}
		else
		{
			Debug.LogWarning($"No subscribers for event of type {typeof(T)}");
		}
		foreach (Action noParamListener in noParamListeners)
		{
			noParamListener?.Invoke();
		}
	}

	internal void Raise()
	{
		lastNoParamEventRaised = true;
		foreach (Action noParamListener in noParamListeners)
		{
			noParamListener?.Invoke();
		}
	}

	internal void Subscribe<T>(Action<T> listener)
	{
		if (eventTable.TryGetValue(typeof(T), out var value))
		{
			eventTable[typeof(T)] = Delegate.Combine(value, listener);
		}
		else
		{
			eventTable[typeof(T)] = listener;
		}
	}

	internal void Subscribe(Action listener)
	{
		noParamListeners.Add(listener);
	}

	internal void Unsubscribe<T>(Action<T> listener)
	{
		if (eventTable.TryGetValue(typeof(T), out var value))
		{
			Delegate obj = Delegate.Remove(value, listener);
			if ((object)obj == null)
			{
				eventTable.Remove(typeof(T));
			}
			else
			{
				eventTable[typeof(T)] = obj;
			}
		}
	}

	internal void Unsubscribe(Action listener)
	{
		noParamListeners.Remove(listener);
	}

	internal bool TryGetLastValue<T>(out T lastValue)
	{
		if (lastValues.TryGetValue(typeof(T), out var value))
		{
			lastValue = (T)value;
			return true;
		}
		lastValue = default(T);
		return false;
	}

	internal bool WasNoParamEventRaised()
	{
		return lastNoParamEventRaised;
	}

	internal void ClearLastValues()
	{
		lastValues.Clear();
		lastNoParamEventRaised = false;
	}
}
