"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

class balistonmod 
{   

    postDBLoad(container) 
    {

        const logger = container.resolve("WinstonLogger");
        const items = container.resolve("DatabaseServer").getTables().templates.items;
        const bots =  container.resolve("DatabaseServer").getTables().bots.types;
        const maps = container.resolve("DatabaseServer").getTables().locations;
        const ragfairConfig = container.resolve("ConfigServer").configs["aki-ragfair"];

        /*const modLoader = container.resolve("PreAkiModLoader"); 
        const handbook = container.resolve("DatabaseServer").getTables().templates.handbook.Items;
        const locales = container.resolve("DatabaseServer").getTables().locales.global;
        const traders = container.resolve("DatabaseServer").getTables().traders;
        const quests = container.resolve("DatabaseServer").getTables().templates.quests;
        const globalsPresets = container.resolve("DatabaseServer").getTables().globals["ItemPresets"];
        */


        for(let item in items)
        {
            items[item]._props.ExaminedByDefault = true;
            items[item]._props.CanSellOnRagfair = true;
        }

       
        for(let botType in bots)
        {    
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
            
            //remove all meds and nades from standards bots and reduce armors
            switch(botType)
            {
                case "marksman" :
                case "arenafighter" :
                case "assault" :
                case "crazyassaultevent" :
                case "arenafighterevent" :
                case "cursedassault" :
                    bots[botType].generation.items.drugs.max = 0;
                    bots[botType].generation.items.drugs.min = 0;
                    bots[botType].generation.items.grenades.max = 0;
                    bots[botType].generation.items.grenades.min = 0;
                    bots[botType].generation.items.healing.max = 0;
                    bots[botType].generation.items.healing.min = 0;
                    bots[botType].generation.items.stims.max = 0;
                    bots[botType].generation.items.stims.min = 0;

                    for( let armor in bots[botType].inventory.equipment.ArmorVest)
                    {
                        if( items[armor]._props.armorClass > 3 )
                        {
                            
                            delete bots[botType].inventory.equipment.ArmorVest[armor];
                        }
                    }

                    let arrayOfitemsToreplace = [];
                    bots[botType].inventory.items.TacticalVest.forEach(lootVestItem =>
                    {
                        if( items[lootVestItem]._name.includes("mag_") || items[lootVestItem]._name.includes("patron_") ) 
                        {
                            arrayOfitemsToreplace.push(lootVestItem);
                        }
                        
                    });

                    bots[botType].inventory.items.TacticalVest = arrayOfitemsToreplace;

                break;
            }

        }

        



        //triple the time of the raid
        for(let map in maps)
        {   
            if(map != "base" && maps[map].base.EscapeTimeLimit !== undefined)
            {
                maps[map].base.EscapeTimeLimit *= 3
            }        
        }

        

        //msgl add all reflex sights : 
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
            "570fd721d2720bc5458b4596"

        ];

        //adjust ragfair prices
        ragfairConfig.dynamic.price.min = 1
        ragfairConfig.dynamic.price.max = 1

        ragfairConfig.dynamic.offerItemCount.min = 1
        ragfairConfig.dynamic.offerItemCount.max = 2

    }

}

module.exports = { mod: new balistonmod() };