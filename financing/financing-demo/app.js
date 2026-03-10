// Application State
const state = {
    currentView: 'catalogView',
    cart: [],
    user: null,
    currentProduct: null, // For Buy Now flow
    selectedPlan: null,
    activeLoans: [],
    products: [
        {
            id: 1,
            name: 'Classic Ankara Dress',
            price: 250,
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
            description: 'Elegant traditional African dress with vibrant patterns'
        },
        {
            id: 2,
            name: 'Dashiki Luxury Shirt',
            price: 180,
            image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
            description: 'Premium colorful African print shirt'
        },
        {
            id: 3,
            name: 'Kente Cloth Jacket',
            price: 450,
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
            description: 'Luxurious Kente design jacket with gold accents'
        },
        {
            id: 4,
            name: 'African Print Skirt',
            price: 200,
            image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
            description: 'Vibrant African print midi skirt'
        },
        {
            id: 5,
            name: 'Bespoke Agbada Set',
            price: 650,
            image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800',
            description: 'Custom-made traditional Agbada ensemble'
        },
        {
            id: 6,
            name: 'Designer African Blouse',
            price: 150,
            image: 'https://images.unsplash.com/photo-1564257577-2f1f0b7a5e8c?w=800',
            description: 'Elegant African print blouse with modern cut'
        }
    ]
};

// Credit tier configuration
const CREDIT_TIERS = {
    NEW: { name: 'New User', limit: 500 },
    VERIFIED: { name: 'Verified User', limit: 2000 },
    TRUSTED: { name: 'Trusted User', limit: 5000 }
};

// Financing plans with interest rates
const FINANCING_PLANS = [
    { months: 3, interestRate: 0, name: '3 Months - 0% Interest' },
    { months: 6, interestRate: 5, name: '6 Months - 5% Interest' },
    { months: 9, interestRate: 8, name: '9 Months - 8% Interest' },
    { months: 12, interestRate: 10, name: '12 Months - 10% Interest' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Load saved user data
    const savedUser = localStorage.getItem('financingUser');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        updateCreditDisplay();
        document.getElementById('dashboardBtn').style.display = 'block';
    }

    // Load saved loans
    const savedLoans = localStorage.getItem('activeLoans');
    if (savedLoans) {
        state.activeLoans = JSON.parse(savedLoans);
    }

    // Render products
    renderProducts();
}

