# Laporan Audit Komprehensif `mcp_library` — v0.2.1

**Tanggal Audit:** 15 November 2026 (Asia/Jakarta)
**Cabang yang Diaudit:** `main` (commit `48ef326`), dengan tinjauan perbandingan `arena/019fbae0-mcp-library`
**Lingkup:** seluruh 73 file ter-track — arsitektur, keamanan, keandalan parser/adapter, aplikasi web, worker CLI, CI/CD, tes, dan kepatuhan dokumentasi (README.md + kontrak katalog)
**Verifikasi langsung:** 24 tes unit lolos, typecheck lolos, lint lolos, production build lolos, `npm run audit` 0 kerentanan, uji hidup terhadap Official Registry API, Glama API, sitemap MCPMarket, dan registry npm

---

## 1. Ringkasan Eksekutif

`mcp_library` adalah katalog MCP dwibahasa (Indonesia–Inggris) yang berorientasi provenance dengan model keamanan yang matang: clone tanpa eksekusi, ekspor konfigurasi bebas-kredensial, dan validasi Zod pada data eksternal. Arsitektur monorepo-nya bersih dan teruji.

Audit ini menemukan **tiga masalah berdampak besar** yang membuat status README tidak lagi sesuai kenyataan, ditambah satu bug fungsional CLI dan sejumlah temuan minor. Keempat perbaikan utama telah **diterapkan langsung di rilis v0.2.1** dalam audit ini:

| # | Temuan | Dampak | Status di 0.2.1 |
|---|---|---|---|
| 1 | `npm run audit` gagal: 9 kerentanan (3 kritis, 5 tinggi, 1 sedang) — bertentangan dengan klaim README "0 audit vulnerabilities" dan merusak gerbang CI | Kritis | ✅ Diperbaiki — 0 kerentanan |
| 2 | API Glama menutup akses publik (401 sejak 2026-08-26); README dan workflow masih mengklaim "tanpa kredensial" | Tinggi | ✅ Diperbaiki — dukungan kunci + dokumentasi |
| 3 | README menyuruh mengunduh `tools-0.xml`–`tools-7.xml` padahal indeks sitemap hidup berisi 13 file (`tools-0`–`tools-12`) | Sedang | ✅ Diperbaiki — instruksi mengacu indeks hidup |
| 4 | Bug `parseArgs`: nilai flag yang mengandung `=` terpotong (`--query=a=b` → `a`) | Sedang | ✅ Diperbaiki + 5 tes baru |

> ⚠️ **Peringatan kredensial (wajib ditindaklanjuti pemilik repo):** sebuah GitHub PAT dibagikan melalui chat untuk keperluan push rilis ini. Sesuai `SECURITY.md` dan `docs/DECISIONS.md` ("Any token exposed outside a secret manager must be revoked"), token tersebut harus **dicabut/dirotasi segera** setelah push selesai. Token itu tidak ditulis ke file, log, atau konfigurasi mana pun di repositori.

---

## 2. Metodologi

1. Pembacaan menyeluruh seluruh kode sumber (`apps/*`, `packages/*`, `tests/*`, `.github/*`, `infra/*`, `docs/*`).
2. Eksekusi gerbang mutu: `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit`.
3. Uji hidup (read-only) terhadap: `registry.modelcontextprotocol.io/v0.1/servers` (termasuk `search`), `glama.ai/api/mcp/v1/servers`, `mcpmarket.com/sitemap.xml` + `sitemap/tools-0.xml`, dan `registry.npmjs.org` untuk tiga paket ter-pin.
4. Uji perilaku: seluruh perintah CLI (`dry-run`, `fixtures`, `providers:check`, `providers:sync-glama --check`, `library:profiles`, `library:pack`, `library:check-packages`, `library:status`, `library:refresh`), plus uji payload web dengan snapshot sintetis 61.003 kandidat.
5. Analisis diff `main` vs `arena/019fbae0-mcp-library`.
6. Pencarian rahasia ter-commit (`git ls-files`, `.gitignore`, `.env.example`).

