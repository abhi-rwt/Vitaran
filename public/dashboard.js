/************************************************
 * Vitaran - Dashboard (Logistics Optimized)
 ************************************************/

let currentPlan = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch("/api/auth/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (!data.success) {
            window.location.href = "login.html";
            return;
        }

        if (!data.user.plan) {
            window.location.href = "subscription.html";
            return;
        }

        currentPlan = data.user.plan;

        /* PLAN BADGE */
        const badge = document.querySelector(".badge");
        if (badge) {
            badge.innerText = currentPlan + " Active";
        }

        /* INIT DASHBOARD */
        initDashboard(currentPlan);

    } catch (err) {
        console.log("Dashboard error:", err);
    }
});


/* LOGOUT */
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("lastOrderType");
    window.location.href = "login.html";
}


/* ================= PLAN CONFIG ================= */

const PLAN_CONFIG = {
    "E-Commerce 1 Month": { platforms: ["Amazon", "Flipkart", "Meesho", "Myntra"], maxProfit: 60 },
    "E-Commerce 3 Months": { platforms: ["Amazon", "Flipkart", "Meesho", "Myntra"], maxProfit: 70 },
    "E-Commerce 12 Months": { platforms: ["Amazon", "Flipkart", "Meesho", "Myntra"], maxProfit: 80 },

    "Food 1 Month": { platforms: ["Swiggy", "Zomato"], maxProfit: 80 },
    "Food 3 Months": { platforms: ["Swiggy", "Zomato"], maxProfit: 90 },
    "Food 12 Months": { platforms: ["Swiggy", "Zomato"], maxProfit: 100 },

    "Grocery 1 Month": { platforms: ["Zepto", "Instamart", "Blinkit"], maxProfit: 80 },
    "Grocery 3 Months": { platforms: ["Zepto", "Instamart", "Blinkit"], maxProfit: 90 },
    "Grocery 12 Months": { platforms: ["Zepto", "Instamart", "Blinkit"], maxProfit: 100 },

    "Food+Grocery 1 Month": { platforms: ["Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"], maxProfit: 90 },
    "Food+Grocery 3 Months": { platforms: ["Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"], maxProfit: 100 },
    "Food+Grocery 12 Months": { platforms: ["Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"], maxProfit: 110 },

    "All-in-One 1 Month": {
        platforms: ["Amazon", "Flipkart", "Meesho", "Myntra", "Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"],
        maxProfit: 100
    },
    "All-in-One 3 Months": {
        platforms: ["Amazon", "Flipkart", "Meesho", "Myntra", "Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"],
        maxProfit: 110
    },
    "All-in-One 12 Months": {
        platforms: ["Amazon", "Flipkart", "Meesho", "Myntra", "Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"],
        maxProfit: 120
    }
};


/* ================= DASHBOARD ================= */

function initDashboard(userPlan) {
    let config = PLAN_CONFIG[userPlan];
    if (!config) config = PLAN_CONFIG["E-Commerce 1 Month"];

    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function platformLogo(name) {
        const lower = name.toLowerCase();
        if (lower === "myntra") return "/logos/myntra.jpeg";
        return `/logos/${lower}.png`;
    }

    /* 🚚 REALISTIC LOGISTICS LOGIC 🚚 */
    const BASE_PAY = 25;       // Minimum pickup fee
    const PER_KM_RATE = 8;     // Fuel & Maintenance per KM
    const COMM_RATE = 0.02;    // 2% Bonus of Order Amount

    const orders = [];
    for (let i = 0; i < random(5, 9); i++) {
        const amount = random(150, 1000);
        const km = parseFloat((Math.random() * 8 + 1).toFixed(1));

        // Calculation: Base + (Distance * Rate) + (Order Commission)
        let calculatedProfit = Math.round(BASE_PAY + (km * PER_KM_RATE) + (amount * COMM_RATE));

        // Sync with Plan limit
        if (calculatedProfit > config.maxProfit) {
            calculatedProfit = config.maxProfit;
        }

        orders.push({
            platform: randomFrom(config.platforms),
            orderId: "VT" + random(1000, 9999),
            payment: Math.random() > 0.5 ? "PAID" : "COD",
            amount: amount,
            km: km,
            profit: calculatedProfit
        });
    }

    // Sort by profit (Higher profit on top)
    orders.sort((a, b) => b.profit - a.profit);

    /* TABLE RENDER */
    const tbody = document.querySelector(".table tbody");
    tbody.innerHTML = "";

    const lastOrderType = localStorage.getItem("lastOrderType");

    orders.forEach((o, index) => {
        const tr = document.createElement("tr");
        if (index === 0) tr.classList.add("priority");

        const isHighProfit = o.profit >= 70;
        const isDisabled = (lastOrderType === "HIGH" && isHighProfit);

        tr.innerHTML = `
            <td>
                <img src="${platformLogo(o.platform)}" onerror="this.src='/logos/default.png'">
                ${o.platform}
            </td>
            <td>#${o.orderId}</td>
            <td><span class="tag">${o.payment}</span></td>
            <td>₹${o.amount}</td>
            <td>${o.km} KM</td>
            <td class="${isHighProfit ? 'green' : ''}">₹${o.profit}</td>
            <td class="action-cell"></td>
        `;

        const btn = document.createElement("button");
        btn.className = "btn accept";
        btn.innerText = isDisabled ? "Locked" : "Accept";
        
        if (isDisabled) {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        } else {
            btn.onclick = () => acceptOrder(o.orderId, o.payment, o.amount, o.profit);
        }

        tr.querySelector(".action-cell").appendChild(btn);
        tbody.appendChild(tr);
    });

    /* STATS */
    const stats = document.querySelectorAll(".stat strong");
    if (stats.length >= 4) {
        const active = random(3, 9);
        const completed = random(70, 120);
        stats[0].innerText = active + completed;
        stats[1].innerText = active;
        stats[2].innerText = completed;
        stats[3].innerText = "₹" + random(3000, 12000);
    }
}


/* ================= ACCEPT ORDER ================= */

function acceptOrder(id, payment, amount, profit) {
    const currentType = profit >= 70 ? "HIGH" : "NORMAL";
    localStorage.setItem("lastOrderType", currentType);
    window.location.href = `order.html?order=${id}&payment=${payment}&amount=${amount}&profit=${profit}`;
}