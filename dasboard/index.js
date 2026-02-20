"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const XLSX = require("xlsx");   
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

puppeteer.use(StealthPlugin())
//$BARU
const dashboardDir = path.join(__dirname, "dashboard");

if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir);
}

fs.writeFileSync(
  path.join(dashboardDir, "data.json"),
  JSON.stringify(dashboardData, null, 2)
);
//$SAMPAI SINI
//ACAK AKUN
function shuffleArray(arr) {
  const shuffled = [...arr];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const rand = crypto.randomBytes(4).readUInt32BE(0);
    const j = rand % (i + 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}




//HELPER ISI CAPTION 
async function clearComposer(page) {
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);
}


async function typeCaptionFB(page,
  caption,
  delayMikir,
  delayKetikMin,
  delayKetikMax,
  pauseChance,
  pauseMin,
  pauseMax) {
  delayMikir = Number(delayMikir);
  delayKetikMin = Number(delayKetikMin);
  delayKetikMax = Number(delayKetikMax);
  pauseChance = Number(pauseChance);
  pauseMin = Number(pauseMin);
  pauseMax = Number(pauseMax);

  console.log("✍️ Ketik caption (FB stable)");

  // 1️⃣ Tunggu overlay loading hilang
  await page.waitForFunction(() => {
    return !(
      document.querySelector('[aria-label="Loading"]') ||
      document.querySelector('[aria-busy="true"]') ||
      document.querySelector('div[role="dialog"]')
    );
  }, { timeout: 30000 });

  // 2️⃣ Bangunin editor (WAJIB di FB)
  await page.keyboard.type(" ");
  await page.waitForTimeout(150);
  await page.keyboard.press("Backspace");

  await page.waitForTimeout(delayMikir);
  
  // 3️⃣ Ketik caption ala manusia
  for (const ch of caption) {

    const delayHuruf =
      Math.floor(Math.random() * (delayKetikMax - delayKetikMin + 1)) + delayKetikMin;

    await page.keyboard.type(ch, { delay: delayHuruf });

    // pause random dari XLSX
    if (Math.random() < pauseChance) {
      const pause =
        Math.floor(Math.random() * (pauseMax - pauseMin + 1)) + pauseMin;

      await page.waitForTimeout(pause);
    }
 }

  // 4️⃣ Commit React
  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  console.log("✅ Caption berhasil diketik captiontypeFB");

return { ok: true, method: "typeCaptionFB" };

  }


/// async function debugComposerAll(page) {
  ///console.log("\n🔎 DEBUG COMPOSER ALL ELEMENT");

 /// const data = await page.evaluate(() => {
   /// const results = [];

   /// document.querySelectorAll("div, textarea, span").forEach(el => {
      ///const r = el.getBoundingClientRect();
     /// if (r.width < 80 || r.height < 40) return;

     /// const attrs = el.getAttributeNames();

      ///const isCandidate =
       /// el.isContentEditable ||
       /// el.getAttribute("contenteditable") === "true" ||
       /// el.tagName === "TEXTAREA" ||
       //// el.getAttribute("role") === "textbox" ||
       //// el.getAttribute("role") === "combobox" ||
       /// el.getAttribute("data-mcomponent") === "ServerTextArea" ||
       /// attrs.some(a => a.includes("aria"));

      ///if (!isCandidate) return;

      ///results.push({
       /// tag: el.tagName,
        ///role: el.getAttribute("role"),
       /// aria: el.getAttribute("aria-label"),
       /// data: el.getAttribute("data-mcomponent"),
        /// contenteditable: el.getAttribute("contenteditable"),
        ///class: (el.className || "").toString().slice(0, 60),
       /// textPreview: (el.innerText || el.value || "").slice(0, 30)
      ///});
    ///});

   //) return results;
 /// });

//) console.log("🧪 COMPOSER ALL:", JSON.stringify(data, null, 2));
///}

//Validasinya 
async function validateCaption(page, caption) {
  return await page.evaluate(text => {
    const el =
      document.querySelector('div[contenteditable="true"][role="textbox"]') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('textarea');

    if (!el) return false;

    const domVal =
      el.textContent ||
      el.innerText ||
      el.value ||
      "";

    // fallback React internal (FB pakai data-text)
    const dataText = el.getAttribute("data-text") || "";

    return (
      domVal.includes(text.slice(0, 3)) ||
      dataText.includes(text.slice(0, 3))
    );
  }, caption);
}


