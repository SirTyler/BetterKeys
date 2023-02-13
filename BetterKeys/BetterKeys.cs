using EFT.InventoryLogic;
using System.IO;
using BepInEx;
using UnityEngine;

namespace BetterKeys
{
    [BepInPlugin("com.SirTyler.BetterKeys", "SirTyler-BetterKeys", "1.2.3")]
    public class BetterKeys : BaseUnityPlugin
    {
        private void Awake()
        {
            _ = Resources.LoadTexture("betterkeys_trash", Path.Combine(ModInfo.path, "res/icon_betterkeys_trash.png"));
            _ = Resources.LoadTexture("betterkeys_s", Path.Combine(ModInfo.path, "res/icon_betterkeys_s.png"));
            _ = Resources.LoadTexture("betterkeys_a", Path.Combine(ModInfo.path, "res/icon_betterkeys_a.png"));
            _ = Resources.LoadTexture("betterkeys_b", Path.Combine(ModInfo.path, "res/icon_betterkeys_b.png"));
            _ = Resources.LoadTexture("betterkeys_c", Path.Combine(ModInfo.path, "res/icon_betterkeys_c.png"));
            Patcher.PatchAll();
        }

        private static ModInformation _modInfo;
        public static ModInformation ModInfo
        {
            private set
            {
                _modInfo = value;
            }
            get
            {
                if (_modInfo == null)
                    _modInfo = ModInformation.Load();
                return _modInfo;
            }
        }

        private static BetterTiers _tiers;
        public static BetterTiers Tiers
        {
            private set
            {
                _tiers = value;
            }
            get
            {
                if (_tiers == null)
                    _tiers = BetterTiers.Load();
                return _tiers;
            }
        }

        private static Transform _gameObjectStorage;
        public static Transform GameObjectStorage
        {
            get
            {
                if (_gameObjectStorage == null)
                {
                    GameObject storage = new GameObject("BetterKeys Storage");
                    DontDestroyOnLoad(storage);
                    storage.SetActive(false);
                    _gameObjectStorage = storage.transform;
                }

                return _gameObjectStorage;
            }
        }

        public static bool IsKey(Item item)
        {
            return (item.Template._parent == "5c99f98d86f7745c314214b3" || item.Template._parent == "5c164d2286f774194c5e69fa");
        }

        public static int GetKey(Item item)
        {
            if (item.Template._parent == "5c99f98d86f7745c314214b3" || item.Template._parent == "5c164d2286f774194c5e69fa")
            {
                if (Tiers.JunkKeys.Contains(item.Template._id)) return 0;
                else if (Tiers.STier.Contains(item.Template._id)) return 1;
                else if (Tiers.ATier.Contains(item.Template._id)) return 2;
                else if (Tiers.BTier.Contains(item.Template._id)) return 3;
                else if (Tiers.CTier.Contains(item.Template._id)) return 4;
            }
            return -1;
        }
    }
}
