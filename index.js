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
const freshMeatMenu = require("./services/freshMeatMenu");

// ==================================================
// FOOD PALACE RESTAURANT MENU (Prices with +₹30 added)
// ==================================================
const foodPalaceMenu = {
  categories: [
    {
      id: "fp_soups",
      title: "Soups",
      items: [
        { id: "fp_s1", name: "Veg Hot & Sour Soup", price: 150 },
        { id: "fp_s2", name: "Veg Machow Soup", price: 150 },
        { id: "fp_s3", name: "Chicken Hot & Sour Soup", price: 170 },
        { id: "fp_s4", name: "Chicken Machow Soup", price: 170 }
      ]
    },
    {
      id: "fp_veg_starters",
      title: "Veg Starters",
      items: [
        { id: "fp_vs1", name: "Gobi Manchurian", price: 189 },
        { id: "fp_vs2", name: "Chilli Gobi", price: 199 },
        { id: "fp_vs3", name: "Gobi 65", price: 189 },
        { id: "fp_vs4", name: "Paneer Manchurian", price: 229 },
        { id: "fp_vs5", name: "Paneer Majestic", price: 239 },
        { id: "fp_vs6", name: "RR Gobi", price: 199 },
        { id: "fp_vs7", name: "Crispy Babycorn", price: 239 },
        { id: "fp_vs8", name: "Babycorn Chilli", price: 229 },
        { id: "fp_vs9", name: "Babycorn 65", price: 229 },
        { id: "fp_vs10", name: "Babycorn Manchurian", price: 229 },
        { id: "fp_vs11", name: "Chilli Paneer", price: 229 },
        { id: "fp_vs12", name: "Paneer 65", price: 229 },
        { id: "fp_vs13", name: "Kaju Fry (Oil Roast)", price: 279 },
        { id: "fp_vs14", name: "American Sweetcorn", price: 209 },
        { id: "fp_vs15", name: "Mushroom 65", price: 239 },
        { id: "fp_vs16", name: "Chilli Mushroom", price: 239 },
        { id: "fp_vs17", name: "Mushroom Manchurian", price: 239 },
        { id: "fp_vs18", name: "Pepper Mushroom", price: 239 },
        { id: "fp_vs19", name: "Dragon Paneer", price: 269 }
      ]
    },
    {
      id: "fp_nveg_starters",
      title: "Non-Veg Starters",
      items: [
        { id: "fp_nvs1", name: "Chilli Chicken", price: 255 },
        { id: "fp_nvs2", name: "Chicken 65", price: 255 },
        { id: "fp_nvs3", name: "Chicken Lollipop", price: 275 },
        { id: "fp_nvs4", name: "Chicken Drumstick", price: 265 },
        { id: "fp_nvs5", name: "Chilli Prawns", price: 275 },
        { id: "fp_nvs6", name: "Loose Prawns", price: 275 },
        { id: "fp_nvs7", name: "Chicken Manchuria", price: 255 },
        { id: "fp_nvs8", name: "Schezwan Chicken", price: 265 },
        { id: "fp_nvs9", name: "Chicken Majestic", price: 275 },
        { id: "fp_nvs10", name: "Chicken 555", price: 275 },
        { id: "fp_nvs11", name: "Dragon Chicken", price: 275 },
        { id: "fp_nvs12", name: "Sizzler Chicken", price: 295 },
        { id: "fp_nvs13", name: "Pepper Chicken", price: 285 },
        { id: "fp_nvs14", name: "Apollo Fish", price: 265 },
        { id: "fp_nvs15", name: "Chilli Fish", price: 265 },
        { id: "fp_nvs16", name: "Lemon Chicken", price: 255 },
        { id: "fp_nvs17", name: "Butter Garlic Chicken", price: 285 },
        { id: "fp_nvs18", name: "Guntur Chicken", price: 275 }
      ]
    },
    {
      id: "fp_veg_curries",
      title: "Veg Curries",
      items: [
        { id: "fp_vc1", name: "Veg Kheema Curry", price: 230 },
        { id: "fp_vc2", name: "Mixed Veg Curry", price: 220 },
        { id: "fp_vc3", name: "Kadai Veg Curry", price: 220 },
        { id: "fp_vc4", name: "Mushroom Masala", price: 230 },
        { id: "fp_vc5", name: "Paneer Butter Masala", price: 310 },
        { id: "fp_vc6", name: "Kadai Paneer Curry", price: 240 },
        { id: "fp_vc7", name: "Kaju Curry", price: 270 },
        { id: "fp_vc8", name: "Kaju Paneer Curry", price: 270 },
        { id: "fp_vc9", name: "Tomato Curry", price: 190 },
        { id: "fp_vc10", name: "Methi Chaman", price: 310 },
        { id: "fp_vc11", name: "Palak Paneer", price: 240 },
        { id: "fp_vc12", name: "Kadai Mushroom", price: 230 }
      ]
    },
    {
      id: "fp_nveg_curries",
      title: "Non-Veg Curries",
      items: [
        { id: "fp_nvc1", name: "Mutton Roghan Josh", price: 380 },
        { id: "fp_nvc2", name: "Mutton Curry", price: 380 },
        { id: "fp_nvc3", name: "Kadai Mutton", price: 380 },
        { id: "fp_nvc4", name: "Prawns Curry", price: 270 },
        { id: "fp_nvc5", name: "Egg Masala", price: 180 },
        { id: "fp_nvc6", name: "Miryali Chicken Curry", price: 310 },
        { id: "fp_nvc7", name: "Spl Chicken Curry", price: 280 },
        { id: "fp_nvc8", name: "Kaju Chicken Curry", price: 280 },
        { id: "fp_nvc9", name: "Butter Chicken", price: 250 },
        { id: "fp_nvc10", name: "Chicken Curry (Bone)", price: 230 },
        { id: "fp_nvc11", name: "Chicken Curry (Boneless)", price: 250 },
        { id: "fp_nvc12", name: "Kadai Chicken Curry", price: 230 }
      ]
    },
    {
      id: "fp_tandoor",
      title: "Tandoor & Roti",
      items: [
        { id: "fp_t1", name: "Tandoori Roti", price: 55 },
        { id: "fp_t2", name: "Butter Roti", price: 60 },
        { id: "fp_t3", name: "Butter Naan", price: 60 },
        { id: "fp_t4", name: "Garlic Naan", price: 80 },
        { id: "fp_t5", name: "Pulka", price: 50 },
        { id: "fp_t6", name: "Tandoori Chicken Full", price: 469 },
        { id: "fp_t7", name: "Tandoori Chicken Half", price: 269 },
        { id: "fp_t8", name: "Chicken Tikka", price: 269 },
        { id: "fp_t9", name: "Tangdi Kabab Full", price: 279 }
      ]
    },
    {
      id: "fp_biryanis",
      title: "Biryanis",
      items: [
        { id: "fp_b1", name: "Chicken Dum Biryani", price: 230 },
        { id: "fp_b2", name: "Spl Chicken Biryani (Boneless)", price: 280 },
        { id: "fp_b3", name: "Prawns Biryani", price: 310 },
        { id: "fp_b4", name: "Fish Biryani", price: 270 },
        { id: "fp_b5", name: "Chicken Fry Piece Biryani", price: 270 },
        { id: "fp_b6", name: "Chicken Lollipop Biryani", price: 280 },
        { id: "fp_b7", name: "Mutton Dum Biryani", price: 380 },
        { id: "fp_b8", name: "Mutton Fry Piece Biryani", price: 380 },
        { id: "fp_b9", name: "Egg Biryani", price: 180 },
        { id: "fp_b10", name: "Chicken 65 Biryani", price: 280 },
        { id: "fp_b11", name: "Paneer Biryani", price: 240 },
        { id: "fp_b12", name: "Mushroom Biryani", price: 240 },
        { id: "fp_b13", name: "Veg Biryani", price: 200 }
      ]
    },
    {
      id: "fp_chinese",
      title: "Chinese / Fried Rice",
      items: [
        { id: "fp_c1", name: "Veg Fried Rice", price: 170 },
        { id: "fp_c2", name: "Veg Schezwan Fried Rice", price: 180 },
        { id: "fp_c3", name: "Mushroom Fried Rice", price: 200 },
        { id: "fp_c4", name: "Paneer Fried Rice", price: 200 },
        { id: "fp_c5", name: "Egg Fried Rice", price: 170 },
        { id: "fp_c6", name: "Chicken Fried Rice", price: 200 },
        { id: "fp_c7", name: "Chicken Schezwan Fried Rice", price: 210 },
        { id: "fp_c8", name: "Prawns Fried Rice", price: 230 }
      ]
    }
  ]
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

if (
  !VERIFY_TOKEN ||
  !WHATSAPP_TOKEN ||
  !PHONE_NUMBER_ID ||
  !SUPABASE_URL ||
  !SUPABASE_KEY
) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const resend = new Resend(RESEND_API_KEY);

async function sendOrderEmail(subject, htmlContent) {
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.warn("Resend API key or Admin email not configured properly.");
    return;
  }

  try {
    await resend.emails.send({
      from: "Avento Bot <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent,
    });
    console.log("✅ ఆర్డర్ ఈమెయిల్ Resend API ద్వారా విజయవంతంగా పంపబడింది!");
  } catch (error) {
    console.error("❌ ఈమెయిల్ పంపడంలో ఎర్రర్ వచ్చింది:", error);
  }
}

