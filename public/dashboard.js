/************************************************

* Vitaran - Dashboard (Delivery System Ready)
  ************************************************/

let currentPlan = null;

// track last order type (HIGH / NORMAL)
let lastOrderType = localStorage.getItem("lastOrderType") || "NORMAL";

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

/* PAYMENT */

function paymentType(){
return Math.random() > 0.5 ? "PAID" : "COD";
}

/* GENERATE ORDERS */

const orders = [];

for(let i=0;i<random(5,9);i++){

const payment = paymentType();
const amount = random(150,1000);
const km = (Math.random()*8+1).toFixed(1);

orders.push({

platform: randomFrom(config.platforms),
orderId: "VT" + random(1000,9999),
payment: payment,
amount: amount,
km: km,
profit: random(20,config.maxProfit)

});

}

/* SORT */

orders.sort((a,b)=>b.profit-a.profit);

/* TABLE */

const tbody = document.querySelector(".table tbody");
tbody.innerHTML="";

orders.forEach((o,index)=>{

const tr = document.createElement("tr");

if(index===0) tr.classList.add("priority");

/* HIGH LOGIC */
let isHigh = o.profit >= 60;
let disableHigh = (lastOrderType === "HIGH" && isHigh);

/* BUTTON */
let btnHTML = disableHigh
? "<button class="btn disabled">Locked</button>"
: "<button class="btn accept" onclick="acceptOrder('${o.orderId}','${o.payment}',${o.amount},${o.profit},${isHigh})">Accept</button>";

tr.innerHTML=`

<td>
<img src="${platformLogo(o.platform)}">
${o.platform}
</td><td>#${o.orderId}</td><td>
<span class="tag">${o.payment}</span>
</td><td>₹${o.amount}</td><td>${o.km}</td><td class="${o.profit>=70?'green':''}">
₹${o.profit}
</td><td>
${btnHTML}
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

/* ================= ACCEPT ================= */

function acceptOrder(id,payment,amount,profit,isHigh){

console.log("Order accepted:",id);

/* SAVE TYPE */
if(isHigh){
localStorage.setItem("lastOrderType","HIGH");
}else{
localStorage.setItem("lastOrderType","NORMAL");
}

window.location.href = "order.html?order=${id}&payment=${payment}&amount=${amount}&profit=${profit}";

}