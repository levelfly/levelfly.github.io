# -*- coding: utf-8 -*-
"""Generate the 《嚕米的夜光島》 voice bank with edge-tts (zh-TW neural)."""
import asyncio, json, pathlib, sys
import edge_tts

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "voice"
OUT.mkdir(parents=True, exist_ok=True)

VOICE = "zh-TW-HsiaoChenNeural"
RATE = "-8%"
PITCH = "+12Hz"

CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
      "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"]

LINES = {}

# 單念數字（數數動畫）。
# 到 20 是為了晨風群島的「十幾＝10 加幾」——那一關會出到 16 顆光。
# 找數字／是幾個那兩組仍然只到 10：4 歲檔的範圍沒有變。
for i in range(1, 21):
    LINES[f"n{i}"] = CN[i]

# 聽數字 → 找數字（兩種問法輪替）
for i in range(1, 11):
    LINES[f"find_{i}"] = f"找找看，{CN[i]}，在哪裡呢？"
    LINES[f"findb_{i}"] = f"{CN[i]}！{CN[i]}躲在哪裡呀？"

# 數量 → 數字
LINES["ask1"] = "數數看，有幾個呀？"
LINES["ask2"] = "這裡有多少個呢？"
LINES["ask3"] = "我們一起數數看！"
for i in range(1, 11):
    LINES[f"is_{i}"] = f"是{CN[i]}個！"

# 讚美
praise = ["找到了！", "太棒了！", "就是它！", "哇，好厲害！", "你好棒喔！", "答對了！"]
for k, t in enumerate(praise, 1):
    LINES[f"good{k}"] = t

# 溫柔的失誤回應
miss = ["嗯……再看看？", "不是這個喔，再找找。", "差一點點，再試一次！", "沒關係，我們慢慢來。"]
for k, t in enumerate(miss, 1):
    LINES[f"miss{k}"] = t

# 旁白 / 劇情
STORY = {
    "intro1": "哎呀……夜光島的光，全都不見了。",
    "intro2": "我是嚕米。你可以幫我把光找回來嗎？",
    "tap_start": "點一下，我們出發囉！",
    "pick_place": "想先去哪裡呢？",
    "area_marsh": "螢火沼澤到了！",
    "area_cove": "貝殼海灘，好涼快！",
    "area_grove": "果實樹林，好香喔。",
    "area_cliff": "星星懸崖，好高好高！",
    "area_light": "最後……是燈塔。",
    "area_clear": "哇，這裡亮起來了！",
    "collect": "你收到一隻光靈！",
    "rare": "金色的光靈！好稀有喔！",
    "finale1": "哇——整座島，都亮起來了！",
    "finale2": "謝謝你。我們明天，再一起玩好不好？",
    "sneeze": "哈啾！",
    "giggle": "嘻嘻，好癢喔！",
    "lantern": "這些，都是你找回來的光。",
    "again": "再玩一次！",
    "crab": "咦？有小螃蟹！",
    "whale": "看……是光鯨魚。",
}
LINES.update(STORY)

# ── 晨風群島（6 歲檔）──
# 這座島的動詞是「分」不是「找」，所以講法也不一樣：
# 不問「這是幾」，問「這些光要怎麼分過去」。
SKY = {
    "sky_intro1": "早安！風把雲橋吹開了。",
    "sky_intro2": "我們一起把光，送回它們該去的地方吧！",
    "sky_pick": "今天想先去哪一座島呢？",
    "sky_garden": "雲上花園，好香喔！",
    "sky_mill": "風車島，風好大！",
    "sky_falls": "水瀑島，水一直往下掉。",
    "sky_market": "晨風市集，好熱鬧！",
    "sky_beacon": "最高的地方……晨鐘塔。",
    "sky_clear": "哇，這座島的光回來了！",
    "sky_sunrise": "天亮了。我們今天走到這裡。",
}
LINES.update(SKY)

# ── 分光玩法的台詞 ──
# 全部都不含算式：說的是「空位」「一樣多」「剩下的」，不是「八減三」。
# 六歲要先有具體物的經驗，符號是後面的事。
# sky_can / sky_and / sky_take / sky_left 是拼句用的短詞：
#   「八」「可以分成」「五」「跟」「三」——用現成的數字檔組出無限多句話，
#   不必為每一種拆法各錄一句（那會是幾百個檔）。
PLAY = {
    "sky_task_free":  "這兩邊都要有光喔，你想怎麼分呢？",
    "sky_task_free3": "三個地方都要有光，你想怎麼分？",
    "sky_task_fill":  "把光放進空空的位子吧。",
    "sky_task_rest":  "先放好這一邊，剩下的全部送過去。",
    "sky_task_same":  "這一邊，要跟旁邊一樣多喔。",
    "sky_task_more":  "把空的位子補滿，就會比旁邊多囉。",
    "sky_task_ten":   "幫我把十個位子填滿。",
    "sky_task_price": "要付剛剛好的光幣，才買得到喔。",
    "sky_retry":      "沒關係，我們換一種分法看看。",
    "sky_newway":     "哇！這是一種新的分法！",
    "sky_oldway":     "這個分法我們記過了，還有別的嗎？",
    "sky_can":        "可以分成",
    "sky_and":        "跟",
    "sky_take":       "拿走",
    "sky_left":       "剩下",
    "sky_wind":       "風要吹了，我們去哪一邊？",
    "sky_last":       "最後一段風了，我們往晨鐘塔去。",
    "sky_node_repair": "這裡有光要分。",
    "sky_node_spirit": "咦，好像有誰在那裡。",
    "sky_chest":      "咦？這裡有東西！",
    "sky_tool_get":   "挑一個帶著走吧。",
    "sky_spirit_join": "牠要跟我們一起走。",
    "sky_rest":       "休息一下，看看風景。",
    "sky_diary":      "這是我們今天走過的路。",
    "sky_nest":       "這些，都是你發現的。",
}
LINES.update(PLAY)


async def one(sem, key, text):
    async with sem:
        path = OUT / f"{key}.mp3"
        for attempt in range(3):
            try:
                c = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
                await c.save(str(path))
                if path.stat().st_size > 500:
                    return key, text, path.stat().st_size
            except Exception as e:  # noqa
                if attempt == 2:
                    return key, text, f"ERR {e}"
                await asyncio.sleep(1.5)
        return key, text, "ERR empty"


async def main():
    sem = asyncio.Semaphore(8)
    res = await asyncio.gather(*(one(sem, k, v) for k, v in LINES.items()))
    bad = [r for r in res if isinstance(r[2], str)]
    manifest = {k: {"text": v, "file": f"{k}.mp3"} for k, v in LINES.items()}
    (OUT / "manifest.json").write_text(
        json.dumps({"voice": VOICE, "lines": manifest}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    print(f"total={len(res)} ok={len(res)-len(bad)} bad={len(bad)}")
    for b in bad:
        print("  BAD", b)
    sys.stdout.flush()


asyncio.run(main())
