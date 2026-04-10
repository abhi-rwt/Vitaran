/************************************************
 * Vitaran - Dashboard (Final Clean Version)
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

    /* ✅ POPUP VERIFICATION (NO REDIRECT) */
    if(localStorage.getItem("isVerified") !== "true"){
        setTimeout(()=>{
            document.getElementById("verifyModal").style.display = "flex";
        },500);
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

    initDashboard(currentPlan);

} catch (err) {
    console.log("Dashboard error:", err);
}

});


/* ================= LOGOUT ================= */

function logout() {
localStorage.removeItem("token");
localStorage.removeItem("lastOrderType");
localStorage.removeItem("isVerified");
window.location.href = "login.html";
}


/* ================= PLAN CONFIG ================= */

const PLAN_CONFIG = {

"E-Commerce 1 Month": { platforms: ["Amazon","Flipkart","Meesho","Myntra"], maxProfit: 60 },
"E-Commerce 3 Months": { platforms: ["Amazon","Flipkart","Meesho","Myntra"], maxProfit: 70 },
"E-Commerce 12 Months": { platforms: ["Amazon","Flipkart","Meesho","Myntra"], maxProfit: 80 },

"Food 1 Month": { platforms: ["Swiggy","Zomato"], maxProfit: 80 },
"Food 3 Months": { platforms: ["Swiggy","Zomato"], maxProfit: 90 },
"Food 12 Months": { platforms: ["Swiggy","Zomato"], maxProfit: 100 },

"Grocery 1 Month": { platforms: ["Zepto","Instamart","Blinkit"], maxProfit: 80 },
"Grocery 3 Months": { platforms: ["Zepto","Instamart","Blinkit"], maxProfit: 90 },
"Grocery 12 Months": { platforms: ["Zepto","Instamart","Blinkit"], maxProfit: 100 },

"Food+Grocery 1 Month": { platforms: ["Swiggy","Zomato","Zepto","Instamart","Blinkit"], maxProfit: 90 },

"All-in-One 1 Month": {
    platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
    maxProfit:100
}

};


/* ================= DASHBOARD ================= */

function initDashboard(userPlan){

let config = PLAN_CONFIG[userPlan] || PLAN_CONFIG["All-in-One 1 Month"];

const random = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
const randomFrom = arr => arr[Math.floor(Math.random()*arr.length)];

function platformLogo(name){
const lower = name.toLowerCase();
if(lower === "myntra") return "/logos/myntra.jpeg";
return `/logos/${lower}.png`;
}

/* REALISTIC PROFIT */

const BASE_PAY = 25;
const PER_KM = 8;
const COMMISSION = 0.02;

const orders = [];

for(let i=0;i<random(5,9);i++){

const amount = random(150,1000);
const km = parseFloat((Math.random()*8+1).toFixed(1));

let profit = Math.round(BASE_PAY + (km * PER_KM) + (amount * COMMISSION));

if(profit > config.maxProfit){
profit = config.maxProfit;
}

orders.push({
platform: randomFrom(config.platforms),
orderId: "VT" + random(1000,9999),
payment: Math.random() > 0.5 ? "PAID" : "COD",
amount,
km,
profit
});

}

/* SORT */

orders.sort((a,b)=>b.profit-a.profit);

/* RENDER */

const tbody = document.querySelector(".table tbody");
tbody.innerHTML="";

const lastOrderType = localStorage.getItem("lastOrderType");

orders.forEach((o,index)=>{

const tr = document.createElement("tr");
if(index===0) tr.classList.add("priority");

const isHigh = o.profit >= 70;
const isDisabled = (lastOrderType === "HIGH" && isHigh);

tr.innerHTML = `
<td>
<img src="${platformLogo(o.platform)}" onerror="this.src='/logos/default.png'">
${o.platform}
</td>

<td>#${o.orderId}</td>

<td><span class="tag">${o.payment}</span></td>

<td>₹${o.amount}</td>

<td>${o.km} KM</td>

<td class="${isHigh ? 'green' : ''}">₹${o.profit}</td>

<td class="action-cell"></td>
`;

const btn = document.createElement("button");
btn.className = "btn accept";
btn.innerText = isDisabled ? "Locked" : "Accept";

if(isDisabled){
btn.disabled = true;
btn.style.opacity = "0.5";
}else{
btn.onclick = ()=>acceptOrder(o.orderId,o.payment,o.amount,o.profit);
}

tr.querySelector(".action-cell").appendChild(btn);
tbody.appendChild(tr);

});

/* STATS */

const stats = document.querySelectorAll(".stat strong");

if(stats.length >= 4){

const active = random(3,9);
const completed = random(70,120);

stats[0].innerText = active + completed;
stats[1].innerText = active;
stats[2].innerText = completed;
stats[3].innerText = "₹" + random(3000,12000);

}

}


/* ================= ACCEPT ================= */

function acceptOrder(id,payment,amount,profit){

const type = profit >= 70 ? "HIGH" : "NORMAL";
localStorage.setItem("lastOrderType", type);

/* ✅ FIXED TEMPLATE STRING */
window.location.href = `order.html?order=${id}&payment=${payment}&amount=${amount}&profit=${profit}`;

}


/* ================= POPUP ================= */

function openVerify(){
document.getElementById("verifyModal").style.display = "flex";
}

function verifyUser(){

localStorage.setItem("isVerified","true");

document.getElementById("verifyModal").style.display = "none";

alert("Profile Completed ✅");

}