const RESTAURANT_LAT = 13.951505;
const RESTAURANT_LNG = 79.356579;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDeliveryFee(distanceInKm) {
  if (distanceInKm <= 2) {
    return 30;
  } else {
    return Math.round(30 + (distanceInKm - 2) * 10);
  }
}

function formatRupees(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function getCart(user) {
  return Array.isArray(user?.cart) ? user.cart : [];
}

function getTemp(user) {
  const value = user?.temp_selection;
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getLocation(user) {
  return user?.location || null;
}

function getFoodCategories(hotelId) {
  if (hotelId === "food_palace") {
    return Array.isArray(foodPalaceMenu.categories) ? foodPalaceMenu.categories : [];
  }
  return Array.isArray(brindavanMenu.categories) ? brindavanMenu.categories : [];
}

function getMeatCategories() {
  return Array.isArray(freshMeatMenu.categories) ? freshMeatMenu.categories : [];
}

function getFoodItem(itemId, hotelId) {
  return getFoodCategories(hotelId)
    .flatMap(category => category.items || [])
    .find(item => String(item.id) === String(itemId));
}

function getMeatItem(itemId) {
  return getMeatCategories()
    .flatMap(category => category.items || [])
    .find(item => String(item.id) === String(itemId));
}

function getCartTotal(cart) {
  return cart.reduce((total, item) => {
    if (item.price_pending) return total;
    return total + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);
}

function parseOrderDetails(details) {
  if (!details) return {};
  if (typeof details === "object" && !Array.isArray(details)) return details;
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
}

function isAdmin(phone) {
  const configured = normalizePhone(AVENTO_ADMIN_PHONE);
  return Boolean(configured) && normalizePhone(phone) === configured;
}

function serviceImage(filename) {
  return path.join(__dirname, "assets", filename);
}

function getServiceName(service) {
  const names = {
    food: "Food Order",
    fresh_meat: "Fresh Meat Delivery",
    medicine: "Medicine Order",
    plumbing_electrical: "Home Repairs",
    shifting: "Home Shifting / Parcel",
  };
  return names[service] || "Avento Multi-Services";
}

function isServiceAvailableNow() {
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false };
  const currentHour = parseInt(new Intl.DateTimeFormat([], options).format(new Date()));
  return currentHour >= 6 && currentHour < 21;
}

const CALL_NOTICE = `\n\n📞 *మీరు వాట్సాప్ ద్వారానే కాకుండా నేరుగా మా నంబర్ ${AVENTO_CALL_PHONE} కి కాల్ చేసి కూడా ఆర్డర్ ఇవ్వవచ్చు!*`;

async function sendWhatsApp(payload) {
  try {
    const response = await axios.post(
      `${GRAPH_URL}/${PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", ...payload },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );
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
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found: ${filePath}`);
  }
  const contentType = mime.lookup(filePath);
  if (!contentType) {
    throw new Error(`Unsupported image file: ${filePath}`);
  }
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(filePath), { contentType, filename: path.basename(filePath) });
  form.append("type", contentType);

  const response = await axios.post(`${GRAPH_URL}/${PHONE_NUMBER_ID}/media`, form, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, ...form.getHeaders() },
    timeout: 30000,
  });
  return response.data.id;
}

async function sendLocalImage(phone, filePath, caption = "") {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("Image file missing:", filePath);
      return false;
    }
    const mediaId = await uploadWhatsAppImage(filePath);
    await sendWhatsApp({
      to: phone,
      type: "image",
      image: { id: mediaId, ...(caption ? { caption } : {}) },
    });
    return true;
  } catch (error) {
    console.error("Failed to send image:", error.response?.data || error.message);
    return false;
  }
}

async function sendButtons(to, body, buttons) {
  return sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map(button => ({
          type: "reply",
          reply: { id: button.id, title: button.title.slice(0, 20) },
        })),
      },
    },
  });
}