function setupEventListeners() {
    // Navigation
    document.getElementById('cartBtn').addEventListener('click', () => showView('cartView'));
    document.getElementById('dashboardBtn')?.addEventListener('click', () => showView('dashboardView'));
    document.getElementById('goToDashboardBtn')?.addEventListener('click', () => showView('dashboardView'));

    // Cart checkout
    document.getElementById('checkoutBtn').addEventListener('click', handleCartCheckout);

    // KYC form
    document.getElementById('kycForm').addEventListener('submit', handleKYCSubmit);

    // Financing plan selection
    document.getElementById('confirmPlanBtn').addEventListener('click', handlePlanConfirmation);

    // Loan payment form
    document.getElementById('loanPaymentForm').addEventListener('submit', handleLoanPaymentSubmit);
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = state.products.map(product => {
        const monthlyPayment = (product.price / 3).toFixed(2);

        return `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price}</div>
                    <div class="financing-badge">0% Financing Available</div>
                    <div class="financing-info">
                        Or $${monthlyPayment}/mo with 0% interest
                    </div>
                    <div class="product-actions">
                        <button class="btn-primary btn-buy-now" onclick="handleBuyNow(${product.id})">
                            Buy Now
                        </button>
                        <button class="btn-primary btn-add-cart" onclick="addToCart(${product.id})">
                            🛒
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Buy Now Flow
function handleBuyNow(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    state.currentProduct = product;

    // Show payment options modal
    document.getElementById('paymentOptionsModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentOptionsModal').classList.remove('active');
    state.currentProduct = null;
}

function handlePaymentChoice(choice) {
    if (!state.currentProduct) return;

    // Store product before closing modal
    const product = state.currentProduct;

    // Close modal
    document.getElementById('paymentOptionsModal').classList.remove('active');

    if (choice === 'full') {
        // Simulate full payment
        showNotification(`Purchase complete! You bought ${product.name} for $${product.price}`);
        state.currentProduct = null;
    } else if (choice === 'financing') {
        // Start financing flow
        if (!state.user) {
            // User needs to complete KYC first
            showView('kycView');
        } else {
            // Proceed to financing plans (admin will handle credit approval)
            showFinancingPlans();
        }
    }
}

// Cart Functions
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
        state.cart.push({ ...product, cartId: Date.now() });
        updateCartCount();
        showNotification(`${product.name} added to cart!`);
    }
}

function updateCartCount() {
    document.querySelector('.cart-count').textContent = state.cart.length;
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');

    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--gray-600);">Your cart is empty</p>';
        cartSummary.style.display = 'none';
        return;
    }

    cartSummary.style.display = 'block';

    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.cartId})">Remove</button>
        </div>
    `).join('');

    const total = state.cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cartSubtotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

function removeFromCart(cartId) {
    state.cart = state.cart.filter(item => item.cartId !== cartId);
    updateCartCount();
    renderCart();
}

function handleCartCheckout() {
    if (state.cart.length === 0) return;

    // Cart checkout proceeds normally (pay in full)
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);
    showNotification(`Order complete! Total: $${total.toFixed(2)}`);
    state.cart = [];
    updateCartCount();
    showView('catalogView');
}

// KYC Form
function handleKYCSubmit(e) {
    e.preventDefault();

    // Get file inputs
    const idDocument = document.getElementById('idDocument').files[0];
    const selfie = document.getElementById('selfie').files[0];
    const employmentLetter = document.getElementById('employmentLetter').files[0];
    const bankStatement = document.getElementById('bankStatement').files[0];
    const utilityBill = document.getElementById('utilityBill').files[0];

    const formData = {
        // Personal Info
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,

        // Address
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,

        // Employment
        employmentStatus: document.getElementById('employmentStatus').value,
        monthlyIncome: parseFloat(document.getElementById('monthlyIncome').value),
        employerName: document.getElementById('employerName').value,
        employerPhone: document.getElementById('employerPhone').value,
        employerEmail: document.getElementById('employerEmail').value,

        // ID
        idType: document.getElementById('idType').value,
        idNumber: document.getElementById('idNumber').value,

        // Bank Details
        bankName: document.getElementById('bankName').value,
        accountNumber: document.getElementById('accountNumber').value,
        accountName: document.getElementById('accountName').value,

        // Documents (storing file names - in production these would be uploaded to server)
        documents: {
            idDocument: idDocument ? idDocument.name : null,
            selfie: selfie ? selfie.name : null,
            employmentLetter: employmentLetter ? employmentLetter.name : null,
            bankStatement: bankStatement ? bankStatement.name : null,
            utilityBill: utilityBill ? utilityBill.name : null
        }
    };

    // Determine credit tier based on income
    let tier;
    if (formData.monthlyIncome >= 3000) {
        tier = 'TRUSTED';
    } else if (formData.monthlyIncome >= 1500) {
        tier = 'VERIFIED';
    } else {
        tier = 'NEW';
    }

    // Create user profile
    state.user = {
        ...formData,
        tier: tier,
        creditLimit: CREDIT_TIERS[tier].limit,
        availableCredit: CREDIT_TIERS[tier].limit,
        kycCompleted: true,
        kycStatus: 'pending', // Will be approved by admin
        kycDate: new Date().toISOString()
    };

    localStorage.setItem('financingUser', JSON.stringify(state.user));

    updateCreditDisplay();
    document.getElementById('dashboardBtn').style.display = 'block';

    showNotification(`Application submitted successfully! Your profile is under review.`);

    // Continue to financing plans (admin will handle credit approval)
    if (state.currentProduct) {
        showFinancingPlans();
    } else {
        showView('catalogView');
    }
}

// Financing Plans
function showFinancingPlans() {
    if (!state.currentProduct) return;

    const plansContainer = document.getElementById('financingPlans');
    const productSummary = document.getElementById('productSummary');

    // Show product summary
    productSummary.innerHTML = `
        <div class="summary-product">
            <img src="${state.currentProduct.image}" alt="${state.currentProduct.name}">
            <div class="summary-product-info">
                <h4>${state.currentProduct.name}</h4>
                <div class="summary-product-price">$${state.currentProduct.price}</div>
            </div>
        </div>
    `;

    document.getElementById('planOrderTotal').textContent = `$${state.currentProduct.price.toFixed(2)}`;
    document.getElementById('planCreditLimit').textContent = `$${state.user.availableCredit.toFixed(2)}`;

    plansContainer.innerHTML = FINANCING_PLANS.map(plan => {
        const totalWithInterest = state.currentProduct.price * (1 + plan.interestRate / 100);
        const monthlyPayment = totalWithInterest / plan.months;

        return `
            <div class="plan-card" data-months="${plan.months}">
                <div class="plan-header">
                    <div class="plan-duration">${plan.months} Months</div>
                    <div class="plan-badge ${plan.interestRate > 0 ? 'has-interest' : ''}">
                        ${plan.interestRate}% Interest
                    </div>
                </div>
                <div class="plan-details">
                    Total: $${totalWithInterest.toFixed(2)}
                </div>
                <div class="plan-monthly">$${monthlyPayment.toFixed(2)}/month</div>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.plan-card').forEach(card => {
        card.addEventListener('click', () => selectPlan(card));
    });

    showView('financingPlanView');
}

function selectPlan(cardElement) {
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    const months = parseInt(cardElement.dataset.months);
    const plan = FINANCING_PLANS.find(p => p.months === months);
    state.selectedPlan = plan;

    document.getElementById('confirmPlanBtn').disabled = false;
}

function handlePlanConfirmation() {
    if (!state.selectedPlan || !state.currentProduct) return;

    // Create loan
    const totalWithInterest = state.currentProduct.price * (1 + state.selectedPlan.interestRate / 100);
    const monthlyPayment = totalWithInterest / state.selectedPlan.months;

    const loan = {
        id: Date.now(),
        product: state.currentProduct,
        principal: state.currentProduct.price,
        interestRate: state.selectedPlan.interestRate,
        totalAmount: totalWithInterest,
        monthlyPayment: monthlyPayment,
        duration: state.selectedPlan.months,
        remainingBalance: totalWithInterest,
        paidAmount: 0,
        nextPaymentDate: getNextPaymentDate(1),
        paymentsRemaining: state.selectedPlan.months,
        status: 'active',
        createdAt: new Date().toISOString(),
        payments: []
    };

    state.activeLoans.push(loan);
    localStorage.setItem('activeLoans', JSON.stringify(state.activeLoans));

    // Update user's available credit
    state.user.availableCredit -= state.currentProduct.price;
    localStorage.setItem('financingUser', JSON.stringify(state.user));
    updateCreditDisplay();

    // Show confirmation
    renderConfirmation(loan);
    showView('confirmationView');

    // Clear current product
    state.currentProduct = null;
    state.selectedPlan = null;
}

function renderConfirmation(loan) {
    const productContainer = document.getElementById('confirmationProduct');
    productContainer.innerHTML = `
        <div class="summary-product">
            <img src="${loan.product.image}" alt="${loan.product.name}">
            <div class="summary-product-info">
                <h4>${loan.product.name}</h4>
                <div class="summary-product-price">$${loan.product.price}</div>
            </div>
        </div>
    `;

    const scheduleContainer = document.getElementById('repaymentSchedule');
    let scheduleHTML = '';
    for (let i = 1; i <= loan.duration; i++) {
        scheduleHTML += `
            <div class="schedule-item">
                <span>Payment ${i} - ${getNextPaymentDate(i)}</span>
                <span>$${loan.monthlyPayment.toFixed(2)}</span>
            </div>
        `;
    }
    scheduleContainer.innerHTML = scheduleHTML;

    document.getElementById('confirmTotal').textContent = `$${loan.totalAmount.toFixed(2)}`;
    document.getElementById('confirmMonthly').textContent = `$${loan.monthlyPayment.toFixed(2)}`;
    document.getElementById('confirmInterest').textContent = `${loan.interestRate}%`;
}

function getNextPaymentDate(monthsFromNow) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateCreditDisplay() {
    if (!state.user) return;

    const tier = CREDIT_TIERS[state.user.tier];

    // Update credit banner
    const banner = document.getElementById('creditBanner');
    banner.style.display = 'flex';
    document.getElementById('creditLimit').textContent = `$${state.user.creditLimit}`;
    document.getElementById('creditTier').textContent = tier.name;
    document.getElementById('availableCredit').textContent = `$${state.user.availableCredit.toFixed(0)}`;

    // Update dashboard stats
    document.getElementById('dashCreditLimit').textContent = `$${state.user.creditLimit}`;
    document.getElementById('dashAvailableCredit').textContent = `$${state.user.availableCredit.toFixed(0)}`;
    document.getElementById('dashActiveLoans').textContent = state.activeLoans.filter(l => l.status === 'active').length;
    document.getElementById('dashCreditTier').textContent = tier.name;
}

function renderDashboard() {
    const loansContainer = document.getElementById('activeLoans');

    if (state.activeLoans.length === 0) {
        loansContainer.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--gray-600);">No active loans</p>';
        return;
    }

    loansContainer.innerHTML = state.activeLoans.map(loan => {
        const progress = ((loan.paidAmount / loan.totalAmount) * 100).toFixed(0);
        const isOverdue = new Date(loan.nextPaymentDate) < new Date() && loan.remainingBalance > 0;

        return `
            <div class="loan-card">
                <div class="loan-header">
                    <div class="loan-product">
                        <img src="${loan.product.image}" alt="${loan.product.name}">
                        <div>
                            <div class="loan-product-name">${loan.product.name}</div>
                            <div class="loan-amount">$${loan.totalAmount.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="loan-status ${isOverdue ? 'overdue' : 'active'}">
                        ${isOverdue ? 'Overdue' : 'Active'}
                    </div>
                </div>

                <div class="loan-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${progress}% paid</div>
                </div>

                <div class="loan-details">
                    <div class="detail-item">
                        <span class="detail-label">Monthly Payment</span>
                        <span class="detail-value">$${loan.monthlyPayment.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Remaining Balance</span>
                        <span class="detail-value">$${loan.remainingBalance.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Next Payment</span>
                        <span class="detail-value">${loan.nextPaymentDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payments Remaining</span>
                        <span class="detail-value">${loan.paymentsRemaining}</span>
                    </div>
                </div>

                <button class="make-payment-btn" onclick="openLoanPaymentModal(${loan.id})">
                    Make Payment
                </button>
            </div>
        `;
    }).join('');

    updateCreditDisplay();
}

function openLoanPaymentModal(loanId) {
    const loan = state.activeLoans.find(l => l.id === loanId);
    if (!loan) return;

    const modal = document.getElementById('loanPaymentModal');
    const detailsContainer = document.getElementById('loanPaymentDetails');

    detailsContainer.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Product:</strong> ${loan.product.name}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Total Amount:</strong> $${loan.totalAmount.toFixed(2)}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Remaining Balance:</strong> $${loan.remainingBalance.toFixed(2)}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Monthly Payment:</strong> $${loan.monthlyPayment.toFixed(2)}
        </div>
    `;

    document.getElementById('paymentAmount').value = loan.monthlyPayment.toFixed(2);
    document.getElementById('loanPaymentForm').dataset.loanId = loanId;

    modal.classList.add('active');
}

function closeLoanPaymentModal() {
    document.getElementById('loanPaymentModal').classList.remove('active');
}

function handleLoanPaymentSubmit(e) {
    e.preventDefault();

    const loanId = parseInt(e.target.dataset.loanId);
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const method = document.getElementById('paymentMethod').value;

    const loan = state.activeLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Process payment
    loan.paidAmount += amount;
    loan.remainingBalance -= amount;
    loan.paymentsRemaining = Math.ceil(loan.remainingBalance / loan.monthlyPayment);

    // Add payment record
    loan.payments.push({
        amount: amount,
        method: method,
        date: new Date().toISOString()
    });

    // Update next payment date
    if (loan.remainingBalance > 0) {
        loan.nextPaymentDate = getNextPaymentDate(1);
    } else {
        loan.status = 'completed';
        // Restore credit limit
        state.user.availableCredit += loan.principal;
        localStorage.setItem('financingUser', JSON.stringify(state.user));
    }

    // Save
    localStorage.setItem('activeLoans', JSON.stringify(state.activeLoans));

    // Close modal and refresh dashboard
    closeLoanPaymentModal();
    showNotification(`Payment of $${amount.toFixed(2)} processed successfully!`);
    renderDashboard();
}

function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    document.getElementById(viewId).classList.add('active');
    state.currentView = viewId;

    // Render content for specific views
    if (viewId === 'cartView') {
        renderCart();
    } else if (viewId === 'dashboardView') {
        renderDashboard();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
