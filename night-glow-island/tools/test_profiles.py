# -*- coding: utf-8 -*-
"""存檔分檔（v1 → v2）的雙向實測。

存檔格式改版是「改壞了會靜靜吃掉小孩累積的東西」那一類的改動，
所以好樣本壞樣本都要跑：有舊檔要正確搬過去、沒舊檔不能爆、
已經有 v2 的不准被舊檔蓋掉、兩個年齡檔的進度不准互相污染。

直接 import 模組版的 store.js 來測（http 有服 ES modules），不透過遊戲畫面 —
要驗的是資料層本身，不是某條 UI 路徑剛好沒事。

先開好 server：python serve.py
"""
import asyncio
import json
import sys
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8777"
fails = []


def check(name, ok, detail=""):
    print(("  ✓ " if ok else "  ✗ ") + name + (f"　{detail}" if detail else ""))
    if not ok:
        fails.append(name)


async def fresh_page(browser, seed_storage=None):
    """每個案例都用全新的 context，避免上一個案例的 localStorage 殘留。"""
    ctx = await browser.new_context(base_url=BASE)
    page = await ctx.new_page()
    if seed_storage:
        await page.goto(f"{BASE}/index.html")
        await page.evaluate("([k, v]) => localStorage.setItem(k, v)", seed_storage)
    return ctx, page


async def load_store(page):
    """乾淨地重新載入頁面再 import store，確保 store 的 load() 是這一次才跑的。"""
    await page.goto(f"{BASE}/index.html")
    return await page.evaluate("""async () => {
      const m = await import('/src/core/store.js?t=' + Math.random());
      return m.store;
    }""")