---

## 3. Temuan dan Perbaikan

### 3.1 [KRITIS] Gerbang audit keamanan gagal — 9 kerentanan dependensi

`npm run audit` (= `npm audit --audit-level=high`) keluar dengan kode 1:

| Paket | Tingkat | Masalah | Relevansi proyek |
|---|---|---|---|
| `next` 16.2.12 | **Kritis** | RCE tak terautentikasi (Windows host, Image Optimization AVIF/SVG, `next/og`), cache poisoning SSG/ISR, SSRF | Paket produksi aplikasi web |
| `tinypool` (via vitest 3.2.4) | **Kritis** | Prototype pollution → RCE pada opsi worker | Dev-only, tetapi memblokade CI |
| `zod` 3.25.76 | **Tinggi** | Memory exhaustion saat memvalidasi koleksi berukuran besar (GHSA-mrhx-c7xc-m3w5) | **Paling relevan**: zod memvalidasi data katalog eksternal (Glama/Registry) yang tidak dipercaya |
| `sharp` 0.35.0 (override) | Tinggi | libheif/librsvg (CVE-2026-96889) | Dipakai next untuk optimasi gambar |
| `vite` | Tinggi | Eksekusi skrip lintas-origin, pelarian `server.fs.allow` | Dev-only (via vitest) |
| `source-map-js`, `nanoid` | Tinggi | DoS event-loop; generator loop tanpa henti | Transitive |
| `@vitest/mocker` | Sedang | Path traversal / injeksi kode mock | Dev-only |

Akibat: langkah `npm run audit` pada `.github/workflows/ci.yml` dan `provider-watch.yml` pasti gagal; klaim README "0 audit vulnerabilities, 19 tests passed" tidak lagi benar.

**Perbaikan (0.2.1):** `next` → 16.4.6, `zod` → 4.6.7 (API pada `catalog-schema` kompatibel penuh; typecheck & tes lolos tanpa perubahan skema), `vitest` → 4.1.12, override `sharp` → 0.35.5, plus `npm audit fix` untuk `nanoid`/`source-map-js`/`vite`. Hasil: **0 kerentanan, 24 tes lolos, build lolos.**

### 3.2 [TINGGI] Glama menutup API publik — jalur sinkronisasi utama mati

Verifikasi hidup 15 Nov 2026: `GET https://glama.ai/api/mcp/v1/servers?first=5` → **HTTP 401** dengan pesan "This endpoint requires an API key. Create one at https://glama.ai/settings/api-keys" dan kewajiban atribusi API Data License. Sumber eksternal mengonfirmasi penutupan akses publik terjadi **2026-08-26**.

Dampak sebelum perbaikan:
- README mengklaim mode Glama "Public API cursor traversal … Credential required: **No**" — tidak lagi benar.
- `npm run providers:sync-glama -- --check` gagal 401; langkah sama pada `provider-watch.yml` (terjadwal tiap 6 jam) gagal terus.
- `.env.example` menyediakan `GLAMA_API_KEY` "untuk Glama API terdokumentasi di masa depan" — masa depan itu telah tiba tetapi tidak dibaca kode.
- Kewajiban baru dari provider: atribusi terlihat + tautan ke listing Glama pada setiap halaman yang menampilkan data API — belum tercermin di dokumentasi.

**Perbaikan (0.2.1):**
- `fetchGlamaApiPage` kini membaca `GLAMA_API_KEY` dari lingkungan proses dan mengirim `Authorization: Bearer` (skema yang didokumentasikan di `glama.ai/mcp/reference`). Kunci tidak pernah dicatat di log, tidak diterima sebagai argumen CLI, dan tidak ditulis ke disk.
- Respons 401 kini menghasilkan pesan yang menjelaskan penutupan API 2026-08-26, URL pembuatan kunci, dan kewajiban atribusi.
- `provider-watch.yml` menjalankan cek Glama hanya bila secret repo `GLAMA_API_KEY` terpasang, dan mencetak pesan penjelasan bila dilewati.
- README (tabel cakupan sumber, bagian perintah) dan `.env.example` diperbarui; catatan atribusi API Data License ditambahkan.
- Angka 61.417 record/615 halaman dipertahankan sebagai data historis "run terakhir yang selesai (28 Juli 2026)".

