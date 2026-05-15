using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using UnityEngine;

public class CoachFireAndHire : MonoBehaviour
{
	public bool debug;

	public static CoachFireAndHire instance;

	private Stopwatch stopwatch = new Stopwatch();

	private ListOfTeams shuffledTeams;

	private void Awake()
	{
		instance = this;
	}

	public IEnumerator AnalyseCoachDismiss()
	{
		if (debug)
		{
			UnityEngine.Debug.Log("************ CoachFireAndHire -> AnalyseCoachDismiss START ************");
		}
		ListOfCoaches availableCoachesBasic = InitializeAndGetCoaches();
		int processedTeams = 0;
		int notProcessedTeams = 0;
		foreach (Team shuffledTeam in shuffledTeams)
		{
			if (shuffledTeam.shallAnalyseCoachDismiss)
			{
				if (shuffledTeam.Coach.CanFire())
				{
					if (shuffledTeam.GetLeagueDivision(CompetitionType.NationalLeague) == null)
					{
						yield return StartCoroutine(TryFireCoach(shuffledTeam, availableCoachesBasic));
					}
					else if (shuffledTeam.GetLeagueDivision(CompetitionType.NationalLeague).AcceptsHumanCoaches())
					{
						yield return StartCoroutine(TryFireCoach(shuffledTeam, availableCoachesBasic, FireCoach.AcceptHuman));
					}
					else
					{
						yield return StartCoroutine(TryFireCoach(shuffledTeam, availableCoachesBasic));
					}
					processedTeams++;
				}
				else
				{
					notProcessedTeams++;
				}
			}
			else
			{
				notProcessedTeams++;
			}
			if (stopwatch.ElapsedMilliseconds >= 1000)
			{
				break;
			}
		}
		foreach (Team shuffledTeam2 in shuffledTeams)
		{
			shuffledTeam2.shallAnalyseCoachDismiss = false;
		}
		stopwatch.Stop();
		if (debug)
		{
			if (shuffledTeams.Count - notProcessedTeams > 0)
			{
				UnityEngine.Debug.Log($"CoachFireAndHire -> AnalyseCoachDismiss END. Elapsed time: {stopwatch.ElapsedMilliseconds}ms\nProcessed teams: {processedTeams * 100 / (shuffledTeams.Count - notProcessedTeams)}% {processedTeams}/{shuffledTeams.Count - notProcessedTeams}");
			}
			else
			{
				UnityEngine.Debug.Log($"CoachFireAndHire -> AnalyseCoachDismiss END. Elapsed time: {stopwatch.ElapsedMilliseconds}ms\nProcessed teams: 100% 0/0");
			}
		}
	}

	private ListOfCoaches InitializeAndGetCoaches()
	{
		stopwatch.Restart();
		shuffledTeams = new ListOfTeams(DataManager.instance.allTeams);
		shuffledTeams.Shuffle();
		return DataManager.instance.allCoaches.AvailableCoachesBasic();
	}

	public IEnumerator TryResignCoach(Team teamResigningCoach)
	{
		ListOfCoaches availableCoachesBasic = InitializeAndGetCoaches();
		CoroutineWithData response = new CoroutineWithData(this, TryFireCoach(teamResigningCoach, availableCoachesBasic, FireCoach.Resign, FireCoach.Unemployed, FireCoach.MustFire));
		yield return response.coroutine;
		yield return (List<Coach.Invitation>)response.result;
	}

	public IEnumerator ForceFireCoach(Team teamFiringCoach)
	{
		ListOfCoaches availableCoachesBasic = InitializeAndGetCoaches();
		yield return StartCoroutine(TryFireCoach(teamFiringCoach, availableCoachesBasic, default(FireCoach)));
	}

	private IEnumerator TryFireCoach(Team teamWantsNewCoach, ListOfCoaches availableCoachesBasic, params FireCoach[] flags)
	{
		if (availableCoachesBasic == null)
		{
			availableCoachesBasic = DataManager.instance.allCoaches.AvailableCoachesBasic();
		}
		Coach coachTryingToFire = teamWantsNewCoach.Coach;
		if (!availableCoachesBasic.Contains(coachTryingToFire))
		{
			availableCoachesBasic.Add(coachTryingToFire);
		}
		coachTryingToFire.TryingToFire = true;
		CoroutineWithData response = new CoroutineWithData(this, FindSubstituteCoach_New20(teamWantsNewCoach, coachTryingToFire, availableCoachesBasic, new List<Coach.Invitation>(), oneHumanOnlyFound: false, flags));
		yield return response.coroutine;
		List<Coach.Invitation> invitationList = (List<Coach.Invitation>)response.result;
		if (invitationList != null && invitationList.Count != 0)
		{
			if (debug)
			{
				UnityEngine.Debug.Log("RESULT - Found cicle:");
			}
			if (Coach.HasFireCoachFlag(flags, FireCoach.Resign))
			{
				if (debug)
				{
					UnityEngine.Debug.Log("- Coach '" + coachTryingToFire.Name + "' from Team '" + teamWantsNewCoach.Name + "' resigned!");
				}
				DataManager.instance.properties.coachEventNews.Add(new Coach.CoachEventNews(coachTryingToFire, teamWantsNewCoach, null, isResign: true));
			}
			else
			{
				if (debug)
				{
					UnityEngine.Debug.Log("- Coach '" + coachTryingToFire.Name + "' from Team '" + teamWantsNewCoach.Name + "' is fired!");
				}
				DataManager.instance.properties.coachEventNews.Add(new Coach.CoachEventNews(coachTryingToFire, teamWantsNewCoach, null, isResign: false));
				if (coachTryingToFire.Present(ElifootOptions.SimulationFlag.Invitations))
				{
					stopwatch.Stop();
					yield return StartCoroutine(ScreenController.instance.ShowCoachEventView(Coach.CoachEvent.CoachEventType.Fired, coachTryingToFire, teamWantsNewCoach));
					stopwatch.Start();
				}
			}
			invitationList.Reverse();
			foreach (Coach.Invitation item in invitationList)
			{
				if (debug)
				{
					string text = ((item.coach.MyTeam != null) ? item.coach.MyTeam.ShortName : "null");
					UnityEngine.Debug.Log("- Coach '" + item.coach.Name + "' from Team '" + text + "' goes to Team '" + item.team.Name + "'");
				}
				if (item.coach.MyTeam == null)
				{
					DataManager.instance.properties.coachEventNews.Add(new Coach.CoachEventNews(null, null, null, item.team, item.coach, isResign: false));
				}
				else
				{
					DataManager.instance.properties.coachEventNews.Add(new Coach.CoachEventNews(null, item.team, item.coach, item.coach.MyTeam, null, isResign: false));
				}
				item.team.Coach = item.coach;
				availableCoachesBasic.Remove(item.coach);
				if (shuffledTeams != null)
				{
					shuffledTeams.SubtractOneFromCoachStartingIndex();
				}
			}
		}
		coachTryingToFire.TryingToFire = false;
		yield return invitationList;
	}