async function sendNavigation(to) {
  try {
    await sendButtons(to, `⬇️ మరిన్ని ఎంపికలు${CALL_NOTICE}`, [
      { id: "nav_back", title: "⬅️ Back" },
      { id: "nav_main", title: "🏠 Main Menu" },
    ]);
  } catch (error) {
    console.error("Navigation buttons error:", error.message);
  }
}

async function sendList(to, body, buttonText, sections) {
  const safeSections = sections
    .map(section => ({
      title: String(section.title || "Options").slice(0, 24),
      rows: (section.rows || []).slice(0, 10).map(row => ({
        id: String(row.id),
        title: String(row.title || "Option").slice(0, 24),
        ...(row.description ? { description: String(row.description).slice(0, 72) } : {}),
      })),
    }))
    .filter(section => section.rows.length);

  if (!safeSections.length) {
    await sendText(to, "ప్రస్తుతం ఎంపికలు అందుబాటులో లేవు. కొద్దిసేపటి తర్వాత ప్రయత్నించండి.");
    await sendNavigation(to);
    return;
  }

  await sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: { button: String(buttonText).slice(0, 20), sections: safeSections },
    },
  });
  await sendNavigation(to);
}

async function getOrCreateUser(phone) {
  const { data, error } = await supabase.from("users").select("*").eq("phone_number", phone).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({ phone_number: phone, current_state: "IDLE", cart: [], temp_selection: {} })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created;
}

async function updateUser(phone, updates) {
  const { error } = await supabase.from("users").update(updates).eq("phone_number", phone);
  if (error) throw error;
}

async function setState(phone, state, extra = {}) {
  await updateUser(phone, { current_state: state, ...extra });
}

async function saveOrder(phone, serviceType, details, status = "REQUESTED") {
  const { data, error } = await supabase
    .from("orders")
    .insert({ user_phone: phone, service_type: serviceType, details: JSON.stringify(details), status })
    .select("*")
    .single();

  if (error) {
    console.error("Supabase order save error:", error);
    throw error;
  }
  return data;
}

async function getOrderById(orderId) {
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  return data;
}

async function updateOrder(orderId, updates) {
  const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Order not found");
  return data;
}

async function getLatestCustomerOrder(phone) {
  const cleanPhone = normalizePhone(phone);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_phone", cleanPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Get latest order error:", error.message);
    return null;
  }
  return data;
}

async function showMainMenu(to) {
  await sendLocalImage(
    to,
    serviceImage("welcome.jpg"),
    "🙏 *నమస్కారం! Avento Services కి స్వాగతం.*\n\n⏰ *సేవల సమయం: ఉదయం 6:00 AM నుండి రాత్రి 9:00 PM వరకు*\n\nమీకు కావాల్సిన సర్వీస్‌ను కింద ఉన్న బటన్‌ను నొక్కి ఎంచుకోండి."
  );

  await sendList(to, "దయచేసి ఒక సేవను ఎంచుకోండి:", "సేవలు ఎంచుకోండి", [
    {
      title: "మా సేవలు (6:00 AM - 9:00 PM)",
      rows: [
        { id: "srv_food", title: "Food Order", description: "హోటల్ ఫుడ్ డెలివరీ" },
        { id: "srv_meat", title: "Fresh Meat Delivery", description: "చికెన్, మటన్, చేపలు" },
        { id: "srv_med", title: "Medicine Order", description: "మందుల డెలివరీ" },
        { id: "srv_plumbing", title: "Home Repairs", description: "ప్లంబింగ్, ఎలక్ట్రికల్" },
        { id: "srv_shifting", title: "Home Shifting / Parcel", description: "ఇల్లు మారడం, పార్సెల్ డెలివరీ" },
      ],
    },
  ]);
}

async function startService(phone, service) {
  await setState(phone, "IDLE", { cart: [], location: null, temp_selection: { service } });
}

async function goToMainMenu(phone) {
  await setState(phone, "IDLE", { location: null, temp_selection: {} });
  await showMainMenu(phone);
}

async function goBack(phone, user) {
  const state = user.current_state || "IDLE";
  const temp = getTemp(user);
  const cart = getCart(user);

  switch (state) {
    case "SELECT_HOTEL":
      await goToMainMenu(phone);
      return;
    case "FOOD_CATEGORY":
      await showHotels(phone);
      return;
    case "FOOD_ITEMS":
      await showFoodCategories(phone, temp.hotel_name);
      return;
    case "MEAT_CATEGORY":
      await goToMainMenu(phone);
      return;
    case "MEAT_QUANTITY":
      await showMeatCategories(phone);
      return;
    case "CART":
      if (temp.service === "fresh_meat") {
        await showMeatCategories(phone);
      } else if (temp.service === "food") {
        await showFoodCategories(phone, temp.hotel_name);
      } else {
        await goToMainMenu(phone);
      }
      return;
    case "AWAITING_LOCATION":
      if (cart.length) {
        await showCart(phone, cart, temp.hotel_name);
      } else {
        await goToMainMenu(phone);
      }
      return;
    case "REVIEW_ORDER":
      if (cart.length) {
        await showCart(phone, cart, temp.hotel_name);
      } else {
        await goToMainMenu(phone);
      }
      return;
    default:
      await goToMainMenu(phone);
  }
}

async function showHotels(to) {
  await setState(to, "SELECT_HOTEL");
  await sendList(
    to,
    "🍽️ Food Order (6:00 AM - 9:00 PM)\n\nదయచేసి మీకు కావాల్సిన హోటల్‌ను ఎంచుకోండి.",
    "హోటల్ ఎంచుకోండి",
    [
      {
        title: "Available Hotels",
        rows: [
          { id: "hotel_food_palace", title: "Food Palace", description: "ఫుడ్ పాలెస్ రెస్టారెంట్" },
          { id: "hotel_brindavanam", title: "Brindavanam", description: "బృందావనం రెస్టారెంట్" },
          { id: "hotel_king_biryani", title: "King Biryani", description: "కింగ్ బిర్యానీ" },
        ],
      },
    ]
  );
}

async function showFoodCategories(to, hotelId, hotelName) {
  const categories = getFoodCategories(hotelId);
  await setState(to, "FOOD_CATEGORY");
  await sendList(
    to,
    `🏨 ${hotelName || "Food Order"}\n\n🍽️ మీకు కావాల్సిన ఫుడ్ కేటగిరీ ఎంచుకోండి.`,
    "Food Categories",
    [
      {
        title: "Restaurant Menu",
        rows: categories.slice(0, 10).map(category => ({
          id: `cat_${hotelId}_${category.id}`,
          title: category.title || category.name || category.id,
        })),
      },
    ]
  );
}

