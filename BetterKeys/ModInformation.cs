using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Assertions;

namespace BetterKeys
{
    public class ModInformation
    {
        public string name;
        public string author;
        public string version;
        public string license;
        public string main;
        public string path;

        public static ModInformation Load()
        {
            ModInformation ModInfo;

            JObject response = JObject.Parse(Aki.Common.Http.RequestHandler.GetJson($"/BetterKeys/GetInfo"));
            try
            {
                Assert.IsTrue(response.Value<int>("status") == 0);
                ModInfo = response["data"].ToObject<ModInformation>();
            }
            catch (Exception getModInfoException)
            {
                string errMsg = $"[{typeof(BetterKeys)}] Package.json couldn't be found! Make sure you've installed the mod on the server as well!";
                Debug.LogError(errMsg);
                throw getModInfoException;
            }

            return ModInfo;
        }
    }
}
