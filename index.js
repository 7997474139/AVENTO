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
// FOOD PLACE RESTAURANT MENU (+₹20 on every item)
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
      id: "fp_breads",
      title: "Tandoor — Breads",
      items: [
        { id: "fp_br1", name: "🫓 Tandoori Roti", price: 75 },
        { id: "fp_br2", name: "🫓 Butter Roti", price: 80 },
        { id: "fp_br3", name: "🫓 Butter Naan", price: 80 },
        { id: "fp_br4", name: "🫓 Plain Naan", price: 75 },
        { id: "fp_br5", name: "🫓 Garlic Naan", price: 100 },
        { id: "fp_br6", name: "🫓 Plain Kulcha", price: 80 },
        { id: "fp_br7", name: "🫓 Butter Kulcha", price: 85 },
        { id: "fp_br8", name: "🫓 Methi Roti", price: 85 },
        { id: "fp_br9", name: "🫓 Kothimeera Roti", price: 80 },
        { id: "fp_br10", name: "🫓 Pulka", price: 70 },
      ],
    },
    {
      id: "fp_kababs",
      title: "Tandoor — Kababs",
      items: [
        { id: "fp_k1", name: "🍗 Tandoori Chicken (Full)", price: 489 },
        { id: "fp_k2", name: "🍗 Tandoori Chicken (Half)", price: 289 },
        { id: "fp_k3", name: "🍗 Chicken Tikka", price: 289 },
        { id: "fp_k4", name: "🍗 Haryali Tikka", price: 299 },
        { id: "fp_k5", name: "🍗 Tangdi Kabab Full (Leg Piece)", price: 299 },
        { id: "fp_k6", name: "🍗 Malai Tikka", price: 299 },
        { id: "fp_k7", name: "🍗 Tangdi Kabab Half (Leg Piece)", price: 189 },
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
        { id: "fp_nfr8", name: "🍗 Saugai Fried Rice", price: 250 },
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

// ==================================================
// RESTAURANT REGISTRY (Brindavan & Food Place Restaurant only)
// ==================================================
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

if (!RESEND_API_KEY) console.warn("⚠️  RESEND_API_KEY not set — email notifications disabled.");
if (!ADMIN_EMAIL) console.warn("⚠️  ADMIN_EMAIL not set — email notifications disabled.");
if (!AVENTO_ADMIN_PHONE) console.warn("⚠️  AVENTO_ADMIN_PHONE not set — admin WhatsApp notifications disabled.");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function sendOrderEmail(subject, htmlContent) {
  if (!resend || !ADMIN_EMAIL) {
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
    console.log("✅ Order email sent successfully via Resend API!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

// ==================================================
// HELPERS
// ==================================================

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
  if (distanceInKm <= 2) return 30;
  return Math.round(30 + (distanceInKm - 2) * 10);
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

function getFoodCategories(hotelId = "brindavanam") {
  const key = String(hotelId || "brindavanam").trim().toLowerCase();
  const menu = restaurantMenus[key] || restaurantMenus.brindavanam;
  return Array.isArray(menu?.categories) ? menu.categories : [];
}

function getFoodItem(itemId, hotelId = null) {
  return getFoodCategories(hotelId)
    .flatMap(category => category.items || [])
    .find(item => String(item.id) === String(itemId));
}

function getCartTotal(cart) {
  return cart.reduce((total, item) => {
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

function isServiceAvailableNow() {
  if (String(process.env.BYPASS_SERVICE_HOURS || "").toLowerCase() === "true") {
    return true;
  }

  const currentHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date())
  );
  return currentHour >= 6 && currentHour < 21;
}

// ==================================================
// WHATSAPP API
// ==================================================

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
  if (!fs.existsSync(filePath)) throw new Error(`Image file not found: ${filePath}`);
  const contentType = mime.lookup(filePath);
  if (!contentType) throw new Error(`Unsupported image file: ${filePath}`);
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(filePath), {
    contentType,
    filename: path.basename(filePath),
  });
  form.append("type", contentType);

  const response = await axios.post(`${GRAPH_URL}/${PHONE_NUMBER_ID}/media`, form, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      ...form.getHeaders(),
    },
    timeout: 30000,
  });
  return response.data.id;
}

async function sendLocalImage(phone, filePath, caption = "") {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("Image file missing:", filePath);
      if (caption) await sendText(phone, caption);
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
    if (caption) {
      try {
        await sendText(phone, caption);
      } catch (fallbackError) {
        console.error(
          "Caption fallback failed:",
          fallbackError.response?.data || fallbackError.message
        );
      }
    }
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
          reply: {
            id: button.id,
            title: button.title.slice(0, 20),
          },
        })),
      },
    },
  });
}

async function sendNavigation(to) {
  try {
    await sendButtons(to, "⬇️ More options", [
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
        ...(row.description
          ? { description: String(row.description).slice(0, 72) }
          : {}),
      })),
    }))
    .filter(section => section.rows.length);

  if (!safeSections.length) {
    await sendText(
      to,
      "No options are available right now. Please try again in a moment."
    );
    await sendNavigation(to);
    return;
  }

  await sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: String(buttonText).slice(0, 20),
        sections: safeSections,
      },
    },
  });

  await sendNavigation(to);
}