async function showFoodItems(to, hotelId, categoryId, page = 0) {
  const categories = getFoodCategories(hotelId);
  const category = categories.find(item => String(item.id) === String(categoryId));

  if (!category) {
    await sendText(to, "ఈ కేటగిరీ దొరకలేదు.");
    await sendNavigation(to);
    return;
  }

  const items = category.items || [];
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  page = Math.max(0, Math.min(page, totalPages - 1));
  const visibleItems = items.slice(page * pageSize, page * pageSize + pageSize);

  const rows = visibleItems.map(item => ({
    id: `item_${hotelId}_${item.id}`,
    title: item.name,
    description: formatRupees(item.price),
  }));

  if (page > 0) {
    rows.push({ id: `foodpage_${hotelId}_${categoryId}_${page - 1}`, title: "Previous Page" });
  }
  if (page < totalPages - 1) {
    rows.push({ id: `foodpage_${hotelId}_${categoryId}_${page + 1}`, title: "Next Page" });
  }

  await setState(to, "FOOD_ITEMS", {
    temp_selection: {
      ...getTemp(await getOrCreateUser(to)),
      current_category_id: categoryId,
      current_page: page,
    },
  });

  await sendList(
    to,
    `${category.title || category.name || category.id}\nPage ${page + 1}/${totalPages}\n\nమీకు కావాల్సిన ఐటమ్ ఎంచుకోండి.`,
    "Food Items",
    [{ title: "Available Items", rows }]
  );
}

async function showMeatCategories(to) {
  const categories = getMeatCategories();
  await setState(to, "MEAT_CATEGORY");
  await sendList(
    to,
    "🥩 Fresh Meat Delivery (6:00 AM - 9:00 PM)\n\nమీకు కావాల్సిన మీట్ రకం ఎంచుకోండి.",
    "Meat Categories",
    [
      {
        title: "Fresh Meat",
        rows: categories.slice(0, 10).map(category => ({
          id: String(category.id),
          title: category.title || category.name || category.id,
        })),
      },
    ]
  );
}

async function showMeatQuantities(to, meatItem) {
  const quantities = freshMeatMenu.quantities || [];
  await sendList(
    to,
    `🥩 ${meatItem.name}\n\nఎన్ని కిలోలు కావాలి? ధరను మా బృందం నిర్ధారిస్తుంది.`,
    "Select KG",
    [
      {
        title: "Quantity",
        rows: quantities.slice(0, 10).map((quantity, index) => ({
          id: `qty_${index}_${meatItem.id}`,
          title: quantity.title || `${quantity.id}`,
        })),
      },
    ]
  );
}

function renderCart(cart) {
  if (!cart.length) return "మీ కార్ట్ ఖాళీగా ఉంది.";
  const lines = cart.map((item, index) => {
    if (item.price_pending) {
      return `${index + 1}. ${item.name}\n   పరిమాణం: ${item.quantity} KG\n   ధర: నిర్ధారించాలి`;
    }
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    return `${index + 1}. ${item.name}\n   Qty: ${quantity}\n   ధర: ${formatRupees(price * quantity)}`;
  });
  lines.push("\n--------------------");
  lines.push(`ఫుడ్ మొత్తం: ${formatRupees(getCartTotal(cart))}`);
  return lines.join("\n");
}

async function showCart(to, cart, hotelName) {
  const hotelLine = hotelName ? `🏨 హోటల్: ${hotelName}\n\n` : "";
  await setState(to, "CART");
  await sendButtons(
    to,
    `🛒 మీ కార్ట్\n\n${hotelLine}${renderCart(cart)}`,
    [
      { id: "cart_add_more", title: "మరిన్ని ఐటమ్స్" },
      { id: "cart_remove", title: "ఐటమ్ తొలగించు" },
      { id: "cart_checkout", title: "కొనసాగించు" },
    ]
  );
  await sendNavigation(to);
}

async function showRemoveItems(to, cart) {
  if (!cart.length) {
    await sendText(to, "మీ కార్ట్ ఖాళీగా ఉంది.");
    await sendNavigation(to);
    return;
  }
  await sendList(to, "తొలగించాల్సిన ఐటమ్ ఎంచుకోండి.", "Remove Item", [
    {
      title: "Cart Items",
      rows: cart.slice(0, 10).map((item, index) => ({
        id: `remove_${index}`,
        title: `${index + 1}. ${item.name}`,
      })),
    },
  ]);
}

async function askForLocation(phone, user) {
  await setState(phone, "AWAITING_LOCATION", {
    temp_selection: { ...getTemp(user), purpose: "CHECKOUT" },
  });
  await sendText(phone, "📍 దయచేసి మీ లొకేషన్‌ను షేర్ చేయండి.");
  await sendNavigation(phone);
}

function renderServiceReview(user) {
  const temp = getTemp(user);
  const location = getLocation(user);
  const cart = getCart(user);
  const service = temp.service;
  const lines = ["🧾 మీ ఆర్డర్ సమ్మరీ (Order Summary)", ""];

  if (service === "food") {
    lines.push(`🏨 హోటల్: ${temp.hotel_name || "Food Palace"}`);
    lines.push("");
    lines.push(renderCart(cart));

    if (location) {
      const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
      const deliveryFee = calculateDeliveryFee(distance);
      const foodTotal = getCartTotal(cart);
      const grandTotal = foodTotal + deliveryFee;

      lines.push("");
      lines.push(`📏 రెస్టారెంట్ నుండి దూరం: ${distance.toFixed(1)} KM`);
      lines.push(`🚚 డెలివరీ చార్జీలు: ${formatRupees(deliveryFee)}`);
      lines.push("--------------------");
      lines.push(`💰 చెల్లించాల్సిన మొత్తం: ${formatRupees(grandTotal)}`);
    }
  } else if (service === "fresh_meat") {
    lines.push("🥩 Fresh Meat Order");
    lines.push("");
    lines.push(renderCart(cart));

    if (location) {
      const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
      const deliveryFee = calculateDeliveryFee(distance);
      lines.push("");
      lines.push(`📏 లొకేషన్ నుండి దూరం: ${distance.toFixed(1)} KM`);
      lines.push(`🚚 డెలివరీ చార్జీలు: ${formatRupees(deliveryFee)} (మీట్ ధర నిర్ధారించాలి)`);
    }
  } else if (service === "medicine") {
    lines.push("💊 మెడిసిన్ రిక్వెస్ట్ (ప్రిస్క్రిప్షన్ అందింది)");
  } else if (service === "plumbing_electrical") {
    lines.push("🔧 Home Repairs (ప్లంబింగ్ / ఎలక్ట్రికల్)");
    lines.push(`వివరాలు: ${temp.notes || "వివరాలు అందించబడ్డాయి"}`);
  } else if (service === "shifting") {
    lines.push(`🚚 ${temp.service_name || "Home Shifting / Parcel"}`);
    lines.push(`వివరాలు: ${temp.notes || "వివరాలు అందించబడ్డాయి"}`);
  }

  if (location && service !== "food" && service !== "fresh_meat") {
    const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
    const deliveryFee = calculateDeliveryFee(distance);
    lines.push("");
    lines.push(`📏 దూరం: ${distance.toFixed(1)} KM`);
    lines.push(`🚚 అంచనా డెలివరీ చార్జీలు: ${formatRupees(deliveryFee)}`);
    lines.push(`📍 Location: ${location.latitude}, ${location.longitude}`);
  } else if (location && service === "fresh_meat") {
    lines.push("");
    lines.push(`📍 Location: ${location.latitude}, ${location.longitude}`);
  }

  lines.push("");
  lines.push("దయచేసి మీ వివరాలను నిర్ధారించండి.");
  return lines.join("\n");
}

