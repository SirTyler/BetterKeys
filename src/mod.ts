import _package from "../package.json"

import { DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { VFS } from "@spt-aki/utils/VFS";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";

class BetterKeys implements IPostDBLoadMod
{
    private modConfig = require("../config/config.json");
    private modPath = "user/mods/BetterKeys";

    public postDBLoad(container: DependencyContainer): void
    {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const database = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        const vfs = container.resolve<VFS>("VFS");
        const jsonUtil = container.resolve<JsonUtil>("JsonUtil");

        const _keys = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/db/_keys.json`));
        this.load(database, jsonUtil, vfs, _keys, "bigmap", logger);
        this.load(database, jsonUtil, vfs, _keys, "factory4", logger);
        this.load(database, jsonUtil, vfs, _keys, "Interchange", logger);
        this.load(database, jsonUtil, vfs, _keys, "laboratory", logger);
        this.load(database, jsonUtil, vfs, _keys, "Lighthouse", logger);
        this.load(database, jsonUtil, vfs, _keys, "RezervBase", logger);
        this.load(database, jsonUtil, vfs, _keys, "Shoreline", logger);
        this.load(database, jsonUtil, vfs, _keys, "Woods", logger);
        logger.logWithColor(`Finished loading: ${_package.name}-${_package.version}`, LogTextColor.GREEN);
    }

    load(database, jsonUtil, vfs, modDb, mapID, logger)
    {
        const keyDb = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/db/${mapID}.json`))
        for (const keyID in keyDb.Keys)
        {
            if (database.templates.items[keyID])
            {
                if (!this.modConfig.ChangeMarkedKeysBackground && modDb.MarkedKeys.includes(keyID))
                    database.templates.items[keyID]._props.BackgroundColor = "yellow";
                else 
                    database.templates.items[keyID]._props.BackgroundColor = this.modConfig.BackgroundColor[database.locales.global["en"].interface[mapID]];

                for (const localeID in database.locales.global)
                {
                    const originalDesc = database.locales.global[localeID].templates[keyID].Description;

                    if (vfs.exists(`${this.modPath}/locale/${localeID}.json`))
                    {
                        const loadedLocale = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/locale/${localeID}.json`));
                        const betterString = `${loadedLocale.mapString}: ${database.locales.global[localeID].interface[mapID]}.${BetterKeys.getExtracts(keyID, keyDb, loadedLocale)}\n${BetterKeys.isConfigQuestsEnabled(this.modConfig, keyID, keyDb, loadedLocale, database.locales.global[localeID])}${BetterKeys.isConfigLootEnabled(this.modConfig, keyID, keyDb, loadedLocale)}\n`;

                        database.locales.global[localeID].templates[keyID].Description = betterString + originalDesc;
                    }
                }
            }
        }

        logger.info(`   Loaded: ${_package.name}-${mapID}`);
    }

    static getExtracts(keyId, modDb, locale)
    {
        let ex = "";
        for (const extract of modDb.Keys[keyId].Extract)
            ex = ex + extract +", ";
        return ex.length > 0 ? ` ${locale.extractString}: ` + ex.substring(0,ex.length-2) + "." : "";
    }

    static getLoot(keyId, modDb, locale)
    {
        let loots = "";
        for (const lootId of modDb.Keys[keyId].Loot)
            loots = loots + locale[lootId]+", ";
        return loots.length > 0 ? loots.substring(0,loots.length-2) : `${locale.no}`;
        
    }

    static isConfigLootEnabled(config, keyId, modDb, locale)
    {
        if (config.AddLootToDesc)
            return `${locale.lootString}: ${BetterKeys.getLoot(keyId, modDb, locale)}.\n`;
        else return "";
    }

    static isUsedInQuests(keyId, modDb, locale, database)
    {
        let quests = "";
        for (const q of modDb.Keys[keyId].Quest)
            quests = quests + database.quest[q].name +", ";
        return quests.length > 0 ? quests.substring(0,quests.length-2) : `${locale.no}`;
    }
	
    static isConfigQuestsEnabled(config, keyId, modDb, locale, database)
    {
        if (config.AddIfUsedInQuestsToDesc)
            return `${locale.questString}: ${BetterKeys.isUsedInQuests(keyId, modDb, locale, database)}.\n`;
        else return "";
    }
}

module.exports = { mod: new BetterKeys }