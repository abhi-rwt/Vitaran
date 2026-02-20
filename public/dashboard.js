/************************************************
 * Vitaran - FINAL Dashboard Logic
 * Single Source of Truth ✅
 ************************************************/

/* ================= PLAN CONFIG ================= */
// plan name localStorage me save hoga (subscription ke baad)
// example: localStorage.setItem("plan", "ALL");

const PLAN_CONFIG = {
  ECOM: {
    platforms: ["Amazon", "Flipkart", "Meesho", "Myntra"],
    maxProfit: 60
  },
  QUICK: {
    platforms: ["Swiggy", "Zomato", "Zepto", "Instamart", "Blinkit"],
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

/* ================= HELPERS ================= */
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
  return randomFrom(["Accepted", "Picked", "Out"]);
}

/* ================= MAIN LOGIC ================= */
const userPlan = localStorage.getItem("plan") || "ALL";
const config = PLAN_CONFIG[userPlan];

const orders = [];

// generate random orders
for (let i = 0; i < random(5, 9); i++) {
  const profit = random(20, config.maxProfit);
  orders.push({
    platform: randomFrom(config.platforms),
    orderId: "#QD" + random(1000, 9999),
    status: orderStatus(),
    km: (Math.random() * 8 + 1).toFixed(1),
    profit: profit
  });
}

// sort by highest profit (MOST IMPORTANT)
orders.sort((a, b) => b.profit - a.profit);

/* ================= RENDER ================= */
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

/* ================= STATS ================= */
document.querySelectorAll(".stat strong")[0].innerText = random(80, 200); // total
document.querySelectorAll(".stat strong")[1].innerText = random(3, 9);    // active
document.querySelectorAll(".stat strong")[2].innerText = random(70, 180); // completed
document.querySelectorAll(".stat strong")[3].innerText = "₹" + random(3000, 12000);

/* ================= TRACKING ================= */
const steps = document.querySelectorAll(".step");
steps.forEach((s, i) => {
  if (i < random(1, 3)) s.classList.add("active");
});

/* ================= DEBUG (for viva) ================= */
console.log("Active Plan:", userPlan);
console.log("Generated Orders:", orders);