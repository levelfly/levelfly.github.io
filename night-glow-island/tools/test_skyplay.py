# -*- coding: utf-8 -*-
"""晨風群島：自動走完一整晚。

這一支不是「看看有沒有 render 出來」，是真的把光珠**拖**進托盤裡玩到天亮：
按下、移動、放開，走的跟小孩的手指同一條 pointer 事件路徑。

驗的東西分兩類：

  能不能玩    航線圖 → 分光 → 節點 → 天亮 → 圖鑑，一整條路走得完、走得回來
  紅線有沒有破  🔴 **光永遠守恆**。故意分錯一次，池子＋托盤的光加起來必須一顆不少。
                那是這個年齡檔最重要的一條設計線：資源耗損會被六歲讀成能力評價。

先開好 server：python serve.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8777"
fails = []
notes = []


def check(name, ok, detail=""):
    print(("  OK  " if ok else "  X   ") + name + (f"　{detail}" if detail else ""))
    if not ok:
        fails.append(f"{name}　{detail}")


async def boot(page, query="?profile=age6"):
    """開場到可以玩：等載入畫面消失（不是等 class，那是競態）。"""
    await page.goto(f"{BASE}/{query}")
    await page.wait_for_function(
        "() => { const l = document.getElementById('loader');"
        " return !l || l.classList.contains('ready') || l.classList.contains('gone'); }",
        timeout=25000)
    await page.mouse.click(page.viewport_size["width"] // 2, page.viewport_size["height"] // 2)
    await page.wait_for_function(
        "() => { const l = document.getElementById('loader'); return !l || l.classList.contains('gone'); }",
        timeout=20000)
    await page.wait_for_timeout(400)


async def scene(page):
    return await page.evaluate("() => window.__glow?.sceneName")


async def wait_scene(page, names, timeout=25000):
    want = names if isinstance(names, (list, tuple)) else [names]
    await page.wait_for_function(
        "names => names.includes(window.__glow?.sceneName)", arg=want, timeout=timeout)
    return await scene(page)


async def center(el):
    """東西不在就回 None，不要讓 Playwright 等三十秒。

    這個遊戲的東西是會消失的（選了一扇門，另一扇就 vanish 掉）。
    直接對不存在的 locator 問 bounding_box 會卡滿逾時然後把整支測試炸掉 ——
    看起來像遊戲壞了，其實只是我們晚了半秒。"""
    try:
        if await el.count() == 0:
            return None
        b = await el.bounding_box(timeout=3000)
    except Exception:
        return None
    return (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2) if b else None


async def tap(page, el, dy=0.0):
    """用座標點，不要用 locator.click()。

    這個遊戲裡每一個東西都在輕輕漂（Prop 每幀都在寫 transform），
    Playwright 的 click 會一直等「元素穩定下來」，然後逾時 —— 但畫面其實好好的。
    小孩的手指也不會等它停，所以照座標點才是真實路徑。"""
    p = await center(el)
    if not p:
        return False
    await page.mouse.click(p[0], p[1] + dy)
    return True


async def drag(page, src, dst):
    """真的用手指拖：pointerdown → 幾段 move → pointerup。
    步進不能少於三段，`draggable` 要看到超過門檻的位移才算拖曳（否則會被當成點擊）。"""
    a, b = await center(src), await center(dst)
    if not a or not b:
        return False
    await page.mouse.move(*a)
    await page.mouse.down()
    for i in range(1, 7):
        await page.mouse.move(a[0] + (b[0] - a[0]) * i / 6, a[1] + (b[1] - a[1]) * i / 6)
        await page.wait_for_timeout(12)
    await page.mouse.up()
    await page.wait_for_timeout(160)
    return True


async def tap_tray(page, ti):
    """點托盤把池子裡的光拉一顆過來。

    不能點正中央 —— 已經放進去的光珠就疊在那裡，點下去是把它**拿回燈籠**（那是設計，
    不是 bug：點空位＝放進去，點光珠＝拿回來）。所以先問清楚每顆光珠在哪，
    再挑一個離它們最遠的位置點。小孩用眼睛做同一件事。
    """
    loc = page.locator(f'.tray[data-slot="{ti}"]')
    try:
        if await loc.count() == 0:
            return False
        box = await loc.bounding_box(timeout=3000)
    except Exception:
        return False
    if not box:
        return False
    orbs = await page.evaluate("""() => Array.from(document.querySelectorAll('.prop.orb'))
        .map(n => { const r = n.getBoundingClientRect();
                    return [r.left + r.width / 2, r.top + r.height / 2]; })""")
    best, bestD = None, -1
    for fx_ in (.5, .18, .82, .34, .66):
        for fy_ in (.86, .14, .5):
            x = box["x"] + box["width"] * fx_
            y = box["y"] + box["height"] * fy_
            d = min((abs(x - ox) ** 2 + abs(y - oy) ** 2) ** .5 for ox, oy in orbs) if orbs else 1e9
            if d > bestD:
                bestD, best = d, (x, y)
    await page.mouse.click(*best)
    return True


def plan_targets(board):
    """每個托盤該有多少。free 槽的需求是「至少一顆」——剩下的通通丟給第一個。"""
    trays = board["trays"]
    fixed = sum(t["need"] or 0 for t in trays if t["kind"] != "free")
    frees = [t for t in trays if t["kind"] == "free"]
    want = {}
    for t in trays:
        want[t["i"]] = t["need"] or 0
    if frees:
        spare = board["total"] - fixed - (len(frees) - 1)
        want[frees[0]["i"]] = max(1, spare)
        for t in frees[1:]:
            want[t["i"]] = 1
    return want


async def solve_task(page, use_drag=True, limit=40):
    """像人一樣把這一題分完：看盤面 → 決定下一顆放哪 → 搬過去。

    回傳「有沒有真的搬過東西」。池子本來就空著（上一題的演出還沒演完）不算解了一題 ——
    不然計數會虛胖成幾十題，而一座島其實只有五、六題。"""
    moves = 0
    for _ in range(limit):
        board = await page.evaluate("() => window.__glow?.board?.() || null")
        if not board or not board["pool"]:
            return moves > 0
        want = plan_targets(board)
        move = None
        for t in board["trays"]:
            left = want[t["i"]] - t["value"]
            if left <= 0:
                continue
            fits = sorted([v for v in board["pool"] if v <= left], reverse=True)
            if fits:
                move = (fits[0], t["i"])
                break
        if not move:
            return False
        val, ti = move
        orb = page.locator(f'.prop.orb[data-in="pool"][data-orb="{val}"]').first
        tray = page.locator(f'.tray[data-slot="{ti}"]')
        before = len(board["pool"])
        if use_drag:
            if not await drag(page, orb, tray):
                return False
        else:
            await tap_tray(page, ti)
            await page.wait_for_timeout(220)
        after = await page.evaluate("() => window.__glow?.board?.()?.pool?.length ?? -1")
        if after >= before:
            return False        # 這一下沒生效，別在原地空轉
        moves += 1
    return False


async def light_is_conserved(page):
    """池子裡的 + 托盤裡的 == 這一題本來就有的。一顆都不能少。"""
    b = await page.evaluate("() => window.__glow?.board?.() || null")
    if not b:
        return None
    return sum(b["pool"]) + sum(t["value"] for t in b["trays"]), b["total"]


async def run(pw, portrait=True):
    size = {"width": 430, "height": 880} if portrait else {"width": 900, "height": 430}
    browser = await pw.chromium.launch()
    ctx = await browser.new_context(viewport=size, device_scale_factor=2)
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    tag = "直握" if portrait else "橫握"
    print(f"\n─── {tag} {size['width']}x{size['height']} ───")

    await boot(page)
    s = await wait_scene(page, ["title", "skymap"])
    check(f"[{tag}] 開場直接進晨風群島（?profile 指定了就不再問一次）", s == "title", s)

    # 開場的光種子 → 航線圖。
    # 要多戳幾次：光種子是 appear 進來的（scale 從 0 彈上來），太早戳的時候
    # 它的外接矩形還很小，座標會落在旁邊。真人也是看到了才戳，所以重試才是真實行為。
    for _ in range(8):
        if await scene(page) != "title":
            break
        await tap(page, page.locator(".prop").first)
        await page.wait_for_timeout(700)
    s = await wait_scene(page, ["skymap"])
    check(f"[{tag}] 進得了航線圖", s == "skymap")

    segs = await page.evaluate("() => window.__glow.run.voyage.segs")
    check(f"[{tag}] 一晚是 5～7 段風", 5 <= segs <= 7, f"segs={segs}")
    picks = await page.locator(".prop[data-pickable]").count()
    check(f"[{tag}] 一次只給兩個選項", picks == 2, f"{picks} 個")
    sails = await page.locator(".sail-bar i").count()
    check(f"[{tag}] 風帆進度條的段數對得上", sails == segs, f"{sails} vs {segs}")

    conserved_checked = False
    repairs = 0
    guard = 0

    while guard < 90:
        guard += 1
        s = await scene(page)

        if s == "dawn":
            break

        if s == "skymap":
            done = await page.evaluate("() => window.__glow.run.voyage.done")
            dawnv = await page.evaluate(
                "() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dawn'))")
            if done:
                check(f"[{tag}] 天色跟著風走（第 {done} 段）", abs(dawnv - done / segs) < 0.02, f"--dawn={dawnv}")
            node = page.locator(".prop[data-pickable]").first
            await tap(page, node)
            await page.wait_for_timeout(900)
            continue

        if s == "repair":
            solved = 0
            saw_board = False
            # 一座島有五、六題。不要用「等 board 出現」當入口條件 ——
            # 過完最後一題會直接進收尾動畫，那時候場景名還是 repair 但棋盤已經收掉了，
            # 死等 board 會白等到逾時（明明遊戲是好好的）。看場景名變了就走。
            for _ in range(12):
                if await scene(page) != "repair":
                    break
                # 等「下一題的光真的倒出來」——不要用固定間隔輪詢：
                # 過關演出有長有短（發現新分法時嚕米會把整句話講完），輪詢不是等太久就是漏掉。
                try:
                    await page.wait_for_function(
                        "() => window.__glow?.sceneName !== 'repair'"
                        " || (window.__glow?.board?.()?.pool?.length || 0) > 0", timeout=28000)
                except Exception:
                    break
                if await scene(page) != "repair":
                    break
                saw_board = True

                # 🔴 整晚只做一次：故意分錯，確認光沒有被拿走。
                if not conserved_checked:
                    conserved_checked = True
                    before = await page.evaluate("() => window.__glow.board().total")
                    for _ in range(30):     # 全部倒進第一個托盤，大部分題目這樣一定不對
                        b = await page.evaluate("() => window.__glow?.board?.()")
                        if not b or not b["pool"] or b["trays"][0]["full"]:
                            break
                        n0 = len(b["pool"])
                        await tap_tray(page, 0)
                        await page.wait_for_timeout(200)
                        if await page.evaluate("() => window.__glow?.board?.()?.pool?.length ?? -1") >= n0:
                            break
                    await page.wait_for_timeout(2400)
                    got = await light_is_conserved(page)
                    if got:
                        check(f"[{tag}] 🔴 分錯之後光一顆都沒少", got[0] == got[1] == before,
                              f"現在 {got[0]} / 本來 {before}")
                    else:
                        notes.append("分錯時剛好過關了，守恆這一項這一輪沒測到")

                # 一半用拖的、一半用點的：兩條互動路徑都要走得到
                if await solve_task(page, use_drag=(solved % 2 == 0)):
                    solved += 1
                await page.wait_for_timeout(700)
            # 只有真的看到棋盤才算走過一座島。最後一題過關之後還有兩秒多的收尾演出，
            # 那段時間場景名仍然是 repair，外層迴圈會再進來一次 —— 那不是一座島。
            if saw_board:
                repairs += 1
                check(f"[{tag}] 分得完（第 {repairs} 座島，{solved} 題）", solved >= 1)
            continue

        if s == "event":
            # 寶箱／光靈／休息：一直戳戳得到的東西，直到它把我們送回航線。
            # 不要「戳一次然後等」——剛進場景時 lockTaps 還壓著（選島的動畫還在演），
            # 那一下會被吃掉，然後就只能等自動流程，看起來像卡死。真人也是會再戳一次的。
            for _ in range(34):
                if await scene(page) != "event":
                    break
                for sel in [".pick-card", ".prop"]:
                    loc = page.locator(sel).first
                    if await loc.count():
                        try:
                            await tap(page, loc)
                        except Exception:
                            pass
                        break
                await page.wait_for_timeout(900)
            if await scene(page) == "event":
                check(f"[{tag}] 路上的節點回得了航線圖", False, "卡在 event")
                break
            continue

        await page.wait_for_timeout(700)

    s = await scene(page)
    check(f"[{tag}] 風吹完就天亮（不是死亡，是收帆）", s == "dawn", s)
    check(f"[{tag}] 一晚真的有分光關卡", repairs >= 1, f"{repairs} 座島")

    if s == "dawn":
        # 天亮那一頁是慢慢浮出來的（1.6 秒後才貼上），存檔也有 250ms 的防抖。
        # 一看到場景名就查會兩邊都撲空 —— 那是測試搶快，不是遊戲沒做。
        await page.wait_for_timeout(3000)
        nights = await page.evaluate("() => JSON.parse(localStorage['glowisle.v2']).profiles.age6.nights")
        check(f"[{tag}] 日記記下了這一晚", nights >= 1, f"nights={nights}")
        pages = await page.locator(".diary-sheet svg").count()
        check(f"[{tag}] 天亮那一頁畫得出來", pages >= 1)

    # 圖鑑三頁
    await tap(page, page.locator(".hud-lantern"))
    await wait_scene(page, ["nest"])
    for tab, name in [("recipes", "配方"), ("spirits", "光靈"), ("diary", "日記")]:
        await tap(page, page.locator(f'.nest-tab[data-tab="{tab}"]'))
        await page.wait_for_timeout(320)
        n = await page.locator(".nest-body *").count()
        check(f"[{tag}] {name}那一頁有東西", n > 0, f"{n} 個節點")
    recs = await page.evaluate(
        "() => Object.values(JSON.parse(localStorage['glowisle.v2']).profiles.age6.recipes).flat().length")
    check(f"[{tag}] 玩過就會有配方進圖鑑", recs >= 1, f"{recs} 種拆法")

    # 效能：托盤與光珠都是 DOM + SVG，掉幀第一個會在這裡出現
    fps = await page.evaluate("""() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      const tick = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(tick) : res(n); };
      requestAnimationFrame(tick);
    })""")
    check(f"[{tag}] 沒有掉幀", fps >= 50, f"{fps} fps")

    real = [e for e in errors if "favicon" not in e.lower()]
    check(f"[{tag}] 主控台乾淨", not real, "; ".join(real[:3]))

    await ctx.close()
    await browser.close()


async def age4_untouched(pw):
    """4 歲檔行為零改變 —— 這是所有改動的天花板。"""
    print("\n─── 夜光島（age4）沒有被動到 ───")
    browser = await pw.chromium.launch()
    ctx = await browser.new_context(viewport={"width": 430, "height": 880})
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    await boot(page, "?profile=age4")
    s = await wait_scene(page, ["title"])
    check("age4 開場還是 title", s == "title", s)
    for _ in range(8):
        if await scene(page) != "title":
            break
        await tap(page, page.locator(".prop").first)
        await page.wait_for_timeout(700)
    s = await wait_scene(page, ["map"])
    check("age4 回的是夜光島的地圖", s == "map", s)
    await tap(page, page.locator(".hud-lantern"))
    s = await wait_scene(page, ["lantern"])
    check("age4 的燈籠打開的還是收藏冊，不是新的窩", s == "lantern", s)
    check("age4 沒有主控台錯誤", not errors, "; ".join(errors[:2]))
    await ctx.close()
    await browser.close()


async def two_doors(pw):
    """門開了：沒有 ?profile 的時候，她要自己選一座島。"""
    print("\n─── 兩扇門 ───")
    browser = await pw.chromium.launch()
    ctx = await browser.new_context(viewport={"width": 430, "height": 880})
    page = await ctx.new_page()
    await boot(page, "")
    s = await wait_scene(page, ["agepick", "title"])
    check("開場出現兩扇門", s == "agepick", s)
    doors = await page.locator(".prop").count()
    check("兩扇門都在", doors >= 2, f"{doors}")
    caps = await page.locator(".pick-cap").all_text_contents()
    check("兩座島的名字都寫著", "夜光島" in caps and "晨風群島" in caps, str(caps))
    # 點右邊那扇 → 晨風群島。
    # 兩扇門是 appear 進來的（scale 從 0 彈上來），太早點的時候外接矩形還是 0×0，
    # 那一下會落在空白處。等它長出來，然後跟真人一樣可以再點一次。
    await page.wait_for_timeout(1500)
    for _ in range(6):
        if await scene(page) != "agepick" or await page.locator(".prop").count() < 2:
            break
        c = await center(page.locator(".prop").nth(1))
        if c:
            await page.mouse.click(*c)
        await page.wait_for_timeout(800)
    s = await wait_scene(page, ["title"])
    pid = await page.evaluate("() => window.__glow.profile.id")
    check("按了右邊那扇就真的換到晨風群島", s == "title" and pid == "age6", pid)
    await ctx.close()
    await browser.close()


async def main():
    async with async_playwright() as pw:
        await run(pw, portrait=True)
        await run(pw, portrait=False)
        await age4_untouched(pw)
        await two_doors(pw)

    print("\n=== 結果 ===")
    for n in notes:
        print("·", n)
    if fails:
        for f in fails:
            print("X", f)
        sys.exit(1)
    print("OK 晨風群島走得完一整晚：拖得動、分錯不扣光、風停天亮、圖鑑記得住")


if __name__ == "__main__":
    asyncio.run(main())
