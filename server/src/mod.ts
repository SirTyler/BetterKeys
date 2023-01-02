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

import https from "https";

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
    private _versions;

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
        this._versions = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/_versions.json`));
        if (this.modConfig.AutoUpdate)
            this.update(database);
        else
            this.loadDatabase(database);
    }

    public loadDatabase(database): void
    {
        this.load(database, this._keys, "bigmap");
        this.load(database, this._keys, "factory4");
        this.load(database, this._keys, "Interchange");
        this.load(database, this._keys, "laboratory");
        this.load(database, this._keys, "Lighthouse");
        this.load(database, this._keys, "RezervBase");
        this.load(database, this._keys, "Shoreline");
        this.load(database, this._keys, "Woods");
        this.logger.logWithColor(`Finished loading: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
    }

    private load(database, modDb, mapID)
    {
        const keyDb = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/${mapID}.json`))
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

                    if (this.vfs.exists(`${this.modPath}/locale/${localeID}.json`))
                    {
                        const loadedLocale = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/locale/${localeID}.json`));
                        const betterString = `${loadedLocale.mapString}: ${database.locales.global[localeID][mapID]}.${BetterKeys.getExtracts(keyID, keyDb, loadedLocale)}\n${BetterKeys.isConfigQuestsEnabled(this.modConfig, keyID, keyDb, loadedLocale, database.locales.global[localeID])}${BetterKeys.isConfigLootEnabled(this.modConfig, keyID, keyDb, loadedLocale)}\n`;

                        database.locales.global[localeID][`${keyID} Description`] = betterString + originalDesc;
                    }
                }
            }
        }

        this.logger.info(`   Loaded: ${_package.name}-${mapID}`);
    }

    private update(database)
    {
        https.get("https://raw.githubusercontent.com/SirTyler/BetterKeys/main/server/db/_versions.json",(res) => 
        {
            let body = "";
        
            res.on("data", (chunk) => 
            {
                body += chunk;
            });
        
            res.on("end", () => 
            {
                try
                {
                    const array: string[] = ["_keys","bigmap","factory4","Interchange","laboratory","Lighthouse","RezerveBase","Shoreline","Woods"];
                    let b = false;
                    const json = JSON.parse(body);
                    for (const i in array)
                    {
                        if (json[array[i]] > this._versions[array[i]])
                        {
                            this.updateFile(array[i]);
                            this._versions[array[i]] = json[array[i]];
                            if (!b) b = true;
                        }
                    }

                    if (b)
                    {
                        this.vfs.removeFile(`${this.modPath}/db/_versions.json`);
                        this.vfs.writeFile(`${this.modPath}/db/_versions.json`, body);
                        this.logger.logWithColor(`Finished updating: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
                        this.loadDatabase(database);
                    }
                    else 
                    {
                        this.logger.logWithColor(`No Updates: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
                        this.loadDatabase(database);
                    }
                }
                catch (error) 
                {
                    this.logger.error(error.message);
                }
            });
        
        }).on("error", (error) => 
        {
            this.logger.error(error.message);
        });
    }

    private updateFile(file)
    {
        if (this.vfs.exists(`${this.modPath}/db/${file}.json`))
        {
            https.get(`https://raw.githubusercontent.com/SirTyler/BetterKeys/main/server/db/${file}.json`,(res) => 
            {
                let body = "";
            
                res.on("data", (chunk) => 
                {
                    body += chunk;
                });
            
                res.on("end", () => 
                {
                    try
                    {
                        this.vfs.removeFile(`${this.modPath}/db/${file}.json`);
                        this.vfs.writeFile(`${this.modPath}/db/${file}.json`, body);
                        this.logger.info(`   Updated: ${_package.name}-${file}`);
                    }
                    catch (error) 
                    {
                        this.logger.error(error.message);
                    }
                });
            
            }).on("error", (error) => 
            {
                this.logger.error(error.message);
            });
        }
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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