### 3.3 [SEDANG] Bug CLI: nilai argumen mengandung `=` terpotong

`apps/worker/src/index.ts` (versi lama) mem-parsing flag dengan:

```ts
const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
```

Semantik `split` JavaScript **memotong array hasil**, bukan berhenti di pemisah pertama (seperti Python). Terbukti: `--query=a=b` → `"a"`; nilai seperti `--dir=/path=dengan=sama` juga rusak. `--updated-since`, `--search`, `--query`, `--servers` dapat terpengaruh.

**Perbaikan (0.2.1):** parsing kini memakai `indexOf("=")` + `slice`, dipindah ke modul teruji `apps/worker/src/lib/cli-args.ts` dengan 5 tes baru (`tests/cli-args.test.ts`). Sekalian diperbaiki: fallback `positiveNumber` kini ikut dijepit ke batas maksimum (kap `--max-pages` 100.000 kini selalu berlaku), `worker:help` kini mendokumentasikan `library:packs`, `library:pack`, `library:profiles --servers`, `library:check-packages`, dan `--check` pada importer sitemap, serta `providers:import-mcpmarket-sitemaps` memberi pesan ramah ketika direktori `--dir` tidak ada (sebelumnya: ENOENT mentah).

### 3.4 [SEDANG] Instruksi MCPMarket di README kadaluarsa — kehilangan ±38% data

README lama menyuruh mengunduh `tools-0.xml` sampai `tools-7.xml`. Indeks sitemap hidup (diverifikasi 15 Nov 2026) berisi **13 file** `tools-0.xml`–`tools-12.xml`; `tools-0.xml` saja memuat 3.908 blok `<url>` (3.900 URL `/server/` + 18 URL `/client/` yang benar dibuang parser). Mengikuti README lama secara harfiah melewatkan 5 file sitemap.

**Perbaikan (0.2.1):** README kini merujuk indeks hidup `https://mcpmarket.com/sitemap.xml` dan menyebut rentang `tools-0`–`tools-12` (13 file) per pemeriksaan terakhir. Parser itu sendiri terverifikasi benar terhadap data hidup.

### 3.5 [SEDANG — belum diubah, butuh keputusan pemilik] Cabang `arena` melanggar model keamanan proyek sendiri

Cabang `arena/019fbae0-mcp-library` berisi jembatan katalog web (`candidateToCatalogServer`) yang direkomendasikan laporan audit sebelumnya, tetapi implementasinya **mengarang fakta** dan mengabadikannya dalam tes:

- `setup: { packageName: candidate.canonicalName, args: ["-y", canonicalName] }` → menghasilkan perintah tidak valid `npx -y github/github-mcp-server` (canonicalName bukan paket npm). Tes-nya justru mengasertifkan keluaran ini sebagai benar.
- `risk: "Low"` untuk semua kandidat verified-open-source — risiko seharusnya mencerminkan profil **izin** (data seed menandai github-mcp-server sebagai *High*), bukan status lisensi. Ini melanggar metodologi proyek ("Popularity cannot outrank risk").
- `transports: ["stdio"]` dan `execution: "Local"` di-hard-code untuk semua kandidat; `permissionTags` dan `implementation` ditebak dari kata kunci — melanggar "Normalize, don't merely copy" / "Retain provenance".

**Rekomendasi:** JANGAN merge `arena` → `main` apa adanya. Bila jembatan ingin dibangun: gunakan placeholder `REVIEW_*` untuk setup (seperti data seed), jangan set risiko berdasarkan lisensi, kosongkan (atau tandai `unknown`) field yang tidak diketahui sumbernya, dan tulis ulang tesnya sesuai kontrak.