async function showReview(phone, user) {
  await setState(phone, "REVIEW_ORDER");
  await sendButtons(phone, renderServiceReview(user), [
    { id: "order_submit", title: "నిర్ధారించు" },
    { id: "order_cancel", title: "రద్దు చేయి" },
  ]);
  await sendNavigation(phone);
}

async function sendPaymentInstructions(phone, order, details) {
  const amount = Number(details.total || 0);
  if (!AVENTO_UPI_ID) {
    await sendText(phone, `మీ ఆర్డర్ #${order.id} నమోదు అయింది. కానీ UPI ID సెటప్ కాలేదు.`);
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    await sendText(phone, `మీ ఆర్డర్ #${order.id} ధర ఇంకా నిర్ధారించబడలేదు.`);
    return;
  }

  const qrPath = serviceImage("payment-qr.png");
  const upiDeepLink = `upi://pay?pa=${AVENTO_UPI_ID}&pn=${encodeURIComponent(AVENTO_UPI_NAME)}&am=${amount}&cu=INR`;

  const caption =
    `💳 *YOUR BILL IS GENERATED!* 💳\n\n` +
    `🧾 ఆర్డర్ నంబర్: *#${order.id}*\n` +
    `💰 చెల్లించాల్సిన మొత్తం: *${formatRupees(amount)}*\n` +
    `📱 UPI ID: *${AVENTO_UPI_ID}*\n` +
    `👤 పేరు: *${AVENTO_UPI_NAME}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👉 *డైరెక్ట్ పేమెంట్ లింక్ (Direct Pay):*\n` +
    `${upiDeepLink}\n\n` +
    `⚡ *గమనిక:* చెల్లింపు చేసిన తర్వాత *12 అంకెల UTR నంబర్ లేదా పేమెంట్ స్క్రీన్‌షాట్‌ను* ఇక్కడ పంపండి.\n` +
    `━━━━━━━━━━━━━━━━━━━`;

  if (fs.existsSync(qrPath)) {
    const sent = await sendLocalImage(phone, qrPath, caption);
    if (!sent) await sendText(phone, caption);
  } else {
    await sendText(phone, caption);
  }
}

async function initiatePaymentFlow(phone, user) {
  const cart = getCart(user);
  const temp = getTemp(user);
  const service = temp.service;

  if (!["food", "fresh_meat"].includes(service)) {
    await createServiceRequest(phone, user);
    return;
  }

  if (!cart.length) {
    await sendText(phone, "మీ కార్ట్ ఖాళీగా ఉంది. ముందుగా ఐటమ్స్ ఎంచుకోండి.");
    await sendNavigation(phone);
    return;
  }

  const hasPendingPrice = cart.some(item => item.price_pending);
  let foodTotal = getCartTotal(cart);
  let deliveryFee = 0;

  const location = getLocation(user);
  if (location) {
    const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
    deliveryFee = calculateDeliveryFee(distance);
  }

  const totalAmount = foodTotal + deliveryFee;
  const details = {
    service,
    items: cart,
    food_total: foodTotal,
    delivery_fee: deliveryFee,
    total: totalAmount,
    location,
    notes: temp.notes || null,
    hotel_name: temp.hotel_name || null,
    payment: { method: "UPI_MANUAL", status: hasPendingPrice ? "PRICE_PENDING" : "PENDING", utr_transaction_id: null },
    created_at: new Date().toISOString(),
  };

  try {
    const cleanPhone = normalizePhone(phone);
    const chatLink = `https://wa.me/${cleanPhone}`;
    const loc = details.location ? `https://maps.google.com/?q=${details.location.latitude},${details.location.longitude}` : "లొకేషన్ లేదు";

    if (service === "fresh_meat" || hasPendingPrice) {
      details.payment.status = "PRICE_PENDING";
      const order = await saveOrder(phone, service, details, "PRICE_PENDING");
      await setState(phone, "IDLE", { cart: [], temp_selection: {} });

      await sendText(
        phone,
        `✅ మీ Fresh Meat ఆర్డర్ రిక్వెస్ట్ నమోదు అయింది.\n\n🧾 ఆర్డర్ నంబర్: #${order.id}\nధర నిర్ధారించిన తర్వాత చెల్లింపు వివరాలు పంపిస్తాము.`
      );
      await sendNavigation(phone);

      const itemsList = cart.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(", ");
      if (AVENTO_ADMIN_PHONE) {
        await sendText(
          AVENTO_ADMIN_PHONE,
          `🥩 *కొత్త ఫ్రెష్ మీట్ ఆర్డర్ వచ్చింది! (#${order.id})*\n\n👤 కస్టమర్: ${cleanPhone}\n🛒 ఐటమ్స్: ${itemsList}\n📍 లొకేషన్: ${loc}\n👉 ధర నమోదు చేయడానికి పంపండి: *price ${order.id} <AMOUNT>*`
        );
      }
      return;
    }

    const order = await saveOrder(phone, service, details, "PENDING_PAYMENT");
    await setState(phone, "AWAITING_UTR", { temp_selection: { ...temp, pending_order_id: order.id } });

    await sendPaymentInstructions(phone, order, details);
    await sendNavigation(phone);

    const itemsList = cart.map(i => `${i.name} (Qty: ${i.quantity})`).join(", ");
    if (AVENTO_ADMIN_PHONE) {
      await sendWhatsApp({
        to: AVENTO_ADMIN_PHONE,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `🍽️ *కొత్త ఫుడ్ ఆర్డర్ వచ్చింది! (#${order.id})*\n\n🏨 హోటల్: ${details.hotel_name || 'Food Palace'}\n👤 కస్టమర్: ${cleanPhone}\n🛒 ఐటమ్స్: ${itemsList}\n💰 మొత్తం: ${formatRupees(totalAmount)}\n📍 లొకేషన్: ${loc}`
          },
          action: {
            buttons: [
              { type: "reply", reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm / Paid" } },
              { type: "reply", reply: { id: `adm_ask_ss_${order.id}`, title: "📸 Ask Screenshot" } },
              { type: "reply", reply: { id: `adm_rej_${order.id}`, title: "❌ Reject" } }
            ]
          }
        }
      });
    }
  } catch (error) {
    console.error("Payment flow error:", error.message);
    await sendText(phone, "ఆర్డర్ ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది.");
  }
}

