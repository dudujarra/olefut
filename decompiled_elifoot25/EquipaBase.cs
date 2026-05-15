using System.Collections.Generic;
using System.Collections.ObjectModel;
using UnityEngine;

public class EquipaBase : EliObject
{
	private ListOfPlayers jogadores = new ListOfPlayers();

	private int numJogadores;

	public IList<EliObject> Jogadores
	{
		get
		{
			ReadOnlyCollection<EliObject> readOnlyCollection = jogadores.AsReadOnly();
			_ = (ListOfPlayers)(object)readOnlyCollection;
			return readOnlyCollection;
		}
	}

	public void AddJogador(Player j)
	{
		jogadores.Add(j);
		numJogadores++;
	}

	public void RemoveJogador(Player j)
	{
		if (jogadores.Remove(j))
		{
			numJogadores--;
		}
	}

	public void DumpJogadores()
	{
		Debug.LogFormat("Num jogadores: {0}", numJogadores);
		foreach (Player jogadore in jogadores)
		{
			Debug.Log(jogadore.Name);
		}
	}

	public EquipaBase()
		: base(generateID: true)
	{
	}
}
