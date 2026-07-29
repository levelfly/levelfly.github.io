# -*- coding: utf-8 -*-
"""Generate the 《嚕米的夜光島》 voice bank with edge-tts (zh-TW neural)."""
import asyncio, json, pathlib, sys
import edge_tts

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "voice"
OUT.mkdir(parents=True, exist_ok=True)

VOICE = "zh-TW-HsiaoChenNeural"
RATE = "-8%"
PITCH = "+12Hz"

CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]

LINES = {}

# 單念數字（數數動畫）
for i in range(1, 11):
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