// ==================================================
// SUPABASE
// ==================================================

async function getOrCreateUser(phone) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", phone)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      phone_number: phone,
      current_state: "IDLE",
      cart: [],
      temp_selection: {},
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retried, error: retryError } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phone)
        .single();
      if (retryError) throw retryError;
      return retried;
    }
    throw insertError;
  }

  return created;
}

async function updateUser(phone, updates) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("phone_number", phone);
  if (error) throw error;
}

async function setState(phone, state, extra = {}) {
  await updateUser(phone, { current_state: state, ...extra });
}

async function saveOrder(phone, serviceType, details, status = "REQUESTED") {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_phone: phone,
      service_type: serviceType,
      details: JSON.stringify(details),
      status,
    })
    .select("*")
    .single();
  if (error) {
    console.error("Supabase order save error:", error);
    throw error;
  }
  return data;
}

async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateOrder(orderId, updates) {
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select("*")
    .maybeSingle();
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

// ==================================================
// HOTEL SELECTION (entry point)
// ==================================================

async function goToHotels(phone) {
  await setState(phone, "SELECT_HOTEL", {
    cart: [],
    location: null,
    temp_selection: { service: "food" },
  });
  await showHotels(phone);
}

async function showHotels(to) {
  await setState(to, "SELECT_HOTEL");

  const available = isServiceAvailableNow();
  console.log(
    `[showHotels] phone=${to} service_available=${available} bypass=${process.env.BYPASS_SERVICE_HOURS || "off"}`
  );

  const welcomeText =
    "🙏 *Namaste! Welcome to Avento Food Delivery.*\n\n" +
    "Please select the hotel you would like to order from.";
  const welcomeImagePath = serviceImage("welcome.jpg");
  console.log(
    `[showHotels] welcome image path=${welcomeImagePath} exists=${fs.existsSync(welcomeImagePath)}`
  );

  try {
    const sent = await sendLocalImage(to, welcomeImagePath, welcomeText);
    console.log(
      `[showHotels] welcome result: ${sent ? "image+caption sent" : "fallback text sent"}`
    );
  } catch (e) {
    console.error(
      "[showHotels] welcome send error:",
      e.response?.data || e.message
    );
  }

  if (!available) {
    await sendText(
      to,
      "🌙 *Avento Food Delivery is currently closed.*\n\n" +
        "Our service hours are over. Please try again tomorrow.\n\n" +
        `⚡ *If it is urgent*, please call this number: *${AVENTO_CALL_PHONE}*\n\n` +
        `Thank you! 🙏`
    );
    await sendNavigation(to);
    return;
  }

  await sendList(to, "🍽️ Please select a hotel:", "Select Hotel", [
    {
      title: "Available Hotels",
      rows: HOTEL_LIST.map(h => ({
        id: `hotel_${h.id}`,
        title: h.name,
        description: h.description,
      })),
    },
  ]);
}

async function goBack(phone, user) {
  const state = user.current_state || "IDLE";
  const temp = getTemp(user);
  const cart = getCart(user);

  switch (state) {
    case "SELECT_HOTEL":
      await goToHotels(phone);
      return;
    case "FOOD_CATEGORY":
      await goToHotels(phone);
      return;
    case "FOOD_ITEMS":
      await showFoodCategories(phone, temp.hotel_name, temp.hotel_id);
      return;
    case "CART":
      await showFoodCategories(phone, temp.hotel_name, temp.hotel_id);
      return;
    case "AWAITING_LOCATION":
      if (cart.length) {
        await showCart(phone, cart, temp.hotel_name);
      } else {
        await goToHotels(phone);
      }
      return;
    case "AWAITING_UTR":
      await sendText(
        phone,
        "Your payment reference is still pending. You can complete verification by sending the UTR or a payment photo."
      );
      await sendNavigation(phone);
      return;
    default:
      await goToHotels(phone);
  }
}

// ==================================================
// MENU BROWSING
// ==================================================

async function showFoodCategories(to, hotelName, hotelId = null) {
  const categories = getFoodCategories(hotelId);
  await setState(to, "FOOD_CATEGORY");
  await sendList(
    to,
    `🏨 ${hotelName || "Food Place Restaurant"}\n\n🍽️ Please select the food category you would like.`,
    "Food Categories",
    [
      {
        title: "Restaurant Menu",
        rows: categories.slice(0, 10).map(category => ({
          id: `cat_${category.id}`,
          title: category.title || category.name || category.id,
        })),
      },
    ]
  );
}

async function showFoodItems(to, categoryId, page = 0, hotelId = null) {
  const category = getFoodCategories(hotelId).find(
    item => String(item.id) === String(categoryId)
  );
  if (!category) {
    await sendText(to, "This category was not found.");
    await sendNavigation(to);
    return;
  }

  const items = category.items || [];
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  page = Math.max(0, Math.min(page, totalPages - 1));

  const visibleItems = items.slice(page * pageSize, page * pageSize + pageSize);

  const rows = visibleItems.map(item => ({
    id: `item_${item.id}`,
    title: item.name,
    description: formatRupees(item.price),
  }));

  if (page > 0) {
    rows.push({
      id: `foodpage_${categoryId}_${page - 1}`,
      title: "Previous Page",
    });
  }
  if (page < totalPages - 1) {
    rows.push({
      id: `foodpage_${categoryId}_${page + 1}`,
      title: "Next Page",
    });
  }

  await setState(to, "FOOD_ITEMS", {
    temp_selection: {
      ...getTemp(await getOrCreateUser(to)),
      current_category_id: categoryId,
      current_page: page,
      ...(hotelId ? { hotel_id: hotelId } : {}),
    },
  });

  await sendList(
    to,
    `${category.title || category.name || category.id}\nPage ${page + 1}/${totalPages}\n\nPlease select the item you would like.`,
    "Food Items",
    [{ title: "Available Items", rows }]
  );
}

// ==================================================
// CART
// ==================================================

function renderCart(cart) {
  if (!cart.length) return "Your cart is empty.";

  const lines = cart.map((item, index) => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    return (
      `${index + 1}. ${item.name}\n` +
      `   Qty: ${quantity}\n` +
      `   Price: ${formatRupees(price * quantity)}`
    );
  });

  lines.push("\n--------------------");
  lines.push(`Food Total: ${formatRupees(getCartTotal(cart))}`);
  return lines.join("\n");
}