//ISI CAPTION type manusia tahan update 


 async function typeCaptionStable(page, caption) {
  let typed = false;

  try {
    // 1️⃣ AKTIFKAN COMPOSER
    await page.evaluate(() => {
      const candidates = [
        '[role="textbox"]',
        '[role="combobox"]',
        'textarea',
        'div[contenteditable="true"]',
        '[aria-label*="Tulis sesuatu"]',
        '[aria-label*="Write something"]'
      ];

      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) {
          el.click();
          return true;
        }
      }
      return false;
    });

    await page.waitForTimeout(1500);

    // 2️⃣ PASTIKAN FOCUS
    const focused = await page.evaluate(() => {
      const els = document.querySelectorAll(
        'div[contenteditable="true"], textarea'
      );
      for (const el of els) {
        el.click();
        el.focus();
        if (document.activeElement === el) return true;
      }
      return false;
    });

    if (!focused) {
      return { ok: false, typed: false, step: "focus_failed" };
    }

    // 3️⃣ TYPE CAPTION
    typed = true;
    for (const char of caption) {
      await page.keyboard.type(char, {
        delay: 80 + Math.random() * 120
      });

      if (Math.random() < 0.05) {
        await page.waitForTimeout(300 + Math.random() * 600);
      }
    }

    await page.waitForTimeout(800);

    // 4️⃣ COMMIT REACT
    await page.keyboard.press("Space");
    await page.keyboard.press("Backspace");

    // 5️⃣ VALIDASI
    const ok = await validateCaption(page, caption);

    if (ok) {
      return { ok: true, typed: true, step: "stable_ok" };
    }

    console.log("⚠️ Stable ngetik tapi tidak tervalidasi");
    return { ok: false, typed: true, step: "validation_failed" };

  } catch (err) {
    console.log("❌ typeCaptionStable exception:", err.message);
    return { ok: false, typed, step: "exception", error: err.message };
  }
}
   
  



//isi caption klik placeholder 
async function activateComposerAndFillCaption(page, caption) {
  return await page.evaluate((text) => {
    const placeholderKeywords = [
      "write something",
      "tulis sesuatu",
      "buat postingan publik",
      "create a public post",
      "kirim postingan buat persetujuan admin",
      "submit a post for admin"
    ];

    // ===============================
    // 1️⃣ CLICK PLACEHOLDER (DOM BUTTON)
    // ===============================
    const btn = [...document.querySelectorAll("div[role='button']")]
      .find(el => {
        const t = (el.innerText || "").toLowerCase();
        return placeholderKeywords.some(k => t.includes(k));
      });

    if (btn) {
      ["mousedown", "mouseup", "click"].forEach(type =>
        btn.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window
          })
        )
      );
    }

    // ===============================
    // 2️⃣ FIND & FILL TEXTBOX
    // ===============================
    const selectors = [
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true']",
  "textarea"
];
    for (const s of selectors) {
      const tb = document.querySelector(s);
      if (!tb) continue;

      tb.focus();

      // clear dulu (penting buat React)
      if ("value" in tb) {
        tb.value = "";
      } else {
        tb.innerText = "";
        tb.textContent = "";
      }

      // isi caption
      if ("value" in tb) {
        tb.value = text;
        tb.dispatchEvent(new Event("input", { bubbles: true }));
        tb.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        tb.innerText = text;
        tb.dispatchEvent(new InputEvent("input", { bubbles: true }));
        tb.dispatchEvent(new Event("change", { bubbles: true }));
      }

      return {
        ok: true,
        step: "activate+fill",
        selector: s
      };
    }

    return {
      ok: false,
      step: "textbox_not_found"
    };
  }, caption);
}


//caption human like 
async function typeByExecCommand(page, caption) {
  await page.evaluate(text => {
    const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
  if (!el) return;

    el.focus();
    document.execCommand("insertText", false, text);
  }, caption);
}

