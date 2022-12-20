using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.DragAndDrop;
using UnityEngine.UI;
using UnityEngine;

namespace BetterKeys
{
	public class BetterKeysItemViewPanel : UIElement
	{
		public Image iconImage;                 //_questIconImage
		public ItemView itemView;
        private static Sprite[] iconCache = { null, null, null, null, null };
		private bool initialized;

		public void Init()
        {
			if (initialized) return;

			iconCache[0] = Resources.iconCache["betterkeys_trash"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction");
			iconCache[1] = Resources.iconCache["betterkeys_s"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction");
			iconCache[2] = Resources.iconCache["betterkeys_a"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction");
			iconCache[3] = Resources.iconCache["betterkeys_b"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction");
			iconCache[4] = Resources.iconCache["betterkeys_c"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction");
			initialized = true;
		}

		private void Awake()
        {
			Init();
        }

		public void Show(Item item, ItemView itemView)
		{
			Init();

			this.itemView = itemView;

			int i = BetterKeys.GetKey(item);
			if (i != -1)
			{
				iconImage.sprite = iconCache[i];
				base.ShowGameObject();
			}
			else base.HideGameObject();
		}
	}
}
