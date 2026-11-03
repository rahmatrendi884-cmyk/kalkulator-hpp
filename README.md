# JEMBER DESTRUCTION — paket website yang diperbaiki

## Cara menjalankan
1. Ekstrak seluruh isi ZIP ke satu folder. Jangan membuka `index.html` dari dalam ZIP.
2. Pastikan folder `assets` tetap berada di samping `index.html`.
3. Jalankan melalui hosting statis (Netlify, Vercel, GitHub Pages, atau cPanel) atau server lokal.
4. Website memerlukan koneksi internet untuk memuat Tailwind CSS, ikon, font, dan library ekspor Excel dari CDN.

## Perbaikan pada versi ini
- Memulihkan file konfigurasi Tailwind yang sebelumnya dirujuk tetapi tidak disertakan.
- Memuat konfigurasi Tailwind sebelum library Tailwind.
- Membuka katalog agar produk dan tombol dapat digunakan tanpa harus menekan konfirmasi follow Instagram.
- Memperbaiki inisialisasi aplikasi agar berjalan setelah DOM siap.
- Menghapus definisi ganda fungsi pembacaan gambar.
- Menambahkan pesan error saat proses tambah produk gagal.
- Menyimpan data katalog/pesanan/keuangan/pengaturan tertentu di localStorage browser.

## Login demo admin
- Username: `admin`
- Password: `admin123`
- PIN: `123456`

Ganti kredensial demo sebelum penggunaan. Login saat ini masih berjalan di sisi browser, bukan autentikasi server yang aman.

## Batasan penting
Paket ini adalah aplikasi frontend. Data localStorage hanya tersedia pada browser/perangkat yang sama dan tidak otomatis tersinkron ke pelanggan atau admin lain. Untuk toko online sungguhan yang menerima pesanan lintas perangkat, diperlukan backend/database, autentikasi server, dan penyimpanan file. Jangan gunakan data pelanggan atau pembayaran sungguhan sebelum backend tersebut dipasang.


## Mode tampilan
- Gunakan tombol **Mode Terang/Mode Gelap** di bagian kanan navigasi untuk mengganti tema.
- Pilihan tema disimpan di `localStorage` browser dan diterapkan kembali saat halaman dibuka.

## Catatan pengujian dan batasan
- JavaScript telah lolos pemeriksaan sintaks Node.js.
- Referensi file CSS/JavaScript lokal, ID elemen yang dipanggil JavaScript, serta nama fungsi handler inline telah diperiksa.
- Uji browser interaktif penuh belum dapat diselesaikan di lingkungan pemeriksaan ini; lakukan uji akhir di browser setelah diunggah ke hosting.
- Tailwind CSS, ikon, font, dan pustaka Excel masih dimuat dari CDN, sehingga koneksi internet diperlukan agar tampilan dan fitur eksternal terkait bekerja normal.
- QRIS contoh dan tautan WhatsApp demo harus diganti dengan data resmi sebelum toko dipublikasikan. Login admin saat ini masih berbasis kode di sisi browser dan bukan autentikasi aman untuk produksi.
