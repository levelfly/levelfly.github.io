# -*- coding: utf-8 -*-
"""把整座島打包成一個 HTML 檔。

為什麼要這個：開發版用 ES modules，瀏覽器規定必須走 http，所以得先 `python serve.py`。
單檔版是拿來雙擊就玩、AirDrop／LINE 直接傳給人、沒網路也能玩的。

做法（三件事，都不用改 src 任何一行）：
  1. bun 把 22 個模組打成一顆 IIFE
  2. styles/*.css 直接 inline
  3. assets/ 底下每個檔轉成 data URI，再裝一個 fetch 攔截器把相對路徑導過去

第 3 點是關鍵：`file://` 下 fetch 相對檔案一定失敗（實測 TypeError: Failed to fetch，
Chromium 把 file:// 當 opaque origin）。與其去改 audio.js 的載入邏輯、讓兩種發行版
走不同的路，不如在最外層騙 fetch —— 程式碼完全不知道自己被打包了。

用法：
    python tools/build_single.py            → dist/夜光島.html
    python tools/build_single.py --minify   → 同上，JS 壓過（除錯會變難）
"""
import base64
import json
import mimetypes
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = DIST / "夜光島.html"

MIME = {
    ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png",
    ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".woff2": "font/woff2", ".ogg": "audio/ogg", ".wav": "audio/wav",
}


def bundle_js(minify: bool) -> str:
    """用 bun 打包。bun 是 dev-only 工具 —— 產物裡沒有任何第三方程式碼，
    『零外部素材』那條規則管的是 runtime，不是 build。"""
    # Windows 上 npm 全域裝的是 bun.cmd 這種 shim，CreateProcess 收裸名字會找不到，
    # 一定要用 which 解出來的完整路徑（含副檔名）。
    exe = shutil.which("bun")
    if exe is None:
        sys.exit("找不到 bun。裝一下：npm i -g bun（或改用 npx esbuild）")
    tmp = DIST / "_bundle.js"
    cmd = [exe, "build", "src/main.js", "--format=iife", "--outfile", str(tmp)]
    if minify:
        cmd.append("--minify")
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        sys.exit(f"bun build 失敗：\n{r.stdout}\n{r.stderr}")
    js = tmp.read_text(encoding="utf-8")
    tmp.unlink()
    return js


def collect_assets() -> dict:
    """assets/ 底下每個檔 → data URI，key 用遊戲程式碼實際會 fetch 的相對路徑。"""
    files = {}
    base = ROOT / "assets"
    for p in sorted(base.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT).as_posix()          # 例：assets/voice/n1.mp3
        mime = MIME.get(p.suffix.lower()) or mimetypes.guess_type(p.name)[0] \
            or "application/octet-stream"
        files[rel] = f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode("ascii")
    return files


FETCH_SHIM = """
<script id="embedded-assets" type="application/json">__FILES__</script>
<script>
/* file:// 下 fetch 相對檔案必定失敗（opaque origin）。把 assets/ 的請求導到內嵌的
   data URI，遊戲程式碼一行都不用知道自己被單檔化了。 */
(function () {
  var FILES = JSON.parse(document.getElementById('embedded-assets').textContent);
  var real = window.fetch && window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var key = url.replace(/^\\.\\//, '').split('?')[0];
    var hit = FILES[key];
    if (hit) return real(hit, init);
    if (!real) return Promise.reject(new TypeError('fetch unavailable'));
    return real(input, init);
  };
  /* 存檔：file:// 下 localStorage 在部分瀏覽器（尤其 iOS Safari）可能被擋。
     擋掉就退回記憶體版 —— 這一趟還是能玩完，只是關掉分頁就忘記。 */
  try {
    localStorage.setItem('__probe__', '1');
    localStorage.removeItem('__probe__');
  } catch (e) {
    var mem = {};
    try {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: function (k) { return k in mem ? mem[k] : null; },
          setItem: function (k, v) { mem[k] = String(v); },
          removeItem: function (k) { delete mem[k]; },
          clear: function () { mem = {}; },
        },
        configurable: true,
      });
    } catch (e2) { /* 連覆寫都不准就算了，store.js 自己有 try/catch */ }
  }
})();
</script>
"""


def main():
    minify = "--minify" in sys.argv
    DIST.mkdir(exist_ok=True)

    js = bundle_js(minify)
    css = "\n".join((ROOT / "styles" / n).read_text(encoding="utf-8")
                    for n in ("base.css", "game.css"))
    files = collect_assets()

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = re.sub(r'[ \t]*<link rel="stylesheet"[^>]*>\n?', "", html)
    html = html.replace("</head>", f"<style>\n{css}\n</style>\n</head>")

    shim = FETCH_SHIM.replace("__FILES__", json.dumps(files))
    html = re.sub(r'<script type="module"[^>]*></script>',
                  lambda _: shim + "<script>\n" + js + "\n</script>", html)

    OUT.write_text(html, encoding="utf-8")
    mb = OUT.stat().st_size / 1e6
    print(f"→ {OUT}")
    print(f"  {mb:.2f} MB  (js {len(js)/1e3:.0f}KB · css {len(css)/1e3:.0f}KB · "
          f"assets {len(files)} 個 / {len(json.dumps(files))/1e6:.2f}MB)")
    if mb > 6:
        print("  ⚠ 超過 6MB，手機載入會開始有感，考慮把語音改成 lazy decode 或降位元率")


if __name__ == "__main__":
    main()
