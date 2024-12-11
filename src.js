"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');

class balistonmod 
{   
    preSptLoad(container)
    {

        let ragfairConfig = container.resolve("ConfigServer").getConfig("spt-ragfair");
        let pmcConfig = container.resolve("ConfigServer").getConfig("spt-pmc");
        let weatherConfig = container.resolve("ConfigServer").getConfig("spt-weather");

        let staticRouterModService = container.resolve("StaticRouterModService");


        weatherConfig.acceleration = 1;

        //adjust some ragfair configs
        ragfairConfig.traders["579dc571d53a0658a154fbec"] = true
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

        ragfairConfig.dynamic.nonStackableCount = { min : 999, max:999 };

        ragfairConfig.dynamic.armor.removeRemovablePlateChance = 100;

        for(let umprice in ragfairConfig.dynamic.unreasonableModPrices)
        {
            ragfairConfig.dynamic.unreasonableModPrices[umprice].enabled = false;
        }

        pmcConfig.convertIntoPmcChance.default.assault = { "min": 1, "max":10 }
        pmcConfig.convertIntoPmcChance.default.cursedassault = { "min": 1, "max":10 }
        pmcConfig.convertIntoPmcChance.default.pmcbot = { "min": 1, "max":10 }
        pmcConfig.convertIntoPmcChance.default.exusec = { "min": 1, "max":5  }
        pmcConfig.convertIntoPmcChance.factory4_day.assault = { "min": 1, "max":10 }

        pmcConfig.forceHealingItemsIntoSecure = false;

        var money = ["5449016a4bdc2d6f028b456f","5696686a4bdc2da3298b456a","569668774bdc2da2298b4568"];

        //unlimited items
        staticRouterModService.registerStaticRouter( "StaticRoutePeekingSpt",
            [
                {
                    url: "/client/ragfair/find",
                    action: (url, info, sessionId, output) => 
                    {
                        let ragfair = JSON.parse(output);
                        ragfair.data.offers.forEach(offer =>
                        {
                            if( money.includes( offer.items[0]._tpl) == false && offer.user.memberType == 0)
                            {   
                                offer.sellInOnePiece = false;
                                offer.items[0].upd.StackObjectsCount = 999;
                            }
                        });
                        
                        return JSON.stringify(ragfair);
                    }
                }
            ],
            "spt"
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
        const quests = container.resolve("DatabaseServer").getTables().templates.quests;
        */

        //overheat balancing;
        globals.config.Overheat.DurReduceMinMult = 0.1;
        
        //realistic things 
        globals.config.Health.Effects.Existence.EnergyDamage = 0.4;
        globals.config.Health.Effects.Existence.HydrationDamage = 0.65;
        globals.config.Health.Falling.DamagePerMeter = 2;

         
        // -> falling probality is 38% after reaching 20% of maximum falling spped value and graduating by a linear coeficient of 1 ?
        
        //unlock flea market 
        globals.config.RagFair.minUserLevel = 0;

        //remove anti-RMT restrictions 
        globals.config.RestrictionsInRaid = []


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
            items[item]._props.DiscardLimit = -1;
        }

        let allowed_plates = ["656f57dc27aed95beb08f628","654a4dea7c17dec2f50cc86a","656fac30c6baea13cd07e10c","656f9d5900d62bcd2e02407c"]

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
                    bots[botType].generation.items.grenades.weights = {"0": 99,"1": 1};

                    bots[botType].generation.items.vestLoot ??= {"weights": {"0": 99,"1": 1} };
                    bots[botType].generation.items.vestLoot.weights =   {"0": 99,"1": 1};

                    bots[botType].generation.items.drink ??= {"weights": {"0": 1} };
                    bots[botType].generation.items.drink.weights =   {"0": 1};

                    bots[botType].generation.items.food ??= {"weights": {"0": 1} };
                    bots[botType].generation.items.food.weights =   {"0": 1};

                    bots[botType].generation.items.pocketLoot ??= {"weights": {"0": 90,"1": 10} };
                    bots[botType].generation.items.pocketLoot.weights = {"0": 90,"1": 10};

                    bots[botType].generation.items.currency ??= {"weights": {"0": 99,"1": 1} };
                    bots[botType].generation.items.currency.weights = {"0": 99,"1": 1};

                    bots[botType].generation.items.backpackLoot ??= {"weights": {"0": 80,"1": 10,"2":8,"3":2} };
                    bots[botType].generation.items.backpackLoot.weights = {"0": 80,"1": 10,"2":8,"3":2};


                    //remove plates > class 3
                    for(let itemModded in bots[botType].inventory.mods )
                    {
                        let a = bots[botType].inventory.mods[itemModded]["Front_plate"];
                        if( a !== undefined )
                        {
                            bots[botType].inventory.mods[itemModded]["Front_plate"] = a.filter(fp => allowed_plates.includes(fp))
                        } 

                        a = bots[botType].inventory.mods[itemModded]["Back_plate"];
                        if( a !== undefined )
                        {
                            bots[botType].inventory.mods[itemModded]["Back_plate"] = a.filter(bp => allowed_plates.includes(bp))
                        } 
                    }


                break;


                case "assault" :
                    bots[botType].chances.equipment.ArmorVest = 20;
                break;


                case "bear":
                case "usec":
                    bots[botType].generation.items.healing.weights = {"0": 80,"1": 20};
                    bots[botType].generation.items.drugs.weights = {"0": 80,"1": 20};
                    bots[botType].generation.items.stims.weights = {"0": 95,"1": 5};
                    bots[botType].generation.items.vestLoot.weights = {"0": 99,"1": 1};
                    bots[botType].generation.items.pocketLoot.weights = {"0": 90,"1": 10};
                    bots[botType].generation.items.grenades.weights = {"0": 70,"1": 20,"2": 8,"3": 2}
                    bots[botType].generation.items.backpackLoot.weights = {"0": 1};
                    bots[botType].generation.items.food.weights =   {"0": 1};
                    bots[botType].generation.items.drink.weights =   {"0": 1};
                    bots[botType].generation.items.currency.weights = {"0": 90,"1": 10};
                    bots[botType].chances.equipment.Backpack = 10;
                    bots[botType].inventory.equipment.SecondPrimaryWeapon = {};

                break;

                case "bosstest":
                case "followergluharsnipe":
                case "followertagilla":
                case "followertest":
                case "test":
                    continue;
            }

