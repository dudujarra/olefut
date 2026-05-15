using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[RequireComponent(typeof(RectTransform))]
public class EffectComponent : BaseMeshEffect
{
	private EffectBase m_EffectParent;

	public void SetParent(EffectBase parent)
	{
		m_EffectParent = parent;
	}

	protected override void OnTransformParentChanged()
	{
		base.OnTransformParentChanged();
		SetParent(GetComponentInParent<EffectBase>());
	}

	public override void ModifyMesh(VertexHelper vh)
	{
		if (IsActive() && m_EffectParent != null)
		{
			m_EffectParent.ModifyMesh(vh);
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

	public void SetDirty(bool updateParent = true)
	{
		if (updateParent)
		{
			SetParent(GetComponentInParent<EffectBase>());
		}
		base.graphic.SetVerticesDirty();
	}
}
