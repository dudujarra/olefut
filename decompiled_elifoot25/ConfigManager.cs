using System;
using System.Collections.Generic;
using UnityEngine;

public class ConfigManager : MonoBehaviour
{
	public TextAsset configFile;

	public static Dictionary<string, string> configDictionary = new Dictionary<string, string>();

	[HideInInspector]
	public Color DEFAULT_TEXTCOLOR;

	[HideInInspector]
	public Color BACKGROUND_STANDARD_COLOR;

	[HideInInspector]
	public Color COLOR_GOAL_HUMAN;

	[HideInInspector]
	public Color COLOR_GOAL_STANDARD_TEXT;

	[HideInInspector]
	public Color COLOR_GOAL_PENALTY_SHOOTOUT_WON_TEXT;

	[HideInInspector]
	public Color COLOR_GOAL_PENALTY_SHOOTOUT_LOST_TEXT;

	[HideInInspector]
	public Color COLOR_GOAL_STANDARD_BACKGROUND;

	[HideInInspector]
	public Color COLOR_GOAL_PENALTY_SHOOTOUT_WON_BACKGROUND;

	[HideInInspector]
	public Color COLOR_GOAL_PENALTY_SHOOTOUT_LOST_BACKGROUND;

	[HideInInspector]
	public Color COLOR_OBSCURE_LIST_LIGHT;

	[HideInInspector]
	public Color COLOR_OBSCURE_LIST_DARK;

	[HideInInspector]
	public Color COLOR_OBSCURE_LIST_PROMOTION;

	[HideInInspector]
	public Color COLOR_OBSCURE_LIST_RELEGATION;

	[HideInInspector]
	public Color COLOR_COACH_HUMAN;

	[HideInInspector]
	public Color COLOR_COACH_STANDARD;

	[HideInInspector]
	public Color COLOR_CLOCK_BEFORE_MATCH;

	[HideInInspector]
	public Color COLOR_CLOCK_NORMAL;

	[HideInInspector]
	public Color COLOR_CLOCK_ENDING;

	[HideInInspector]
	public Color COLOR_CLOCK_FINISHED;

	[HideInInspector]
	public Color COLOR_STADIUM_FULL;

	[HideInInspector]
	public Color COLOR_STADIUM_EMPTY;

	[HideInInspector]
	public Color COLOR_GOALS_FIRST_LEG;

	[HideInInspector]
	public Font MenuItem_Title_Font;

	[HideInInspector]
	public Color MenuItem_Title_TextColor;

	[HideInInspector]
	public Color MenuItem_Title_BackgroundColor;

	[HideInInspector]
	public Font MenuItem_Standard_Font;

	[HideInInspector]
	public Color MenuItem_Standard_TextColor;

	[HideInInspector]
	public Color MenuItem_Standard_BackgroundColor;

	[HideInInspector]
	public Font MenuItem_Highlight_Font;

	[HideInInspector]
	public Color MenuItem_Highlight_TextColor;

	[HideInInspector]
	public Color MenuItem_Highlight_BackgroundColor;

	[HideInInspector]
	public Font MenuItem_Disabled_Font;

	[HideInInspector]
	public Color MenuItem_Disabled_TextColor;

	[HideInInspector]
	public Color MenuItem_Disabled_BackgroundColor;

	[HideInInspector]
	public Font MenuItem_Cancel_Font;

	[HideInInspector]
	public Color MenuItem_Cancel_TextColor;

	[HideInInspector]
	public Color MenuItem_Cancel_BackgroundColor;

	[HideInInspector]
	public Color MatchEvent_Home_Color;

	[HideInInspector]
	public Color MatchEvent_Away_Color;

	public static ConfigManager instance;

	private void Awake()
	{
		instance = this;
		if (configFile != null)
		{
			ParseConfigFile();
		}
	}

