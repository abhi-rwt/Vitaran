/************************************************
 * Order Page Logic
 ************************************************/

/* GET URL DATA */

const params = new URLSearchParams(window.location.search);

const orderId = params.get("order");
const payment = params.get("payment");
const amount = params.get("amount");
const profit = params.get("profit");

/* SET DATA */

document.getElementById("orderId").innerText = "Order #" + orderId;
document.getElementById("paymentType").innerText = payment;
document.getElementById("amount").innerText = amount;
document.getElementById("profit").innerText = profit;


/* ================= MAP ================= */

var map = new mappls.Map("map", {
center: [28.6139, 77.2090], // Delhi
zoom: 12
});

/* DRIVER MARKER */
new mappls.Marker({
map: map,
position: [28.6139,77.2090],
title: "Driver"
});

/* PICKUP MARKER */
new mappls.Marker({
map: map,
position: [28.6220,77.2100],
title: "Pickup"
});

/* DROP MARKER */
new mappls.Marker({
map: map,
position: [28.6300,77.2200],
title: "Drop"
});


/* ================= DELIVERY FLOW ================= */

function arrived(){

alert("Reached Pickup Location");

document.getElementById("pickedBtn").disabled = false;

}

function picked(){

alert("Order Picked");

document.getElementById("deliverBtn").disabled = false;

}

function delivered(){

if(payment === "COD"){

const cash = prompt("Enter cash received:");

if(!cash){
alert("Enter amount");
return;
}

alert("Cash ₹" + cash + " collected");

}

alert("Delivery Completed! ₹" + profit + " earned");

/* GO TO DASHBOARD */

window.location.href = "dashboard.html";

}