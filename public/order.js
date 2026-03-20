/************************************************
 * Vitaran - Order Page Logic (Final)
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


/* ================= MAP ================= */

let map;

function initMap(){

  map = new mappls.Map("map", {
    center: [28.6139, 77.2090], // Delhi
    zoom: 13
  });

  /* DRIVER */
  new mappls.Marker({
    map: map,
    position: [28.6139, 77.2090],
    title: "You"
  });

  /* PICKUP */
  new mappls.Marker({
    map: map,
    position: [28.6220, 77.2100],
    title: "Pickup"
  });

  /* DELIVERY */
  new mappls.Marker({
    map: map,
    position: [28.6300, 77.2200],
    title: "Delivery"
  });

}

/* LOAD MAP */
window.onload = initMap;


/* ================= DELIVERY FLOW ================= */

function arrived(){

  alert("📍 You reached pickup location");

  document.getElementById("pickedBtn").disabled = false;

}

function picked(){

  alert("📦 Order picked successfully");

  document.getElementById("deliverBtn").disabled = false;

}

function delivered(){

  /* COD CASE */
  if(payment === "COD"){

    const cash = prompt("Enter cash received:");

    if(!cash){
      alert("Please enter amount");
      return;
    }

    alert("💰 ₹" + cash + " collected");
  }

  /* FINAL */
  alert("✅ Delivery Completed!\nEarnings: ₹" + profit);

  /* BACK TO DASHBOARD */
  window.location.href = "dashboard.html";

}