async function createServiceRequest(phone, user) {
  const temp = getTemp(user);
  const location = getLocation(user);
  let deliveryFee = 0;
  if (location) {
    const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
    deliveryFee = calculateDeliveryFee(distance);
  }

  const details = {
    service: temp.service,
    service_name: temp.service_name || null,
    notes: temp.notes || null,
    media_id: temp.media_id || temp.prescription_media_id || null,
    location,
    delivery_fee: deliveryFee,
    status: "REQUESTED",
    created_at: new Date().toISOString(),
  };

  try {
    const order = await saveOrder(phone, temp.service || "other", details, "REQUESTED");
    await setState(phone, "IDLE", { cart: [], temp_selection: {} });

    await sendText(
      phone,
      `🎉 మీ ఆర్డర్ విజయవంతంగా బుక్ చేయబడింది. ధన్యవాదాలు! 🙏\n\n🧾 ఆర్డర్ నంబర్: #${order.id}\nమా బృందం త్వరలోనే మిమ్మల్ని సంప్రదిస్తుంది.`
    );
    await sendNavigation(phone);

    const loc = details.location ? `https://maps.google.com/?q=${details.location.latitude},${details.location.longitude}` : "లొకేషన్ లేదు";
    const cleanPhone = normalizePhone(phone);
    const chatLink = `https://wa.me/${cleanPhone}`;
    const serviceTitle = getServiceName(temp.service);

    if (AVENTO_ADMIN_PHONE) {
      await sendWhatsApp({
        to: AVENTO_ADMIN_PHONE,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `🔔 *కొత్త సర్వీస్ రిక్వెస్ట్ వచ్చింది! (#${order.id})*\n\n🛠️ సర్వీస్: *${serviceTitle}*\n👤 కస్టమర్: ${cleanPhone}\n📍 లొకేషన్: ${loc}`
          },
          action: {
            buttons: [
              { type: "reply", reply: { id: `adm_accept_${order.id}`, title: "✅ Accept Service" } },
              { type: "reply", reply: { id: `adm_reject_srv_${order.id}`, title: "❌ Reject Service" } }
            ]
          }
        }
      });
    }
  } catch (error) {
    console.error("Service request error:", error.message);
    await sendText(phone, "మీ రిక్వెస్ట్ సేవ్ చేయడంలో లోపం ఏర్పడింది.");
  }
}

async function handleAdminCommand(phone, text) {
  if (!isAdmin(phone)) return false;
  const trimmed = String(text || "").trim();
  const priceMatch = trimmed.match(/^price\s+(\S+)\s+(\d+(?:\.\d{1,2})?)$/i);

  if (priceMatch) {
    const orderId = priceMatch[1];
    const amount = Number(priceMatch[2]);
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        await sendText(phone, `ఆర్డర్ దొరకలేదు: ${orderId}`);
        return true;
      }
      const details = parseOrderDetails(order.details);
      details.total = amount;
      details.payment = { ...(details.payment || {}), status: "PENDING", quoted_at: new Date().toISOString() };

      await updateOrder(orderId, { details: JSON.stringify(details), status: "PENDING_PAYMENT" });
      await setState(order.user_phone, "AWAITING_UTR", { temp_selection: { service: details.service, pending_order_id: order.id } });
      await sendPaymentInstructions(order.user_phone, order, details);
      await sendText(phone, `ధర నమోదు అయింది. Order: #${order.id}`);
    } catch (error) {
      console.error("Admin price command error:", error.message);
    }
    return true;
  }
  return false;
}

