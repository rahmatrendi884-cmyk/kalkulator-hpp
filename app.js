    async function readFileAsBase64(file) {
      if (!file) throw new Error('File tidak ditemukan.');
      if (!file.type || !file.type.startsWith('image/')) throw new Error('File harus berupa gambar.');
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          try {
            const maxSide = 1400;
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.76));
          } catch (err) { URL.revokeObjectURL(url); reject(err); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal membaca gambar.')); };
        img.src = url;
      });
    }

    const STORAGE_KEY = 'jemberDestructionStore_v2';
    function createPersistentState(defaultState) {
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
      catch (err) { console.warn('Data tersimpan tidak dapat dibaca:', err); }
      ['products', 'orders', 'cashflow', 'settings', 'isIgFollowed'].forEach(key => {
        if (Object.prototype.hasOwnProperty.call(saved, key)) defaultState[key] = saved[key];
      });
      const cache = new WeakMap();
      const persist = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            products: defaultState.products,
            orders: defaultState.orders,
            cashflow: defaultState.cashflow,
            settings: defaultState.settings,
            isIgFollowed: defaultState.isIgFollowed
          }));
        } catch (err) {
          console.error('Penyimpanan browser penuh/gagal:', err);
          if (typeof showToast === 'function') showToast('Penyimpanan browser penuh. Cadangkan data dan gunakan database server untuk produksi.', 'error');
        }
      };
      const wrap = value => {
        if (!value || typeof value !== 'object') return value;
        if (cache.has(value)) return cache.get(value);
        const proxy = new Proxy(value, {
          get(target, prop, receiver) { return wrap(Reflect.get(target, prop, receiver)); },
          set(target, prop, next, receiver) {
            const result = Reflect.set(target, prop, next, receiver);
            persist();
            return result;
          },
          deleteProperty(target, prop) {
            const result = Reflect.deleteProperty(target, prop);
            persist();
            return result;
          }
        });
        cache.set(value, proxy);
        return proxy;
      };
      return wrap(defaultState);
    }

    const STATE = createPersistentState({
      isIgFollowed: false,
      isAdminAuthenticated: false,
      adminStep1Passed: false,
      selectedProductForCheckout: null,

      security: {
        username: "admin",
        password: "admin123",
        pin: "123456"
      },
      
      settings: {
        storeName: "JEMBER DESTRUCTION",
        avatarUrl: "",
        bio: "Brand fashion eksklusif dengan fokus pada desain kontemporer, bahan berkualitas tinggi, dan potongan presisi untuk gaya hidup modern.",
        originStory: "Berdiri di Jember, JEMBER DESTRUCTION lahir dari semangat untuk menyajikan pakaian berkualitas tinggi dengan sistem Pre-Order yang transparan dan terukur.\n\nSetiap koleksi dirancang dengan teliti, menggunakan bahan pilihan dan teknik cetak premium untuk memastikan kenyamanan maksimal serta daya tahan produk.",
        igLink: "https://instagram.com/jemberdestruction",
        adminPhone: "081234567890",
        waGroupLink: "https://chat.whatsapp.com/demo-preorder-group",
        qrisImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_PREORDER_JEMBER_DESTRUCTION"
      },

      products: [
        {
          id: "P01",
          name: "Kaos Oversize Heavyweight Cotton 24s",
          price: 150000,
          hpp: 70000,
          minDP: 75000,
          sizes: ["S", "M", "L", "XL", "XXL"],
          colors: ["Putih", "Hitam"],
          colorImages: {
            "Putih": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
            "Hitam": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80"
          },
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80"
        },
        {
          id: "P02",
          name: "Hoodie Boxy Fit Fleece 330gsm",
          price: 280000,
          hpp: 135000,
          minDP: 140000,
          sizes: ["M", "L", "XL"],
          colors: ["Hitam", "Putih"],
          colorImages: {
            "Hitam": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80",
            "Putih": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80"
          },
          image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80"
        }
      ],

      orders: [
        {
          id: "ORD-001",
          date: "2026-10-28 14:20",
          custName: "Ahmad Rizky",
          custPhone: "081298765432",
          custAddress: "Jl. Sudirman No. 45, Jember",
          productId: "P01",
          productName: "Kaos Oversize Heavyweight Cotton 24s",
          size: "M",
          color: "Putih",
          qty: 2,
          unitPrice: 150000,
          unitHPP: 70000,
          totalPrice: 300000,
          totalHPP: 140000,
          paidAmount: 300000,
          remainingAmount: 0,
          paymentType: "LUNAS",
          proofImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
          dpReceiptImage: null,
          status: "LUNAS"
        }
      ],

      cashflow: [
        { id: "CF-01", date: "2026-10-27", type: "EXPENSE", desc: "Sewa Mesin Press & Polyflex", amount: 120000 }
      ]
    });


    // --- TEMA GELAP / TERANG ---
    const THEME_STORAGE_KEY = 'jemberDestructionTheme';
    function applyTheme(theme) {
      const selectedTheme = theme === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', selectedTheme);
      try { localStorage.setItem(THEME_STORAGE_KEY, selectedTheme); } catch (error) { console.warn('Preferensi tema tidak dapat disimpan:', error); }
      const icon = document.getElementById('themeToggleIcon');
      const label = document.getElementById('themeToggleLabel');
      const button = document.getElementById('themeToggle');
      if (icon) icon.className = `ph ${selectedTheme === 'dark' ? 'ph-sun' : 'ph-moon'} text-base`;
      if (label) label.textContent = selectedTheme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
      if (button) {
        const nextLabel = selectedTheme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
        button.setAttribute('aria-label', nextLabel);
        button.setAttribute('title', nextLabel);
      }
    }
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    function initializeJemberStore() {
      let savedTheme = 'dark';
      try { savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark'; } catch (error) {}
      applyTheme(savedTheme);
      setupPinInputNavigation();
      renderProducts();
      updateStoreSettingsUI();
      initDefaultColorRows();
      const storeContent = document.getElementById('storeContent');
      if (storeContent) storeContent.classList.remove('opacity-50', 'pointer-events-none');
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeJemberStore, { once: true });
    } else {
      initializeJemberStore();
    }

    // --- LOGIKA FORM WARNA DINAMIS ADMIN ---
    function addColorOptionRow(colorName = '', imgUrl = '') {
      const container = document.getElementById('colorOptionsContainer');
      if (!container) return;
      const rowId = 'colorRow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

      const div = document.createElement('div');
      div.id = rowId;
      div.className = "p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 relative group";
      div.innerHTML = `
        <div class="flex items-center gap-2">
          <input type="text" placeholder="Nama Warna (mis: Hitam)" value="${colorName}" required class="color-name-input flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500">
          <button type="button" onclick="removeColorRow('${rowId}')" class="text-zinc-500 hover:text-red-400 p-1 text-base transition">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <input type="file" accept="image/*" class="color-file-input flex-1 text-[11px] text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-zinc-800 file:text-amber-400 hover:file:bg-zinc-700 cursor-pointer bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <img src="${imgUrl || 'https://placehold.co/50x50/18181b/ffffff?text=Foto'}" class="color-img-preview w-8 h-8 object-cover rounded-md border border-zinc-800 flex-shrink-0">
        </div>
      `;

      container.appendChild(div);

      const fileInput = div.querySelector('.color-file-input');
      const imgPreview = div.querySelector('.color-img-preview');
      fileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const b64 = await readFileAsBase64(e.target.files[0]);
          imgPreview.src = b64;
        }
      });
    }

    function removeColorRow(rowId) {
      const row = document.getElementById(rowId);
      if (row) row.remove();
    }

    function initDefaultColorRows() {
      const container = document.getElementById('colorOptionsContainer');
      if (!container) return;
      container.innerHTML = '';
      addColorOptionRow('Hitam');
      addColorOptionRow('Putih');
    }

    async function handleAddProduct(e) {
      e.preventDefault();
      try {
      const name = document.getElementById('prodName').value.trim();
      const price = parseFloat(document.getElementById('prodPrice').value) || 0;
      const hpp = parseFloat(document.getElementById('prodHPP').value) || 0;
      const minDP = parseFloat(document.getElementById('prodMinDP').value) || 0;
      const sizesStr = document.getElementById('prodSizes').value;
      const fileInput = document.getElementById('prodImageFile');

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast("Harap pilih foto sampul utama produk!", "error");
        return;
      }

      const mainImageBase64 = await readFileAsBase64(fileInput.files[0]);
      const sizes = sizesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const colorRows = document.querySelectorAll('#colorOptionsContainer > div');
      const colorsList = [];
      const colorImagesMap = {};

      for (const row of colorRows) {
        const cName = row.querySelector('.color-name-input').value.trim();
        const cFileInput = row.querySelector('.color-file-input');
        const cPreviewImg = row.querySelector('.color-img-preview').src;

        if (cName) {
          colorsList.push(cName);
          if (cFileInput.files && cFileInput.files[0]) {
            colorImagesMap[cName] = await readFileAsBase64(cFileInput.files[0]);
          } else if (cPreviewImg && !cPreviewImg.includes('placehold.co')) {
            colorImagesMap[cName] = cPreviewImg;
          } else {
            colorImagesMap[cName] = mainImageBase64;
          }
        }
      }

      if (colorsList.length === 0) {
        showToast("Harap tambahkan minimal 1 opsi warna produk!", "error");
        return;
      }

      const newProd = {
        id: `P${Date.now()}`,
        name,
        price,
        hpp,
        minDP: minDP > 0 ? minDP : Math.round(price * 0.5),
        sizes: sizes.length ? sizes : ["All Size"],
        colors: colorsList,
        colorImages: colorImagesMap,
        image: mainImageBase64
      };

      STATE.products.push(newProd);
      renderProducts();
      renderAdminProductsList();

      document.getElementById('prodName').value = '';
      document.getElementById('prodPrice').value = '';
      document.getElementById('prodHPP').value = '';
      document.getElementById('prodMinDP').value = '';
      document.getElementById('prodImageFile').value = '';
      initDefaultColorRows();

      showToast("Produk pre-order baru dengan foto variasi warna berhasil diterbitkan!", "success");
      } catch (error) {
        console.error('Gagal menambahkan produk:', error);
        showToast(error && error.message ? error.message : 'Gagal menambahkan produk. Periksa ukuran foto dan ruang penyimpanan.', 'error');
      }
    }

    function onCheckoutColorChange() {
      const prod = STATE.selectedProductForCheckout;
      if (!prod) return;

      const selectedColor = document.getElementById('orderColor').value;
      const displayImage = (prod.colorImages && prod.colorImages[selectedColor]) ? prod.colorImages[selectedColor] : prod.image;

      const summaryCard = document.getElementById('checkoutProductCard');
      summaryCard.innerHTML = `
        <img src="${displayImage}" class="w-16 h-16 object-cover rounded-lg border border-zinc-800 transition duration-300" onerror="this.src='https://placehold.co/100x100/18181b/ffffff?text=Item'">
        <div>
          <h4 class="text-sm font-bold text-white">${prod.name}</h4>
          <span class="text-xs font-semibold text-zinc-300 block">${formatIDR(prod.price)} / pcs</span>
          <span class="text-xs font-bold text-amber-400">Minimal DP: ${formatIDR(prod.minDP || Math.round(prod.price * 0.5))} / pcs</span>
        </div>
      `;

      updateCheckoutTotal();
    }

    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `p-4 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all transform duration-300 ${
        type === 'success' ? 'bg-white text-black border border-zinc-300' :
        type === 'error' ? 'bg-red-950 text-red-200 border border-red-800' :
        type === 'order' ? 'bg-emerald-500 text-black font-bold border border-emerald-400 text-sm' :
        'bg-zinc-800 text-zinc-100 border border-zinc-700'
      }`;
      toast.innerHTML = `<i class="ph ph-${type === 'success' || type === 'order' ? 'check-circle' : type === 'error' ? 'warning-circle' : 'info'} text-lg"></i><span>${message}</span>`;
      
      const container = document.getElementById('toastContainer');
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 4500);
    }

    function playNotificationSound() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch(e) {}
    }

    function renderProducts() {
      const grid = document.getElementById('productGrid');
      grid.innerHTML = '';

      STATE.products.forEach(p => {
        const card = document.createElement('div');
        card.className = "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition group";
        card.innerHTML = `
          <div>
            <div class="h-56 w-full bg-zinc-950 overflow-hidden relative">
              <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='https://placehold.co/600x400/18181b/ffffff?text=Produk+Preorder'">
              <span class="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-white border border-zinc-700">PRE-ORDER</span>
            </div>
            <div class="p-5 space-y-3">
              <h3 class="text-base font-bold text-white leading-snug">${p.name}</h3>
              <div class="flex items-baseline justify-between">
                <div>
                  <span class="text-lg font-extrabold text-white block">${formatIDR(p.price)}</span>
                  <span class="text-[11px] font-semibold text-amber-400">Min. DP: ${formatIDR(p.minDP || Math.round(p.price * 0.5))}</span>
                </div>
                <span class="text-[11px] text-zinc-500">HPP: ${formatIDR(p.hpp)}</span>
              </div>
              <div class="space-y-1 pt-2 border-t border-zinc-800/60">
                <div class="text-[11px] text-zinc-400">Pilihan Ukuran: <span class="text-zinc-200 font-medium">${p.sizes.join(', ')}</span></div>
                <div class="text-[11px] text-zinc-400">Pilihan Warna: <span class="text-zinc-200 font-medium">${p.colors.join(', ')}</span></div>
              </div>
            </div>
          </div>
          <div class="p-5 pt-0">
            <button onclick="openCheckoutForProduct('${p.id}')" class="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2">
              <i class="ph ph-shopping-cart text-base"></i>
              <span>Ikut Pre-Order Sekarang</span>
            </button>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function openCheckoutForProduct(productId) {
      const prod = STATE.products.find(p => p.id === productId);
      if (!prod) return;

      STATE.selectedProductForCheckout = prod;

      const summaryCard = document.getElementById('checkoutProductCard');
      summaryCard.innerHTML = `
        <img src="${prod.image}" class="w-16 h-16 object-cover rounded-lg border border-zinc-800" onerror="this.src='https://placehold.co/100x100/18181b/ffffff?text=Item'">
        <div>
          <h4 class="text-sm font-bold text-white">${prod.name}</h4>
          <span class="text-xs font-semibold text-zinc-300 block">${formatIDR(prod.price)} / pcs</span>
          <span class="text-xs font-bold text-amber-400">Minimal DP: ${formatIDR(prod.minDP || Math.round(prod.price * 0.5))} / pcs</span>
        </div>
      `;

      const sizeSelect = document.getElementById('orderSize');
      sizeSelect.innerHTML = prod.sizes.map(s => `<option value="${s}">${s}</option>`).join('');

      const colorSelect = document.getElementById('orderColor');
      colorSelect.innerHTML = prod.colors.map(c => `<option value="${c}">${c}</option>`).join('');

      document.getElementById('orderQty').value = 1;
      onCheckoutColorChange();
      updateCheckoutTotal();

      switchTab('checkout');
    }

    function setCheckoutMode(mode) {
      const btnNew = document.getElementById('btnCheckoutModeNew');
      const btnSettle = document.getElementById('btnCheckoutModeSettle');
      const formNew = document.getElementById('checkoutForm');
      const formSettle = document.getElementById('settleForm');

      if (mode === 'NEW') {
        btnNew.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-white text-black";
        btnSettle.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-zinc-400 hover:text-white";
        formNew.classList.remove('hidden');
        formSettle.classList.add('hidden');
      } else {
        btnSettle.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-amber-500 text-black";
        btnNew.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-zinc-400 hover:text-white";
        formSettle.classList.remove('hidden');
        formNew.classList.add('hidden');
      }
    }

    function updatePayOptionUI() {
      if (!STATE.selectedProductForCheckout) return;
      const prod = STATE.selectedProductForCheckout;
      const qty = parseInt(document.getElementById('orderQty').value) || 1;
      const subtotal = prod.price * qty;
      const payOption = document.querySelector('input[name="payOption"]:checked').value;

      const labelLunas = document.getElementById('labelPayLunas');
      const labelDP = document.getElementById('labelPayDP');
      const minDpPerItem = prod.minDP || Math.round(prod.price * 0.5);
      const totalMinDP = minDpPerItem * qty;

      document.getElementById('dpTextDescription').innerText = `Uang Muka Minimal ${formatIDR(minDpPerItem)} / pcs.`;

      let toPay = subtotal;
      let remaining = 0;

      if (payOption === 'DP') {
        toPay = totalMinDP;
        remaining = subtotal - toPay;
        labelDP.className = "p-4 bg-zinc-950 border-2 border-amber-400 rounded-xl cursor-pointer flex flex-col justify-between space-y-2 relative";
        labelLunas.className = "p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer flex flex-col justify-between space-y-2 relative";
      } else {
        labelLunas.className = "p-4 bg-zinc-950 border-2 border-white rounded-xl cursor-pointer flex flex-col justify-between space-y-2 relative";
        labelDP.className = "p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer flex flex-col justify-between space-y-2 relative";
      }

      document.getElementById('checkoutSubtotal').innerText = formatIDR(subtotal);
      document.getElementById('checkoutAmountToPay').innerText = formatIDR(toPay);
      document.getElementById('checkoutRemainingPay').innerText = formatIDR(remaining);
      document.getElementById('checkoutTotalDisplay').innerText = formatIDR(toPay);
    }

    function updateCheckoutTotal() {
      updatePayOptionUI();
    }

    async function handleProcessOrder(e) {
      e.preventDefault();
      const prod = STATE.selectedProductForCheckout;
      if (!prod) return;

      const qty = parseInt(document.getElementById('orderQty').value) || 1;
      const size = document.getElementById('orderSize').value;
      const color = document.getElementById('orderColor').value;
      const custName = document.getElementById('custName').value.trim();
      const custPhone = document.getElementById('custPhone').value.trim();
      const custAddress = document.getElementById('custAddress').value.trim();
      const payOption = document.querySelector('input[name="payOption"]:checked').value;
      const proofInput = document.getElementById('paymentProof');

      if (!proofInput.files || proofInput.files.length === 0) {
        showToast("Harap sertakan foto bukti transfer pembayaran!", "error");
        return;
      }

      const proofBase64 = await readFileAsBase64(proofInput.files[0]);

      const subtotal = prod.price * qty;
      const minDpPerItem = prod.minDP || Math.round(prod.price * 0.5);
      const paidAmount = payOption === 'DP' ? (minDpPerItem * qty) : subtotal;
      const remainingAmount = subtotal - paidAmount;

      const newOrderId = `ORD-${Date.now()}`;
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      const newOrder = {
        id: newOrderId,
        date: dateStr,
        custName,
        custPhone,
        custAddress,
        productId: prod.id,
        productName: prod.name,
        size,
        color,
        qty,
        unitPrice: prod.price,
        unitHPP: prod.hpp,
        totalPrice: subtotal,
        totalHPP: prod.hpp * qty,
        paidAmount,
        remainingAmount,
        paymentType: payOption,
        proofImage: proofBase64,
        dpReceiptImage: payOption === 'DP' ? proofBase64 : null,
        status: payOption === 'DP' ? 'DP (UANG MUKA)' : 'LUNAS'
      };

      STATE.orders.push(newOrder);
      triggerNewOrderNotification(newOrder);

      renderReceiptUI(newOrder);
      document.getElementById('checkoutForm').reset();
      switchTab('receipt');
    }

    async function handleProcessSettleOrder(e) {
      e.preventDefault();
      let inputId = document.getElementById('settleOrderId').value.trim().toUpperCase();
      if (!inputId.startsWith('ORD-')) {
        if (!inputId.startsWith('ORD')) {
          inputId = 'ORD-' + inputId;
        } else {
          inputId = inputId.replace('ORD', 'ORD-');
        }
      }

      const order = STATE.orders.find(o => o.id.toUpperCase() === inputId);
      if (!order) {
        showToast("ID Order tidak ditemukan! Silakan periksa kembali.", "error");
        return;
      }

      const receiptFile = document.getElementById('settleReceiptProof').files[0];
      const payFile = document.getElementById('settlePaymentProof').files[0];

      if (!receiptFile || !payFile) {
        showToast("Harap unggah struk DP dan bukti transfer pelunasan!", "error");
        return;
      }

      const receiptBase64 = await readFileAsBase64(receiptFile);
      const payBase64 = await readFileAsBase64(payFile);

      order.paidAmount = order.totalPrice;
      order.remainingAmount = 0;
      order.dpReceiptImage = receiptBase64;
      order.proofImage = payBase64;
      order.paymentType = "LUNAS";
      order.status = "LUNAS";

      showToast(`Pelunasan ID #${order.id} berhasil terverifikasi!`, "success");
      renderReceiptUI(order);
      document.getElementById('settleForm').reset();
      switchTab('receipt');
    }

    function renderReceiptUI(order) {
      document.getElementById('receiptStoreName').innerText = STATE.settings.storeName;
      document.getElementById('receiptDate').innerText = order.date;
      document.getElementById('receiptOrderId').innerText = `#${order.id}`;
      document.getElementById('receiptCustName').innerText = order.custName;
      document.getElementById('receiptCustPhone').innerText = order.custPhone;
      document.getElementById('receiptCustAddress').innerText = order.custAddress;
      document.getElementById('receiptProdTitle').innerText = order.productName;
      document.getElementById('receiptQtyUnit').innerText = `${order.qty}x @ ${formatIDR(order.unitPrice)}`;
      document.getElementById('receiptVarSpec').innerText = `Size ${order.size} / ${order.color}`;
      document.getElementById('receiptTotalAmount').innerText = formatIDR(order.totalPrice);
      document.getElementById('receiptPaidAmount').innerText = formatIDR(order.paidAmount);
      document.getElementById('receiptRemainingAmount').innerText = formatIDR(order.remainingAmount);

      const statusBadge = document.getElementById('receiptStatusBadge');
      if (order.status === 'LUNAS') {
        statusBadge.className = "inline-block px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-md text-xs font-bold";
        statusBadge.innerText = "LUNAS 100%";
      } else {
        statusBadge.className = "inline-block px-2.5 py-1 bg-amber-950/80 border border-amber-800 text-amber-400 rounded-md text-xs font-bold";
        statusBadge.innerText = "DP (UANG MUKA)";
      }

      document.getElementById('receiptWaGroupBtn').href = STATE.settings.waGroupLink;
    }

    function triggerNewOrderNotification(order) {
      playNotificationSound();
      showToast(`🔔 PESANAN BARU MASUK! #${order.id} oleh ${order.custName} (${formatIDR(order.paidAmount)})`, "order");

      const badge = document.getElementById('adminNewOrderBadge');
      if (badge) badge.classList.remove('hidden');

      let cleanAdminPhone = STATE.settings.adminPhone.replace(/[^0-9]/g, '');
      if (cleanAdminPhone.startsWith('0')) cleanAdminPhone = '62' + cleanAdminPhone.slice(1);

      const waMsg = encodeURIComponent(
        `🚨 *NOTIFIKASI PESANAN PRE-ORDER BARU* 🚨\n\n` +
        `*ID Order:* #${order.id}\n` +
        `*Status Pembayaran:* ${order.status}\n` +
        `*Nama Pemesan:* ${order.custName}\n` +
        `*WhatsApp:* ${order.custPhone}\n` +
        `*Produk:* ${order.productName}\n` +
        `*Variasi:* Size ${order.size} / ${order.color}\n` +
        `*Jumlah:* ${order.qty} pcs\n` +
        `*Nominal Dibayar:* ${formatIDR(order.paidAmount)}\n` +
        `*Sisa Pelunasan:* ${formatIDR(order.remainingAmount)}\n` +
        `*Alamat:* ${order.custAddress}\n\n` +
        `_Sistem Pre-Order ${STATE.settings.storeName}_`
      );

      setTimeout(() => {
        window.open(`https://wa.me/${cleanAdminPhone}?text=${waMsg}`, '_blank');
      }, 1200);

      if (STATE.isAdminAuthenticated) {
        renderAdminDashboard();
      }
    }

    function handleAdminStep1(e) {
      e.preventDefault();
      const user = document.getElementById('adminUser').value;
      const pass = document.getElementById('adminPass').value;

      if (user === STATE.security.username && pass === STATE.security.password) {
        STATE.adminStep1Passed = true;
        document.getElementById('adminStep1Form').classList.add('hidden');
        document.getElementById('adminStep2Form').classList.remove('hidden');
        showToast("Langkah 1 Berhasil! Masukkan 6-Digit PIN Security.", "info");
      } else {
        showToast("Username atau Password Admin salah!", "error");
      }
    }

    function setupPinInputNavigation() {
      const pinInputs = document.querySelectorAll('#pinInputContainer input');
      pinInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
          if (e.key >= '0' && e.key <= '9') {
            if (index < pinInputs.length - 1) pinInputs[index + 1].focus();
          } else if (e.key === 'Backspace') {
            if (index > 0) pinInputs[index - 1].focus();
          }
        });
      });
    }

    function handleAdminStep2(e) {
      e.preventDefault();
      const pinInputs = document.querySelectorAll('#pinInputContainer input');
      let pin = "";
      pinInputs.forEach(i => pin += i.value);

      if (pin === STATE.security.pin) {
        STATE.isAdminAuthenticated = true;
        
        const badge = document.getElementById('adminNewOrderBadge');
        if (badge) badge.classList.add('hidden');

        showToast("Verifikasi 2 Langkah Berhasil! Selamat datang Admin.", "success");
        switchTab('admin-dashboard');
        renderAdminDashboard();
      } else {
        showToast("PIN 6-Digit Salah!", "error");
      }
    }

    function updateStoreSettingsUI() {
      document.getElementById('settingAdminUser').value = STATE.security.username;
      document.getElementById('settingAdminPass').value = STATE.security.password;
      document.getElementById('settingAdminPin').value = STATE.security.pin;

      document.getElementById('settingStoreName').value = STATE.settings.storeName;
      document.getElementById('settingStoreBio').value = STATE.settings.bio;

      document.getElementById('navStoreTitle').innerText = STATE.settings.storeName;
      document.getElementById('igLinkBtn').href = STATE.settings.igLink;
      document.getElementById('qrisDisplayImg').src = STATE.settings.qrisImageUrl;

      document.getElementById('profileDisplayName').innerText = STATE.settings.storeName;
      
      const avatarImg = document.getElementById('profileDisplayAvatar');
      const avatarIcon = document.getElementById('profileAvatarContainer');
      if (STATE.settings.avatarUrl) {
        avatarImg.src = STATE.settings.avatarUrl;
        avatarImg.classList.remove('hidden');
        avatarIcon.classList.add('hidden');
      } else {
        avatarImg.classList.add('hidden');
        avatarIcon.classList.remove('hidden');
      }

      document.getElementById('profileDisplayBio').innerText = STATE.settings.bio;
      document.getElementById('profileDisplayStory').innerText = STATE.settings.originStory;
      
      let igHandle = STATE.settings.igLink.replace(/\/$/, "").split('/').pop() || "jemberdestruction";
      if (!igHandle.startsWith('@')) igHandle = '@' + igHandle;

      let cleanPhone = STATE.settings.adminPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

      document.getElementById('profileIgLink').href = STATE.settings.igLink;
      document.getElementById('profileIgHandle').innerText = igHandle;
      document.getElementById('profileWaLink').href = `https://wa.me/${cleanPhone}`;
      document.getElementById('profileWaPhone').innerText = STATE.settings.adminPhone;
      
      document.getElementById('profileCardIg').innerText = igHandle;
      document.getElementById('profileCardWa').innerText = STATE.settings.adminPhone;
    }

    function handleSaveSecuritySettings(e) {
      e.preventDefault();
      const newAdminUser = document.getElementById('settingAdminUser').value.trim();
      const newAdminPass = document.getElementById('settingAdminPass').value.trim();
      const newAdminPin = document.getElementById('settingAdminPin').value.trim();

      if (newAdminPin.length !== 6 || isNaN(newAdminPin)) {
        showToast("PIN harus berisi 6 digit angka!", "error");
        return;
      }

      STATE.security.username = newAdminUser;
      STATE.security.password = newAdminPass;
      STATE.security.pin = newAdminPin;

      showToast("Kredensial Keamanan Admin Berhasil Diperbarui!", "success");
    }

    async function handleSaveSettings(e) {
      e.preventDefault();
      STATE.settings.storeName = document.getElementById('settingStoreName').value.trim();
      STATE.settings.bio = document.getElementById('settingStoreBio').value.trim();

      const avatarFileInput = document.getElementById('settingAvatarFile');
      if (avatarFileInput.files && avatarFileInput.files.length > 0) {
        const base64Avatar = await readFileAsBase64(avatarFileInput.files[0]);
        if (base64Avatar) {
          STATE.settings.avatarUrl = base64Avatar;
        }
      }

      updateStoreSettingsUI();
      showToast("Profil Market & Pengaturan Toko Berhasil Diperbarui!", "success");
    }

    function switchTab(tabName) {
      const tabs = ['store', 'profile', 'checkout', 'receipt', 'admin-login', 'admin-dashboard'];
      tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.classList.add('hidden');
      });

      document.getElementById('navStoreBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2";
      document.getElementById('navProfileBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2";
      document.getElementById('navAdminBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 relative";

      if (tabName === 'store') {
        document.getElementById('tab-store').classList.remove('hidden');
        document.getElementById('navStoreBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all bg-white text-black hover:bg-zinc-200 flex items-center gap-1.5 sm:gap-2";
      } else if (tabName === 'profile') {
        document.getElementById('tab-profile').classList.remove('hidden');
        document.getElementById('navProfileBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all bg-white text-black hover:bg-zinc-200 flex items-center gap-1.5 sm:gap-2";
      } else if (tabName === 'checkout') {
        document.getElementById('tab-checkout').classList.remove('hidden');
      } else if (tabName === 'receipt') {
        document.getElementById('tab-receipt').classList.remove('hidden');
      } else if (tabName === 'admin-login') {
        if (STATE.isAdminAuthenticated) {
          switchTab('admin-dashboard');
          return;
        }
        document.getElementById('tab-admin-login').classList.remove('hidden');
        document.getElementById('navAdminBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all bg-white text-black hover:bg-zinc-200 flex items-center gap-1.5 sm:gap-2 relative";
      } else if (tabName === 'admin-dashboard') {
        if (!STATE.isAdminAuthenticated) {
          switchTab('admin-login');
          return;
        }
        document.getElementById('tab-admin-dashboard').classList.remove('hidden');
        document.getElementById('navAdminBtn').className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all bg-white text-black hover:bg-zinc-200 flex items-center gap-1.5 sm:gap-2 relative";
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function markInstagramFollowed() {
      showToast("Mengarahkan ke Instagram... Jangan lupa tekan 'Follow'!", "info");
    }

    function confirmFollowedIG() {
      STATE.isIgFollowed = true;
      const content = document.getElementById('storeContent');
      content.classList.remove('opacity-50', 'pointer-events-none');
      
      const badge = document.getElementById('igStatusBadge');
      badge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-medium w-fit";
      badge.innerHTML = `<i class="ph ph-check-circle text-sm"></i><span>Terverifikasi Follow Instagram</span>`;
      
      showToast("Terima kasih! Pemesanan Pre-Order kini telah dibuka.", "success");
    }

    function switchAdminSubTab(subTab) {
      ['orders', 'products', 'financials', 'settings'].forEach(s => {
        const el = document.getElementById(`admin-subtab-${s}`);
        if (el) el.classList.add('hidden');
        const btn = document.getElementById(`subtab-${s}-btn`);
        if (btn) btn.className = "pb-3 border-b-2 border-transparent text-zinc-400 hover:text-white flex items-center gap-1.5";
      });

      const activeEl = document.getElementById(`admin-subtab-${subTab}`);
      if (activeEl) activeEl.classList.remove('hidden');
      const activeBtn = document.getElementById(`subtab-${subTab}-btn`);
      if (activeBtn) activeBtn.className = "pb-3 border-b-2 border-white text-white flex items-center gap-1.5";
    }

    function calculateFinancialMetrics() {
      let revenue = 0;
      let totalHPP = 0;

      STATE.orders.forEach(o => {
        revenue += o.paidAmount;
        totalHPP += o.totalHPP;
      });

      let extraExpenses = 0;
      let extraIncome = 0;

      STATE.cashflow.forEach(c => {
        if (c.type === 'EXPENSE') extraExpenses += c.amount;
        if (c.type === 'INCOME') extraIncome += c.amount;
      });

      const netProfit = (revenue + extraIncome) - (totalHPP + extraExpenses);

      document.getElementById('statRevenue').innerText = formatIDR(revenue);
      document.getElementById('statHPP').innerText = formatIDR(totalHPP);
      document.getElementById('statExpenses').innerText = formatIDR(extraExpenses);
      document.getElementById('statNetProfit').innerText = formatIDR(netProfit);
    }

    function renderOrdersList() {
      const search = (document.getElementById('orderSearchInput').value || '').toLowerCase();
      const sizeFilter = document.getElementById('orderSizeFilter').value;
      const statusFilter = document.getElementById('orderPaymentStatusFilter').value;
      const container = document.getElementById('groupedOrdersContainer');
      container.innerHTML = '';

      const filtered = STATE.orders.filter(o => {
        const matchesSearch = o.custName.toLowerCase().includes(search) || 
                              o.custPhone.includes(search) || 
                              o.id.toLowerCase().includes(search) ||
                              o.productName.toLowerCase().includes(search);
        const matchesSize = sizeFilter === '' || o.size === sizeFilter;
        const matchesStatus = statusFilter === '' || 
                              (statusFilter === 'LUNAS' && o.status === 'LUNAS') ||
                              (statusFilter === 'DP' && o.status.includes('DP'));
        return matchesSearch && matchesSize && matchesStatus;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">Tidak ada data pesanan yang cocok.</div>`;
        return;
      }

      const groups = {};
      filtered.forEach(o => {
        const key = `[STATUS: ${o.status}] - ${o.productName} | Size: ${o.size} | Warna: ${o.color}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(o);
      });

      Object.keys(groups).forEach(groupKey => {
        const groupOrders = groups[groupKey];
        const groupTotalQty = groupOrders.reduce((sum, item) => sum + item.qty, 0);

        const groupDiv = document.createElement('div');
        groupDiv.className = "bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden space-y-3";
        
        let rowsHtml = '';
        groupOrders.forEach(o => {
          rowsHtml += `
            <tr class="border-t border-zinc-800/60 hover:bg-zinc-950/50 transition">
              <td class="p-3 font-mono text-zinc-400">#${o.id}</td>
              <td class="p-3 font-semibold text-white">${o.custName}</td>
              <td class="p-3 text-zinc-300">
                <a href="https://wa.me/${o.custPhone.replace(/[^0-9]/g, '')}" target="_blank" class="hover:underline flex items-center gap-1 text-emerald-400">
                  <i class="ph ph-whatsapp-logo"></i> ${o.custPhone}
                </a>
              </td>
              <td class="p-3 text-center">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded ${o.status === 'LUNAS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
                  ${o.status}
                </span>
              </td>
              <td class="p-3 text-center font-bold text-white">${o.qty} pcs</td>
              <td class="p-3 text-right">
                <div class="font-bold text-white">${formatIDR(o.paidAmount)}</div>
                ${o.remainingAmount > 0 ? `<div class="text-[10px] text-amber-400">Sisa: ${formatIDR(o.remainingAmount)}</div>` : `<div class="text-[10px] text-emerald-400">Lunas</div>`}
              </td>
              <td class="p-3 text-center space-x-1">
                <button onclick="openProofModal('${o.proofImage}')" class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] rounded-lg transition border border-zinc-700 inline-flex items-center gap-1" title="Bukti Transfer">
                  <i class="ph ph-image"></i> Bukti
                </button>
                ${o.dpReceiptImage ? `
                <button onclick="openProofModal('${o.dpReceiptImage}')" class="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 text-[11px] rounded-lg transition border border-amber-800 inline-flex items-center gap-1" title="Struk DP">
                  <i class="ph ph-receipt"></i> Struk DP
                </button>` : ''}
                ${o.remainingAmount > 0 ? `
                <button onclick="adminMarkAsPaid('${o.id}')" class="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1" title="Tandai Lunas">
                  <i class="ph ph-check"></i> Pelunasan
                </button>` : ''}
              </td>
            </tr>
          `;
        });

        groupDiv.innerHTML = `
          <div class="bg-zinc-950 px-5 py-3.5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="font-bold text-xs text-white flex items-center gap-2">
              <i class="ph ph-folder-star text-amber-400"></i> ${groupKey}
            </span>
            <span class="px-3 py-1 bg-zinc-800 text-zinc-200 text-[11px] font-bold rounded-full w-fit">
              Total Kelompok: ${groupTotalQty} pcs (${groupOrders.length} Pemesan)
            </span>
          </div>
          <div class="overflow-x-auto p-2">
            <table class="w-full text-left text-xs">
              <thead class="text-zinc-500 font-medium">
                <tr>
                  <th class="p-3">ID Order</th>
                  <th class="p-3">Nama Pemesan</th>
                  <th class="p-3">WhatsApp</th>
                  <th class="p-3 text-center">Status</th>
                  <th class="p-3 text-center">Jumlah</th>
                  <th class="p-3 text-right">Pembayaran</th>
                  <th class="p-3 text-center">Aksi / Bukti</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;

        container.appendChild(groupDiv);
      });
    }

    function adminMarkAsPaid(orderId) {
      const order = STATE.orders.find(o => o.id === orderId);
      if (!order) return;

      order.paidAmount = order.totalPrice;
      order.remainingAmount = 0;
      order.status = "LUNAS";
      order.paymentType = "LUNAS";

      renderAdminDashboard();
      showToast(`Pesanan #${order.id} berhasil ditandai LUNAS!`, "success");
    }

    function renderAdminDashboard() {
      calculateFinancialMetrics();
      renderOrdersList();
      renderAdminProductsList();
      renderCashflowList();
      updateStoreSettingsUI();
    }

    function renderAdminProductsList() {
      const tbody = document.getElementById('adminProductsTableBody');
      const countBadge = document.getElementById('productCountBadge');
      if (!tbody) return;

      tbody.innerHTML = '';
      if (countBadge) countBadge.innerText = `${STATE.products.length} Produk`;

      if (STATE.products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-zinc-500">Belum ada produk.</td></tr>`;
        return;
      }

      STATE.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-zinc-950/50 transition";
        tr.innerHTML = `
          <td class="p-3">
            <img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-cover rounded-lg border border-zinc-800" onerror="this.src='https://placehold.co/100x100/18181b/ffffff?text=Produk'">
          </td>
          <td class="p-3 font-semibold text-white">${p.name}</td>
          <td class="p-3 font-medium text-emerald-400">${formatIDR(p.price)}</td>
          <td class="p-3 font-medium text-amber-400">${formatIDR(p.minDP || Math.round(p.price * 0.5))}</td>
          <td class="p-3 font-medium text-zinc-400">${formatIDR(p.hpp)}</td>
          <td class="p-3 text-zinc-400 text-[11px]">
            <div><span class="text-zinc-200">Size:</span> ${p.sizes.join(', ')}</div>
            <div><span class="text-zinc-200">Warna:</span> ${p.colors.join(', ')}</div>
          </td>
          <td class="p-3 text-center">
            <button onclick="deleteProduct('${p.id}')" class="text-zinc-500 hover:text-red-400 transition text-base p-1">
              <i class="ph ph-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function deleteProduct(id) {
      STATE.products = STATE.products.filter(p => p.id !== id);
      renderProducts();
      renderAdminProductsList();
      showToast("Produk berhasil dihapus dari katalog.", "info");
    }


    function backToStep1() {
      STATE.adminStep1Passed = false;
      document.getElementById('adminStep2Form').classList.add('hidden');
      document.getElementById('adminStep1Form').classList.remove('hidden');
    }

    function adminLogout() {
      STATE.isAdminAuthenticated = false;
      STATE.adminStep1Passed = false;
      document.getElementById('adminStep2Form').classList.add('hidden');
      document.getElementById('adminStep1Form').classList.remove('hidden');
      document.getElementById('adminStep1Form').reset();
      document.getElementById('adminStep2Form').reset();
      showToast("Anda telah keluar dari Dashboard Admin.", "info");
      switchTab('store');
    }

    function openProofModal(imgUrl) {
      document.getElementById('modalProofImg').src = imgUrl;
      document.getElementById('proofModal').classList.remove('hidden');
    }

    function closeProofModal() {
      document.getElementById('proofModal').classList.add('hidden');
    }

    function handleAddCashflow(e) {
      e.preventDefault();
      const type = document.getElementById('cfType').value;
      const desc = document.getElementById('cfDesc').value.trim();
      const amount = parseFloat(document.getElementById('cfAmount').value) || 0;

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

      STATE.cashflow.push({
        id: `CF-${String(STATE.cashflow.length + 1).padStart(2, '0')}`,
        date: dateStr,
        type,
        desc,
        amount
      });

      document.getElementById('cashflowForm').reset();
      renderAdminDashboard();
      showToast("Catatan transaksi keuangan berhasil disimpan!", "success");
    }

    function renderCashflowList() {
      const tbody = document.getElementById('cashflowTableBody');
      tbody.innerHTML = '';

      if (STATE.cashflow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-zinc-500">Belum ada riwayat transaksi keuangan.</td></tr>`;
        return;
      }

      STATE.cashflow.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-zinc-950/50 transition";
        tr.innerHTML = `
          <td class="p-3 text-zinc-400 font-mono">${c.date}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.type === 'EXPENSE' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}">
              ${c.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
            </span>
          </td>
          <td class="p-3 font-medium text-white">${c.desc}</td>
          <td class="p-3 text-right font-bold ${c.type === 'EXPENSE' ? 'text-red-400' : 'text-emerald-400'}">
            ${c.type === 'EXPENSE' ? '-' : '+'}${formatIDR(c.amount)}
          </td>
          <td class="p-3 text-center">
            <button onclick="deleteCashflow('${c.id}')" class="text-zinc-500 hover:text-red-400 transition text-base">
              <i class="ph ph-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function deleteCashflow(id) {
      STATE.cashflow = STATE.cashflow.filter(c => c.id !== id);
      renderAdminDashboard();
      showToast("Transaksi keuangan berhasil dihapus.", "info");
    }

    function exportToExcel() {
      if (typeof XLSX === 'undefined') {
        showToast("Library Excel belum dimuat.", "error");
        return;
      }

      const excelData = STATE.orders.map(o => ({
        "ID Pesanan": o.id,
        "Tanggal": o.date,
        "Nama Pemesan": o.custName,
        "No. WhatsApp": o.custPhone,
        "Alamat Pengiriman": o.custAddress,
        "Nama Produk": o.productName,
        "Ukuran (Size)": o.size,
        "Warna": o.color,
        "Jumlah (Qty)": o.qty,
        "Harga Satuan": o.unitPrice,
        "HPP Satuan": o.unitHPP,
        "Total Pembayaran": o.totalPrice,
        "Nominal Dibayar": o.paidAmount,
        "Sisa Pelunasan": o.remainingAmount,
        "Total HPP": o.totalHPP,
        "Status": o.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pemesan Pre-Order");

      XLSX.writeFile(workbook, `Data_PreOrder_${STATE.settings.storeName.replace(/\s+/g, '_')}.xlsx`);
      showToast("Data pemesan berhasil diexport ke Excel!", "success");
    }

    function formatIDR(num) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    }
  