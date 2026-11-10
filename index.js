require("dotenv").config();

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mime = require("mime-types");
const express = require("express");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// ==================================================
// RESTAURANTS & THEIR EXACT GPS LOCATIONS (Railway Kodur)
// ==================================================
const restaurantsData = {
  food_palace: {
    name: "Food Place Restaurant",
    lat: 13.951505,
    lng: 79.356579,
  },
  brindavanam: {
    name: "Brindavan Restaurant",
    lat: 13.950000,
    lng: 79.355000,
  }
};

// ==================================================
// FOOD PALACE MENU
// ==================================================
const foodPalaceMenu = {
  categories: [
    {
      id: "fp_soups",
      title: "Soups",
      items: [
        { id: "fp_s1", name: "🥗 Veg Hot & Sour Soup", price: 170 },
        { id: "fp_s2", name: "🥗 Veg Manchow Soup", price: 170 },
        { id: "fp_s3", name: "🍗 Chicken Hot & Sour Soup", price: 190 },
        { id: "fp_s4", name: "🍗 Chicken Manchow Soup", price: 190 },
      ],
    },
    {
      id: "fp_nonveg_starters",
      title: "Non-Veg Starters",
      items: [
        { id: "fp_nvs1", name: "🍗 Chilli Chicken", price: 275 },
        { id: "fp_nvs2", name: "🍗 Chicken 65", price: 275 },
        { id: "fp_nvs3", name: "🍗 Chicken Lollipop (Sauce)", price: 295 },
        { id: "fp_nvs4", name: "🍗 Chicken Drumstick (Oil Roast)", price: 285 },
        { id: "fp_nvs5", name: "🦐 Chilli Prawns", price: 295 },
        { id: "fp_nvs6", name: "🦐 Loose Prawns", price: 295 },
        { id: "fp_nvs7", name: "🍗 Chicken Manchuria", price: 275 },
        { id: "fp_nvs8", name: "🍗 Schezwan Chicken", price: 285 },
        { id: "fp_nvs9", name: "🍗 Chicken Majestic", price: 295 },
        { id: "fp_nvs10", name: "🍗 Chicken 555", price: 295 },
        { id: "fp_nvs11", name: "🍗 Dragon Chicken", price: 295 },
        { id: "fp_nvs12", name: "🍗 Sizzler Chicken", price: 315 },
        { id: "fp_nvs13", name: "🍗 Pepper Chicken (Oil Roast)", price: 305 },
        { id: "fp_nvs14", name: "🐟 Apollo Fish", price: 285 },
        { id: "fp_nvs15", name: "🐟 Chilli Fish", price: 285 },
      ],
    },
    {
      id: "fp_biryani",
      title: "Biryanis",
      items: [
        { id: "fp_b1", name: "🍗 Chicken Dum Biryani", price: 250 },
        { id: "fp_b2", name: "🍗 Spl. Chicken Biryani (Boneless)", price: 300 },
        { id: "fp_b3", name: "🦐 Prawns Biryani", price: 330 },
        { id: "fp_b4", name: "🥩 Mutton Dum Biryani", price: 400 },
      ],
    }
  ],
};

