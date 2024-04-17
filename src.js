"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');

class balistonmod 
{   
    preAkiLoad(container)
    {
        let ragfairConfig = container.resolve("ConfigServer").getConfig("aki-ragfair");
        let staticRouterModService = container.resolve("StaticRouterModService");

        //adjust some ragfair configs
        ragfairConfig.dynamic.barter.chancePercent = 0;
        
        ragfairConfig.dynamic.offerItemCount.min = 1;
        ragfairConfig.dynamic.offerItemCount.max = 1;

        ragfairConfig.dynamic.priceRanges.default.min = 1;
        ragfairConfig.dynamic.priceRanges.default.max = 1;

        ragfairConfig.dynamic.endTimeSeconds = {"min" :30000, "max":36000};

        for(let dc in  ragfairConfig.dynamic.condition)
        {
            ragfairConfig.dynamic.condition[dc].conditionChance = 0;
        }

        for(let umprice in ragfairConfig.dynamic.unreasonableModPrices)
        {
            ragfairConfig.dynamic.unreasonableModPrices[umprice].enabled = false;
        }

        var money = ["5449016a4bdc2d6f028b456f","5696686a4bdc2da3298b456a","569668774bdc2da2298b4568"];

        //unlimited items
        staticRouterModService.registerStaticRouter( "StaticRoutePeekingAki",
            [
                {
                    url: "/client/ragfair/find",
                    action: (url, info, sessionId, output) => 
                    {

                        let ragfair = JSON.parse(output);

                        ragfair.data.offers.forEach(offer =>
                        {
                            if( money.includes( offer.items[0]._tpl) == false && offer.user.avatar == "/files/trader/avatar/unknown.jpg")
                            {
                                offer.items[0].upd.StackObjectsCount = 999;
                                offer.sellInOnePiece = false;
                                offer.CurrentItemCount = 999;
                            }

                        });
                        
                        return JSON.stringify(ragfair);
                    }
                }
            ],
            "aki"
        );


    }

