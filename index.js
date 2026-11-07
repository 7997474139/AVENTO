require("dotenv").config();

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mime = require("mime-types");
const express = require("express");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const brindavanMenu = require("./services/brindavanMenu");

// ==================================================
// FOOD PLACE RESTAURANT MENU (+₹20 added to every item price)
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
        { id: "fp_nvs16", name: "🍗 Arabian Chicken Drumstick", price: 325 },
        { id: "fp_nvs17", name: "🍗 Korean Wings (Spicy)", price: 295 },
        { id: "fp_nvs18", name: "🍗 Lemon Chicken", price: 275 },
        { id: "fp_nvs19", name: "🍗 Butter Garlic Chicken", price: 305 },
        { id: "fp_nvs20", name: "🍗 Guntur Chicken", price: 295 },
        { id: "fp_nvs21", name: "🐟 Crispy Fish", price: 285 },
      ],
    },
    {
      id: "fp_veg_starters",
      title: "Veg Starters",
      items: [
        { id: "fp_vs1", name: "🥦 Gobi Manchurian", price: 209 },
        { id: "fp_vs2", name: "🥦 Chilli Gobi", price: 219 },
        { id: "fp_vs3", name: "🥦 Gobi 65", price: 209 },
        { id: "fp_vs4", name: "🧀 Paneer Manchurian", price: 249 },
        { id: "fp_vs5", name: "🧀 Paneer Majestic", price: 259 },
        { id: "fp_vs6", name: "🥦 RR Gobi", price: 219 },
        { id: "fp_vs7", name: "🌽 Crispy Babycorn", price: 259 },
        { id: "fp_vs8", name: "🌽 Babycorn Chilli", price: 249 },
        { id: "fp_vs9", name: "🌽 Babycorn 65", price: 249 },
        { id: "fp_vs10", name: "🌽 Babycorn Manchuria", price: 249 },
        { id: "fp_vs11", name: "🧀 Chilli Paneer", price: 249 },
        { id: "fp_vs12", name: "🧀 Paneer 65", price: 249 },
        { id: "fp_vs13", name: "🥜 Kaju Fry (Oil Roast)", price: 299 },
        { id: "fp_vs14", name: "🌽 American Sweetcorn (Crispy)", price: 229 },
        { id: "fp_vs15", name: "🍄 Mushroom 65", price: 259 },
        { id: "fp_vs16", name: "🍄 Chilli Mushroom", price: 259 },
        { id: "fp_vs17", name: "🍄 Mushroom Manchuria", price: 259 },
        { id: "fp_vs18", name: "🍄 Pepper Mushroom", price: 259 },
        { id: "fp_vs19", name: "🍄 Mushroom Black Pepper", price: 249 },
        { id: "fp_vs20", name: "🧀 Dragon Paneer", price: 289 },
      ],
    },
    {
      id: "fp_veg_curries",
      title: "Veg Curries",
      items: [
        { id: "fp_vc1", name: "🥗 Veg Kheema Curry", price: 250 },
        { id: "fp_vc2", name: "🥗 Mixed Veg Curry", price: 240 },
        { id: "fp_vc3", name: "🥗 Kadai Veg Curry", price: 240 },
        { id: "fp_vc4", name: "🥗 Veg Kollapuri Curry", price: 240 },
        { id: "fp_vc5", name: "🍄 Mushroom Masala", price: 250 },
        { id: "fp_vc6", name: "🧀 Paneer Butter Masala", price: 330 },
        { id: "fp_vc7", name: "🧀 Kadai Paneer Curry", price: 260 },
        { id: "fp_vc8", name: "🥜 Kaju Curry", price: 290 },
        { id: "fp_vc9", name: "🥜 Kaju Paneer Curry", price: 290 },
        { id: "fp_vc10", name: "🍅 Tomato Curry", price: 210 },
        { id: "fp_vc11", name: "🌿 Methi Chaman", price: 330 },
        { id: "fp_vc12", name: "🧀 Paneer Chatpata Curry", price: 330 },
        { id: "fp_vc13", name: "🥬 Palak Paneer", price: 260 },
        { id: "fp_vc14", name: "🥬 Plain Palak", price: 220 },
        { id: "fp_vc15", name: "🥗 Veg Chatpata Curry", price: 240 },
        { id: "fp_vc16", name: "🧀 Paneer Labadar Curry", price: 270 },
        { id: "fp_vc17", name: "🍄 Kadai Mushroom", price: 250 },
      ],
    },
    {
      id: "fp_curries",
      title: "Non-Veg Curries",
      items: [
        { id: "fp_c1", name: "🥩 Mutton Roghan Josh", price: 400 },
        { id: "fp_c2", name: "🥩 Mutton Curry", price: 400 },
        { id: "fp_c3", name: "🥩 Kadai Mutton", price: 400 },
        { id: "fp_c4", name: "🦐 Prawns Curry", price: 290 },
        { id: "fp_c5", name: "🥚 Egg Masala", price: 200 },
        { id: "fp_c6", name: "🍗 Miryali Chicken Curry (Bone)", price: 330 },
        { id: "fp_c7", name: "🍗 Spl. Chicken Curry (Chef Special)", price: 300 },
        { id: "fp_c8", name: "🍗 Kaju Chicken Curry (Boneless)", price: 300 },
        { id: "fp_c9", name: "🍗 Methi Chicken Curry", price: 280 },
        { id: "fp_c10", name: "🍗 Chicken Dhopyaza", price: 280 },
        { id: "fp_c11", name: "🍗 Chicken Tikka Masala", price: 280 },
        { id: "fp_c12", name: "🍗 Tawde Masala (Leg Piece)", price: 300 },
        { id: "fp_c13", name: "🍗 Butter Chicken", price: 270 },
        { id: "fp_c14", name: "🍗 Chicken Curry (Bone)", price: 250 },
        { id: "fp_c15", name: "🍗 Chicken Curry (Boneless)", price: 270 },
        { id: "fp_c16", name: "🍗 Chicken Chhatpata Curry", price: 270 },
        { id: "fp_c17", name: "🍗 Kadai Chicken Curry", price: 250 },
        { id: "fp_c18", name: "🍗 Kollapuri Chicken Curry", price: 250 },
        { id: "fp_c19", name: "🍗 Hyderabadi Chicken Curry", price: 260 },
        { id: "fp_c20", name: "🍗 Chicken Kheema Curry", price: 270 },
        { id: "fp_c21", name: "🍗 Afghani Chicken Curry", price: 290 },
        { id: "fp_c22", name: "🍗 Moghlai Chicken Curry", price: 270 },
        { id: "fp_c23", name: "🍗 Punjabi Chicken Curry", price: 270 },
      ],
    },
    {
      id: "fp_tandoor",
      title: "Tandoor Items",
      items: [
        { id: "fp_t1", name: "🫓 Tandoori Roti", price: 75 },
        { id: "fp_t2", name: "🫓 Butter Roti", price: 80 },
        { id: "fp_t3", name: "🫓 Butter Naan", price: 80 },
        { id: "fp_t4", name: "🫓 Plain Naan", price: 75 },
        { id: "fp_t5", name: "🫓 Garlic Naan", price: 100 },
        { id: "fp_t6", name: "🫓 Plain Kulcha", price: 80 },
        { id: "fp_t7", name: "🫓 Butter Kulcha", price: 85 },
        { id: "fp_t8", name: "🫓 Methi Roti", price: 85 },
        { id: "fp_t9", name: "🫓 Kothimeera Roti", price: 80 },
        { id: "fp_t10", name: "🫓 Pulka", price: 70 },
        { id: "fp_t11", name: "🍗 Tandoori Chicken (Full)", price: 489 },
        { id: "fp_t12", name: "🍗 Tandoori Chicken (Half)", price: 289 },
        { id: "fp_t13", name: "🍗 Chicken Tikka", price: 289 },
        { id: "fp_t14", name: "🍗 Haryali Tikka", price: 299 },
        { id: "fp_t15", name: "🍗 Tangdi Kabab Full (Leg Piece)", price: 299 },
        { id: "fp_t16", name: "🍗 Malai Tikka", price: 299 },
        { id: "fp_t17", name: "🍗 Tangdi Kabab Half (Leg Piece)", price: 189 },
      ],
    },
    {
      id: "fp_biryani",
      title: "Biryanis",
      items: [
        { id: "fp_b1", name: "🍗 Chicken Dum Biryani", price: 250 },
        { id: "fp_b2", name: "🍗 Spl. Chicken Biryani (Boneless)", price: 300 },
        { id: "fp_b3", name: "🦐 Prawns Biryani", price: 330 },
        { id: "fp_b4", name: "🐟 Fish Biryani (Boneless)", price: 290 },
        { id: "fp_b5", name: "🍗 Chicken Fry Piece Biryani (Bone)", price: 290 },
        { id: "fp_b6", name: "🍗 Chicken Lollipop Biryani", price: 300 },
        { id: "fp_b7", name: "🥩 Mutton Fry Piece Biryani (Bone)", price: 400 },
        { id: "fp_b8", name: "🥩 Mutton Dum Biryani", price: 400 },
        { id: "fp_b9", name: "🍗 Hongkong Biryani (Boneless)", price: 310 },
        { id: "fp_b10", name: "🍗 Rambo Biryani (Leg Piece)", price: 320 },
        { id: "fp_b11", name: "🥚 Egg Biryani", price: 200 },
        { id: "fp_b12", name: "🍗 Chicken 65 Biryani", price: 300 },
        { id: "fp_b13", name: "🥩 Gongura Mutton Biryani", price: 420 },
        { id: "fp_b14", name: "🍗 Tandoor Biryani", price: 320 },
        { id: "fp_b15", name: "🧀 Paneer Biryani", price: 260 },
        { id: "fp_b16", name: "🍄 Mushroom Biryani", price: 260 },
        { id: "fp_b17", name: "🥜 Kaju Biryani", price: 290 },
        { id: "fp_b18", name: "🥗 Veg Biryani", price: 220 },
      ],
    },
    {
      id: "fp_veg_fried_rice",
      title: "Veg Fried Rice",
      items: [
        { id: "fp_vfr1", name: "🥗 Veg Fried Rice", price: 190 },
        { id: "fp_vfr2", name: "🥗 Veg Schezwan Fried Rice", price: 200 },
        { id: "fp_vfr3", name: "🍄 Mushroom Fried Rice", price: 220 },
        { id: "fp_vfr4", name: "🧀 Paneer Fried Rice", price: 220 },
        { id: "fp_vfr5", name: "🥦 Gobi Fried Rice", price: 200 },
        { id: "fp_vfr6", name: "🥗 Mixed Veg Fried Rice", price: 220 },
        { id: "fp_vfr7", name: "🥜 Kaju Fried Rice", price: 270 },
      ],
    },
    {
      id: "fp_nonveg_fried_rice",
      title: "Non-Veg Fried Rice",
      items: [
        { id: "fp_nfr1", name: "🥚 Egg Fried Rice", price: 190 },
        { id: "fp_nfr2", name: "🥚 Egg Schezwan Fried Rice", price: 200 },
        { id: "fp_nfr3", name: "🍗 Chicken Fried Rice", price: 220 },
        { id: "fp_nfr4", name: "🍗 Chicken Schezwan Fried Rice", price: 230 },
        { id: "fp_nfr5", name: "🍗 Spl. Chicken Fried Rice", price: 220 },
        { id: "fp_nfr6", name: "🦐 Prawns Fried Rice", price: 250 },
        { id: "fp_nfr7", name: "🍗 Shagapossi Fried Rice", price: 250 },
        { id: "fp_nfr8", name: "🍗 Saugai FriedRice", price: 250 },
      ],
    },
    {
      id: "fp_desserts",
      title: "Desserts",
      items: [
        { id: "fp_d1", name: "🍦 Vennela Ice Cream (Single Scoop)", price: 90 },
        { id: "fp_d2", name: "🍦 Vennela Ice Cream (Double Scoop)", price: 120 },
        { id: "fp_d3", name: "🍫 Chocolate Ice Cream (Single Scoop)", price: 100 },
        { id: "fp_d4", name: "🍫 Chocolate Ice Cream (Double Scoop)", price: 140 },
        { id: "fp_d5", name: "🍓 Strawberry Ice Cream (Single Scoop)", price: 90 },
        { id: "fp_d6", name: "🍓 Strawberry Ice Cream (Double Scoop)", price: 120 },
        { id: "fp_d7", name: "🍦 Butterscotch Ice Cream (Single Scoop)", price: 100 },
        { id: "fp_d8", name: "🍦 Butterscotch Ice Cream (Double Scoop)", price: 140 },
      ],
    },
  ],
};