            //aren't we all humans after all ..?    
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
            "57ae0171245977343c27bfcf",
            "58d39d3d86f77445bb794ae7",
            "616554fe50224f204c1da2aa",
            "5c7d55f52e221644f31bff6a",
            "616584766ef05c2ce828ef57",
            "615d8d878004cc50514c3233",
            "577d128124597739d65d0e56",
            "58d2664f86f7747fec5834f6",
            "5b31163c5acfc400153b71cb",
            "5a33b652c4a28232996e407c",
            "5a33b2c9c4a282000c5a9511",
            "558022b54bdc2dac148b458d",
            "58491f3324597764bc48fa02",
            "584924ec24597768f12ae244",
            "5b30b0dc5acfc400153b7124",
            "6165ac8c290d254f5e6b2f6c",
            "60a23797a37c940de7062d02",
            "5d2da1e948f035477b1ce2ba",
            "5c0505e00db834001b735073",
            "609a63b6e2ff132951242d09",
            "584984812459776a704a82a6",
            "59f9d81586f7744c7506ee62",
            "570fd721d2720bc5458b4596",
            "655f13e0a246670fb0373245" ];

        //glock 17 sigle firerate to 800
        items["5a7ae0c351dfba0017554310"]._props.SingleFireRate = 800;

        //glock 18 mod 3
        items["5a7ae0c351dfba0017554310"]._props.Slots.find(x => x._name == "mod_barrel")._props.filters[0].Filter.forEach((barrel) => 
            items["5b1fa9b25acfc40018633c01"]._props.Slots.find(x => x._name == "mod_barrel")._props.filters[0].Filter.push(barrel) ); //clone barrels to G18

        items["5a7ae0c351dfba0017554310"]._props.Slots.find(x => x._name == "mod_reciever")._props.filters[0].Filter.forEach((barrel) => 
            items["5b1fa9b25acfc40018633c01"]._props.Slots.find(x => x._name == "mod_reciever")._props.filters[0].Filter.push(barrel) ); //clone slides to G18
        items["5b1fa9b25acfc40018633c01"]._props.Slots.find(x => x._name == "mod_tactical")._props.filters[0].Filter.push("5a7ad74e51dfba0015068f45")
        items["5b1fa9b25acfc40018633c01"]._props.bFirerate = 720;
        

        //9x18 PBM adjustement
        items["573719df2459775a626ccbc2"]._props.Damage = 55; 
        
        //orsis t5000 meme
        items["5df24cf80dee1b22f862e9bc"]._props.defAmmo = "5cde8864d7f00c0010373be1";
        items["5df24cf80dee1b22f862e9bc"]._props.Chambers[0]._props.filters[0].Filter = ["5cde8864d7f00c0010373be1","5d2f2ab648f03550091993ca"];
        items["5df24cf80dee1b22f862e9bc"]._props.Slots.find(x => x._name == "mod_magazine")._props.filters[0].Filter = [];
        items["5df24cf80dee1b22f862e9bc"]._props.ammoCaliber = "Caliber127x108";

        //stm-9 fullauto
        items["60339954d62c9b14ed777c06"]._props.weapFireType = [ "single","fullauto"];
 
        //mp-153 stock adapter + new handguard + 510mm barrel
        items["5bfe7fb30db8340018089fed"]._props.Slots.find(x => x._name == "mod_stock")._props.filters[0].Filter.push("5ef1b9f0c64c5d0dfc0571a1");
        items["56dee2bdd2720bc8328b4567"]._props.Slots.find(x => x._name == "mod_handguard")._props.filters[0].Filter.push("55d45f484bdc2d972f8b456d");
        items["56dee2bdd2720bc8328b4567"]._props.Slots.find(x => x._name == "mod_barrel")._props.filters[0].Filter.push("560835c74bdc2dc8488b456f");

        //new stim item 
        let stim = require("./stim.json");
        globals.config.Health.Effects.Stimulator.Buffs["overtakerBuff"] = stim.item._props.effects_health
        items["67462f9335b5fd3c8ba4bb92"] = stim.item;
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
        items["5732ee6a24597719ae0c0281"]._props.Weight = 0.23;

        //m12B stock weight adjustement (sv-98)
        items["624c29ce09cd027dff2f8cd7"]._props.Weight = 0.553;


        //gp-25 adjust weight 
        items["639af924d0446708ee62294e"]._props.Weight = 1.4;
        items["62e7e7bbe6da9612f743f1e0"]._props.IronSightRange = 10;


        //m203 adjust weight
        items["639c3fbbd0446708ee622ee9"]._props.Weight = 1.367;

        //12ga .50bmg ammo 
        items["5d6e68c4a4b9361b93413f79"]._props.Damage = 99
        items["5d6e68c4a4b9361b93413f79"]._props.PenetrationPower = 40;
        items["5d6e68c4a4b9361b93413f79"]._props.Tracer = true;

        
    }




}

module.exports = { mod: new balistonmod() };