async function showCart(to, cart, hotelName) {
  await setState(to, "CART");
  const hotelLine = hotelName ? `🏨 Hotel: ${hotelName}\n\n` : "";

  await sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: `🛒 Your Cart\n\n${hotelLine}${renderCart(cart)}\n\n👇 What would you like to do?`,
      },
      action: {
        button: "Cart Options",
        sections: [
          {
            title: "Cart Actions",
            rows: [
              { id: "cart_add_more", title: "➕ Add more items" },
              { id: "cart_back", title: "⬅️ Back" },
              { id: "cart_remove", title: "🗑️ Remove item" },
              { id: "cart_checkout", title: "✅ Confirm order" },
            ],
          },
        ],
      },
    },
  });
}

async function showRemoveItems(to, cart) {
  if (!cart.length) {
    await sendText(to, "Your cart is empty.");
    await sendNavigation(to);
    return;
  }
  await sendList(to, "Please select the item to remove.", "Remove Item", [
    {
      title: "Cart Items",
      rows: cart.slice(0, 10).map((item, index) => ({
        id: `remove_${index}`,
        title: `${index + 1}. ${item.name}`,
      })),
    },
  ]);
}

// ==================================================
// LOCATION & PAYMENT
// ==================================================

async function askForLocation(phone, user) {
  await setState(phone, "AWAITING_LOCATION", {
    temp_selection: { ...getTemp(user), purpose: "CHECKOUT" },
  });
  await sendText(
    phone,
    "📍 Please share your location.\n\n" +
      "This is required to calculate delivery charges and for the delivery boy to reach you."
  );
  await sendNavigation(phone);
}

async function sendPaymentInstructions(phone, order, details) {
  const amount = Number(details.total || 0);

  if (!AVENTO_UPI_ID) {
    await sendText(
      phone,
      `Your order #${order.id} has been recorded. However, the UPI ID is not set up. Please contact our team.`
    );
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    await sendText(
      phone,
      `The price for your order #${order.id} has not been confirmed yet. Our team will inform you of the price.`
    );
    return;
  }

  const qrPath = serviceImage("payment-qr.png");

  // ============================================================
  // DIRECT UPI DEEP LINK — HIDDEN FROM USER (kept for future use)
  // ============================================================
  // const upiDeepLink = `upi://pay?pa=${AVENTO_UPI_ID}&pn=${encodeURIComponent(
  //   AVENTO_UPI_NAME
  // )}&am=${amount}&cu=INR`;

  const caption =
    `💳 *PAYMENT REQUIRED* 💳\n\n` +
    `🧾 Order Number: *#${order.id}*\n` +
    `🏨 Hotel: ${details.hotel_name || "Food Place Restaurant"}\n\n` +
    `🍽️ Food Total: ${formatRupees(details.food_total)}\n` +
    `🚚 Delivery Charges: ${formatRupees(details.delivery_fee)}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total: ${formatRupees(amount)}*\n\n` +
    `📱 UPI ID: *${AVENTO_UPI_ID}*\n` +
    `👤 Name: *${AVENTO_UPI_NAME}*\n\n` +
    `⚡ *Note:* Scan the PhonePe QR code above or pay to the UPI ID above. After payment, send the *12-digit UTR number or payment screenshot* here.\n` +
    `━━━━━━━━━━━━━━━━━━━`;

  const sent = await sendLocalImage(phone, qrPath, caption);
  if (!sent) await sendText(phone, caption);
}

