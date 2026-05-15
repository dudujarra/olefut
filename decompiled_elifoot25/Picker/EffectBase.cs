using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Picker;

[ExecuteInEditMode]
public abstract class EffectBase : UIBehaviour
{
	public void SetEffectComponentToAllChildGraphics()
	{
		SetEffectComponentToAllChildGraphics(base.transform);
	}

	public void SetEffectComponentToAllChildGraphics(Transform target)
	{
		List<Graphic> list = ListPool<Graphic>.Get();
		try
		{
			GetComponentsInChildren(includeInactive: true, list);
			int i = 0;
			for (int count = list.Count; i < count; i++)
			{
				Graphic graphic = list[i];
				if (graphic.GetComponent<EffectComponent>() == null)
				{
					EffectComponent effectComponent = graphic.gameObject.AddComponent<EffectComponent>();
					effectComponent.SetParent(this);
					effectComponent.SetDirty(updateParent: false);
				}
			}
		}
		finally
		{
			ListPool<Graphic>.Release(list);
		}
	}

	protected override void OnEnable()
	{
		base.OnEnable();
		SetDirty();
	}

	protected override void OnDisable()
	{
		SetDirty();
		base.OnDisable();
	}

	protected override void OnDestroy()
	{
		SetDirty();
		base.OnDestroy();
	}

	public static UIVertex Leap(UIVertex a, UIVertex b, float t)
	{
		return new UIVertex
		{
			color = Color32.Lerp(a.color, b.color, t),
			normal = Vector3.Lerp(a.normal, b.normal, t),
			position = Vector3.Lerp(a.position, b.position, t),
			tangent = Vector4.Lerp(a.tangent, b.tangent, t),
			uv0 = Vector2.Lerp(a.uv0, b.uv0, t),
			uv1 = Vector2.Lerp(a.uv1, b.uv1, t)
		};
	}

	public abstract void ModifyMesh(VertexHelper vh);

	protected bool SetProperty<T>(ref T currentValue, T newValue)
	{
		if ((currentValue == null && newValue == null) || (currentValue != null && currentValue.Equals(newValue)))
		{
			return false;
		}
		currentValue = newValue;
		SetDirty();
		return true;
	}

	protected void SetDirty()
	{
		SetDirty(base.transform);
	}

	protected void SetDirty(Transform target)
	{
		List<EffectComponent> list = ListPool<EffectComponent>.Get();
		target.GetComponents(list);
		int i = 0;
		for (int count = list.Count; i < count; i++)
		{
			list[i].SetDirty();
		}
		ListPool<EffectComponent>.Release(list);
		if (target.GetComponent<ILayoutElement>() != null)
		{
			LayoutRebuilder.MarkLayoutForRebuild((RectTransform)target);
		}
		foreach (Transform item in target)
		{
			if (!(item.GetComponent<EffectBase>() != null))
			{
				SetDirty(item);
			}
		}
	}
}
