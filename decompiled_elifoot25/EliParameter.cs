using System;
using UnityEngine;

public class EliParameter : EliObject
{
	public class ButtonConfig
	{
		public string secondText;

		public TextAnchor textAlignment = TextAnchor.MiddleRight;

		public bool active;

		public Sprite icon;

		public Action onButtonPressed;

		public ButtonConfig(string text, bool active, Sprite icon, Action onButtonPressed)
		{
			secondText = text;
			this.active = active;
			this.icon = icon;
			this.onButtonPressed = onButtonPressed;
		}
	}

	public object value;

	public EliParameterType type;

	public string id;

	public int sectionId = -1;

	public int subSectionId = -1;

	public int number = -1;

	public string displayName;

	public int minIntValue = -1;

	public int maxIntValue = -1;

	public TextAnchor alignment = TextAnchor.MiddleCenter;

	public Func<object, bool> OnValueChanged;

	public Func<object> OnButtonPressed;

	private EliParameterPermissions[] permissions;

	private GameObject myGameObject;

	public Sprite buttonIcon;

	public GameObject MyGameObject
	{
		get
		{
			return myGameObject;
		}
		set
		{
			myGameObject = value;
		}
	}

	public EliParameter(string id, string displayName, object value, EliParameterType type, params EliParameterPermissions[] permissions)
		: base(generateID: false)
	{
		this.id = id;
		this.displayName = displayName;
		this.value = value;
		this.type = type;
		this.permissions = permissions;
	}

	public EliParameter(string id, string displayName, object value, EliParameterType type, int minValue, int maxValue, TextAnchor alignment, params EliParameterPermissions[] permissions)
		: base(generateID: false)
	{
		this.id = id;
		this.displayName = displayName;
		this.value = value;
		this.type = type;
		minIntValue = minValue;
		maxIntValue = maxValue;
		this.alignment = alignment;
		this.permissions = permissions;
	}

	public EliParameter(string id, string displayName, object value, EliParameterType type, int minValue, int maxValue, TextAnchor alignment, Func<object, bool> OnValueChanged, params EliParameterPermissions[] permissions)
		: base(generateID: false)
	{
		this.id = id;
		this.displayName = displayName;
		this.value = value;
		this.type = type;
		minIntValue = minValue;
		maxIntValue = maxValue;
		this.alignment = alignment;
		this.permissions = permissions;
		this.OnValueChanged = OnValueChanged;
	}

	public static bool HasPermission(EliParameterPermissions[] myPermissions, EliParameterPermissions thisPermission)
	{
		for (int i = 0; i < myPermissions.Length; i++)
		{
			if (myPermissions[i] == thisPermission)
			{
				return true;
			}
		}
		return false;
	}

	public bool HasPermission(EliParameterPermissions thisPermission)
	{
		return HasPermission(permissions, thisPermission);
	}

	public bool MaySave()
	{
		bool flag = false;
		EliParameterType eliParameterType = type;
		if (eliParameterType == EliParameterType.Unknown || (uint)(eliParameterType - 6) <= 1u || eliParameterType == EliParameterType.ReadOnly)
		{
			return false;
		}
		return true;
	}
}