async function initiatePaymentFlow(phone, user) {
  const cart = getCart(user);
  const temp = getTemp(user);
  const location = getLocation(user);

  if (!cart.length) {
    await sendText(phone, "Your cart is empty. Please select items first.");
    await sendNavigation(phone);
    return;
  }

  const foodTotal = getCartTotal(cart);
  let deliveryFee = 0;

  if (location) {
    const distance = calculateDistance(
      RESTAURANT_LAT,
      RESTAURANT_LNG,
      location.latitude,
      location.longitude
    );
    deliveryFee = calculateDeliveryFee(distance);
  }

  const totalAmount = foodTotal + deliveryFee;

  if (totalAmount <= 0) {
    await sendText(phone, "Order amount is invalid. Please check your cart again.");
    return;
  }

  const details = {
    service: "food",
    items: cart,
    food_total: foodTotal,
    delivery_fee: deliveryFee,
    total: totalAmount,
    location: location,
    hotel_name: temp.hotel_name || null,
    hotel_id: temp.hotel_id || null,
    payment: {
      method: "UPI_MANUAL",
      status: "PENDING",
      utr_transaction_id: null,
    },
    created_at: new Date().toISOString(),
  };

  try {
    const cleanPhone = normalizePhone(phone);
    const chatLink = `https://wa.me/${cleanPhone}`;
    const loc = details.location
      ? `https://maps.google.com/?q=${details.location.latitude},${details.location.longitude}`
      : "Location not provided";

    const order = await saveOrder(phone, "food", details, "PENDING_PAYMENT");
    await setState(phone, "AWAITING_UTR", {
      temp_selection: { ...temp, pending_order_id: order.id },
    });

    await sendPaymentInstructions(phone, order, details);
    await sendNavigation(phone);

    const itemsList = cart
      .map(i => `${i.name} (Qty: ${i.quantity})`)
      .join(", ");

    if (AVENTO_ADMIN_PHONE) {
      await sendWhatsApp({
        to: AVENTO_ADMIN_PHONE,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text:
              `🍽️ *New food order received! (#${order.id})*\n\n` +
              `🏨 Hotel: ${details.hotel_name || "Food Place Restaurant"}\n` +
              `👤 Customer WhatsApp: ${cleanPhone}\n` +
              `💬 Chat link: ${chatLink}\n` +
              `🛒 Items: ${itemsList}\n` +
              `💰 Total payable: ${formatRupees(totalAmount)}\n` +
              `📍 Location: ${loc}`,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm / Paid" },
              },
              {
                type: "reply",
                reply: { id: `adm_ask_ss_${order.id}`, title: "📸 Ask Screenshot" },
              },
              {
                type: "reply",
                reply: { id: `adm_rej_${order.id}`, title: "❌ Reject" },
              },
            ],
          },
        },
      });
    }

    await sendOrderEmail(
      `🚀 New food order received! (#${order.id})`,
      `<h2>🍽️ New Food Order (${details.hotel_name || "Food Place Restaurant"})</h2>
       <p><b>Phone / WhatsApp:</b> <a href="${chatLink}" target="_blank">${phone} (Open chat)</a></p>
       <p><b>Items:</b> ${itemsList}</p>
       <p><b>Food Total:</b> ${formatRupees(foodTotal)}</p>
       <p><b>Delivery Charges:</b> ${formatRupees(deliveryFee)}</p>
       <p><b>Total Payable:</b> ${formatRupees(totalAmount)}</p>
       <p><b>Location:</b> <a href="${loc}" target="_blank">View on Google Maps</a></p>`
    );
  } catch (error) {
    console.error("Payment flow error:", error.message);
    await sendText(
      phone,
      "There was an error processing your order. Please try again."
    );
  }
}

// ==================================================
// ADMIN COMMANDS
// ==================================================

async function handleAdminCommand(phone, text) {
  if (!isAdmin(phone)) return false;

  const trimmed = String(text || "").trim();

  const paidMatch = trimmed.match(/^paid\s+(\S+)$/i);
  if (paidMatch) {
    const orderId = paidMatch[1];
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        await sendText(phone, `Order not found: ${orderId}`);
        return true;
      }

      const details = parseOrderDetails(order.details);
      details.payment = {
        ...(details.payment || {}),
        status: "PAID",
        verified_manually: true,
        verified_at: new Date().toISOString(),
      };

      await updateOrder(orderId, {
        details: JSON.stringify(details),
        status: "PREPARING",
      });

      await setState(order.user_phone, "IDLE", {
        cart: [],
        location: null,
        temp_selection: {},
      });

      await sendButtons(
        order.user_phone,
        `🎉 Your order has been booked successfully. Thank you! 🙏\n\n` +
          `✅ Your order is confirmed.\n` +
          `🧾 Order Number: #${order.id}\n` +
          `💰 Total: ${formatRupees(details.total)}\n\n` +
          `📦 Status: Order sent to hotel (Preparing).`,
        [
          { id: "track_order", title: "📦 Track Order" },
          { id: "nav_main", title: "🏠 Main Menu" },
        ]
      );

      await sendButtons(
        phone,
        `✅ Order #${order.id} successfully confirmed!\n\nSelect a status update for the customer:`,
        [
          { id: `st_prep_${order.id}`, title: "👨‍🍳 Preparing" },
          { id: `st_out_${order.id}`, title: "🚀 Out for Delivery" },
          { id: `st_del_${order.id}`, title: "✅ Delivered" },
        ]
      );
    } catch (error) {
      console.error("Admin paid command error:", error.message);
      await sendText(phone, "Could not confirm the order.");
    }
    return true;
  }

  const statusMatch = trimmed.match(/^status\s+(\S+)$/i);
  if (statusMatch) {
    const orderId = statusMatch[1];
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        await sendText(phone, `Order not found: ${orderId}`);
        return true;
      }
      await sendButtons(
        phone,
        `⚙️ *Order #${orderId} Status Update*\n\nPlease select one of the buttons below:`,
        [
          { id: `st_prep_${orderId}`, title: "👨‍🍳 Preparing" },
          { id: `st_out_${orderId}`, title: "🚀 Out for Delivery" },
          { id: `st_del_${orderId}`, title: "✅ Delivered" },
        ]
      );
    } catch (error) {
      console.error("Admin status command error:", error.message);
      await sendText(phone, "Error sending order status buttons.");
    }
    return true;
  }

  return false;
}