### 3.6 Temuan minor (dicatat, prioritas rendah)

1. **`ensureSnapshot` berisiko kehilangan data**: bila `schemaVersion` katalog lokal ≠ 1, snapshot di-reset hanya ke seed — seluruh 61k kandidat sinkron hilang tanpa peringatan. Saran: tolak dengan pesan eksplisit/migrasi.
2. **`officialRegistryCursor` tersimpan tetapi tidak pernah dibaca** (registry tidak punya `--resume`, berbeda dari Glama). Dead state.
3. **`--resume --check` (Glama)** mengabaikan kursor secara diam-diam karena mode check tidak memuat snapshot.
4. **`exportClientConfig` (hanya dipakai tes)** memancarkan kunci `transport` yang tidak dikenali klien mana pun untuk transport jarak jauh (format klien nyata memakai `type: "http"|"sse"`). Latent — belum dipakai UI/CLI.
5. **`assertNoLikelySecret`** tidak mencakup pola `glpat-`, `xoxb-`, `sk-ant-`, `AKIA…`.
6. **`githubCoordinates`** memotong URL GitHub ber-segment dalam (`github.com/a/b/c/d` → repo `a/b`) pada enrich; bisa salah-atribusi metadata untuk URL dalam dari Glama.
7. **`navigator.clipboard`** dipakai tanpa guard; gagal diam-diam pada origin non-HTTPS (deploy LAN via http).
8. **`search-hero`** meng-hard-code "source × 6" padahal library lokal bisa 61k (kosmetik).
9. **README/SECURITY**: frasa "Do not publish a remote repository until…" dan "Until a public repository owner and contact channel are configured…" sudah kedaluwarsa karena repo sudah publik; bagian Lisensi README telah diperbarui, SECURITY.md sebaiknya menyertakan kontak pelaporan.
10. **`package-lock.json`**: esbuild postinstall muncul peringatan `install-scripts` pada npm baru — pertimbangkan `npm install-scripts approve esbuild` atau pin versi.

---

## 4. Kepatuhan README.md (matriks klaim → verifikasi)

| Klaim README | Verifikasi | Status |
|---|---|---|
| Katalog dwibahasa: browse/search/filter/profile/compare/methodology/library | Rute ada: `/`, `/servers`, `/servers/[slug]`, `/compare`, `/methodology`, `/library`; build 12 rute lolos | ✅ |
| Adapter Official Registry dengan normalisasi cursor-ready | Uji hidup `search=playwright` → HTTP 200, `nextCursor` terbaca | ✅ |
| Traversal Glama 61.417 record/615 halaman | Historis 28 Juli 2026; **API kini 401** | ⚠️ → diperbaiki jadi klaim historis + kunci |
| Snapshot lokal 61.522 kandidat (61.417+101+4) | Aritmetika cocok; data lokal tidak di-commit (sesuai batas data) | ✅ |
| Boundary data: web hanya mengirim jendela terkurasi | Dibuktikan dengan snapshot sintetis 61.003 kandidat → hanya 300 (±90 KB) ke browser; `/library` force-dynamic | ✅ |
| Free packs (Web&Research, Thinking&Memory, Developer) | `freePacks` + `library:pack` berjalan; ketiga paket ter-pin masih ada di npm | ✅ |
| Clone aman: tanpa install/hook/submodule/eksekusi | Kode terverifikasi: `spawn` `shell:false`, `core.hooksPath=/dev/null`, `GIT_TERMINAL_PROMPT=0`, `GIT_CONFIG_NOSYSTEM`, `--depth 1 --no-tags --filter=blob:none --no-recurse-submodules`, allowlist host, `assertContained`, `toSafeName` hash | ✅ |
| Tidak ada `.env`/clone/snapshot/profil/kredensial ter-commit | `git ls-files` bersih; `.gitignore` benar; `.env.example` hanya placeholder kosong | ✅ |
| MCPMarket: hanya sitemap publik, tidak menembus Vercel checkpoint | Kode & parser terverifikasi terhadap data hidup; tidak ada bypass | ✅ |
| Perintah `npm run …` di README | Semua skrip ada di `package.json` dan dijalankan sukses | ✅ (help CLI diperlengkap) |
| "Latest validation: 0 audit vulnerabilities, 19 tests passed, build passed" | Semula **salah** (9 kerentanan); setelah 0.2.1: 0 kerentanan, **24** tes, build lolos | ⚠️ → diperbarui |
| Instruksi unduh `tools-0..7.xml` | Indeks hidup: 13 file (`tools-0..12`) | ❌ → diperbaiki |
| Quick start `npm ci && npm run dev` | `npm ci` + `npm run build` terverifikasi | ✅ |

