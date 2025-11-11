(function() {
  function waitForSalla(callback) {
    if (window.salla && salla.cart && salla.cart.event && salla.cart.api && salla.profile?.api?.info) {
      callback();
    } else {
      setTimeout(() => waitForSalla(callback), 300);
    }
  }
  waitForSalla(() => {
    console.log(':white_check_mark: Salla جاهزة — بدأ تنفيذ كود البوب-أب');
    // ========== إنشاء العناصر ==========
    const overlay = document.createElement('div');
    overlay.id = 'checkout-overlay';
    overlay.classList.add('overlay-hidden');
    const container = document.createElement('div');
    container.className = 'popup-container';
    const closeBtn = document.createElement('span');
    closeBtn.textContent = ':heavy_multiplication_x:';
    closeBtn.className = 'popup-close';
    closeBtn.addEventListener('click', hideOverlay);
    const offerContainer = document.createElement('div');
    offerContainer.id = 'offer-progress';
    offerContainer.className = 'offer-container';
    const btns = document.createElement('div');
    btns.className = 'popup-buttons';
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'اكمل تصفح المتجر';
    continueBtn.className = 'btn-continue';
    continueBtn.onclick = hideOverlay;
    const actionBtn = document.createElement('button');
    actionBtn.textContent = 'سجل الدخول أولاً';
    actionBtn.className = 'btn-action';
    btns.append(continueBtn, actionBtn);
    container.append(closeBtn, offerContainer, btns);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    // ========== وظائف العرض ==========
    let isOpen = false;
    let isLoggedIn = false;
    function showOverlay() {
      if (isOpen) return;
      isOpen = true;
      overlay.classList.remove('overlay-hidden');
      overlay.classList.add('overlay-visible');
      container.classList.add('popup-open');
    }
    function hideOverlay() {
      overlay.classList.remove('overlay-visible');
      overlay.classList.add('overlay-hidden');
      container.classList.remove('popup-open');
      isOpen = false;
    }
    overlay.addEventListener('click', e => {
      if (e.target === overlay) hideOverlay();
    });
    // ========== تحديث العروض ==========
    async function updateOfferProgress() {
      try {
        const response = await salla.cart.api.details();
        const count = response.data?.cart?.count || 0;
        const milestones = [
          { products: 2, discount: '10%' },
          { products: 3, discount: '15%' },
          { products: 4, discount: '20%' }
        ];
        let html = `
          <div class="offer-title">:gift: عروض</div>
          <h3 class="offer-heading">الجمعة الخضراء 25</h3>
          <div class="milestones-container">
        `;
        milestones.forEach((m, idx) => {
          const active = count >= m.products;
          const progress = idx > 0 ? (count >= milestones[idx - 1].products ? 100 : 0) : 0;
          if (idx > 0) {
            html += `
              <div class="milestone-line">
                <div class="milestone-progress" style="width:${progress}%;background:${progress === 100 ? '#4CAF50' : '#E0E0E0'}"></div>
              </div>
            `;
          }
          html += `
            <div class="milestone-item ${active ? 'active' : ''}">
              <div class="milestone-circle" style="background:${active ? '#4CAF50' : '#E0E0E0'}">${m.discount}</div>
              <small class="milestone-text" style="color:${active ? '#4CAF50' : '#888'}">${m.products} منتجات</small>
            </div>
          `;
        });
        html += `
          </div>
          <p class="offer-count">عدد المنتجات الحالي: <strong>${count}</strong></p>
        `;
        offerContainer.innerHTML = html;
        // التحقق من حالة تسجيل الدخول وتحديث الزر
        try {
          const profile = await salla.profile.api.info();
          isLoggedIn = profile?.data?.id !== undefined && profile?.data?.email;
          if (isLoggedIn) {
            actionBtn.textContent = 'اذهب لصفحة الدفع';
            actionBtn.classList.add('btn-green');
            actionBtn.classList.remove('btn-orange');
          } else {
            actionBtn.textContent = 'سجل الدخول أولاً';
            actionBtn.classList.add('btn-orange');
            actionBtn.classList.remove('btn-green');
          }
        } catch (err) {
          console.warn(':x: تعذر التحقق من حالة تسجيل الدخول', err);
          isLoggedIn = false;
          actionBtn.textContent = 'سجل الدخول أولاً';
          actionBtn.classList.add('btn-orange');
          actionBtn.classList.remove('btn-green');
        }
      } catch (err) {
        console.warn(':x: فشل تحميل بيانات العرض', err);
        offerContainer.innerHTML = '<p style="color:#999;">تعذر تحميل العرض</p>';
      }
    }
    // ========== عند إضافة منتج ==========
    salla.cart.event.onItemAdded(async () => {
      await updateOfferProgress();
      showOverlay();
    });
    // ========== زر الإجراء ==========
    actionBtn.onclick = async () => {
      actionBtn.disabled = true;
      if (!isLoggedIn) {
        hideOverlay();
        salla.event.dispatch('login::open');
      } else {
        actionBtn.textContent = 'جارٍ التوجيه...';
        actionBtn.classList.add('btn-loading');
        try {
          const response = await salla.api.cart.submit();
          const url = response.data?.url || '/cart';
          window.location.href = url;
        } catch (err) {
          console.error('Checkout redirect failed:', err);
          window.location.href = '/cart';
        }
      }
    };
  });
})();
