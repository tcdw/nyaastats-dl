import fs from 'fs-extra';
import path from 'path';

function toCamelCase(str: string, first = false) {
    const words = str.split('_');
    let out = '';
    words.forEach((e, i) => {
        if (!first && i === 0) {
            out += e;
            return;
        }
        out += e[0].toUpperCase() + e.substring(1);
    });
    return out;
}

function pad(e: number, len: number) {
    let str = String(e);
    while (str.length < len) {
        str = `0${str}`;
    }
    return str;
}

function filter(e: number | undefined | null) {
    if (!e) {
        return 0;
    }
    return e;
}

function count(map: Map<string, number>, key: string, amount = 1) {
    return map.set(key, filter(map.get(key)) + amount);
}

function combine(src: string, year: number = 2020) {
    const vehicle = [
        'boat_one_cm', // 坐船移动距离
        'aviate_one_cm', // 鞘翅滑行距离
        'horse_one_cm', // 骑马移动距离
        'minecart_one_cm', // 坐矿车移动距离
        'pig_one_cm', // 骑猪移动距离
        'strider_one_cm', // 骑炽足兽移动距离
        'climb_one_cm', // 已攀爬距离
        'crouch_one_cm', // 潜行距离
        'fly_one_cm', // 飞行距离
        'sprint_one_cm', // 疾跑距离
        'swim_one_cm', // 游泳距离
        'walk_one_cm', // 行走距离
    ];
    const advancements = [
        'adventure/adventuring_time',
        'adventure/arbalistic',
        'adventure/bullseye',
        'adventure/hero_of_the_village',
        'adventure/honey_block_slide',
        'adventure/kill_a_mob',
        'adventure/kill_all_mobs',
        'adventure/ol_betsy',
        'adventure/root',
        'adventure/shoot_arrow',
        'adventure/sleep_in_bed',
        'adventure/sniper_duel',
        'adventure/summon_iron_golem',
        'adventure/throw_trident',
        'adventure/totem_of_undying',
        'adventure/trade',
        'adventure/two_birds_one_arrow',
        'adventure/very_very_frightening',
        'adventure/voluntary_exile',
        'adventure/whos_the_pillager_now',
        'end/dragon_breath',
        'end/dragon_egg',
        'end/elytra',
        'end/enter_end_gateway',
        'end/find_end_city',
        'end/kill_dragon',
        'end/levitate',
        'end/respawn_dragon',
        'end/root',
        'husbandry/balanced_diet',
        'husbandry/bred_all_animals',
        'husbandry/breed_an_animal',
        'husbandry/complete_catalogue',
        'husbandry/fishy_business',
        'husbandry/obtain_netherite_hoe',
        'husbandry/plant_seed',
        'husbandry/root',
        'husbandry/safely_harvest_honey',
        'husbandry/silk_touch_nest',
        'husbandry/tactical_fishing',
        'husbandry/tame_an_animal',
        'nether/all_effects',
        'nether/all_potions',
        'nether/brew_potion',
        'nether/charge_respawn_anchor',
        'nether/create_beacon',
        'nether/create_full_beacon',
        'nether/distract_piglin',
        'nether/explore_nether',
        'nether/fast_travel',
        'nether/find_bastion',
        'nether/find_fortress',
        'nether/get_wither_skull',
        'nether/loot_bastion',
        'nether/netherite_armor',
        'nether/obtain_ancient_debris',
        'nether/obtain_blaze_rod',
        'nether/obtain_crying_obsidian',
        'nether/return_to_sender',
        'nether/ride_strider',
        'nether/root',
        'nether/summon_wither',
        'nether/uneasy_alliance',
        'nether/use_lodestone',
        'story/cure_zombie_villager',
        'story/deflect_arrow',
        'story/enchant_item',
        'story/enter_the_end',
        'story/enter_the_nether',
        'story/follow_ender_eye',
        'story/form_obsidian',
        'story/iron_tools',
        'story/lava_bucket',
        'story/mine_diamond',
        'story/mine_stone',
        'story/obtain_armor',
        'story/root',
        'story/shiny_gear',
        'story/smelt_iron',
        'story/upgrade_tools',
    ];
    const dataPaths = fs.readdirSync(path.join(src, 'data/by-uuid'));
    const statsPrefix = 'minecraft:custom/minecraft:';
    const statsPrefixLegacy = 'stat.';
    const data: Map<string, number> = new Map();
    dataPaths.forEach((e, i) => {
        process.stderr.write('\r');
        process.stderr.write(`[${i + 1} / ${dataPaths.length}] 正在处理 ...`);
        const content = fs.readJSONSync(path.join(src, 'data/by-uuid', e), { encoding: 'utf8' });
        const timeStart = new Date(content.data.time_start);
        const timeLast = new Date(content.data.time_last);

        // 每年份加入的玩家数量
        // yearly_registered:$YEAR $VALUE
        const yearKey = `yearly_registered:${timeStart.getFullYear()}`;
        count(data, yearKey);

        // 今年范围内的所有数据统计
        if (timeStart.getFullYear() === year) {
            // 该年份每月加入的玩家数量
            // yearly_registered:$YEAR_$MONTH  $VALUE
            const addedKey = `monthly_registered:${year}_${pad(timeStart.getMonth() + 1, 2)}`;
            count(data, addedKey);
        }

        // 进度 (advancement) 完成人数
        // advancement:$NAME  $AMOUNT
        advancements.forEach((f) => {
            if (typeof content.advancements[`minecraft:${f}`] !== 'undefined'
                && content.advancements[`minecraft:${f}`].done) {
                const advKey = `advancements:${f}`;
                count(data, advKey);
            }
        });

        // 出行方式总里程
        vehicle.forEach((f) => {
            const vehicleKey = `stats:${f}`;
            const value: number | undefined = content.stats[`${statsPrefix}${f}`];
            const valueLegacy: number | undefined = content.stats[`${statsPrefixLegacy}${toCamelCase(f)}`];
            if (typeof value !== 'undefined') {
                count(data, vehicleKey, Math.floor(value / 100));
            } else if (typeof valueLegacy !== 'undefined') {
                count(data, vehicleKey, Math.floor(valueLegacy / 100));
            }
        });
    });
    let output = '';

    // 通用数据
    const dataAsc: Map<string, number> = new Map([...data.entries()].sort());
    dataAsc.forEach((v, k) => {
        output += `${k}\t${v}\n`;
    });

    fs.writeFileSync(path.join(src, 'results.txt'), output, { encoding: 'utf8' });
}

export default combine;
