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
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";

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
    private _versionsLocale;

    public preAkiLoad(container: DependencyContainer): void
    {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        this.router = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        this.mod = require("../package.json");
        this.hookRoutes();
    }

    public postAkiLoad(container: DependencyContainer): void
    {
        this.modLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
    }

    public postDBLoad(container: DependencyContainer): void
    {
        const database = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        this.vfs = container.resolve<VFS>("VFS");
        this._keys = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/_keys.json`));
        this._versions = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/_versions.json`));
        this._versionsLocale = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/locale/_versions.json`));
        if (this.modConfig.AutoUpdate)
        {
            const localeArray: string[] = ["ch","cz","en","es-mx","es","fr","ge","hu","it","jp","kr","pl","po","ru","sk","tu"];
            this.update(this._versionsLocale, "locale", localeArray, database, false);
            const mapArray: string[] = ["_keys","bigmap","factory4","Interchange","laboratory","Lighthouse","RezerveBase","Shoreline","Woods","TarkovStreets"];
            this.update(this._versions, "db", mapArray, database, true);
        }
        else
            this.loadDatabase(database);
    }

    public loadDatabase(database: IDatabaseTables): void
    {
        this.load(database, this._keys, "bigmap", "56f40101d2720b2a4d8b45d6");
        this.load(database, this._keys, "factory4", "55f2d3fd4bdc2d5f408b4567");
        this.load(database, this._keys, "Interchange", "5714dbc024597771384a510d");
        this.load(database, this._keys, "laboratory", "5b0fc42d86f7744a585f9105");
        this.load(database, this._keys, "Lighthouse", "5704e4dad2720bb55b8b4567");
        this.load(database, this._keys, "RezervBase", "5704e5fad2720bc05b8b4567");
        this.load(database, this._keys, "Shoreline", "5704e554d2720bac5b8b456e");
        this.load(database, this._keys, "Woods", "5704e3c2d2720bac5b8b4567");
        this.load(database, this._keys, "TarkovStreets", "5714dc692459777137212e12");
        this.logger.logWithColor(`Finished loading: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
    }

    private load(database: IDatabaseTables, modDb, mapID: string, mapKey: string): void
    {
        const keyDb = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/${mapID}.json`))
        for (const keyID in keyDb.Keys)
        {
            if (database.templates.items[keyID])
            {
                if (!this.modConfig.ChangeMarkedKeysBackground && modDb.MarkedKeys.includes(keyID))
                    database.templates.items[keyID]._props.BackgroundColor = "yellow";
                else
                {
                    const color = this.modConfig.BackgroundColor[database.locales.global["en"][`${mapKey} Name`]];
                    if (color.toUpperCase() != "OFF")
                        database.templates.items[keyID]._props.BackgroundColor = color
                }

                for (const localeID in database.locales.global)
                {
                    const originalDesc = database.locales.global[localeID][`${keyID} Description`];
                    let loadedLocale = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/locale/en.json`));
                    if (this.vfs.exists(`${this.modPath}/locale/${localeID}.json`))
                    {
                        loadedLocale = this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/locale/${localeID}.json`));
                    }

                    const betterString = `${loadedLocale.mapString}: ${database.locales.global[localeID][`${mapKey} Name`]}.${BetterKeys.getExtracts(keyID, keyDb, loadedLocale)}\n${BetterKeys.isConfigQuestsEnabled(this.modConfig, keyID, keyDb, loadedLocale, database.locales.global[localeID])}${BetterKeys.isConfigLootEnabled(this.modConfig, keyID, keyDb, loadedLocale)}\n`;
                    database.locales.global[localeID][`${keyID} Description`] = betterString + originalDesc;
                }
            }
        }

        this.logger.info(`   Loaded: ${_package.name}-${mapID}`);
    }

    private update(versions, folder: string, array: string[], database: IDatabaseTables, updateDatabasePostLoad: boolean)
    {
        https.get(`https://raw.githubusercontent.com/SirTyler/BetterKeys/main/server/${folder}/_versions.json`,(res) => 
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
                    let b = false;
                    const json = JSON.parse(body);
                    for (const i in array)
                    {
                        //this.logger.logWithColor(`${json[array[i]]} | ${versions[array[i]]}`, LogTextColor.RED);
                        if (json[array[i]] > versions[array[i]])
                        {
                            this.updateFile(folder, array[i]);
                            versions[array[i]] = json[array[i]];
                            if (!b) b = true;
                        }
                    }

                    if (b)
                    {
                        this.vfs.removeFile(`${this.modPath}/${folder}/_versions.json`);
                        this.vfs.writeFile(`${this.modPath}/${folder}/_versions.json`, body);
                        this.logger.logWithColor(`Finished updating [${folder}]: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
                        if (updateDatabasePostLoad) this.loadDatabase(database);
                    }
                    else 
                    {
                        this.logger.logWithColor(`No Updates [${folder}]: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
                        if (updateDatabasePostLoad) this.loadDatabase(database);
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

    private updateFile(folder: string, file: string): void
    {
        if (this.vfs.exists(`${this.modPath}/${folder}/${file}.json`))
        {
            https.get(`https://raw.githubusercontent.com/SirTyler/BetterKeys/main/server/${folder}/${file}.json`,(res) => 
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
                        this.vfs.removeFile(`${this.modPath}/${folder}/${file}.json`);
                        this.vfs.writeFile(`${this.modPath}/${folder}/${file}.json`, body);
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

    private hookRoutes(): void
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
    private getModInfo(url: string, info: any, sessionId: string, output: string): string
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
    private getTiers(url: string, info: any, sessionId: string, output: string): string
    {
        const modOutput = {
            status: 1,
            data: null
        };

        modOutput.data = {...this.jsonUtil.deserialize(this.vfs.readFile(`${this.modPath}/db/_keys.json`))};
        modOutput.status = 0;

        return this.jsonUtil.serialize(modOutput);
    }

    static getExtracts(keyId: string, modDb, locale): string
    {
        let extractList = "";
        for (const extract of modDb.Keys[keyId].Extract)
            extractList = extractList + extract +", ";
        return extractList.length > 0 ? ` ${locale.extractString}: ` + extractList.substring(0,extractList.length-2) + "." : "";
    }

    static getLoot(keyId: string, modDb, locale): string
    {
        let lootList = "";
        for (const lootId of modDb.Keys[keyId].Loot)
            lootList = lootList + locale[lootId]+", ";
        return lootList.length > 0 ? lootList.substring(0,lootList.length-2) : `${locale.no}`;
        
    }

    static isConfigLootEnabled(config, keyId: string, modDb, locale): string
    {
        if (config.AddLootToDesc)
            return `${locale.lootString}: ${BetterKeys.getLoot(keyId, modDb, locale)}.\n`;
        else return "";
    }

    static isUsedInQuests(keyId: string, modDb, locale, database): string
    {
        let questList = "";
        for (const quest of modDb.Keys[keyId].Quest)
            questList = questList + database[`${quest} name`] +", ";
        return questList.length > 0 ? questList.substring(0,questList.length-2) : `${locale.no}`;
    }
	
    static isConfigQuestsEnabled(config, keyId: string, modDb, locale, database): string
    {
        if (config.AddIfUsedInQuestsToDesc)
            return `${locale.questString}: ${BetterKeys.isUsedInQuests(keyId, modDb, locale, database)}.\n`;
        else return "";
    }
}

module.exports = { mod: new BetterKeys }