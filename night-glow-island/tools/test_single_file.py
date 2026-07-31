# -*- coding: utf-8 -*-
"""單檔版冒煙測試：直接開 dist/夜光島.html 的 file:// URL，真的玩完一整關。

驗的不是「載得起來」，是「小朋友走的那條路能不能走完」：
  1. 沒有 console error / pageerror
  2. 語音真的解碼進 buffer（fetch shim 有效 → 不是退回瀏覽器 TTS）
  3. 一整關的題目答得完、地點會亮起來
  4. localStorage 在 file:// 下寫得進去（存檔不會白做）

跑之前先 `python tools/build_single.py`。
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
SINGLE = ROOT / "dist" / "夜光島.html"
OUT = ROOT / "tools" / "render_check"
OUT.mkdir(exist_ok=True)


def center(rect):
    return rect["left"] + rect["width"] / 2, rect["top"] + rect["height"] / 2


async def main():
    # --http 走模組版當對照組：同一份測試邏輯、不同載入通道。
    # 兩邊都失敗 = 本來就這樣，不是單檔化造成的。
    use_http = "--http" in sys.argv
    if use_http:
        url = "http://127.0.0.1:8777/?go=marsh"
    else:
        if not SINGLE.exists():
            sys.exit(f"找不到 {SINGLE}，先跑 python tools/build_single.py")
        url = SINGLE.as_uri() + "?go=marsh"
    print(f"通道: {'http 模組版（對照組）' if use_http else 'file:// 單檔版'}")
    problems = []

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844, "device_scale_factor": 2},
            has_touch=True,
        )
        page = await ctx.new_page()
        errors, logs = [], []
        page.on("console", lambda m: (errors if m.type == "error" else logs).append(m.text))
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        # 攔 speechSynthesis：只要走了退路就代表 mp3 沒解碼成功
        await page.add_init_script("""
          window.__ttsCalls = 0;
          const s = window.speechSynthesis;
          if (s && s.speak) { const o = s.speak.bind(s); s.speak = function (u) { window.__ttsCalls++; return o(u); }; }
        """)
        await page.goto(url)
        await page.wait_for_selector("#loader.ready", timeout=20000)
        await asyncio.sleep(0.3)
        await page.click("#loader")
        await page.wait_for_selector("#loader.gone", timeout=20000, state="attached")
        await asyncio.sleep(1.5)

        # ── 1. 語音：fetch 拿不拿得到，以及有沒有偷偷退回瀏覽器 TTS ──
        # app 物件沒有把 audio 模組掛出來，所以不直接數 buffer.size，
        # 改驗兩件外部可觀測的事：資產 fetch 得到、而且沒有走 speechSynthesis 退路。
        voice = await page.evaluate("""async () => {
          const out = { manifest: null, mp3: null, ttsFallback: window.__ttsCalls || 0 };
          try {
            const r = await fetch('assets/voice/manifest.json');
            const j = await r.json();
            out.manifest = Object.keys(j.lines || {}).length;
          } catch (e) { out.manifest = 'FAIL ' + e.name; }
          try {
            const r = await fetch('assets/voice/n1.mp3');
            const b = await r.arrayBuffer();
            out.mp3 = b.byteLength;
          } catch (e) { out.mp3 = 'FAIL ' + e.name; }
          return out;
        }""")
        print("語音探針:", voice)
        if not isinstance(voice["manifest"], int) or voice["manifest"] < 70:
            problems.append(f"語音 manifest 拿不到（{voice['manifest']}）—— fetch shim 沒生效")
        if not isinstance(voice["mp3"], int) or voice["mp3"] < 1000:
            problems.append(f"語音 mp3 拿不到（{voice['mp3']}）—— 會退回瀏覽器 TTS")
        if voice["ttsFallback"]:
            problems.append(f"用了 {voice['ttsFallback']} 次瀏覽器 TTS —— 表示 mp3 沒解碼成功")

        # ── 2. 真的玩完一整關 ─────────────────────────────────────
        async def scene_name():
            return await page.evaluate("() => { try { return window.__glow?.sceneName; } catch(e){ return null; } }")

        async def cleared_marsh():
            """『這個地點真的通了』的地面真相 = 存檔裡 cycles.marsh 被記上去。

            不要用「離開 level 場景」判斷 —— 實測過關後遊戲會自己接著進下一個地點，
            場景名稱一直是 level、進度燈還會歸零重數，看起來像永遠沒過關。
            """
            return await page.evaluate("""() => {
              try {
                const d = JSON.parse(localStorage.getItem('glowisle.v2') || '{}');
                return ((d.profiles || {})[d.activeProfile || 'age4'] || {}).cycles?.marsh || 0;
              }
              catch (e) { return 0; }
            }""")

        async def snapshot():
            return await page.evaluate(
                """() => Array.from(document.querySelectorAll('.prop')).map(n => ({
                     value: n.dataset.value, locked: n.dataset.locked,
                     rect: n.getBoundingClientRect() }))""")

        async def play_until_unlocked(secs=14):
            """跟真人一樣：一直戳可數物件，直到數字牌亮起來。

            不去猜「這一題應該有幾顆」——道具是一顆一顆 appear 上去的，
            用數量當同步點永遠會有競態。真正的通過條件只有一個：**有牌可以按了**。
            重複戳同一顆是安全的（level.js:160 `c.tagged` 擋掉），所以每一輪直接全戳一遍。
            """
            for _ in range(int(secs * 2)):
                props = await snapshot()
                if any(x["value"] is not None and x["locked"] != "1" for x in props):
                    return props
                for c in [x for x in props if x["value"] is None]:
                    x, y = center(c["rect"])
                    await page.touchscreen.tap(x, y)
                    await asyncio.sleep(0.3)
                await asyncio.sleep(0.5)
            return await snapshot()

        async def get_q():
            return await page.evaluate("() => { try { return window.__glow?.q; } catch(e){ return null; } }")

        answered = 0
        for rnd in range(16):
            if await cleared_marsh():
                break
            if await scene_name() != "level":
                await asyncio.sleep(1.0)
                continue
            q = await get_q()
            props = await play_until_unlocked() if q else []
            if not props or not q:
                await asyncio.sleep(1.0)
                continue

            # 按答案那張牌。位置要在按下的前一刻重讀 —— 牌子會浮動，用舊 rect 會按空。
            ans = str(q["answer"])
            box = await page.evaluate(f"""() => {{
              const n = document.querySelector('.prop[data-value="{ans}"]');
              return n ? {{ rect: n.getBoundingClientRect(), locked: n.dataset.locked }} : null;
            }}""")
            if not box or box["locked"] == "1":
                await asyncio.sleep(1.0)
                continue
            x, y = center(box["rect"])
            await page.touchscreen.tap(x, y)
            answered += 1
            await asyncio.sleep(3.2)

        cycles = await cleared_marsh()
        print(f"按了 {answered} 次答案　marsh 通關次數 = {cycles}")
        if not cycles:
            problems.append(f"16 輪內沒把 marsh 走完（按了 {answered} 次答案）")

        # ── 3. 存檔有沒有寫進去 ───────────────────────────────────
        saved = await page.evaluate("""() => {
          try { return { raw: localStorage.getItem('glowisle.v2') }; }
          catch (e) { return { err: e.name + ': ' + e.message }; }
        }""")
        print("存檔:", (saved.get("raw") or saved.get("err") or "")[:180])
        if not saved.get("raw"):
            problems.append("file:// 下 localStorage 沒寫進去 —— 存檔會失效")

        await page.screenshot(path=str(OUT / "single_file_smoke.png"))
        await browser.close()

    print("\n--- console error ---")
    print("\n".join(errors) if errors else "（無）")
    if errors:
        problems.append(f"有 {len(errors)} 筆 console error")

    print("\n=== 結果 ===")
    if problems:
        for p_ in problems:
            print("✗", p_)
        sys.exit(1)
    ch = "http 模組版" if use_http else "file:// 單檔版"
    print(f"✓ {ch} 全綠：語音有聲、marsh 走得完、存檔寫得進去、零錯誤")


if __name__ == "__main__":
    asyncio.run(main())
