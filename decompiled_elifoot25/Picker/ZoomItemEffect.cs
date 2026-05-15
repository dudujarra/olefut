using System.Reflection;
using UnityEngine;
using UnityEngine.UI;

namespace Picker;

public class ZoomItemEffect : BaseMeshEffect
{
	protected Graphic targetGraphic;

	protected SyncGraphic syncGraphic;

	protected RectTransform targetGraphicTransform;

	protected RectTransform syncGraphicTransform;

	protected FieldInfo materialDirtyField;

	protected FieldInfo vertsDirtyField;

	private bool prevScaleZero;

	public void Setup(Graphic targetGraphic, SyncGraphic syncGraphic)
	{
		this.targetGraphic = targetGraphic;
		this.syncGraphic = syncGraphic;
		targetGraphicTransform = targetGraphic.rectTransform;
		syncGraphicTransform = syncGraphic.rectTransform;
	}

	protected override void OnDestroy()
	{
		base.OnDestroy();
		if (syncGraphic != null && Application.isPlaying)
		{
			Util.DestroyObject(syncGraphic.gameObject);
		}
	}

	protected override void OnEnable()
	{
		base.OnEnable();
		if (syncGraphic != null)
		{
			syncGraphic.enabled = true;
		}
		BindingFlags bindingAttr = BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.FlattenHierarchy | BindingFlags.GetField;
		materialDirtyField = typeof(Graphic).GetField("m_MaterialDirty", bindingAttr);
		vertsDirtyField = typeof(Graphic).GetField("m_VertsDirty", bindingAttr);
	}

	protected override void OnDisable()
	{
		base.OnDisable();
		if (syncGraphic != null)
		{
			syncGraphic.enabled = false;
		}
	}

	protected override void OnRectTransformDimensionsChange()
	{
		base.OnRectTransformDimensionsChange();
		SyncTransform();
	}

	protected virtual void LateUpdate()
	{
		SyncTransform();
	}

	protected void SyncTransform()
	{
		RectTransform rectTransform = targetGraphicTransform;
		if (rectTransform == null)
		{
			return;
		}
		Vector3 lossyScale = rectTransform.lossyScale;
		if (lossyScale.x == 0f && lossyScale.y == 0f)
		{
			if (prevScaleZero)
			{
				return;
			}
			prevScaleZero = true;
		}
		else
		{
			prevScaleZero = false;
		}
		RectTransform rectTransform2 = syncGraphicTransform;
		Vector3 position = rectTransform.position;
		if (position != rectTransform2.position)
		{
			rectTransform2.position = position;
		}
		Quaternion rotation = rectTransform.rotation;
		if (rotation != rectTransform2.rotation)
		{
			rectTransform2.rotation = rotation;
		}
		if (lossyScale != rectTransform2.lossyScale)
		{
			Vector3 lossyScale2 = rectTransform2.parent.lossyScale;
			if (lossyScale2.x != 0f && lossyScale2.y != 0f && lossyScale2.z != 0f)
			{
				rectTransform2.localScale = new Vector3(lossyScale.x / lossyScale2.x, lossyScale.y / lossyScale2.y, lossyScale.z / lossyScale2.z);
			}
			else
			{
				rectTransform2.localScale = Vector3.zero;
			}
		}
	}

	public override void ModifyMesh(Mesh mesh)
	{
		if (!Application.isPlaying || !IsActive())
		{
			return;
		}
		_SyncGraphics();
		using VertexHelper vertexHelper = new VertexHelper();
		vertexHelper.FillMesh(mesh);
	}

	public override void ModifyMesh(VertexHelper vh)
	{
		if (Application.isPlaying && IsActive())
		{
			_SyncGraphics();
			vh.Clear();
		}
	}

	private void _SyncGraphics()
	{
		if (!(syncGraphic == null))
		{
			if (materialDirtyField != null)
			{
				materialDirtyField.SetValue(syncGraphic, true);
			}
			if (vertsDirtyField != null)
			{
				vertsDirtyField.SetValue(syncGraphic, true);
			}
			syncGraphic.Rebuild(CanvasUpdate.PreRender);
		}
	}
}