async function typeByInputEvents(page, caption) {
  const selector = 'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
  

  // 3️⃣ Fokus editor & set caret di akhir
  const focused = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.focus();
    el.click(); // pastikan aktif
    const selObj = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selObj.removeAllRanges();
    selObj.addRange(range);
    return document.activeElement === el;
  }, selector);

  if (!focused) {
    console.log("❌ Editor tidak bisa fokus");
    return false;
  }

  // 4️⃣ Masukkan teks per karakter (human-like)
  for (const char of caption) {
    await page.evaluate((ch, sel) => {
      const el = document.querySelector(sel);
      if (!el) return;

      // INSERT TEXT via execCommand
      document.execCommand("insertText", false, ch);

      // FIRE beforeinput & input event
      const beforeEvt = new InputEvent("beforeinput", { inputType: "insertText", data: ch, bubbles: true, cancelable: true });
      const inputEvt = new InputEvent("input", { inputType: "insertText", data: ch, bubbles: true });

      el.dispatchEvent(beforeEvt);
      el.dispatchEvent(inputEvt);
    }, char, selector);

    // delay human-like
    await page.waitForTimeout(50 + Math.random() * 80);
  }

  // 5️⃣ Commit terakhir (Space + Backspace) supaya React detect perubahan
  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  // 6️⃣ Validasi isi caption
  const ok = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return false;
    return (el.innerText && el.innerText.trim().length > 0);
  }, selector);

  if (ok) {
    console.log("✅ Caption berhasil diisi (Ultimate BeforeInput)");
  } else {
    console.log("❌ Caption gagal masuk");
  }

  return ok;
}
async function typeCaptionFinal(page, caption) {
  console.log("✍️ Isi caption via InputEvent FINAL (SINGLE FUNC)");

  const editor = await page.waitForSelector(
    'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea',
    { timeout: 10000, visible: true }
  );

  if (!editor) throw new Error("❌ Editor FB tidak ditemukan");

  await editor.click({ delay: 50 });
  await page.waitForTimeout(300);

  await page.evaluate((el, text) => {
    el.focus();

    // Clear editor
    if (el.innerHTML !== undefined) el.innerHTML = "";
    if (el.value !== undefined) el.value = "";

    // Set caret di akhir
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    // Masukkan teks per karakter
    for (const ch of text) {
      el.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: ch
      }));
      document.execCommand("insertText", false, ch); // optional tambahan biar React deteksi
      el.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: ch
      }));
    }
  }, editor, caption);

  // Delay sebentar biar React update
  await page.waitForTimeout(300);

  // Validasi
  const ok = await page.evaluate(el => {
    return (el.innerText && el.innerText.trim().length > 0) ||
           (el.value && el.value.trim().length > 0);
  }, editor);

  if (ok) console.log("✅ Caption BERHASIL diisi (FINAL)");
  else console.log("❌ Caption gagal masuk");

  return ok;
}


async function typeByForceReact(page, caption) {
  const selector =
    'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea';

  // 1️⃣ FOKUS COMPOSER
  const focused = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.click();
    el.focus();
    return document.activeElement === el;
  }, selector);

  if (!focused) {
    console.log("❌ Composer tidak fokus");
    return { ok: false, step: "focus_failed" };
  }

  await page.waitForTimeout(300);

  // 2️⃣ TYPE HUMAN-LIKE (ACAK)
  for (const char of caption) {
    const delay = 80 + Math.random() * 120; // 80–200 ms
    await page.keyboard.type(char, { delay });

    if (Math.random() < 0.05) {
      await page.waitForTimeout(300 + Math.random() * 700);
    }
  }

  // 3️⃣ COMMIT REACT
  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  // 4️⃣ VALIDASI
  await page.waitForTimeout(800);
  const ok = await validateCaption(page, caption);
  if (ok) {
    return { ok: true, step: "typed_human" };
  }

  // 5️⃣ FALLBACK: FORCE REACT (KALAU GAGAL)
  console.log("⚠️ Human typing gagal, pakai force React");

  const forced = await page.evaluate((text, sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;

    el.focus();
    el.innerText = text;

    ["input", "change"].forEach(evt =>
      el.dispatchEvent(new Event(evt, { bubbles: true }))
    );

    return true;
  }, caption, selector);

  return forced
    ? { ok: true, step: "forced_react" }
    : { ok: false, step: "all_failed" };
}

async function typeByExecCommand(page, caption) {
  await page.evaluate(text => {
    document.execCommand("insertText", false, text);
  }, caption);
}

async function typeByKeyboard(page, caption) {

  // THINK BEFORE TYPE
  await page.waitForTimeout(800 + Math.random() * 1200);

  // WAKE EDITOR
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("Backspace");

  await page.waitForTimeout(300 + Math.random() * 400);

  // TYPE PER CHAR (biar bisa pause random)
  for (const char of caption) {

    await page.keyboard.type(char, {
      delay: 80 + Math.random() * 70
    });

    // 10% chance pause mikir
    if (Math.random() < 0.1) {
      await page.waitForTimeout(400 + Math.random() * 900);
    }
  }

}


//async function typeByInputEvent(page, caption) {
 // await page.evaluate(text => {
     //const el = document.querySelector(
   //'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
  //);
  //if (!el) return false;

  //  el.focus();

   // el.dispatchEvent(new InputEvent("beforeinput", {
      //inputType: "insertText",
    //data: text,
     // bubbles: true,
      //cancelable: true
    //}));

   // el.textContent = text;

   //el.dispatchEvent(new InputEvent("input", {
      //inputType: "insertText",
      //data: text,
     // bubbles: true
  //  }));

   // return true;
  //}, caption);