V1 = json.dumps({
    "bugs": {"kuku": 2, "lala": 1},
    "goldenBugs": {"zizi": 1},
    "platinumBugs": {},
    "runs": 3,
    "cycles": {"marsh": 2, "cove": 1},
    "secrets": {"sneeze": True, "crab": True},
    "best": 7,
    "muted": True,
}, ensure_ascii=False)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # ── 好樣本：有 v1 舊檔，要整包搬進 age4，秘密與靜音搬到共用區 ──
        print("案例 1：v1 舊檔 → v2 的 age4")
        ctx, page = await fresh_page(browser, ("glowisle.v1", V1))
        await page.goto(f"{BASE}/index.html")
        r = await page.evaluate("""async () => {
          const { store } = await import('/src/core/store.js?t=' + Math.random());
          return {
            profileId: store.profileId,
            bugs: store.bugs, golden: store.goldenBugs,
            runs: store.runs, cycleMarsh: store.cycle('marsh'), cycleCove: store.cycle('cove'),
            secrets: store.secrets, muted: store.muted,
            v1StillThere: !!localStorage.getItem('glowisle.v1'),
          };
        }""")
        check("預設落在 age4", r["profileId"] == "age4", r["profileId"])
        check("光靈搬過去了", r["bugs"] == {"kuku": 2, "lala": 1}, str(r["bugs"]))
        check("金色光靈搬過去了", r["golden"] == {"zizi": 1}, str(r["golden"]))
        check("玩過幾輪搬過去了", r["runs"] == 3, str(r["runs"]))
        check("週目搬過去了", (r["cycleMarsh"], r["cycleCove"]) == (2, 1), str((r["cycleMarsh"], r["cycleCove"])))
        check("秘密進共用區", r["secrets"] == {"sneeze": True, "crab": True}, str(r["secrets"]))
        check("靜音進共用區", r["muted"] is True, str(r["muted"]))
        check("舊檔沒被刪（出事還救得回來）", r["v1StillThere"])
        await ctx.close()

        # ── 壞樣本一：什麼都沒有，不能爆 ──
        print("案例 2：全新裝置，沒有任何舊檔")
        ctx, page = await fresh_page(browser)
        await page.goto(f"{BASE}/index.html")
        r = await page.evaluate("""async () => {
          const { store } = await import('/src/core/store.js?t=' + Math.random());
          return { id: store.profileId, bugs: store.bugs, runs: store.runs, muted: store.muted,
                   played4: store.played('age4'), played6: store.played('age6') };
        }""")
        check("落在 age4 且是空的", r["id"] == "age4" and r["bugs"] == {} and r["runs"] == 0)
        check("沒有靜音", r["muted"] is False)
        check("兩個檔都算沒玩過", r["played4"] is False and r["played6"] is False)
        await ctx.close()

        # ── 壞樣本二：v2 已經存在時，不准被 v1 蓋掉 ──
        print("案例 3：v1 和 v2 同時存在 → 以 v2 為準")
        ctx = await browser.new_context(base_url=BASE)
        page = await ctx.new_page()
        await page.goto(f"{BASE}/index.html")
        await page.evaluate("""([v1]) => {
          localStorage.setItem('glowisle.v1', v1);
          localStorage.setItem('glowisle.v2', JSON.stringify({
            activeProfile: 'age6',
            shared: { muted: false, secrets: {} },
            profiles: { age4: { bugs: {}, goldenBugs: {}, platinumBugs: {}, runs: 0, cycles: {}, best: 0 },
                        age6: { bugs: { nini: 5 }, goldenBugs: {}, platinumBugs: {}, runs: 9, cycles: {}, best: 1 } },
          }));
        }""", [V1])
        r = await page.evaluate("""async () => {
          const { store } = await import('/src/core/store.js?t=' + Math.random());
          return { id: store.profileId, bugs: store.bugs, runs: store.runs, muted: store.muted };
        }""")
        check("用的是 v2 不是 v1", r["id"] == "age6" and r["runs"] == 9, f"id={r['id']} runs={r['runs']}")
        check("v1 的靜音沒有污染 v2", r["muted"] is False, str(r["muted"]))
        await ctx.close()

        # ── 兩個檔不准互相污染，但共用的東西要真的共用 ──
        print("案例 4：age4 / age6 進度隔離，靜音與秘密共用")
        ctx, page = await fresh_page(browser)
        await page.goto(f"{BASE}/index.html")
        r = await page.evaluate("""async () => {
          const { store } = await import('/src/core/store.js?t=' + Math.random());
          store.setProfile('age4');
          store.addBug('kuku'); store.cycleUp('marsh'); store.setMuted(true); store.unlock('sneeze');
          const a4 = { bugs: {...store.bugs}, marsh: store.cycle('marsh') };

          store.setProfile('age6');
          const a6Before = { bugs: {...store.bugs}, marsh: store.cycle('marsh'),
                             muted: store.muted, sneeze: store.found('sneeze') };
          store.addBug('nini'); store.cycleUp('cloudbridge');

          store.setProfile('age4');
          const a4After = { bugs: {...store.bugs}, marsh: store.cycle('marsh'),
                            cloudbridge: store.cycle('cloudbridge') };
          return { a4, a6Before, a4After };
        }""")
        check("age6 看不到 age4 的光靈", r["a6Before"]["bugs"] == {}, str(r["a6Before"]["bugs"]))
        check("age6 看不到 age4 的週目", r["a6Before"]["marsh"] == 0, str(r["a6Before"]["marsh"]))
        check("靜音是共用的", r["a6Before"]["muted"] is True)
        check("秘密是共用的", r["a6Before"]["sneeze"] is True)
        check("age4 的東西沒被 age6 動到", r["a4After"]["bugs"] == {"kuku": 1} and r["a4After"]["marsh"] == 1,
              str(r["a4After"]))
        check("age6 的週目沒漏到 age4", r["a4After"]["cloudbridge"] == 0, str(r["a4After"]["cloudbridge"]))
        await ctx.close()

        await browser.close()

    print("\n=== 結果 ===")
    if fails:
        for f in fails:
            print("✗", f)
        sys.exit(1)
    print("✓ 存檔分檔全綠：舊檔搬得過去、新裝置不爆、v2 不被 v1 蓋、兩個檔互不污染")


if __name__ == "__main__":
    asyncio.run(main())