	public void ParseConfigFile()
	{
		configDictionary.Clear();
		int num = 0;
		string[] array = configFile.text.Split('\n');
		foreach (string text in array)
		{
			num++;
			if (text.StartsWith(";"))
			{
				continue;
			}
			string text2 = Util.TrimEndCrLf(text);
			string[] array2 = text2.Split(':');
			if (array2.Length == 1 && string.IsNullOrEmpty(array2[0]))
			{
				continue;
			}
			if (array2.Length != 2)
			{
				Debug.LogWarning($"1003: Invalid line (nr {num}) in config file ignored: " + text2);
				continue;
			}
			string text3 = array2[0];
			string text4 = array2[1];
			try
			{
				if (configDictionary.ContainsKey(text3))
				{
					Debug.LogWarning("1004: configDictionary already contains key " + text3 + ". Ignoring new entry at line " + text2);
					continue;
				}
				while (text4.StartsWith("#"))
				{
					if (configDictionary.ContainsKey(text4))
					{
						text4 = configDictionary[text4];
						continue;
					}
					Debug.LogWarning("1005: No entry found in configDictionary for key " + text4 + ". Line " + text2 + " not processed.");
					break;
				}
				configDictionary.Add(text3, text4);
			}
			catch (Exception ex)
			{
				Debug.LogError("Error adding to dicionary (" + text3 + ", " + text4 + "\nLine: " + text2 + "\n" + ex.Message + ")");
			}
		}
		foreach (KeyValuePair<string, string> item in configDictionary)
		{
			string text5 = item.Key.Trim().ToUpper();
			string text6 = null;
			if (item.Value.StartsWith("#"))
			{
				try
				{
					text6 = configDictionary[item.Value];
				}
				catch
				{
					Debug.Log("Key not found: " + item.Value);
				}
			}
			else
			{
				text6 = item.Value;
			}
			try
			{
				if (text6 != null)
				{
					switch (text5)
					{
					case "DEFAULT_TEXTCOLOR":
						DEFAULT_TEXTCOLOR = Util.ParseColor(text6);
						break;
					case "BACKGROUND_STANDARD_COLOR":
						BACKGROUND_STANDARD_COLOR = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_HUMAN":
						COLOR_GOAL_HUMAN = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_STANDARD_TEXT":
						COLOR_GOAL_STANDARD_TEXT = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_STANDARD_BACKGROUND":
						COLOR_GOAL_STANDARD_BACKGROUND = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_PENALTY_SHOOTOUT_WON_TEXT":
						COLOR_GOAL_PENALTY_SHOOTOUT_WON_TEXT = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_PENALTY_SHOOTOUT_WON_BACKGROUND":
						COLOR_GOAL_PENALTY_SHOOTOUT_WON_BACKGROUND = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_PENALTY_SHOOTOUT_LOST_TEXT":
						COLOR_GOAL_PENALTY_SHOOTOUT_LOST_TEXT = Util.ParseColor(text6);
						break;
					case "COLOR_GOAL_PENALTY_SHOOTOUT_LOST_BACKGROUND":
						COLOR_GOAL_PENALTY_SHOOTOUT_LOST_BACKGROUND = Util.ParseColor(text6);
						break;
					case "COLOR_GOALS_FIRST_LEG":
						COLOR_GOALS_FIRST_LEG = Util.ParseColor(text6);
						break;
					case "COLOR_OBSCURE_LIST_LIGHT":
						COLOR_OBSCURE_LIST_LIGHT = Util.ParseColor(text6);
						break;
					case "COLOR_OBSCURE_LIST_DARK":
						COLOR_OBSCURE_LIST_DARK = Util.ParseColor(text6);
						break;
					case "COLOR_OBSCURE_LIST_PROMOTION":
						COLOR_OBSCURE_LIST_PROMOTION = Util.ParseColor(text6);
						break;
					case "COLOR_OBSCURE_LIST_RELEGATION":
						COLOR_OBSCURE_LIST_RELEGATION = Util.ParseColor(text6);
						break;
					case "COLOR_COACH_STANDARD":
						COLOR_COACH_STANDARD = Util.ParseColor(text6);
						break;
					case "COLOR_COACH_HUMAN":
						COLOR_COACH_HUMAN = Util.ParseColor(text6);
						break;
					case "COLOR_CLOCK_BEFORE_MATCH":
						COLOR_CLOCK_BEFORE_MATCH = Util.ParseColor(text6);
						break;
					case "COLOR_CLOCK_NORMAL":
						COLOR_CLOCK_NORMAL = Util.ParseColor(text6);
						break;
					case "COLOR_CLOCK_ENDING":
						COLOR_CLOCK_ENDING = Util.ParseColor(text6);
						break;
					case "COLOR_CLOCK_FINISHED":
						COLOR_CLOCK_FINISHED = Util.ParseColor(text6);
						break;
					case "COLOR_STADIUM_FULL":
						COLOR_STADIUM_FULL = Util.ParseColor(text6);
						break;
					case "COLOR_STADIUM_EMPTY":
						COLOR_STADIUM_EMPTY = Util.ParseColor(text6);
						break;
					case "MENUITEM_TITLE_FONT":
						MenuItem_Title_Font = Util.LoadFont(text6);
						break;
					case "MENUITEM_TITLE_TEXTCOLOR":
						MenuItem_Title_TextColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_TITLE_BACKGROUNDCOLOR":
						MenuItem_Title_BackgroundColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_STANDARD_FONT":
						MenuItem_Standard_Font = Util.LoadFont(text6);
						break;
					case "MENUITEM_STANDARD_TEXTCOLOR":
						MenuItem_Standard_TextColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_STANDARD_BACKGROUNDCOLOR":
						MenuItem_Standard_BackgroundColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_HIGHLIGHT_FONT":
						MenuItem_Highlight_Font = Util.LoadFont(text6);
						break;
					case "MENUITEM_HIGHLIGHT_TEXTCOLOR":
						MenuItem_Highlight_TextColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_HIGHLIGHT_BACKGROUNDCOLOR":
						MenuItem_Highlight_BackgroundColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_DISABLED_FONT":
						MenuItem_Disabled_Font = Util.LoadFont(text6);
						break;
					case "MENUITEM_DISABLED_TEXTCOLOR":
						MenuItem_Disabled_TextColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_DISABLED_BACKGROUNDCOLOR":
						MenuItem_Disabled_BackgroundColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_CANCEL_TEXTCOLOR":
						MenuItem_Cancel_TextColor = Util.ParseColor(text6);
						break;
					case "MENUITEM_CANCEL_FONT":
						MenuItem_Cancel_Font = Util.LoadFont(text6);
						break;
					case "MENUITEM_CANCEL_BACKGROUNDCOLOR":
						MenuItem_Cancel_BackgroundColor = Util.ParseColor(text6);
						break;
					case "MATCHEVENT_HOME_COLOR":
						MatchEvent_Home_Color = Util.ParseColor(text6);
						break;
					case "MATCHEVENT_AWAY_COLOR":
						MatchEvent_Away_Color = Util.ParseColor(text6);
						break;
					}
				}
			}
			catch
			{
				Debug.LogError("Error applying color. DataManager.ParseConfigFile(). Key=" + text5 + "; value=" + text6);
			}
		}
	}
}