// ==================================================
// WEBHOOK VERIFICATION
// ==================================================

app.get(["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"], (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ==================================================
// INCOMING WHATSAPP MESSAGES
// ==================================================

app.post(["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"], async (req, res) => {
  res.sendStatus(200);

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return;

    const phone = message.from;
    const type = message.type;

    const text = type === "text" ? message.text?.body?.trim() || "" : "";

    const command =
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id ||
      text;

    const normalized = normalize(command);

    const user = await getOrCreateUser(phone);
    const cart = getCart(user);
    const temp = getTemp(user);

    if (type === "text" && (await handleAdminCommand(phone, text))) {
      return;
    }

    // ==========================================
    // ADMIN BUTTON ACTIONS
    // ==========================================
    if (String(command).startsWith("adm_")) {
      if (!isAdmin(phone)) return;

      const parts = String(command).split("_");
      const action = parts[1];
      let orderId = parts.slice(2).join("_");

      let subAction = action;
      if (action === "ask" && parts[2] === "ss") {
        subAction = "ask_ss";
        orderId = parts.slice(3).join("_");
      }

      const order = await getOrderById(orderId);
      if (!order) return;

      if (subAction === "paid") {
        const details = parseOrderDetails(order.details);
        details.payment = {
          ...(details.payment || {}),
          status: "PAID",
          verified_manually: true,
        };

        await updateOrder(orderId, {
          details: JSON.stringify(details),
          status: "PREPARING",
        });

        await setState(order.user_phone, "IDLE", {
          cart: [],
          location: null,
          temp_selection: {},
        });

        await sendButtons(
          order.user_phone,
          `🎉 Your order has been booked successfully. Thank you! 🙏\n\n` +
            `✅ Your order is confirmed.\n` +
            `🧾 Order Number: #${order.id}\n` +
            `💰 Total: ${formatRupees(details.total)}\n\n` +
            `📦 Status: Order sent to hotel (Preparing).`,
          [
            { id: "track_order", title: "📦 Track Order" },
            { id: "nav_main", title: "🏠 Main Menu" },
          ]
        );

        await sendButtons(
          phone,
          `✅ Order #${orderId} successfully confirmed!\n\nSelect status update:`,
          [
            { id: `st_prep_${orderId}`, title: "👨‍🍳 Preparing" },
            { id: `st_out_${orderId}`, title: "🚀 Out for Delivery" },
            { id: `st_del_${orderId}`, title: "✅ Delivered" },
          ]
        );
      } else if (subAction === "ask_ss") {
        await setState(order.user_phone, "AWAITING_UTR", {
          temp_selection: { pending_order_id: order.id },
        });

        await sendText(
          order.user_phone,
          `📸 *Payment screenshot required! (#${order.id})*\n\n` +
            `Please send your successful UPI payment screenshot here on WhatsApp. Our team will verify it and process your order.`
        );
        await sendText(
          phone,
          `📸 Screenshot request for Order #${orderId} has been sent to the customer.`
        );
      } else if (subAction === "rej") {
        await updateOrder(orderId, { status: "REJECTED" });
        await sendText(
          order.user_phone,
          `❌ Sorry, your order #${orderId} has been rejected as it is currently unavailable. Please try again.`
        );
        await sendText(phone, `❌ Order #${orderId} rejected successfully.`);
      }
      return;
    }

    // ==========================================
    // STATUS UPDATE BUTTON ACTIONS FROM ADMIN
    // ==========================================
    if (String(command).startsWith("st_")) {
      if (!isAdmin(phone)) return;

      const parts = String(command).split("_");
      const action = parts[1];
      const orderId = parts[2];

      const order = await getOrderById(orderId);
      if (!order) return;

      let newStatusText = "";
      let statusMessageToCustomer = "";

      if (action === "prep") {
        newStatusText = "PREPARING";
        statusMessageToCustomer = `👨‍🍳 Update: Your order is being prepared at the hotel. It will be ready for delivery soon!`;
      } else if (action === "out") {
        newStatusText = "OUT_FOR_DELIVERY";
        statusMessageToCustomer = `🚀 Update: Your order has been handed to the delivery boy and is on the way to your location (Out for Delivery)!`;
      } else if (action === "del") {
        newStatusText = "DELIVERED";
        statusMessageToCustomer = `✅ Your order has been delivered successfully! Thank you for choosing Avento Services. 🙏\n\nVisit the Main Menu to place more orders.`;
      }

      await updateOrder(orderId, { status: newStatusText });

      if (action === "del") {
        await sendText(
          order.user_phone,
          `📦 *Order Delivered* (#${order.id})\n\n${statusMessageToCustomer}`
        );
        await setState(order.user_phone, "IDLE", {
          cart: [],
          location: null,
          temp_selection: {},
        });
        await sendText(
          phone,
          `✅ Order #${orderId} delivered successfully and the order has been closed.`
        );
      } else {
        await sendButtons(
          order.user_phone,
          `📦 *Live Order Tracking* (#${order.id})\n\n${statusMessageToCustomer}`,
          [
            { id: "track_order", title: "📦 Track Order" },
            { id: "nav_main", title: "🏠 Main Menu" },
          ]
        );
        await sendButtons(
          phone,
          `✅ Order #${orderId} status successfully changed to '${newStatusText}'.\n\nSelect to change to another status:`,
          [
            { id: `st_prep_${orderId}`, title: "👨‍🍳 Preparing" },
            { id: `st_out_${orderId}`, title: "🚀 Out for Delivery" },
            { id: `st_del_${orderId}`, title: "✅ Delivered" },
          ]
        );
      }
      return;
    }

    // ==========================================
    // CUSTOMER TRACK ORDER
    // ==========================================
    if (
      command === "track_order" ||
      ["track order", "where is my order", "order status"].includes(normalized)
    ) {
      const latestOrder = await getLatestCustomerOrder(phone);

      if (!latestOrder) {
        await sendText(phone, "No active orders were found for your number.");
        await sendNavigation(phone);
        return;
      }

      const st = latestOrder.status;

      if (st === "DELIVERED" || st === "REJECTED") {
        await sendText(
          phone,
          `📦 Order Number #${latestOrder.id} is already complete (Status: ${st}).\n\nTo place a new order, please send 'Hi' or 'Menu'.`
        );
        await sendNavigation(phone);
        return;
      }

      let statusDesc = "";
      if (st === "PENDING_PAYMENT") statusDesc = "💳 Payment is pending.";
      else if (st === "PAYMENT_REVIEW") statusDesc = "🔍 Payment verification in progress.";
      else if (st === "PREPARING" || st === "CONFIRMED") statusDesc = "👨‍🍳 Your order is being prepared at the hotel.";
      else if (st === "OUT_FOR_DELIVERY") statusDesc = "🚀 The delivery boy is on the way to your location (Out for Delivery)!";
      else statusDesc = `Status: ${st}`;

      if (AVENTO_ADMIN_PHONE) {
        await sendText(
          AVENTO_ADMIN_PHONE,
          `🔔 *Customer Update Request*\n\n` +
            `Customer (${phone}) is requesting an update for Order #${latestOrder.id}.\n` +
            `Current Status: ${statusDesc}`
        );
      }

      await sendButtons(
        phone,
        `📦 *Order Tracking Details*\n\n` +
          `🧾 Order Number: #${latestOrder.id}\n` +
          `📌 Current Status: ${statusDesc}\n\n` +
          `Select Main Menu if you need any help.`,
        [
          { id: "track_order", title: "🔄 Refresh Status" },
          { id: "nav_main", title: "🏠 Main Menu" },
        ]
      );
      return;
    }

    // ==========================================
    // GREETING / MAIN MENU → HOTEL LIST
    // ==========================================
    if (
      command === "nav_main" ||
      command === "srv_food" ||
      ["hi", "hello", "menu", "start", "hi avento services", "hi avento"].includes(normalized)
    ) {
      await goToHotels(phone);
      return;
    }

    if (
      command === "nav_back" ||
      ["back"].includes(normalized)
    ) {
      await goBack(phone, user);
      return;
    }

    // ==========================================
    // PAYMENT PROOF / UTR / SCREENSHOT HANDLING
    // ==========================================
    if (user.current_state === "AWAITING_UTR") {
      let orderId = temp.pending_order_id;

      if (!orderId) {
        const latest = await getLatestCustomerOrder(phone);
        if (latest) orderId = latest.id;
      }

      if (!orderId) {
        await sendText(
          phone,
          "Could not find your pending order number. Please contact our team."
        );
        return;
      }

      const order = await getOrderById(orderId);

      if (!order || normalizePhone(order.user_phone) !== normalizePhone(phone)) {
        await sendText(phone, "Could not find the order.");
        return;
      }

      let utrNumber = text;
      let imageMediaId = message.image?.id || null;

      if (type === "image" && imageMediaId) {
        utrNumber = `IMAGE_SCREENSHOT_${imageMediaId}`;
      }

      if (!utrNumber) {
        await sendText(
          phone,
          "Please send your PhonePe UTR / UPI Ref No or payment screenshot."
        );
        return;
      }

      const details = parseOrderDetails(order.details);

      details.payment = {
        ...(details.payment || {}),
        method: "UPI_MANUAL",
        status: "PAYMENT_REVIEW",
        utr_transaction_id: utrNumber,
        screenshot_media_id: imageMediaId,
        submitted_at: new Date().toISOString(),
      };

      await updateOrder(orderId, {
        details: JSON.stringify(details),
        status: "PAYMENT_REVIEW",
      });

      await setState(phone, "IDLE", { cart: [], temp_selection: {} });

      await sendText(
        phone,
        `✅ Your UTR number / details have been received.\n\n` +
          `🧾 Order Number: #${order.id}\n` +
          `Our team will verify this UTR and confirm your order after verifying payment.\n\n` +
          `Thank you! 🙏`
      );

      const cleanPhone = normalizePhone(phone);
      const chatLink = `https://wa.me/${cleanPhone}`;

      await sendOrderEmail(
        `💳 New payment review received! (#${order.id})`,
        `<h2>💳 Payment verification required</h2>
         <p><b>Order ID:</b> #${order.id}</p>
         <p><b>Customer WhatsApp:</b> <a href="${chatLink}" target="_blank" style="color: #25D366; font-weight: bold;">💬 Open chat to view (${phone})</a></p>
         <p><b>Amount:</b> ${formatRupees(details.total)}</p>
         <p><b>UTR / Text:</b> ${text || "Screenshot sent"}</p>`
      );

      if (AVENTO_ADMIN_PHONE) {
        if (imageMediaId) {
          try {
            await sendWhatsApp({
              to: AVENTO_ADMIN_PHONE,
              type: "image",
              image: { id: imageMediaId },
            });
          } catch (err) {
            console.error("Failed to forward payment image to admin:", err.message);
          }
        }

        await sendWhatsApp({
          to: AVENTO_ADMIN_PHONE,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text:
                `💳 *Payment Verification Required*\n\n` +
                `Order ID: #${order.id}\n` +
                `Customer: ${phone}\n` +
                `Amount: ${formatRupees(details.total)}\n` +
                `UTR / Info: ${text || "Screenshot received"}\n\n` +
                `Please check PhonePe/NetBanking and select the button below:`,
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm / Paid" },
                },
                {
                  type: "reply",
                  reply: { id: `adm_ask_ss_${order.id}`, title: "📸 Ask Screenshot" },
                },
                {
                  type: "reply",
                  reply: { id: `adm_rej_${order.id}`, title: "❌ Reject" },
                },
              ],
            },
          },
        });
      }
      return;
    }

    if (command === "order_cancel" || ["cancel"].includes(normalized)) {
      await setState(phone, "IDLE", {
        cart: [],
        location: null,
        temp_selection: {},
      });
      await sendText(phone, "Your current request has been cancelled.");
      await goToHotels(phone);
      return;
    }

    // ==========================================
    // LOCATION RECEIVED
    // ==========================================
    if (type === "location" && message.location) {
      if (user.current_state !== "AWAITING_LOCATION") {
        await sendText(
          phone,
          "Please enter the order process first and send your location when asked."
        );
        await sendNavigation(phone);
        return;
      }

      const location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
      };

      await updateUser(phone, { location, current_state: "REVIEW_ORDER" });

      const updatedUser = { ...user, location, current_state: "REVIEW_ORDER" };
      await showReviewAndConfirm(phone, updatedUser);
      return;
    }

    if (user.current_state === "AWAITING_LOCATION" && type === "text") {
      await sendText(
        phone,
        "📍 *Your location is very important!*\n\n" +
          "To help our service team reach you quickly and confirm delivery, your location is essential.\n\n" +
          "Instead of typing, please use WhatsApp's *Share Location* to share your location. 🙏"
      );
      await sendNavigation(phone);
      return;
    }

    // ==========================================
    // HOTEL SELECTION
    // ==========================================
    const hotelMatch = String(command).match(/^hotel_(.+)$/);
    if (hotelMatch) {
      const hotel = HOTEL_LIST.find(h => h.id === hotelMatch[1]);
      if (!hotel) {
        await sendText(phone, "Hotel not found.");
        await sendNavigation(phone);
        return;
      }

      await setState(phone, "FOOD_CATEGORY", {
        cart: [],
        temp_selection: {
          service: "food",
          hotel_id: hotel.id,
          hotel_name: hotel.name,
        },
      });
      await showFoodCategories(phone, hotel.name, hotel.id);
      return;
    }

    // ==========================================
    // MENU BROWSING (Direct items list on category click)
    // ==========================================
    const pageMatch = String(command).match(/^foodpage_(.+)_(\d+)$/);
    if (pageMatch) {
      await showFoodItems(phone, pageMatch[1], Number(pageMatch[2]), temp.hotel_id);
      return;
    }

    if (String(command).startsWith("cat_")) {
      await showFoodItems(phone, String(command).slice(4), 0, temp.hotel_id);
      return;
    }

    if (String(command).startsWith("item_")) {
      const item = getFoodItem(String(command).slice(5), temp.hotel_id);
      if (!item) {
        await sendText(phone, "This item was not found.");
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

    // ==========================================
    // CART ACTIONS
    // ==========================================
    if (command === "cart_add_more") {
      await showFoodCategories(phone, temp.hotel_name, temp.hotel_id);
      return;
    }

    if (command === "cart_back") {
      await showFoodCategories(phone, temp.hotel_name, temp.hotel_id);
      return;
    }

    if (command === "cart_remove") {
      await showRemoveItems(phone, cart);
      return;
    }

    if (String(command).startsWith("remove_")) {
      const index = Number(String(command).slice(7));
      if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
        await sendText(phone, "Invalid item to remove.");
        await sendNavigation(phone);
        return;
      }

      const updatedCart = cart.filter((_, i) => i !== index);
      await setState(phone, "CART", { cart: updatedCart });

      if (!updatedCart.length) {
        await sendText(phone, "Your cart is now empty.");
        await sendNavigation(phone);
        return;
      }

      await showCart(phone, updatedCart, temp.hotel_name);
      return;
    }

    if (command === "cart_checkout") {
      if (!cart.length) {
        await sendText(phone, "Your cart is empty.");
        await sendNavigation(phone);
        return;
      }
      await askForLocation(phone, user);
      return;
    }

    // ==========================================
    // REVIEW / SUBMIT
    // ==========================================
    if (command === "order_submit") {
      if (user.current_state !== "REVIEW_ORDER") {
        await sendText(
          phone,
          "Your order is not currently in review state. Please go to Main Menu and start again."
        );
        await sendNavigation(phone);
        return;
      }
      await initiatePaymentFlow(phone, user);
      return;
    }

    // ==========================================
    // FALLBACK
    // ==========================================
    if (type === "text") {
      await sendText(
        phone,
        "Sorry, I did not understand your selection.\n\nTap the Main Menu button below or send 'menu' to return to the main menu."
      );
      await sendNavigation(phone);
    } else if (type !== "interactive") {
      await sendText(
        phone,
        "📎 We cannot process this type of message. Please use text, a list option, or select from the menu."
      );
      await sendNavigation(phone);
    }
  } catch (error) {
    console.error("Webhook error:", error.response?.data || error.message);
  }
});

