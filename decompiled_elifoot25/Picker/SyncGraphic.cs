using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.UI;

namespace Picker;

public class SyncGraphic : MaskableGraphic
{
	private Graphic syncGraphic;

	private MethodInfo onPopulateMeshMethod;

	public override Texture mainTexture
	{
		get
		{
			if (!syncGraphic)
			{
				return null;
			}
			return syncGraphic.mainTexture;
		}
	}

	public override Material material
	{
		get
		{
			if (!syncGraphic)
			{
				return null;
			}
			return syncGraphic.material;
		}
		set
		{
		}
	}

	public void Setup(Graphic graphic)
	{
		syncGraphic = graphic;
		base.enabled = graphic.enabled;
	}

	protected override void OnPopulateMesh(VertexHelper vh)
	{
		if (!IsActive() || !(syncGraphic != null))
		{
			return;
		}
		if (onPopulateMeshMethod == null)
		{
			Type type = syncGraphic.GetType();
			BindingFlags bindingAttr = BindingFlags.Instance | BindingFlags.NonPublic;
			onPopulateMeshMethod = type.GetMethod("OnPopulateMesh", bindingAttr, null, new Type[1] { typeof(VertexHelper) }, null);
		}
		if (!syncGraphic.enabled || !syncGraphic.gameObject.activeInHierarchy)
		{
			return;
		}
		onPopulateMeshMethod.Invoke(syncGraphic, new object[1] { vh });
		List<Component> list = ListPool<Component>.Get();
		syncGraphic.GetComponents(typeof(IMeshModifier), list);
		foreach (Component item in list)
		{
			if (!(item is ZoomItemEffect))
			{
				try
				{
					(item as IMeshModifier).ModifyMesh(vh);
				}
				catch (Exception)
				{
				}
			}
		}
		ListPool<Component>.Release(list);
	}

	public override bool Raycast(Vector2 sp, Camera eventCamera)
	{
		return false;
	}
}