//}


//isi caption tambahan cara 
async function typeCaptionUltimate(page,
  caption,
  delayMikir,
  delayKetikMin,
  delayKetikMax,
  pauseChance,
  pauseMin,
  pauseMax) {
  console.log("🧠 typeCaptionUltimate start");
  
let fbResult;

try {
 fbResult = await typeCaptionFB(
  page,
  caption,
  delayMikir,
  delayKetikMin,
  delayKetikMax,
  pauseChance,
  pauseMin,
  pauseMax
);
} catch (e) {
  console.log("⚠️ typeCaptionFB error → lanjut fallback");
}

if (fbResult?.ok) {
  console.log("✅ Caption OK via typeCaptionFB");
  return fbResult; // ⛔ STOP HANYA JIKA SUKSES
}

// ❗ JANGAN return di sini
console.log("❌ typeCaptionFB gagal → lanjut metode berikutnya");
      
   
 const stable = await typeCaptionStable(page, caption);

if (stable?.ok) {
 console.log("✅ Caption OK via Stable");
  return stable;
}

if (stable?.typed) {
 console.log("⚠️ Stable sudah mengetik → STOP (hindari dobel)");
  return { ok: true, method: "StableTyped" };
 }

// ⬇️ HANYA MASUK SINI JIKA STABLE GAGAL TANPA NGETIK
console.log("🧠 Stable gagal tanpa ngetik → lanjut metode lain");
  
console.log("🧠 Stable gagal → Combo helper");
 
console.log("🧠 Activate composer + fill caption (combo)");
 const comboResult = await activateComposerAndFillCaption(page, caption);
 console.log("COMBO:", comboResult);

  await page.waitForTimeout(2000);

  if (comboResult?.ok) {
   console.log("✅ Caption OK via combo helper (trust React)");
    return;
 }
 console.log("🧠 Try typeCaptionSafe (legacy)");
  await clearComposer(page);
  
    try {
      await typeCaptionSafe(page, caption);
      await page.waitForTimeout(400);

    if (await validateCaption(page, caption)) {
       console.log("✅ typeCaptionSafe OK");
      return;
      }
    } catch (e) {
     console.log("⚠️ typeCaptionSafe gagal, lanjut fallback");
  } 

  const methods = [
      { name: "Keyboard", fn: typeByKeyboard },
      { name: "ExecCommand", fn: typeByExecCommand },
      { name: "InputEvent", fn: typeByInputEvents },
      {name: "typeCaptionFinal", fn: typeCaptionFinal },
      { name: "ForceReact", fn: typeByForceReact }
  ];

for (const m of methods) {
    console.log(`✍️ Try ${m.name}...`);
  await clearComposer(page); // ⬅️ INI KUNCI ANTI DOBEL
   try {
      await m.fn(page, caption);
    } catch (err) {
     console.log(`⚠️ ${m.name} ERROR → lanjut fallback`);
    console.log("↪", err.message);
     continue; // ⬅️ INI KUNCI NYA
   }

  await page.waitForTimeout(500);

    //commit React
   await page.keyboard.press("Space");
   await page.keyboard.press("Backspace");

  if (await validateCaption(page, caption)) {
      console.log(`✅ ${m.name} OK`);
      return;
   }

  console.log(`❌ ${m.name} tidak valid → lanjut`);
}

  console.log("⚠️ Semua metode caption gagal → lanjut TANPA caption");
return { ok: false, reason: "caption_blocked" };

}

//Helper isi caption status 
async function typeCaptionSafe(page, caption) {
  const selector =
    'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea';

  // ===============================
  // 1️⃣ WAKE UP REACT COMPOSER
  // ===============================
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);

  // ===============================
  // 2️⃣ PASTIKAN FOCUS KE TEXTBOX
  // ===============================
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (el) el.focus();
  }, selector);

  await page.waitForTimeout(200);

  // ===============================
  // 3️⃣ INPUT PALING AMAN: KEYBOARD
  // ===============================
  await page.keyboard.type(caption, { delay: 90 });
  await page.waitForTimeout(600);

  // ===============================
  // 4️⃣ VALIDASI REACT (BUKAN DOM PALSU)
  // ===============================
  const ok = await page.evaluate((sel, text) => {
    const el = document.querySelector(sel);
    if (!el) return false;

    const value = el.textContent || el.innerText || "";
    return value.includes(text.slice(0, 5));
  }, selector, caption);

if (!ok) {
  console.log("⚠️ React validation skipped (STATUS mode)");
  return;
}

  consol
