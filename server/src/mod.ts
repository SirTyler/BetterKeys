import _package from "../package.json"

import { DependencyContainer } from "tsyringe";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { DynamicRouterModService } from "@spt-aki/services/mod/dynamicRouter/DynamicRouterModService"
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { VFS } from "@spt-aki/utils/VFS";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";

class BetterKeys implements IPostDBLoadMod, IPreAkiLoadMod, IPostAkiLoadMod
{
    private modConfig = require("../config/config.json");
    private modPath = "user/mods/BetterKeys";
    private router: DynamicRouterModService;
    private vfs: VFS;
    private modLoader: PreAkiModLoader;
    private jsonUtil: JsonUtil;
    private path = require("path");
    private logger: ILogger;
    private mod;
    private _keys;

    public preAkiLoad(container: DependencyContainer)
    {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        this.router = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        this.mod = require("../package.json");
        this.hookRoutes();

    }

    public postAkiLoad(container: DependencyContainer)
    {
        this.modLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
    }

    public postDBLoad(container: DependencyContainer): void
    {
        const database = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        this.vfs = container.resolve<VFS>("VFS");

        this._keys = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/_keys.json`));
        this.load(database, this.jsonUtil, this.vfs, this._keys, "bigmap", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "factory4", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "Interchange", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "laboratory", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "Lighthouse", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "RezervBase", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "Shoreline", this.logger);
        this.load(database, this.jsonUtil, this.vfs, this._keys, "Woods", this.logger);
        this.logger.logWithColor(`Finished loading: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
    }

    private load(database, jsonUtil, vfs, modDb, mapID, logger)
    {
        const keyDb = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/db/${mapID}.json`))
        for (const keyID in keyDb.Keys)
        {
            if (database.templates.items[keyID])
            {
                if (!this.modConfig.ChangeMarkedKeysBackground && modDb.MarkedKeys.includes(keyID))
                    database.templates.items[keyID]._props.BackgroundColor = "yellow";
                else 
                    database.templates.items[keyID]._props.BackgroundColor = this.modConfig.BackgroundColor[database.locales.global["en"][mapID]];

                for (const localeID in database.locales.global)
                {
                    const originalDesc = database.locales.global[localeID][`${keyID} Description`];

                    if (vfs.exists(`${this.modPath}/locale/${localeID}.json`))
                    {
                        const loadedLocale = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/locale/${localeID}.json`));
                        const betterString = `${loadedLocale.mapString}: ${database.locales.global[localeID][mapID]}.${BetterKeys.getExtracts(keyID, keyDb, loadedLocale)}\n${BetterKeys.isConfigQuestsEnabled(this.modConfig, keyID, keyDb, loadedLocale, database.locales.global[localeID])}${BetterKeys.isConfigLootEnabled(this.modConfig, keyID, keyDb, loadedLocale)}\n`;

                        database.locales.global[localeID][`${keyID} Description`] = betterString + originalDesc;
                    }
                }
            }
        }

        logger.info(`   Loaded: ${_package.name}-${mapID}`);
    }

    private hookRoutes()
    {
        this.router.registerDynamicRouter(
            "BetterKeys",
            [
                {
                    url: "/BetterKeys/GetInfo",
                    action: (url, info, sessionId, output) =>
                    {
                        return this.getModInfo(url, info, sessionId, output)
                    }
                },
                {
                    url: "/BetterKeys/GetTiers",
                    action: (url, info, sessionId, output) =>
                    {
                        return this.getTiers(url, info, sessionId, output)
                    }
                }
            ],
            "BetterKeys"
        )
    }

    private getModInfo(url: string, info: any, sessionId: string, output: string)
    {
        const modOutput = {
            status: 1,
            data: null
        };

        modOutput.data = {..._package, ...{path: this.path.resolve(this.modLoader.getModPath("BetterKeys"))}};
        modOutput.status = 0;

        return this.jsonUtil.serialize(modOutput);
    }

    private getTiers(url: string, info: any, sessionId: string, output: string)
    {
        const modOutput = {
            status: 1,
            data: null
        };

        modOutput.data = {...this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/_keys.json`))};
        modOutput.status = 0;

        return this.jsonUtil.serialize(modOutput);
    }

    static getExtracts(keyId, modDb, locale)
    {
        let extractList = "";
        for (const extract of modDb.Keys[keyId].Extract)
            extractList = extractList + extract +", ";
        return extractList.length > 0 ? ` ${locale.extractString}: ` + extractList.substring(0,extractList.length-2) + "." : "";
    }

    static getLoot(keyId, modDb, locale)
    {
        let lootList = "";
        for (const lootId of modDb.Keys[keyId].Loot)
            lootList = lootList + locale[lootId]+", ";
        return lootList.length > 0 ? lootList.substring(0,lootList.length-2) : `${locale.no}`;
        
    }

    static isConfigLootEnabled(config, keyId, modDb, locale)
    {
        if (config.AddLootToDesc)
            return `${locale.lootString}: ${BetterKeys.getLoot(keyId, modDb, locale)}.\n`;
        else return "";
    }

    static isUsedInQuests(keyId, modDb, locale, database)
    {
        let questList = "";
        for (const quest of modDb.Keys[keyId].Quest)
            questList = questList + database[`${quest} name`] +", ";
        return questList.length > 0 ? questList.substring(0,questList.length-2) : `${locale.no}`;
    }
	
    static isConfigQuestsEnabled(config, keyId, modDb, locale, database)
    {
        if (config.AddIfUsedInQuestsToDesc)
            return `${locale.questString}: ${BetterKeys.isUsedInQuests(keyId, modDb, locale, database)}.\n`;
        else return "";
    }
}

module.exports = { mod: new BetterKeys }