// ==================================================
// REVIEW & CONFIRM (after location is shared)
// ==================================================
async function showReviewAndConfirm(phone, user) {
  const temp = getTemp(user);
  const location = getLocation(user);
  const cart = getCart(user);

  const foodTotal = getCartTotal(cart);
  let deliveryFee = 0;
  let distanceKm = 0;

  if (location) {
    distanceKm = calculateDistance(
      RESTAURANT_LAT,
      RESTAURANT_LNG,
      location.latitude,
      location.longitude
    );
    deliveryFee = calculateDeliveryFee(distanceKm);
  }

  const grandTotal = foodTotal + deliveryFee;

  const summary =
    `🧾 *Your Order Summary*\n\n` +
    `🏨 Hotel: ${temp.hotel_name || "Food Place Restaurant"}\n\n` +
    `${renderCart(cart)}\n\n` +
    `📏 Distance: ${distanceKm.toFixed(1)} KM\n` +
    `🚚 Delivery Charges: ${formatRupees(deliveryFee)}\n` +
    `--------------------\n` +
    `💰 *Total: ${formatRupees(grandTotal)}*\n\n` +
    `👉 *Please select the button below to confirm.*`;

  await setState(phone, "REVIEW_ORDER");

  await sendButtons(phone, summary, [
    { id: "order_submit", title: "✅ Pay / Confirm" },
    { id: "order_cancel", title: "❌ Cancel" },
  ]);
}

