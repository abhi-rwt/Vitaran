/************************************************

* Vitaran - Dashboard (Delivery System Ready)
  ************************************************/

let currentPlan = null;

document.addEventListener("DOMContentLoaded", async () => {

const token = localStorage.getItem("token");

if(!token){
window.location.href="login.html";
return;
}

try{

const res = await fetch("/api/auth/me",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body: JSON.stringify({ token })
});

const data = await res.json();

if(!data.success){
window.location.href="login.html";
return;
}

if(!data.user.plan){
window.location.href="subscription.html";
return;
}

currentPlan = data.user.plan;

/* PLAN BADGE */

const badge = document.querySelector(".badge");
if(badge){
badge.innerText = currentPlan + " Active";
}

/* INIT DASHBOARD */

initDashboard(currentPlan);

}catch(err){
console.log("Dashboard error:", err);
}

});

/* LOGOUT */

function logout(){
localStorage.removeItem("token");
window.location.href="login.html";
}

/* ================= PLAN CONFIG ================= */

const PLAN_CONFIG = {

"E-Commerce 1 Month":{platforms:["Amazon","Flipkart","Meesho","Myntra"],maxProfit:60},
"E-Commerce 3 Months":{platforms:["Amazon","Flipkart","Meesho","Myntra"],maxProfit:70},
"E-Commerce 12 Months":{platforms:["Amazon","Flipkart","Meesho","Myntra"],maxProfit:80},

"Food 1 Month":{platforms:["Swiggy","Zomato"],maxProfit:80},
"Food 3 Months":{platforms:["Swiggy","Zomato"],maxProfit:90},
"Food 12 Months":{platforms:["Swiggy","Zomato"],maxProfit:100},

"Grocery 1 Month":{platforms:["Zepto","Instamart","Blinkit"],maxProfit:80},
"Grocery 3 Months":{platforms:["Zepto","Instamart","Blinkit"],maxProfit:90},
"Grocery 12 Months":{platforms:["Zepto","Instamart","Blinkit"],maxProfit:100},

"Food+Grocery 1 Month":{platforms:["Swiggy","Zomato","Zepto","Instamart","Blinkit"],maxProfit:90},
"Food+Grocery 3 Months":{platforms:["Swiggy","Zomato","Zepto","Instamart","Blinkit"],maxProfit:100},
"Food+Grocery 12 Months":{platforms:["Swiggy","Zomato","Zepto","Instamart","Blinkit"],maxProfit:110},

"All-in-One 1 Month":{
platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
maxProfit:100
},

"All-in-One 3 Months":{
platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
maxProfit:110
},

"All-in-One 12 Months":{
platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
maxProfit:120
}

};

/* ================= DASHBOARD ================= */

function initDashboard(userPlan){

let config = PLAN_CONFIG[userPlan];

if(!config){
config = PLAN_CONFIG["E-Commerce 1 Month"];
}

function random(min,max){
return Math.floor(Math.random()*(max-min+1))+min;
}

function randomFrom(arr){
return arr[Math.floor(Math.random()*arr.length)];
}

/* LOGO */

function platformLogo(name){
const lower = name.toLowerCase();
if(lower === "myntra") return "/logos/myntra.jpeg";
return "/logos/${lower}.png";
}

/* PAYMENT TYPE */

function paymentType(){
return Math.random() > 0.5 ? "PAID" : "COD";
}

/* GENERATE ORDERS */

const orders = [];

for(let i=0;i<random(5,9);i++){

const payment = paymentType();
const amount = random(150,1000);
const km = (Math.random()*8+1).toFixed(1);

const FUEL_COST = 8;

const profit = Math.floor(amount - (km * FUEL_COST));

const createdAt = Date.now() - random(1,15)*60000;

orders.push({

platform: randomFrom(config.platforms),
orderId: "VT" + random(1000,9999),
payment: payment,
amount: amount,
km: km,
profit: profit,
createdAt: createdAt

});

}

/* PRIORITY SYSTEM */

orders.forEach(o => {

o.waitingTime = Math.floor((Date.now() - o.createdAt)/60000);

o.priorityScore = (o.profit * 0.6) + (o.waitingTime * 2);

});

/* SORT */

orders.sort((a,b)=>b.priorityScore - a.priorityScore);

/* TABLE RENDER */

const tbody = document.querySelector(".table tbody");

tbody.innerHTML="";

orders.forEach((o,index)=>{

const tr = document.createElement("tr");

if(index===0) tr.classList.add("priority");

tr.innerHTML=`

<td>
<img src="${platformLogo(o.platform)}">
${o.platform}
</td><td>#${o.orderId}</td><td>
<span class="tag">${o.payment}</span>
${o.waitingTime>10 ? '<span class="tag urgent">URGENT</span>' : ''}
</td><td>₹${o.amount}</td><td>${o.km} km</td><td class="${o.waitingTime>10 ? 'urgent' : (o.profit>=70?'green':'')}">
₹${o.profit}
<br>
<small>${o.waitingTime} min</small>
</td><td>
<button class="btn accept" onclick="acceptOrder('${o.orderId}','${o.payment}',${o.amount},${o.profit})">
Accept
</button>
</td>
`;tbody.appendChild(tr);

});

/* STATS */

const stats=document.querySelectorAll(".stat strong");

if(stats.length>=4){

const active=random(3,9);
const completed=random(70,120);
const total=active+completed;

stats[0].innerText=total;
stats[1].innerText=active;
stats[2].innerText=completed;
stats[3].innerText="₹"+random(3000,12000);

}

}

/* ================= ACCEPT ORDER ================= */

function acceptOrder(id,payment,amount,profit){

console.log("Order accepted:",id);

window.location.href = "order.html?order=${id}&payment=${payment}&amount=${amount}&profit=${profit}";

}