	private IEnumerator FindSubstituteCoach_New20(Team teamWantsNewCoach, Coach coachBeingFired, ListOfCoaches availableCoachesToHire, List<Coach.Invitation> coachInvitationsSoFar = null, bool oneHumanOnlyFound = false, params FireCoach[] flags)
	{
		ListOfCoaches availableCoachesToHireNext = new ListOfCoaches(availableCoachesToHire);
		for (int i = Mathf.Max(teamWantsNewCoach.findSubstituteCoachStartingIndex, 0); i < availableCoachesToHire.Count; i++)
		{
			if (stopwatch.ElapsedMilliseconds >= 1000)
			{
				yield return null;
				yield break;
			}
			teamWantsNewCoach.findSubstituteCoachStartingIndex = i;
			Coach coachToBeHired = availableCoachesToHire.Coach(i);
			if (!CoachCanBeHired(coachToBeHired, teamWantsNewCoach, oneHumanOnlyFound, flags))
			{
				continue;
			}
			coachToBeHired.OnInviteReceived();
			availableCoachesToHireNext.Remove(coachToBeHired);
			if (coachToBeHired.MyTeam != null && coachToBeHired != coachBeingFired)
			{
				if (coachToBeHired.Present(ElifootOptions.SimulationFlag.Invitations))
				{
					oneHumanOnlyFound = true;
				}
				CoroutineWithData rec = new CoroutineWithData(this, FindSubstituteCoach_New20(coachToBeHired.MyTeam, coachBeingFired, availableCoachesToHireNext, coachInvitationsSoFar, oneHumanOnlyFound, flags));
				yield return rec.coroutine;
				coachInvitationsSoFar = (List<Coach.Invitation>)rec.result;
				if (coachInvitationsSoFar == null || coachInvitationsSoFar.Count == 0)
				{
					continue;
				}
			}
			if (coachToBeHired.Present(ElifootOptions.SimulationFlag.Invitations))
			{
				stopwatch.Stop();
				CoroutineWithData rec = new CoroutineWithData(this, ScreenController.instance.ShowCoachEventView(Coach.CoachEvent.CoachEventType.Invited, coachToBeHired, teamWantsNewCoach));
				yield return rec.coroutine;
				bool num = (bool)rec.result;
				stopwatch.Start();
				if (!num)
				{
					coachInvitationsSoFar = new List<Coach.Invitation>();
					oneHumanOnlyFound = false;
					coachToBeHired.AddRefusedInvitation(teamWantsNewCoach);
					continue;
				}
			}
			try
			{
				if (coachInvitationsSoFar == null)
				{
					coachInvitationsSoFar = new List<Coach.Invitation>();
				}
				coachInvitationsSoFar.Add(new Coach.Invitation(coachToBeHired, teamWantsNewCoach));
			}
			catch (Exception ex)
			{
				UnityEngine.Debug.LogWarning("ERROR IN COACH FIRE AND HIRE");
				UnityEngine.Debug.LogWarning("ex: " + ex);
				UnityEngine.Debug.LogWarning("coachInvitationsSoFar: " + coachInvitationsSoFar);
				if (coachInvitationsSoFar == null)
				{
					UnityEngine.Debug.LogWarning("-> coachInvitationsSoFar is null");
				}
				else
				{
					UnityEngine.Debug.LogWarning("-> coachInvitationsSoFar is not null");
				}
			}
			break;
		}
		yield return coachInvitationsSoFar;
	}

	private bool CoachCanBeHired(Coach coachToBeHired, Team forThisTeam, bool oneHumanOnlyFound, params FireCoach[] flags)
	{
		if (coachToBeHired.MyTeam != null && coachToBeHired.MyTeam == forThisTeam)
		{
			return false;
		}
		if (coachToBeHired.Present(ElifootOptions.SimulationFlag.Invitations) && oneHumanOnlyFound)
		{
			return false;
		}
		if (!coachToBeHired.Present(ElifootOptions.SimulationFlag.Invitations) && !coachToBeHired.AcceptsInvitationByComputer(forThisTeam))
		{
			return false;
		}
		if (!coachToBeHired.CanReceiveMoreInvitations())
		{
			return false;
		}
		return coachToBeHired.CanHire(forThisTeam, null, flags) == CanHireCoach.OK;
	}
}
