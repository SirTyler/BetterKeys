using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.DragAndDrop;
using UnityEngine.UI;

namespace BetterKeys
{
	public class BetterKeysItemViewPanel : UIElement
	{
		public Image iconImage;                 //_questIconImage
		public ItemView itemView;

		public bool initialized;

		public void Init()
		{
			if (initialized) return;
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

			if (BetterKeys.IsKey(item) != -1)
            {
				base.ShowGameObject();
			}
		}
	}
}