const restaurantMenus = {
  brindavanam: brindavanMenu,
  food_palace: foodPalaceMenu,
};

const HOTEL_LIST = [
  { id: "brindavanam", name: "Brindavan", description: "Brindavan Restaurant" },
  { id: "food_palace", name: "Food Place Restaurant", description: "Food Place Restaurant" },
];

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

// Helpers & Delivery Fee Calculation (Railway Kodur Rules)
const RESTAURANT_LAT = 13.951505;
const RESTAURANT_LNG = 79.356579;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateDeliveryFee(distanceInKm) {
  if (distanceInKm <= 2) return 40; 
  return Math.round(40 + (distanceInKm - 2) * 15); 
}

function formatRupees(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
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

async function sendButtons(to, body, buttons) {
  return sendWhatsApp({
    to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.slice(0, 3).map(b => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });
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

    if (text.includes("New Food Order") || text.includes("Food Palace Restaurant") || text.includes("Brindavan")) {
      await setState(phone, "AWAITING_LOCATION", {
        temp_selection: { purpose: "CHECKOUT", web_order_summary: text, service: "food" }
      });
      await sendText(
        phone,
        "📍 *మీ వెబ్‌సైట్ ఆర్డర్ స్వీకరించబడింది!*\n\n" +
        "డెలివరీ ఛార్జీలను లెక్కించి టోటల్ అమౌంట్ పంపడానికి దయచేసి వాట్సాప్‌లో మీ *Share Location* ఆప్షన్ ద్వారా లొకేషన్ పంపండి. 🙏"
      );
      return;
    }

    if (type === "location" && message.location) {
      if (user.current_state !== "AWAITING_LOCATION") {
        await sendText(phone, "Please send your location when asked during checkout.");
        return;
      }
      const location = { latitude: message.location.latitude, longitude: message.location.longitude };
      await updateUser(phone, { location, current_state: "REVIEW_ORDER" });
      
      const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
      const deliveryFee = calculateDeliveryFee(distance);
      
      let foodTotal = 500; 
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
        `💳 *PAYMENT SUMMARY* 💳\n\n` +
        `🧾 Order Number: *#${order.id}*\n` +
        `📏 Distance: ${distance.toFixed(1)} KM\n` +
        `🚚 Delivery Charges: ₹${deliveryFee} (${distance <= 2 ? 'Flat ₹40 for 2km' : '₹40 + ₹15/km'})\n` +
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
                `🍽️ *New Web Order Received! (#${order.id})*\n\n` +
                `👤 Customer: ${phone}\n` +
                `💬 Chat: ${chatLink}\n` +
                `📏 Distance: ${distance.toFixed(1)} km | Delivery: ₹${deliveryFee}\n` +
                `💰 Total: ₹${totalAmount}\n` +
                `📍 Map: ${mapLink}`,
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
        `🚀 New Web Order Received! (#${order.id})`,
        `<h2>🍽️ New Food Order (Railway Kodur)</h2>
         <p><b>Customer WhatsApp:</b> <a href="${chatLink}" target="_blank">${phone}</a></p>
         <p><b>Distance:</b> ${distance.toFixed(1)} km</p>
         <p><b>Delivery Fee:</b> ₹${deliveryFee}</p>
         <p><b>Total Payable:</b> ₹${totalAmount}</p>
         <p><b>Location:</b> <a href="${mapLink}" target="_blank">View on Google Maps</a></p>`
      );

      return;
    }

    if (user.current_state === "AWAITING_LOCATION" && type === "text") {
      await sendText(
        phone,
        "📍 *దయచేసి మీ లొకేషన్ షేర్ చేయండి!*\n\n" +
        "టెర్మ్స్ లేదా మెసేజ్‌లు పంపకండి. కింద వాట్సాప్ అటాచ్‌మెంట్ (📎 లేదా ➕) ఐకాన్ నొక్కి, అందులో **'Location'** సెలెక్ట్ చేసి మీ లైవ్/కరెంట్ లొకేషన్‌ను పంపితేనే డెలివరీ ఛార్జీలు ఖరారు అవుతాయి. 🙏"
      );
      return;
    }

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
      return;
    }

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