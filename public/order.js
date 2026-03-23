/************************************************
 * Order Page Logic
 ************************************************/

/* ================= GET URL DATA ================= */

const params = new URLSearchParams(window.location.search);

const orderId = params.get("order");
const payment = params.get("payment");
const amount = params.get("amount");
const profit = params.get("profit");

/* ================= SET DATA ================= */

document.getElementById("orderId").innerText = "Order #" + orderId;
document.getElementById("paymentType").innerText = payment;
document.getElementById("amount").innerText = amount;
document.getElementById("profit").innerText = profit;


/* ================= MAP FIX ================= */

function waitForMappls(callback){
  if(typeof mappls !== "undefined"){
    callback();
  } else {
    setTimeout(() => waitForMappls(callback), 300);
  }
}

function initMap(){

  var map = new mappls.Map("map", {
    center: [28.6139, 77.2090],
    zoom: 13
  });

  new mappls.Marker({
    map: map,
    position: [28.6139,77.2090],
    title: "You"
  });

  new mappls.Marker({
    map: map,
    position: [28.6220,77.2100],
    title: "Pickup"
  });

  new mappls.Marker({
    map: map,
    position: [28.6300,77.2200],
    title: "Delivery"
  });

}

/* 🔥 WAIT UNTIL MAPPLS LOADS */
window.onload = () => {
  waitForMappls(initMap);
};


/* ================= DELIVERY FLOW ================= */

function arrived(){
  alert("📍 Reached Pickup");
  document.getElementById("pickedBtn").disabled = false;
}

function picked(){
  alert("📦 Order Picked");
  document.getElementById("deliverBtn").disabled = false;
}

function delivered(){

  if(payment === "COD"){
    const cash = prompt("Enter cash received:");
    if(!cash){
      alert("Enter amount");
      return;
    }
    alert("💰 ₹" + cash + " collected");
  }

  alert("✅ Delivery Completed!\nEarnings: ₹" + profit);

  window.location.href = "dashboard.html";
}