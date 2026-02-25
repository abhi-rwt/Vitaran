/************************************************
 * Vitaran - FINAL Dashboard (Stable Version)
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

    // 🔥 If server sleeping, status not OK
    if (!res.ok) {
      throw new Error("Server not responding");
    }

    const data = await res.json();

    if (!data.success) {
      console.log("Auth failed");
      window.location.href = "login.html";
      return;
    }

    if (!data.user.plan) {
      window.location.href = "subscription.html";
      return;
    }

    const userPlan = data.user.plan;
    document.querySelector(".badge").innerText =
      userPlan + " Plan Active";

    initDashboard(userPlan);

  } catch (err) {

    console.log("Dashboard error:", err);

    // 🔥 Render sleep fix (retry once)
    setTimeout(() => {
      location.reload();
    }, 2000);
  }

});


/* ================= PLAN CONFIG ================= */

const PLAN_CONFIG = {
  ECOM: {
    platforms: ["Amazon","Flipkart","Meesho","Myntra"],
    maxProfit: 60
  },
  QUICK: {
    platforms: ["Swiggy","Zomato","Zepto","Instamart","Blinkit"],
    maxProfit: 80
  },
  ALL: {
    platforms: [
      "Amazon","Flipkart","Meesho","Myntra",
      "Swiggy","Zomato","Zepto","Instamart","Blinkit"
    ],
    maxProfit: 100
  }
};


/* ================= DASHBOARD INIT ================= */

function initDashboard(userPlan) {

  const config = PLAN_CONFIG[userPlan];

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
    return randomFrom(["Accepted","Picked","Out"]);
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
  tbody.innerHTML = "";

  orders.forEach((o, index) => {

    const tr = document.createElement("tr");

    if (index === 0) tr.classList.add("priority");

    tr.innerHTML = `
      <td>
        <img src="${platformLogo(o.platform)}">
        ${o.platform}
      </td>
      <td>${o.orderId}</td>
      <td><span class="tag ${o.status.toLowerCase()}">${o.status}</span></td>
      <td>${o.km}</td>
      <td class="${o.profit >= 70 ? "green" : ""}">${o.profit}</td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".stat strong")[0].innerText = random(80, 200);
  document.querySelectorAll(".stat strong")[1].innerText = random(3, 9);
  document.querySelectorAll(".stat strong")[2].innerText = random(70, 180);
  document.querySelectorAll(".stat strong")[3].innerText = "₹" + random(3000, 12000);

  const steps = document.querySelectorAll(".step");

  steps.forEach((s, i) => {
    if (i < random(1, 3)) s.classList.add("active");
  });

  console.log("Server Plan:", userPlan);
}