// ==================================================
// BRINDAVAN MENU (PDF నుండి తీసుకున్నది - ప్రతి ఐటమ్ పై ₹40 పెంచబడింది)
// ==================================================
const brindavanMenu = {
  categories: [
    {
      id: "br_nvs",
      title: "Non-Veg Starters",
      items: [
        { id: "br_nvs1", name: "🍗 Kaju Fry", price: 220 },
        { id: "br_nvs2", name: "🍗 Kaju Roast", price: 210 },
        { id: "br_nvs3", name: "🍗 Chilli Chicken", price: 240 },
        { id: "br_nvs4", name: "🍗 Chicken 65", price: 240 },
        { id: "br_nvs5", name: "🍗 Chicken Majestic", price: 250 },
        { id: "br_nvs6", name: "🍗 Chicken Spring Roll", price: 260 },
        { id: "br_nvs7", name: "🍗 Chicken 555", price: 250 },
        { id: "br_nvs8", name: "🍗 Dragon Chicken", price: 260 },
        { id: "br_nvs9", name: "🍗 Chicken Lollipop", price: 250 },
        { id: "br_nvs10", name: "🍗 Chicken Manchurian", price: 240 },
        { id: "br_nvs11", name: "🍗 Thread Chicken", price: 260 },
        { id: "br_nvs12", name: "🍗 Pepper Chicken", price: 240 },
        { id: "br_nvs13", name: "🍗 Drumstick Chicken", price: 250 },
        { id: "br_nvs14", name: "🍗 Crispy Fried Chicken", price: 260 },
        { id: "br_nvs15", name: "🍗 Chicken Sizzler", price: 280 },
        { id: "br_nvs16", name: "🍗 Ginger Chicken", price: 240 },
        { id: "br_nvs17", name: "🍗 Chicken Bbq", price: 240 },
        { id: "br_nvs18", name: "🍗 Lemon Chicken", price: 240 },
        { id: "br_nvs19", name: "🍗 Tawa Chicken", price: 250 },
        { id: "br_nvs20", name: "🍗 Schezwan Chicken", price: 240 },
        { id: "br_nvs21", name: "🦐 Prawns Fry", price: 320 },
        { id: "br_nvs22", name: "🐟 Chilli Fish", price: 260 },
        { id: "br_nvs23", name: "🐟 Appollo Fish", price: 260 },
      ],
    },
    {
      id: "br_tandoor",
      title: "Tandoori & Kabab's",
      items: [
        { id: "br_t1", name: "🍗 Tandoori Chicken Half", price: 280 },
        { id: "br_t2", name: "🍗 Tandoori Chicken Full", price: 480 },
        { id: "br_t3", name: "🍗 Tangadi Kabab Full", price: 290 },
        { id: "br_t4", name: "🍗 Tangadi Kabab Half", price: 180 },
        { id: "br_t5", name: "🍗 Reshmi Kabab", price: 290 },
        { id: "br_t6", name: "🍗 Malai Kabab", price: 300 },
        { id: "br_t7", name: "🍗 Chicken Tikka", price: 280 },
        { id: "br_t8", name: "🍗 Haryali Kabab", price: 280 },
        { id: "br_t9", name: "🧀 Panner Tikka", price: 260 },
      ],
    },
    {
      id: "br_biriyani",
      title: "Biriyani's",
      items: [
        { id: "br_b1", name: "🍗 Chicken Dum Biriyani", price: 220 },
        { id: "br_b2", name: "🍗 Chicken Fry Piece Biriyani", price: 260 },
        { id: "br_b3", name: "🍗 Spl Chicken Biriyani", price: 270 },
        { id: "br_b4", name: "🦐 Prawns Biriyani", price: 300 },
        { id: "br_b5", name: "🥩 Mutton Fry Piece Biriyani", price: 370 },
        { id: "br_b6", name: "🥚 Egg Biriyani", price: 180 },
        { id: "br_b7", name: "🍗 Chicken Biriyani Family Pack", price: 610 },
        { id: "br_b8", name: "🍗 Spl Chicken Biriyani Family Pack", price: 760 },
        { id: "br_b9", name: "🧀 Panner Biriyani - Veg", price: 230 },
      ],
    },
    {
      id: "br_curries",
      title: "Non-Veg Curries",
      items: [
        { id: "br_c1", name: "🍗 Butter Chicken", price: 250 },
        { id: "br_c2", name: "🍗 Kaju Chicken Curry", price: 260 },
        { id: "br_c3", name: "🍗 Kadai Chicken", price: 250 },
        { id: "br_c4", name: "🥩 Mutton Curry", price: 390 },
        { id: "br_c5", name: "🥩 Mutton Fry", price: 390 },
        { id: "br_c6", name: "🦐 Prawns Curry", price: 290 },
      ],
    },
    {
      id: "br_veg",
      title: "Veg Starters & Curries",
      items: [
        { id: "br_v1", name: "🥦 Gobi Manchurian", price: 190 },
        { id: "br_v2", name: "🧀 Paneer Butter Masala", price: 250 },
        { id: "br_v3", name: "🥜 Kaju Curry", price: 280 },
        { id: "br_v4", name: "🍄 Mushroom Masala", price: 230 },
      ],
    }
  ],
};

const restaurantMenus = {
  food_palace: foodPalaceMenu,
  brindavanam: brindavanMenu,
};

const app = express();
app.use(express.json({ limit: "10mb" }));

