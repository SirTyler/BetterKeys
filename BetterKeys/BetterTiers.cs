using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Assertions;

namespace BetterKeys
{
    public class BetterTiers
    {
        public IList<string> MarkedKeys { get; set; }
        public IList<string> JunkKeys { get; set; }
        public IList<string> STier { get; set; }
        public IList<string> ATier { get; set; }
        public IList<string> BTier { get; set; }
        public IList<string> CTier { get; set; }

        public static BetterTiers Load()
        {
            BetterTiers Tires;

            JObject response = JObject.Parse(Aki.Common.Http.RequestHandler.GetJson($"/BetterKeys/GetTiers"));
            try
            {
                Assert.IsTrue(response.Value<int>("status") == 0);
                Tires = response["data"].ToObject<BetterTiers>();
            }
            catch (Exception getModInfoException)
            {
                string errMsg = $"[{typeof(BetterKeys)}] Package.json couldn't be found! Make sure you've installed the mod on the server as well!";
                Debug.LogError(errMsg);
                throw getModInfoException;
            }

            return Tires;
        }
    }
}