## 5. Catatan "CONTRACT.md" dan kepatuhan kontrak katalog

Repositori **tidak memiliki file `CONTRACT.md`** (diperiksa di `main`, `arena`, dan seluruh riwayat). Padanan yang dimaksud adalah **kontrak katalog kanonik** di `packages/catalog-schema` (README: "canonical validated catalog contracts"). Hasil pemeriksaan:

- Setiap adapter sumber memvalidasi hasil normalisasi via `sourceRecordSchema.safeParse(...)` dan **membuang** record yang tidak lolos (tidak pernah mengarang field) — sesuai kontrak. ✅
- `config-exporters` memakai tipe `CatalogServer` dari skema (type-only) — dapat diterima untuk penggunaan internal ter-tipe; validasi runtime penuh baru relevan saat data lintas proses mengalir. ✅ (catatan)
- **Aplikasi web belum mengonsumsi skema kanonik** — memakai tipe `CatalogServer` lokal + 6 data seed statis. Ini celah duplikasi yang sudah diakui (lihat §3.5) dan sengaja tidak di-merge dari `arena` karena pelanggaran kontrak di sana. ⚠️
- `zod` sebagai fondasi kontrak kini berada di versi yang bebas advisori keamanan. ✅

## 6. Verifikasi ulang pasca-perbaikan (0.2.1)

```
npm run audit      → found 0 vulnerabilities
npm run typecheck  → lolos (semua workspace + tests)
npm run lint       → lolos
npm test           → 9 file tes, 24 tes lolos
npm run build      → lolos (12 rute)
providers:sync-glama --check (tanpa kunci) → pesan 401 yang menjelaskan kunci & atribusi
import-mcpmarket-sitemaps --dir <hilang>    → pesan ramah (bukan ENOENT mentah)
parseArgs --query=a=b                       → "a=b" (tes otomatis)
```

## 7. Rekomendasi tindak lanjut (berurutan)

1. **Rotasi PAT yang dibagikan via chat** (wajib; lihat §1).
2. Pasang secret `GLAMA_API_KEY` di GitHub bila cek Glama terjadwal ingin tetap berjalan; sesudah itu jalankan ulang `providers:sync-glama --all` untuk menyegarkan snapshot.
3. Putuskan arah cabang `arena`: tulis-ulang jembatan katalog sesuai kontrak (lihat §3.5) atau hapus.
4. Tambahkan file `LICENSE` — repo sudah publik tanpa lisensi.
5. Lindungi `ensureSnapshot` terhadap perubahan `schemaVersion` (pesan eksplisit/migrasi, bukan reset senyap).
6. Saat menampilkan data Glama di UI publik, pastikan atribusi terlihat + tautan listing (kewajiban API Data License).
7. Perluas `assertNoLikelySecret` (`glpat-`, `xoxb-`, `sk-ant-`, `AKIA`) dan guard `navigator.clipboard`.
8. Pertimbangkan `--resume` untuk Official Registry (cursor-nya sudah tersimpan) dan hapus status mati bila tidak akan dipakai.
