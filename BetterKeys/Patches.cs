using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.DragAndDrop;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using Aki.Reflection.Patching;
using System;

namespace BetterKeys
{
    class Patcher
    {
        public static void PatchAll()
        {
            new PatchManager().RunPatches();
        }
    }

    public class PatchManager
    {
        public PatchManager()
        {
            this._patches = new List<ModulePatch>
            {
                new ItemViewPatches.GridItemViewUpdateInfoPatch(),
                new ItemViewPatches.ItemViewInitPatch(),
                new ItemViewPatches.NewGridItemViewPatch()
            };
        }

        public void RunPatches()
        {
            foreach (ModulePatch patch in this._patches)
            {
                patch.Enable();
            }
        }

        private readonly List<ModulePatch> _patches;
    }

    public static class ItemViewPatches
    {
        public static Dictionary<ItemView, BetterKeysItemViewPanel> betterkeysPanels = new Dictionary<ItemView, BetterKeysItemViewPanel>();

        public static void SetBetterKeysItemViewPanel(this ItemView __instance)
        {
            if (!betterkeysPanels.TryGetValue(__instance, out BetterKeysItemViewPanel betterkeysItemViewPanel))
                return;

            ItemUiContext itemUiContext = typeof(ItemView).GetField("ItemUiContext", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(__instance) as ItemUiContext;

            if (betterkeysItemViewPanel != null)
            {
                betterkeysItemViewPanel.Show(__instance.Item, __instance);
                return;
            }
        }

        public class NewGridItemViewPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(GridItemView).GetMethod("NewGridItemView", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref GridItemView __instance, Item item)
            {
                if (betterkeysPanels.ContainsKey(__instance)) return;

                try
                {
                    QuestItemViewPanel questIconPanel = typeof(ItemView).GetField("_questsItemViewPanel", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(__instance) as QuestItemViewPanel;

                    BetterKeysItemViewPanel betterkeysIconPanel = GameObject.Instantiate(Resources.GetEditOffsetWindowTemplate(BetterKeys.GetKey(item), questIconPanel), questIconPanel.transform.parent);
                    betterkeysIconPanel.transform.SetAsFirstSibling();
                    betterkeysPanels[__instance] = betterkeysIconPanel;

                    betterkeysIconPanel.gameObject.SetActive(true);
                }
                catch (Exception message)
                {
                    Debug.LogError($"BetterKeys Panel issue: {message}");
                    // Item doesn't have a "quest item" icon panel, so it's probably static
                }
            }
        }

        public class ItemViewInitPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(ItemView).GetMethod("Init", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref ItemView __instance)
            {
                __instance.SetBetterKeysItemViewPanel();
            }
        }

        public class GridItemViewUpdateInfoPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(GridItemView).GetMethod("UpdateInfo", BindingFlags.Instance | BindingFlags.Public);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref GridItemView __instance)
            {
                if (!__instance.IsSearched)
                    return;

                if (!betterkeysPanels.TryGetValue(__instance, out BetterKeysItemViewPanel betterkeysItemViewPanel))
                    return;
                betterkeysItemViewPanel.iconImage.gameObject.SetActive(BetterKeys.IsKey(__instance.Item));

                __instance.SetBetterKeysItemViewPanel();
            }
        }
    }
}