// ==================================================
// HEALTH CHECK & LANDING PAGE
// ==================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "avento-whatsapp-bot",
    service_available_now: isServiceAvailableNow(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avento Services - WhatsApp Bot</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f8; text-align: center; padding: 50px 20px; }
            .card { background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h2 { color: #075e54; margin-bottom: 10px; }
            p { color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
            .btn { display: inline-block; background-color: #25d366; color: white; padding: 12px 25px; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 30px; box-shadow: 0 4px 6px rgba(37, 211, 102, 0.3); }
            .btn:hover { background-color: #1ebe5d; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🙏 Avento Services</h2>
            <p>Namaste! Welcome to Avento Services. To get the services you need, click the button below and send 'Hi'.</p>
            <a class="btn" href="https://wa.me/919059135163?text=Hi%20Avento%20Services" target="_blank">💬 Chat on WhatsApp</a>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Avento WhatsApp Bot running on port ${PORT}`);
  console.log(
    `Service hours (IST): 6:00 AM – 9:00 PM | Currently open: ${isServiceAvailableNow()}`
  );
  if (String(process.env.BYPASS_SERVICE_HOURS || "").toLowerCase() === "true") {
    console.log("⚠️  BYPASS_SERVICE_HOURS=true — service-hours check is DISABLED (testing mode).");
  }
});