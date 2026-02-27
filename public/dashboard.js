/************************************************
 * Vitaran - FINAL Stable Dashboard
 ************************************************/

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

    if (!res.ok) {
      console.log("Server not responding");
      return;
    }

    const data = await res.json();

    if (!data.success) {
      window.location.href = "login.html";
      return;
    }

    if (!data.user.plan) {
      window.location.href = "subscription.html";
      return;
    }

    const userPlan = data.user.plan;

    const badge = document.querySelector(".badge");
    if (badge) {
      badge.innerText = userPlan + " Active";
    }

    initDashboard(userPlan);

  } catch (err) {
    console.log("Dashboard error:", err);
  }

});


/* ================= PLAN MAPPING ================= */

const PLAN_CONFIG = {

  // E-Commerce
  "E-Commerce 1 Month": {
    platforms: ["Amazon","Flipkart","Meesho","Myntra"],
    maxProfit: 60
  },
  "E-Commerce 3 Months": {
    platforms: ["Amazon","Flipkart","Meesho","Myntra"],
    maxProfit: 70
  },
  "E-Commerce 12 Months": {
    platforms: ["Amazon","Flipkart","Meesho","Myntra"],
    maxProfit: 80
  },

  // Food
  "Food 1 Month": {
    platforms: ["Swiggy","Zomato"],
    maxProfit: 80
  },
  "Food 3 Months": {
    platforms: ["Swiggy","Zomato"],
    maxProfit: 90
  },
  "Food 12 Months": {
    platforms: ["Swiggy","Zomato"],
    maxProfit: 100
  },

  // Grocery
  "Grocery 1 Month": {
    platforms: ["Zepto","Instamart","Blinkit"],
    maxProfit: 80
  },
  "Grocery 3 Months": {
    platforms: ["Zepto","Instamart","Blinkit"],
    maxProfit: 90
  },
  "Grocery 12 Months": {
    platforms: ["Zepto","Instamart","Blinkit"],
    maxProfit: 100
  },

  // Food + Grocery
  "Food+Grocery 1 Month": {
    platforms: ["Swiggy","Zomato","Zepto","Instamart","Blinkit"],
    maxProfit: 90
  },
  "Food+Grocery 3 Months": {
    platforms: ["Swiggy","Zomato","Zepto","Instamart","Blinkit"],
    maxProfit: 100
  },
  "Food+Grocery 12 Months": {
    platforms: ["Swiggy","Zomato","Zepto","Instamart","Blinkit"],
    maxProfit: 110
  },

  // All-in-One
  "All-in-One 1 Month": {
    platforms: [
      "Amazon","Flipkart","Meesho","Myntra",
      "Swiggy","Zomato","Zepto","Instamart","Blinkit"
    ],
    maxProfit: 100
  },
  "All-in-One 3 Months": {
    platforms: [
      "Amazon","Flipkart","Meesho","Myntra",
      "Swiggy","Zomato","Zepto","Instamart","Blinkit"
    ],
    maxProfit: 110
  },
  "All-in-One 12 Months": {
    platforms: [
      "Amazon","Flipkart","Meesho","Myntra",
      "Swiggy","Zomato","Zepto","Instamart","Blinkit"
    ],
    maxProfit: 120
  }

};


/* ================= DASHBOARD INIT ================= */

function initDashboard(userPlan) {

  const config = PLAN_CONFIG[userPlan];

  if (!config) {
    console.log("Invalid plan from DB:", userPlan);
    return;
  }

  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function platformLogo(name) {
    return `/logos/${name.toLowerCase()}.png`;
  }

  function orderStatus() {
    return randomFrom(["Accepted","Picked","Delivered"]);
  }

  const orders = [];

  for (let i = 0; i < random(5, 9); i++) {

    const profit = random(20, config.maxProfit);

    orders.push({
      platform: randomFrom(config.platforms),
      orderId: "#VT" + random(1000, 9999),
      status: orderStatus(),
      km: (Math.random() * 8 + 1).toFixed(1),
      profit: profit
    });

  }

  orders.sort((a, b) => b.profit - a.profit);

  const tbody = document.querySelector(".table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  orders.forEach((o, index) => {

    const tr = document.createElement("tr");

    if (index === 0) tr.classList.add("priority");

    tr.innerHTML = `
      <td>
        <img src="${platformLogo(o.platform)}" width="20">
        ${o.platform}
      </td>
      <td>${o.orderId}</td>
      <td><span class="tag">${o.status}</span></td>
      <td>${o.km}</td>
      <td class="${o.profit >= 70 ? "green" : ""}">${o.profit}</td>
    `;

    tbody.appendChild(tr);
  });

  const stats = document.querySelectorAll(".stat strong");

  if (stats.length >= 4) {
    stats[0].innerText = random(80, 200);
    stats[1].innerText = random(3, 9);
    stats[2].innerText = random(70, 180);
    stats[3].innerText = "₹" + random(3000, 12000);
  }

  const steps = document.querySelectorAll(".step");

  steps.forEach((s, i) => {
    if (i < random(1, 3)) s.classList.add("active");
  });

  console.log("Dashboard Loaded Successfully");
}