    postDBLoad(container) 
    {

        const logger = container.resolve("WinstonLogger");
        const items = container.resolve("DatabaseServer").getTables().templates.items;
        const bots =  container.resolve("DatabaseServer").getTables().bots.types;
        const maps = container.resolve("DatabaseServer").getTables().locations;
        const handbook = container.resolve("DatabaseServer").getTables().templates.handbook.Items;
        const locales = container.resolve("DatabaseServer").getTables().locales.global;
        const globals = container.resolve("DatabaseServer").getTables().globals;
        const traders = container.resolve("DatabaseServer").getTables().traders;
        
        /*
        const modLoader = container.resolve("PreAkiModLoader");
        const quests = container.resolve("DatabaseServer").getTables().templates.quests;
        const globalsPresets = container.resolve("DatabaseServer").getTables().globals["ItemPresets"];
        */

        for(let trader in traders)
        {
            if(traders[trader].assort !== undefined )
            {
                traders[trader].assort.items.forEach(assortItem => 
                {
                    if( assortItem.upd !== undefined && assortItem.upd.BuyRestrictionMax !== undefined)
                    {
                        delete assortItem.upd.BuyRestrictionMax;
                        delete assortItem.upd.BuyRestrictionCurrent;
                        assortItem.upd.StackObjectsCount = 999;
                    }
                });

            }

            if(traders[trader].questassort !== undefined)
            {
                traders[trader].questassort.success = {};
            }

        }


        for(let item in items)
        {
            items[item]._props.ExaminedByDefault = true;
            items[item]._props.CanSellOnRagfair = true;
        }

        
        for(let botType in bots)
        {    

            //remove all meds, foods, drinks and nades from standards bots
            //also remove excessive loot from sptpmc
            switch(botType)
            {
                case "marksman" :
                case "arenafighter" :
                case "assault" :
                case "crazyassaultevent" :
                case "arenafighterevent" :
                case "cursedassault" :
                    bots[botType].generation.items.healing.weights = {"0": 1};
                    bots[botType].generation.items.drugs.weights = {"0": 1,};
                    bots[botType].generation.items.stims.weights = {"0": 1,};
                    bots[botType].generation.items.grenades.weights = {"0": 80,"1": 20};

                    bots[botType].generation.items.vestLoot ??= {"weights": {"0": 99,"1": 1} };
                    bots[botType].generation.items.vestLoot.weights =   {"0": 99,"1": 1};

                    bots[botType].generation.items.pocketLoot ??= {"weights": {"0": 90,"1": 10} };
                    bots[botType].generation.items.pocketLoot.weights = {"0": 90,"1": 10};

                    bots[botType].generation.items.backpackLoot ??= {"weights": {"0": 80,"1": 10,"2":8,"3":2} };
                    bots[botType].generation.items.backpackLoot.weights = {"0": 80,"1": 10,"2":8,"3":2};
                break;

                case "bear":
                case "usec":
                    bots[botType].generation.items.healing.weights = {"0": 80,"1": 20};
                    bots[botType].generation.items.drugs.weights = {"0": 80,"1": 20};
                    bots[botType].generation.items.stims.weights = {"0": 95,"1": 5};
                    bots[botType].generation.items.vestLoot.weights = {"0": 99,"1": 1};
                    bots[botType].generation.items.pocketLoot.weights = {"0": 90,"1": 10};
                    bots[botType].generation.items.backpackLoot.weights = {"0": 90,"1": 10};
                    bots[botType].chances.equipment.Backpack = 10;
                    bots[botType].chances.equipment.SecondPrimaryWeapon = 0;
                break;

                case "bosstest":
                case "followergluharsnipe":
                case "followertagilla":
                case "followertest":
                case "test":
                    continue;
            }

            //setting default health point of every ai    
            bots[botType].health.BodyParts= 
            [{
                "Chest": {"max": 85, "min": 85 },
                "Head": { "max": 35, "min": 35 },
                "LeftArm": { "max": 60, "min": 60 },
                "LeftLeg": { "max": 65, "min": 65 },
                "RightArm": { "max": 60, "min": 60 },
                "RightLeg": { "max": 65, "min": 65 },
                "Stomach": { "max": 70,  "min": 70 }
            }]
        }
        
        //triple the time of the raid
        for(let map in maps)
        {   
            if(map != "base" && maps[map].base.EscapeTimeLimit !== undefined)
            {
                maps[map].base.EscapeTimeLimit *= 3;
            }        
        }   


        //msgl adjustmensts :

        items["6275303a9f372d6ea97f9ec7"]._props.shotgunDispersion = 2;
        items["6275303a9f372d6ea97f9ec7"]._props.Slots.find(slot => slot._name == "mod_scope")._props.filters[0].Filter = 
        [
            "6284bd5f95250a29bc628a30",
            "58d39d3d86f77445bb794ae7",
            "616554fe50224f204c1da2aa",
            "5c7d55f52e221644f31bff6a",
            "616584766ef05c2ce828ef57",
            "577d128124597739d65d0e56",
            "615d8d878004cc50514c3233",
            "5b31163c5acfc400153b71cb",
            "5a33b652c4a28232996e407c",
            "5a33b2c9c4a282000c5a9511",
            "58d2664f86f7747fec5834f6",
            "57ae0171245977343c27bfcf",
            "558022b54bdc2dac148b458d",
            "58491f3324597764bc48fa02",
            "584924ec24597768f12ae244",
            "5b30b0dc5acfc400153b7124",
            "60a23797a37c940de7062d02",
            "5d2da1e948f035477b1ce2ba",
            "584984812459776a704a82a6",
            "570fd721d2720bc5458b4596" ];

        //glock 17 sigle firerate to 800
        items["5a7ae0c351dfba0017554310"]._props.SingleFireRate = 800;

        //9x18 PBM adjustement
        items["573719df2459775a626ccbc2"]._props.Damage = 58; 
        
        //m576 adjustements
        items["5ede475339ee016e8c534742"]._props.ProjectileCount = 20;
        items["5ede475339ee016e8c534742"]._props.buckshotBullets = 20;
        items["5ede475339ee016e8c534742"]._props.Damage = 48;

        //stm-9 fullauto
        items["60339954d62c9b14ed777c06"]._props.weapFireType = [ "single","fullauto"];

        //mp-153 stock adapter
        items["5bfe7fb30db8340018089fed"]._props.Slots.find((x) => x._name =="mod_stock")._props.filters[0].Filter.push("5ef1b9f0c64c5d0dfc0571a1");

        //new stim item 
        let stim = require("./stim.json");
        globals.config.Health.Effects.Stimulator.Buffs["overtakerBuff"] = stim.item._props.effects_health
        items["overtaker_stim"] = stim.item;
        handbook.push(stim.handbook);

        for (const [lang, localeData] of Object.entries(locales)) //foreach lang
        {
            for (const [entry, text] of Object.entries(stim.locale)) //and for each entry to add in from the locale object
            {
                locales[lang][entry] = text;
            }                
        }

        //CQCM facemask real weight adjustmeent
        items["657089638db3adca1009f4ca"]._props.Weight = 0.9;

        //waist pouch weight adjustement
        items["5732ee6a24597719ae0c0281"]._props.Weight = 0.2;

        //m12B stock weight adjustement (sv-98)
        items["624c29ce09cd027dff2f8cd7"]._props.Weight = 0.453
        
        
    }

}

module.exports = { mod: new balistonmod() };