app.get(["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"], (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
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
    const cart = getCart(user);
    const temp = getTemp(user);

    if (type === "text" && (await handleAdminCommand(phone, text))) {
      return;
    }

    if (String(command).startsWith("adm_")) {
      if (!isAdmin(phone)) return;
      const parts = String(command).split("_");
      const action = parts[1];
      let orderId = parts.slice(2).join("_");
      let subAction = action;

      if (action === "ask" && parts[2] === "ss") {
        subAction = "ask_ss";
        orderId = parts.slice(3).join("_");
      } else if (action === "reject" && parts[2] === "srv") {
        subAction = "reject_srv";
        orderId = parts.slice(3).join("_");
      }

      const order = await getOrderById(orderId);
      if (!order) return;

      if (subAction === "paid") {
        const details = parseOrderDetails(order.details);
        details.payment = { ...(details.payment || {}), status: "PAID", verified_manually: true };
        await updateOrder(orderId, { details: JSON.stringify(details), status: "PREPARING" });

        await sendButtons(
          order.user_phone,
          `🎉 మీ ఆర్డర్ కన్ఫర్మ్ అయింది!\n🧾 ఆర్డర్ నంబర్: #${order.id}\n📦 స్టేటస్: Preparing`,
          [{ id: "track_order", title: "📦 Track Order" }, { id: "nav_main", title: "🏠 Main Menu" }]
        );
        await sendText(phone, `✅ Order #${orderId} confirmed successfully.`);
      } else if (subAction === "ask_ss") {
        await sendText(
          order.user_phone,
          `📸 *పేమెంట్ స్క్రీన్‌షాట్ అవసరం! (#${order.id})*\n\nదయచేసి మీ UPI పేమెంట్ స్క్రీన్‌షాట్‌ను ఇక్కడ పంపండి.`
        );
        await sendText(phone, `📸 Asked screenshot for Order #${orderId}.`);
      } else if (subAction === "accept") {
        await updateOrder(orderId, { status: "CONFIRMED" });
        await sendText(order.user_phone, `✅ *మీ సర్వీస్ రిక్వెస్ట్ కన్ఫర్మ్ చేయబడింది! (#${order.id})*`);
        await sendText(phone, `👍 Order #${orderId} service accepted.`);
      } else if (subAction === "rej" || subAction === "reject_srv") {
        await updateOrder(orderId, { status: "REJECTED" });
        await sendText(order.user_phone, `❌ క్షమించండి, మీ రిక్వెస్ట్ #${orderId} తిరస్కరించబడింది.`);
        await sendText(phone, `❌ Order #${orderId} rejected.`);
      }
      return;
    }

    if (command === "track_order" || ["track order", "where is my order", "order status"].includes(normalized)) {
      const latestOrder = await getLatestCustomerOrder(phone);
      if (!latestOrder) {
        await sendText(phone, "మీ పేరు మీద ఎలాంటి యాక్టివ్ ఆర్డర్స్ కనుగొనబడలేదు.");
        await sendNavigation(phone);
        return;
      }
      await sendText(phone, `📦 ఆర్డర్ నంబర్: #${latestOrder.id}\n📌 స్టేటస్: ${latestOrder.status}`);
      await sendNavigation(phone);
      return;
    }

    if (command === "nav_main" || ["hi", "hello", "menu", "start", "హాయ్", "మెనూ"].includes(normalized)) {
      await goToMainMenu(phone);
      return;
    }

    if (command === "nav_back" || ["back", "వెనక్కి"].includes(normalized)) {
      await goBack(phone, user);
      return;
    }

    if (user.current_state === "AWAITING_UTR") {
      let orderId = temp.pending_order_id;
      if (!orderId) {
        const latest = await getLatestCustomerOrder(phone);
        if (latest) orderId = latest.id;
      }
      if (!orderId) {
        await sendText(phone, "పెండింగ్ ఆర్డర్ దొరకలేదు.");
        return;
      }

      const order = await getOrderById(orderId);
      let utrNumber = text;
      let imageMediaId = message.image?.id || null;
      if (type === "image" && imageMediaId) {
        utrNumber = `IMAGE_SCREENSHOT_${imageMediaId}`;
      }

      if (!utrNumber) {
        await sendText(phone, "దయచేసి UTR నంబర్ లేదా స్క్రీన్‌షాట్ పంపండి.");
        return;
      }

      const details = parseOrderDetails(order.details);
      details.payment = {
        ...(details.payment || {}),
        method: "UPI_MANUAL",
        status: "PAYMENT_REVIEW",
        utr_transaction_id: utrNumber,
        screenshot_media_id: imageMediaId,
      };

      await updateOrder(orderId, { details: JSON.stringify(details), status: "PAYMENT_REVIEW" });
      await setState(phone, "IDLE", { cart: [], temp_selection: {} });
      await sendText(phone, `✅ మీ పేమెంట్ వివరాలు అందాయి. వెరిఫికేషన్ జరుగుతోంది.`);

      if (AVENTO_ADMIN_PHONE) {
        if (imageMediaId) {
          try {
            await sendWhatsApp({ to: AVENTO_ADMIN_PHONE, type: "image", image: { id: imageMediaId } });
          } catch (err) {
            console.error("Failed to forward image:", err.message);
          }
        }
        await sendWhatsApp({
          to: AVENTO_ADMIN_PHONE,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: `💳 **Payment Verification Required**\nOrder ID: #${order.id}\nCustomer: ${phone}\nAmount: ${formatRupees(details.total)}`
            },
            action: {
              buttons: [
                { type: "reply", reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm / Paid" } },
                { type: "reply", reply: { id: `adm_ask_ss_${order.id}`, title: "📸 Ask Screenshot" } },
                { type: "reply", reply: { id: `adm_rej_${order.id}`, title: "❌ Reject" } }
              ]
            }
          }
        });
      }
      return;
    }

    if (command === "order_cancel" || ["cancel", "రద్దు"].includes(normalized)) {
      await setState(phone, "IDLE", { cart: [], location: null, temp_selection: {} });
      await sendText(phone, "మీ ప్రస్తుత రిక్వెస్ట్ రద్దు చేయబడింది.");
      await showMainMenu(phone);
      return;
    }

    if (type === "location" && message.location) {
      if (user.current_state !== "AWAITING_LOCATION") {
        await sendText(phone, "దయచేసి ముందుగా ఆర్డర్ ప్రక్రియలోకి వెళ్లండి.");
        await sendNavigation(phone);
        return;
      }
      const location = { latitude: message.location.latitude, longitude: message.location.longitude };
      const updatedUser = { ...user, location, current_state: "REVIEW_ORDER" };
      await updateUser(phone, { location, current_state: "REVIEW_ORDER" });
      await showReview(phone, updatedUser);
      return;
    }

    // ==========================================
    // SERVICES & FOOD PALACE SELECTION
    // ==========================================
    if (command === "srv_food") {
      if (!isServiceAvailableNow()) {
        await sendText(
          phone,
          `⚠️ *సమయం ముగిసింది!*\n\nAvento సేవలు ఉదయం 6:00 AM నుండి రాత్రి 9:00 PM వరకు మాత్రమే అందుబాటులో ఉంటాయి. లేదా ${AVENTO_CALL_PHONE} కి కాల్ చేయండి.`
        );
        await sendNavigation(phone);
        return;
      }
      await startService(phone, "food");
      await setState(phone, "SELECT_HOTEL", { temp_selection: { service: "food" } });
      await sendLocalImage(
        phone,
        serviceImage("food.jpg"),
        "🍽️ Food Order\n\n⏰ సర్వీస్ సమయం: 6:00 AM - 9:00 PM\n\nమీకు నచ్చిన హోటల్‌ని ఎంచుకోండి."
      );
      await showHotels(phone);
      return;
    }

    if (command === "hotel_food_palace" || command === "hotel_brindavanam" || command === "hotel_king_biryani") {
      const hotelInfo =
        command === "hotel_food_palace"
          ? { id: "food_palace", name: "Food Palace" }
          : command === "hotel_brindavanam"
          ? { id: "brindavanam", name: "Brindavanam" }
          : { id: "king_biryani", name: "King Biryani" };

      await setState(phone, "FOOD_CATEGORY", {
        cart: [],
        temp_selection: {
          service: "food",
          hotel_id: hotelInfo.id,
          hotel_name: hotelInfo.name,
        },
      });
      await showFoodCategories(phone, hotelInfo.id, hotelInfo.name);
      return;
    }

    if (command === "srv_meat") {
      if (!isServiceAvailableNow()) {
        await sendText(phone, `⚠️ సమయం ముగిసింది! ${AVENTO_CALL_PHONE} కి కాల్ చేయండి.`);
        await sendNavigation(phone);
        return;
      }
      await startService(phone, "fresh_meat");
      await setState(phone, "MEAT_CATEGORY", { temp_selection: { service: "fresh_meat" } });
      await showMeatCategories(phone);
      return;
    }

    if (command === "srv_med") {
      if (!isServiceAvailableNow()) {
        await sendText(phone, `⚠️ సమయం ముగిసింది! ${AVENTO_CALL_PHONE} కి కాల్ చేయండి.`);
        await sendNavigation(phone);
        return;
      }
      await startService(phone, "medicine");
      await setState(phone, "AWAITING_PRESCRIPTION", { temp_selection: { service: "medicine" } });
      await sendText(phone, "💊 ప్రిస్క్రిప్షన్ ఫోటో పంపండి.");
      await sendNavigation(phone);
      return;
    }

    if (command === "srv_plumbing") {
      if (!isServiceAvailableNow()) {
        await sendText(phone, `⚠️ సమయం ముగిసింది! ${AVENTO_CALL_PHONE} కి కాల్ చేయండి.`);
        await sendNavigation(phone);
        return;
      }
      await startService(phone, "plumbing_electrical");
      await setState(phone, "AWAITING_SERVICE_DETAILS", { temp_selection: { service: "plumbing_electrical", notes: "" } });
      await sendText(phone, "🔧 సమస్య వివరాలు లేదా ఫోటో పంపండి.");
      await sendNavigation(phone);
      return;
    }

    if (command === "srv_shifting") {
      if (!isServiceAvailableNow()) {
        await sendText(phone, `⚠️ సమయం ముగిసింది! ${AVENTO_CALL_PHONE} కి కాల్ చేయండి.`);
        await sendNavigation(phone);
        return;
      }
      await startService(phone, "shifting");
      await sendList(phone, "🚚 ఏ సర్వీస్ కావాలి?", "సర్వీస్ ఎంచుకోండి", [
        {
          title: "Shifting",
          rows: [
            { id: "shift_home", title: "Home Shifting" },
            { id: "shift_parcel", title: "Parcel Delivery" },
          ],
        },
      ]);
      return;
    }

    const pageMatch = String(command).match(/^foodpage_(.+)_([^_]+)_(\d+)$/);
    if (pageMatch) {
      const hotelId = pageMatch[1];
      const categoryId = pageMatch[2];
      const pageNum = Number(pageMatch[3]);
      await showFoodItems(phone, hotelId, categoryId, pageNum);
      return;
    }

    if (String(command).startsWith("cat_")) {
      const parts = command.replace("cat_", "").split("_");
      const hotelId = parts[0];
      const categoryId = parts.slice(1).join("_");
      await showFoodItems(phone, hotelId, categoryId, 0);
      return;
    }

    if (String(command).startsWith("item_")) {
      const parts = command.replace("item_", "").split("_");
      const hotelId = parts[0];
      const itemId = parts.slice(1).join("_");
      const item = getFoodItem(itemId, hotelId);

      if (!item) {
        await sendText(phone, "ఈ ఐటమ్ దొరకలేదు.");
        await sendNavigation(phone);
        return;
      }

      const updatedCart = [
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price || 0),
          quantity: 1,
          unit: "item",
          service: "food",
        },
      ];

      await setState(phone, "CART", { cart: updatedCart });
      await showCart(phone, updatedCart, temp.hotel_name);
      return;
    }

    const meatCategory = getMeatCategories().find(cat => String(cat.id) === String(command));
    if (meatCategory) {
      const meatItem = meatCategory.items?.[0];
      if (!meatItem) {
        await sendText(phone, "ఈ మీట్ కేటగిరీలో ఐటమ్స్ లేవు.");
        await sendNavigation(phone);
        return;
      }
      await setState(phone, "MEAT_QUANTITY", {
        temp_selection: { ...temp, service: "fresh_meat", selected_meat_id: meatItem.id },
      });
      await showMeatQuantities(phone, meatItem);
      return;
    }

    const quantityMatch = String(command).match(/^qty_(\d+)_([A-Za-z0-9_-]+)$/);
    if (quantityMatch) {
      const quantityIndex = Number(quantityMatch[1]);
      const meatItem = getMeatItem(quantityMatch[2]);
      const quantityOption = (freshMeatMenu.quantities || [])[quantityIndex];

      if (!meatItem || !quantityOption) {
        await sendText(phone, "పరిమాణం సరిగ్గా లేదు.");
        await sendNavigation(phone);
        return;
      }

      const rawQuantity = quantityOption.value ?? quantityOption.kg ?? 1;
      const parsedQuantity = Number(String(rawQuantity).match(/\d+(?:\.\d+)?/)?.[0] || 1);

      const updatedCart = [
        ...cart,
        {
          id: `${meatItem.id}_${Date.now()}`,
          name: meatItem.name,
          quantity: parsedQuantity,
          unit: "KG",
          price: 0,
          price_pending: true,
          service: "fresh_meat",
        },
      ];

      await setState(phone, "CART", { cart: updatedCart, temp_selection: { ...temp, service: "fresh_meat" } });
      await showCart(phone, updatedCart);
      return;
    }

    if (command === "cart_add_more") {
      if (temp.service === "fresh_meat") {
        await showMeatCategories(phone);
      } else if (temp.service === "food") {
        await showFoodCategories(phone, temp.hotel_id, temp.hotel_name);
      } else {
        await showMainMenu(phone);
      }
      return;
    }

    if (command === "cart_remove") {
      await showRemoveItems(phone, cart);
      return;
    }

    if (String(command).startsWith("remove_")) {
      const index = Number(String(command).slice(7));
      if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
        await sendText(phone, "తొలగించాల్సిన ఐటమ్ సరిగ్గా లేదు.");
        await sendNavigation(phone);
        return;
      }
      const updatedCart = cart.filter((_, i) => i !== index);
      await setState(phone, "CART", { cart: updatedCart });
      await showCart(phone, updatedCart, temp.hotel_name);
      return;
    }

    if (command === "cart_checkout") {
      if (!cart.length) {
        await sendText(phone, "మీ కార్ట్ ఖాళీగా ఉంది.");
        await sendNavigation(phone);
        return;
      }
      await askForLocation(phone, user);
      return;
    }

    if (command === "order_submit") {
      if (user.current_state !== "REVIEW_ORDER") {
        await sendText(phone, "ఆర్డర్ స్టేటస్ సరిగ్గా లేదు.");
        await sendNavigation(phone);
        return;
      }
      await initiatePaymentFlow(phone, user);
      return;
    }

    if (type === "text") {
      await sendText(phone, "క్షమించండి, మీ ఎంపిక అర్థం కాలేదు. Main Menu కోసం 'Menu' అని పంపండి.");
      await sendNavigation(phone);
    }
  } catch (error) {
    console.error("Webhook error:", error.response?.data || error.message);
  }
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="te">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avento Services - WhatsApp Bot</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f8; text-align: center; padding: 50px 20px; }
            .card { background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h2 { color: #075e54; margin-bottom: 10px; }
            p { color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
            .btn { display: inline-block; background-color: #25d366; color: white; padding: 12px 25px; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 30px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🙏 Avento Services</h2>
            <p>నమస్కారం! Avento Services‌కు స్వాగతం.</p>
            <a class="btn" href="https://wa.me/919059135163?text=Hi%20Avento%20Services" target="_blank">💬 WhatsApp లో చాట్ చేయండి</a>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Avento WhatsApp Bot running on port ${PORT}`);
});