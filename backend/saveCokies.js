const fs = require("fs");
const puppeteer = require("puppeteer");

async function saveCookies(cookiesJSON) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Konversi string JSON ke array objek cookies
        const cookies = JSON.parse(cookiesJSON);
        await page.setCookie(...cookies);

        // Simpan cookies ke file backend/cookies.json
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

            // Path file akun
            const accountsFile = "backend/accounts.json";
            let accounts = [];

            // Cek apakah accounts.json sudah ada, jika ada baca isinya
            if (fs.existsSync(accountsFile)) {
                try {
                    const existingData = fs.readFileSync(accountsFile, "utf8");
                    accounts = JSON.parse(existingData);
                } catch (err) {
                    console.error("❌ Error membaca accounts.json:", err);
                }
            }

            // Cek apakah akun sudah ada dalam daftar
            const exists = accounts.some(acc => acc.name === accountName);

            if (!exists) {
                accounts.push({ name: accountName, cookies });

                // Simpan kembali semua akun ke accounts.json
                fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
                console.log("✅ Akun ditambahkan ke accounts.json!");
            } else {
                console.log("ℹ️ Akun sudah ada di daftar, tidak ditambahkan lagi.");
            }
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
