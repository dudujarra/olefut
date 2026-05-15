using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace Picker;

[AddComponentMenu("UI/Picker/MassiveZoomPickerItem", 1016)]
[DisallowMultipleComponent]
public class MassiveZoomPickerItem : MassivePickerItem
{
	private class ZoomGraphic
	{
		public ZoomItemEffect zoomItemEffect;

		public SyncGraphic graphic;

		public bool IsEnabled()
		{
			if (zoomItemEffect != null)
			{
				return graphic != null;
			}
			return false;
		}

		public void Destroy()
		{
			Util.DestroyObject(zoomItemEffect);
			Util.DestroyObject(graphic.gameObject);
		}
	}

	public Transform zoomItem;

	private List<ZoomGraphic> zoomGraphicList = new List<ZoomGraphic>();

	protected override void Awake()
	{
		base.Awake();
		if (Application.isPlaying)
		{
			Setup();
		}
	}

	protected override void OnBeforeTransformParentChanged()
	{
		base.OnBeforeTransformParentChanged();
		for (int i = 0; i < zoomGraphicList.Count; i++)
		{
			zoomGraphicList[i].Destroy();
		}
		zoomGraphicList.Clear();
	}

	protected override void OnTransformParentChanged()
	{
		base.OnTransformParentChanged();
		if (Application.isPlaying)
		{
			Setup();
		}
	}

	protected void Setup()
	{
		if (base.transform.parent == null)
		{
			return;
		}
		MassiveZoomPickerLayoutGroup component = base.transform.parent.GetComponent<MassiveZoomPickerLayoutGroup>();
		if (component == null)
		{
			return;
		}
		Transform zoomItemParent = component.zoomItemParent;
		if (!(zoomItemParent == null) && zoomItem != null)
		{
			Graphic[] componentsInChildren = zoomItem.GetComponentsInChildren<Graphic>(includeInactive: true);
			foreach (Graphic graphic in componentsInChildren)
			{
				SetupZoomGraphic(graphic, zoomItemParent);
			}
		}
	}

	private void SetupZoomGraphic(Graphic graphic, Transform zoomItemParent)
	{
		ZoomItemEffect zoomItemEffect = graphic.GetComponent<ZoomItemEffect>();
		if (zoomItemEffect == null)
		{
			zoomItemEffect = graphic.gameObject.AddComponent<ZoomItemEffect>();
		}
		GameObject obj = new GameObject(graphic.name + "(ZoomItemGraphic)");
		obj.transform.SetParent(zoomItemParent);
		SyncGraphic syncGraphic = obj.AddComponent<SyncGraphic>();
		syncGraphic.Setup(graphic);
		zoomItemEffect.Setup(graphic, syncGraphic);
		zoomGraphicList.Add(new ZoomGraphic
		{
			zoomItemEffect = zoomItemEffect,
			graphic = syncGraphic
		});
	}
}
