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


		public void Show(Item item, ItemView itemView)
		{
			this.itemView = itemView;

			int i = BetterKeys.GetKey(item);
			if (i != -1)
			{
				iconImage.sprite = i switch
				{

					1 => Resources.iconCache["betterkeys_s"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction"),
					2 => Resources.iconCache["betterkeys_a"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction"),
					3 => Resources.iconCache["betterkeys_b"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction"),
					4 => Resources.iconCache["betterkeys_c"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction"),
					_ => Resources.iconCache["betterkeys_trash"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction"),

				};
				base.ShowGameObject();
			}
			else base.HideGameObject();
		}
	}
}