const {
  PORT = 3000,
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  SUPABASE_URL,
  SUPABASE_KEY,
  AVENTO_UPI_ID = "9550665977-5@ybl",
  AVENTO_UPI_NAME = "VALLEPU MAHESH (Avento Services)",
  AVENTO_ADMIN_PHONE = "919550665977",
  AVENTO_CALL_PHONE = "9059135163",
  RESEND_API_KEY,
  ADMIN_EMAIL = "smahesh0404@gmail.com",
} = process.env;

const GRAPH_VERSION = "v23.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

if (!VERIFY_TOKEN || !WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function sendOrderEmail(subject, htmlContent) {
  if (!resend || !ADMIN_EMAIL) return;
  try {
    await resend.emails.send({
      from: "Avento Bot <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

// ==================================================
// DISTANCE & DELIVERY FEE RULES (2km min ₹50, above ₹15/km)
// ==================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateDeliveryFee(distanceInKm) {
  if (distanceInKm <= 2) {
    return 50; 
  }
  const extraKm = distanceInKm - 2;
  return Math.round(50 + extraKm * 15);
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function getTemp(user) {
  const value = user?.temp_selection;
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseOrderDetails(details) {
  if (!details) return {};
  if (typeof details === "object" && !Array.isArray(details)) return details;
  try { return JSON.parse(details); } catch { return {}; }
}

function serviceImage(filename) {
  return path.join(__dirname, "assets", filename);
}

async function sendWhatsApp(payload) {
  try {
    const response = await axios.post(`${GRAPH_URL}/${PHONE_NUMBER_ID}/messages`, { messaging_product: "whatsapp", ...payload }, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      timeout: 20000,
    });
    return response.data;
  } catch (error) {
    console.error("WhatsApp API error:", error.response?.data || error.message);
    throw error;
  }
}

async function sendText(to, body) {
  return sendWhatsApp({ to, type: "text", text: { body } });
}

async function uploadWhatsAppImage(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Image file not found: ${filePath}`);
  const contentType = mime.lookup(filePath);
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(filePath), { contentType, filename: path.basename(filePath) });
  const response = await axios.post(`${GRAPH_URL}/${PHONE_NUMBER_ID}/media`, form, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, ...form.getHeaders() },
    timeout: 30000,
  });
  return response.data.id;
}

async function sendLocalImage(phone, filePath, caption = "") {
  try {
    if (!fs.existsSync(filePath)) {
      if (caption) await sendText(phone, caption);
      return false;
    }
    const mediaId = await uploadWhatsAppImage(filePath);
    await sendWhatsApp({ to: phone, type: "image", image: { id: mediaId, ...(caption ? { caption } : {}) } });
    return true;
  } catch (error) {
    if (caption) await sendText(phone, caption);
    return false;
  }
}

async function getOrCreateUser(phone) {
  const { data, error } = await supabase.from("users").select("*").eq("phone_number", phone).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase.from("users").insert({ phone_number: phone, current_state: "IDLE", cart: [], temp_selection: {} }).select("*").single();
  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retried } = await supabase.from("users").select("*").eq("phone_number", phone).single();
      return retried;
    }
    throw insertError;
  }
  return created;
}

async function updateUser(phone, updates) {
  await supabase.from("users").update(updates).eq("phone_number", phone);
}

async function setState(phone, state, extra = {}) {
  await updateUser(phone, { current_state: state, ...extra });
}

async function saveOrder(phone, serviceType, details, status = "REQUESTED") {
  const { data, error } = await supabase.from("orders").insert({ user_phone: phone, service_type: serviceType, details: JSON.stringify(details), status }).select("*").single();
  if (error) throw error;
  return data;
}

async function getOrderById(orderId) {
  const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  return data;
}

async function updateOrder(orderId, updates) {
  const { data } = await supabase.from("orders").update(updates).eq("id", orderId).select("*").maybeSingle();
  return data;
}

async function getLatestCustomerOrder(phone) {
  const cleanPhone = normalizePhone(phone);
  const { data } = await supabase.from("orders").select("*").eq("user_phone", cleanPhone).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

// ==================================================
// WEBHOOK & EXPRESS ROUTES
// ==================================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "avento-whatsapp-bot" });
});

app.get(["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"], (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post(["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"], async (req, res) => {
  res.sendStatus(200);

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return;

    const phone = message.from;
    const type = message.type;
    const text = type === "text" ? message.text?.body?.trim() || "" : "";
    const command = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || text;
    const normalized = normalize(command);

    const user = await getOrCreateUser(phone);
    const temp = getTemp(user);

    // 1. వెబ్‌సైట్ నుండి ఆర్డర్ రాగానే
    if (text.includes("New Food Order") || text.includes("Food Place") || text.includes("Brindavan")) {
      let selectedRestKey = "food_palace";
      if (text.toLowerCase().includes("brindavan")) {
        selectedRestKey = "brindavanam";
      }

      await setState(phone, "AWAITING_LOCATION", {
        temp_selection: { purpose: "CHECKOUT", web_order_summary: text, service: "food", restaurant_key: selectedRestKey }
      });
      
      await sendText(
        phone,
        "📍 *మీ వెబ్‌సైట్ ఆర్డర్ స్వీకరించబడింది!*\n\n" +
        "డెలివరీ ఛార్జీలు మరియు టోటల్ అమౌంట్ లెక్కించడానికి దయచేసి వాట్సాప్‌లో మీ *Share Location* ఆప్షన్ ద్వారా లొకేషన్ పంపండి. 🙏"
      );
      return;
    }

    // 2. లొకేషన్ రాకుండా టెక్స్ట్ పంపిస్తే
    if (user.current_state === "AWAITING_LOCATION" && type === "text") {
      await sendText(
        phone,
        "📍 *దయచేసి మీ లొకేషన్ షేర్ చేయండి!*\n\n" +
        "కింద వాట్సాప్ అటాచ్‌మెంట్ (📎 లేదా ➕) ఐకాన్ నొక్కి, అందులో **'Location'** సెలెక్ట్ చేసి మీ లైవ్/కరెంట్ లొకేషన్‌ను పంపితేనే ఆర్డర్ కన్ఫర్మ్ అవుతుంది. 🙏"
      );
      return;
    }

    // 3. లొకేషన్ అందిన తర్వాత
    if (type === "location" && message.location) {
      if (user.current_state !== "AWAITING_LOCATION") {
        await sendText(phone, "Please send your location when asked during checkout.");
        return;
      }
      const location = { latitude: message.location.latitude, longitude: message.location.longitude };
      await updateUser(phone, { location, current_state: "REVIEW_ORDER" });
      
      const restKey = temp.restaurant_key || "food_palace";
      const restInfo = restaurantsData[restKey] || restaurantsData.food_palace;

      const distance = calculateDistance(restInfo.lat, restInfo.lng, location.latitude, location.longitude);
      const deliveryFee = calculateDeliveryFee(distance);
      
      let foodTotal = 0;
      const summaryText = temp.web_order_summary || "";
      const match = summaryText.match(/Food Total:\s*₹?(\d+(\.\d+)?)/i);
      if (match) {
        foodTotal = parseFloat(match[1]);
      } else {
        foodTotal = 0;
      }

      const totalAmount = foodTotal + deliveryFee;

      const details = {
        service: "food",
        items_summary: temp.web_order_summary || "Web Order Items",
        food_total: foodTotal,
        delivery_fee: deliveryFee,
        total: totalAmount,
        distance_km: Number(distance.toFixed(2)),
        location: location,
        payment: { method: "UPI_MANUAL", status: "PENDING", utr_transaction_id: null },
        created_at: new Date().toISOString(),
      };

      const order = await saveOrder(phone, "food", details, "PENDING_PAYMENT");
      await setState(phone, "AWAITING_UTR", { temp_selection: { ...temp, pending_order_id: order.id, total: totalAmount } });

      const qrPath = serviceImage("payment-qr.png");
      const caption = 
        `✅ *ORDER CONFIRMED!* (#${order.id})\n\n` +
        `${temp.web_order_summary || ""}\n` +
        `📏 Distance: ${distance.toFixed(1)} KM\n` +
        `🚚 Delivery Charges: ₹${deliveryFee} (${distance <= 2 ? 'Flat ₹50 for upto 2km' : `₹50 + ₹15/km for extra distance`})\n` +
        `💰 *Total Payable: ₹${totalAmount}*\n\n` +
        `📱 UPI ID: *${AVENTO_UPI_ID}*\n` +
        `👤 Name: *${AVENTO_UPI_NAME}*\n\n` +
        `⚡ Scan QR or pay to UPI ID, then send your *12-digit UTR number or payment screenshot* here.`;
      
      const sent = await sendLocalImage(phone, qrPath, caption);
      if (!sent) await sendText(phone, caption);

      const cleanPhone = normalizePhone(phone);
      const chatLink = `https://wa.me/${cleanPhone}`;
      const mapLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

      if (AVENTO_ADMIN_PHONE) {
        await sendWhatsApp({
          to: AVENTO_ADMIN_PHONE,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text:
                `🔔 *New Order Confirmed! (#${order.id})*\n\n` +
                `👤 Customer WhatsApp: ${phone}\n` +
                `💬 Chat: ${chatLink}\n` +
                `📏 Distance: ${distance.toFixed(1)} km | Delivery: ₹${deliveryFee}\n` +
                `💰 Total: ₹${totalAmount}\n` +
                `📍 Map: ${mapLink}\n\n` +
                `⏳ కస్టమర్ పేమెంట్ స్క్రీన్ షాట్ / UTR పంపడానికి వేచి ఉంది.`,
            },
            action: {
              buttons: [
                { type: "reply", reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm / Paid" } },
                { type: "reply", reply: { id: `adm_ask_ss_${order.id}`, title: "📸 Ask Screenshot" } },
                { type: "reply", reply: { id: `adm_rej_${order.id}`, title: "❌ Reject" } },
              ],
            },
          },
        });
      }

      await sendOrderEmail(
        `🚀 New Confirmed Food Order! (#${order.id})`,
        `<h2>🍽️ New Food Order Confirmed (Railway Kodur)</h2>
         <p><b>Order ID:</b> #${order.id}</p>
         <p><b>Customer WhatsApp:</b> <a href="${chatLink}" target="_blank">${phone}</a></p>
         <p><b>Distance:</b> ${distance.toFixed(1)} km</p>
         <p><b>Delivery Fee:</b> ₹${deliveryFee}</p>
         <p><b>Total Payable:</b> ₹${totalAmount}</p>
         <p><b>Location:</b> <a href="${mapLink}" target="_blank">View on Google Maps</a></p>`
      );

      return;
    }

    // 4. UTR / Payment Screenshot Handling
    if (user.current_state === "AWAITING_UTR") {
      let orderId = temp.pending_order_id;
      if (!orderId) {
        const latest = await getLatestCustomerOrder(phone);
        if (latest) orderId = latest.id;
      }
      if (!orderId) return;

      const order = await getOrderById(orderId);
      let utrNumber = text;
      let imageMediaId = message.image?.id || null;
      if (type === "image" && imageMediaId) utrNumber = `IMAGE_SCREENSHOT_${imageMediaId}`;

      const details = parseOrderDetails(order.details);
      details.payment = { ...(details.payment || {}), status: "PAYMENT_REVIEW", utr_transaction_id: utrNumber };
      await updateOrder(orderId, { details: JSON.stringify(details), status: "PAYMENT_REVIEW" });
      await setState(phone, "IDLE", { cart: [], temp_selection: {} });

      await sendText(phone, `✅ మీ UTR / స్క్రీన్ షాట్ అందినది.\n🧾 Order #${order.id}\nమా టీమ్ పరిశీలించి త్వరలో ఆర్డర్ కన్ఫర్మ్ చేస్తుంది. 🙏`);

      if (AVENTO_ADMIN_PHONE) {
        if (type === "image" && imageMediaId) {
          await sendWhatsApp({
            to: AVENTO_ADMIN_PHONE,
            type: "image",
            image: { id: imageMediaId, caption: `📸 Payment Screenshot received from Customer (${phone}) for Order #${order.id}` }
          });
        } else {
          await sendText(AVENTO_ADMIN_PHONE, `📸 Payment UTR received from Customer (${phone}) for Order #${order.id}:\n*${text}*`);
        }
      }

      return;
    }

    // 5. Welcome Message
    if (["hi", "hello", "menu", "start"].includes(normalized)) {
      const welcomeText = 
        "🙏 *Namaste! Welcome to Avento Services.*\n\n" +
        "ప్లీజ్ కింద ఉన్న లింక్ క్లిక్ చేసి మన వెబ్‌సైట్ ద్వారా ఫుడ్ ఆర్డర్ చేయండి:\n" +
        "🔗 *https://www.aventonow.live*\n\n" +
        "ఆర్డర్ కన్ఫర్మ్ చేయగానే వాట్సాప్‌కి వస్తుంది! 🙏";
      await sendText(phone, welcomeText);
      return;
    }

  } catch (error) {
    console.error("Webhook error:", error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Avento WhatsApp Bot running on port ${PORT}`);
});