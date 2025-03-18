const fs = require("fs");
const puppeteer = require("puppeteer");

async function saveCookies(cookiesJSON) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Konversi string JSON ke array objek cookies
        const cookies = JSON.parse(cookiesJSON);
        await page.setCookie(...cookies);

        // Simpan ke file backend/cookies.json
        fs.writeFileSync("backend/cookies.json", JSON.stringify(cookies, null, 2));

        console.log("✅ Cookies berhasil disimpan!");

        // Buka Facebook untuk verifikasi akun
        await page.goto("https://www.facebook.com/", { waitUntil: "networkidle2" });

        // Cek apakah login berhasil dengan mengambil nama akun
        const accountName = await page.evaluate(() => {
            const el = document.querySelector("span[dir='auto']"); // Selector nama akun
            return el ? el.innerText.trim() : null;
        });

        if (accountName) {
            console.log(`✅ Login berhasil! Akun: ${accountName}`);

            // Simpan ke IndexedDB (frontend akan memproses)
            fs.writeFileSync("backend/accounts.json", JSON.stringify({ name: accountName, cookies }, null, 2));
        } else {
            console.log("❌ Gagal mendapatkan nama akun. Mungkin cookies tidak valid.");
        }

    } catch (error) {
        console.error("❌ Gagal memproses cookies:", error);
    } finally {
        await browser.close();
    }
}

// Jalankan fungsi dengan argumen dari GitHub Actions
saveCookies(process.argv[2]);
