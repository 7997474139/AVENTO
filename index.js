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
    name: "Food Palace Restaurant",
    lat: 13.951505,
    lng: 79.356579,
  },
  brindavanam: {
    name: "Brindavan Restaurant",
    lat: 13.950000,
    lng: 79.355000,
  },
  tea_time: {
    name: "Tea Time",
    lat: 13.952000,
    lng: 79.357000,
  }
};

// ==================================================
// FOOD PALACE MENU (+₹50 on every item)
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
        { id: "fp_vc1", name: "🍲 Veg Kheema Curry", price: 250 },
        { id: "fp_vc2", name: "🥗 Mixed Veg Curry", price: 240 },
        { id: "fp_vc3", name: "🥦 Kadai Veg Curry", price: 240 },
        { id: "fp_vc4", name: "🥦 Veg Kollapuri Curry", price: 240 },
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
      id: "fp_nonveg_curries",
      title: "Non-Veg Curries",
      items: [
        { id: "fp_nvc1", name: "🥩 Mutton Roghan Josh", price: 400 },
        { id: "fp_nvc2", name: "🥩 Mutton Curry", price: 400 },
        { id: "fp_nvc3", name: "🥩 Kadai Mutton", price: 400 },
        { id: "fp_nvc4", name: "🦐 Prawns Curry", price: 290 },
        { id: "fp_nvc5", name: "🥚 Egg Masala", price: 200 },
        { id: "fp_nvc6", name: "🍗 Miryali Chicken Curry (Bone)", price: 330 },
        { id: "fp_nvc7", name: "🍗 Spl. Chicken Curry (Chef Special)", price: 300 },
        { id: "fp_nvc8", name: "🍗 Kaju Chicken Curry (Boneless)", price: 300 },
        { id: "fp_nvc9", name: "🍗 Methi Chicken Curry", price: 280 },
        { id: "fp_nvc10", name: "🍗 Chicken Dhopyaza", price: 280 },
        { id: "fp_nvc11", name: "🍗 Chicken Tikka Masala", price: 280 },
        { id: "fp_nvc12", name: "🍗 Tawde Masala (Leg Piece)", price: 300 },
        { id: "fp_nvc13", name: "🍗 Butter Chicken", price: 270 },
        { id: "fp_nvc14", name: "🍗 Chicken Curry (Bone)", price: 250 },
        { id: "fp_nvc15", name: "🍗 Chicken Curry (Boneless)", price: 270 },
        { id: "fp_nvc16", name: "🍗 Chicken Chatpata Curry", price: 270 },
        { id: "fp_nvc17", name: "🍗 Kadai Chicken Curry", price: 250 },
        { id: "fp_nvc18", name: "🍗 Kollapuri Chicken Curry", price: 250 },
        { id: "fp_nvc19", name: "🍗 Hyderabadi Chicken Curry", price: 260 },
        { id: "fp_nvc20", name: "🍗 Chicken Kheema Curry", price: 270 },
        { id: "fp_nvc21", name: "🍗 Afghani Chicken Curry", price: 290 },
        { id: "fp_nvc22", name: "🍗 Moghlai Chicken Curry", price: 270 },
        { id: "fp_nvc23", name: "🍗 Punjabi Chicken Curry", price: 270 },
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
    {
      id: "fp_beverages",
      title: "Beverages",
      items: [
        { id: "fp_bev1", name: "💧 Water Bottle", price: 70 },
        { id: "fp_bev2", name: "🥤 Coke", price: 70 },
        { id: "fp_bev3", name: "🥤 Thumpsup", price: 70 },
        { id: "fp_bev4", name: "🥤 Sprite", price: 70 },
        { id: "fp_bev5", name: "🥛 Ice Butter Milk", price: 80 },
        { id: "fp_bev6", name: "🥛 Lassi", price: 90 },
        { id: "fp_bev7", name: "🍫 Chocolate Milk Shake", price: 129 },
        { id: "fp_bev8", name: "🍦 Vennela Milk Shake", price: 129 },
        { id: "fp_bev9", name: "🍦 Butterscotch Milk Shake", price: 129 },
        { id: "fp_bev10", name: "🍓 Strawberry Milk Shake", price: 129 },
      ],
    },
  ],
};

// ==================================================
// BRINDAVAN MENU (+₹50 on every item)
// ==================================================
const brindavanMenu = {
  categories: [
    {
      id: "br_nvs",
      title: "Non-Veg Starters",
      items: [
        { id: "br_nvs1", name: "🥜 Kamju Fry", price: 230 },
        { id: "br_nvs2", name: "🥜 Kamju Roast", price: 220 },
        { id: "br_nvs3", name: "🍗 Chilli Chicken", price: 250 },
        { id: "br_nvs4", name: "🍗 Chicken 65", price: 250 },
        { id: "br_nvs5", name: "🍗 Chicken Majestic", price: 260 },
        { id: "br_nvs6", name: "🍗 Chicken Spring Roll", price: 270 },
        { id: "br_nvs7", name: "🍗 Chicken 555", price: 260 },
        { id: "br_nvs8", name: "🍗 Dragon Chicken", price: 270 },
        { id: "br_nvs9", name: "🍗 Chicken Lollipop", price: 260 },
        { id: "br_nvs10", name: "🍗 Chicken Manchurian", price: 250 },
        { id: "br_nvs11", name: "🍗 Thread Chicken", price: 270 },
        { id: "br_nvs12", name: "🍗 Pepper Chicken", price: 250 },
        { id: "br_nvs13", name: "🍗 Drumstick Chicken", price: 260 },
        { id: "br_nvs14", name: "🍗 Crispy Fried Chicken", price: 270 },
        { id: "br_nvs15", name: "🍗 Chicken Sizzler", price: 290 },
        { id: "br_nvs16", name: "🍗 Ginger Chicken", price: 250 },
        { id: "br_nvs17", name: "🍗 Chicken BBQ", price: 250 },
        { id: "br_nvs18", name: "🍗 Lemon Chicken", price: 250 },
        { id: "br_nvs19", name: "🍗 Sesmi Chicken", price: 250 },
        { id: "br_nvs20", name: "🍗 Tawa Chicken", price: 260 },
        { id: "br_nvs21", name: "🍗 Chicken Streak", price: 260 },
        { id: "br_nvs22", name: "🍗 Schezwan Chicken", price: 250 },
        { id: "br_nvs23", name: "🥜 Kaju Nut Chicken", price: 290 },
        { id: "br_nvs24", name: "🍗 Creamy Chicken", price: 290 },
        { id: "br_nvs25", name: "🍗 Ghoti Chicken Crispy Fry", price: 290 },
        { id: "br_nvs26", name: "🍗 Ghoti Chilli Chicken", price: 290 },
        { id: "br_nvs27", name: "🍗 Crunchy Chicken", price: 290 },
        { id: "br_nvs28", name: "🍗 Karivepaku Chicken", price: 250 },
        { id: "br_nvs29", name: "🍗 Malai Lollipop", price: 270 },
        { id: "br_nvs30", name: "🦐 Prawns Fry", price: 330 },
      ],
    },
    {
      id: "br_egg",
      title: "Egg Items",
      items: [
        { id: "br_eg1", name: "🥚 Egg Manchurian", price: 190 },
        { id: "br_eg2", name: "🥚 Egg Burji", price: 150 },
        { id: "br_eg3", name: "🥚 Chilli Egg", price: 190 },
        { id: "br_eg4", name: "🥚 Egg Curry", price: 200 },
        { id: "br_eg5", name: "🥚 Egg Masala", price: 200 },
        { id: "br_eg6", name: "🥚 Egg Keema", price: 200 },
      ],
    },
    {
      id: "br_soups",
      title: "Soups",
      items: [
        { id: "br_s1", name: "🥗 Veg Hot & Sour Soup", price: 159 },
        { id: "br_s2", name: "🥗 Veg Manchow Soup", price: 159 },
        { id: "br_s3", name: "🍗 Chicken Hot & Sour Soup", price: 170 },
        { id: "br_s4", name: "🍗 Chicken Manchow Soup", price: 170 },
      ],
    },
    {
      id: "br_fish",
      title: "Fish",
      items: [
        { id: "br_f1", name: "🐟 Chilli Fish", price: 270 },
        { id: "br_f2", name: "🐟 Tawa Fish", price: 270 },
        { id: "br_f3", name: "🐟 Apollo Fish", price: 270 },
        { id: "br_f4", name: "🐟 Fish Manchurian", price: 270 },
        { id: "br_f5", name: "🐟 Ginger Fish", price: 270 },
        { id: "br_f6", name: "🐟 Crispy Fish", price: 270 },
      ],
    },
    {
      id: "br_prawns",
      title: "Prawns",
      items: [
        { id: "br_p1", name: "🦐 Loose Prawns", price: 280 },
        { id: "br_p2", name: "🦐 Chilli Prawns", price: 280 },
        { id: "br_p3", name: "🦐 Schezwan Prawns", price: 280 },
        { id: "br_p4", name: "🦐 Ginger Prawns", price: 280 },
        { id: "br_p5", name: "🦐 Prawns 65", price: 280 },
        { id: "br_p6", name: "🦐 Sizzler Prawns", price: 290 },
      ],
    },
    {
      id: "br_tandoor",
      title: "Tandoori & Kababs",
      items: [
        { id: "br_t1", name: "🍗 Tandoori Chicken Half", price: 290 },
        { id: "br_t2", name: "🍗 Tandoori Chicken Full", price: 490 },
        { id: "br_t3", name: "🍗 Tangadi Kabab Full", price: 300 },
        { id: "br_t4", name: "🍗 Tangadi Kabab Half", price: 190 },
        { id: "br_t5", name: "🍗 Reshmi Kabab", price: 300 },
        { id: "br_t6", name: "🍗 Malai Kabab", price: 310 },
        { id: "br_t7", name: "🍗 Chicken Tikka", price: 290 },
        { id: "br_t8", name: "🍗 Haryali Kabab", price: 290 },
        { id: "br_t9", name: "🍗 Achari Chicken Tikka", price: 290 },
        { id: "br_t10", name: "🍗 Chicken Sheek Kabab", price: 300 },
        { id: "br_t11", name: "🍗 Tandoori Chilli", price: 290 },
        { id: "br_t12", name: "🧀 Paneer Tikka", price: 270 },
        { id: "br_t13", name: "🧀 Haryali Paneer Tikka", price: 270 },
      ],
    },
    {
      id: "br_nonveg_fried_rice",
      title: "Non-Veg Fried Rice",
      items: [
        { id: "br_nfr1", name: "🍗 Chicken Fried Rice", price: 210 },
        { id: "br_nfr2", name: "🥚 Egg Fried Rice", price: 180 },
        { id: "br_nfr3", name: "🥗 Schezwan Fried Rice", price: 220 },
        { id: "br_nfr4", name: "🍗 Mix Non Veg Fried Rice", price: 270 },
        { id: "br_nfr5", name: "🍗 Spl Chicken Fried Rice", price: 240 },
      ],
    },
    {
      id: "br_veg_starters",
      title: "Veg Starters",
      items: [
        { id: "br_vs1", name: "🥜 Kaju Fry", price: 290 },
        { id: "br_vs2", name: "🥦 Gobi Manchurian", price: 200 },
        { id: "br_vs3", name: "🥦 Gobi 65", price: 200 },
        { id: "br_vs4", name: "🥦 Chilli Gobi", price: 210 },
        { id: "br_vs5", name: "🧀 Chilli Paneer", price: 250 },
        { id: "br_vs6", name: "🧀 Paneer 65", price: 250 },
        { id: "br_vs7", name: "🧀 Paneer Majestic", price: 260 },
        { id: "br_vs8", name: "🌽 Crispy Corn", price: 160 },
        { id: "br_vs9", name: "🌽 Chilli Baby Corn", price: 230 },
        { id: "br_vs10", name: "🌽 Baby Corn Manchurian", price: 230 },
        { id: "br_vs11", name: "🍄 Chilli Mushroom", price: 240 },
        { id: "br_vs12", name: "🍄 Mushroom Manchurian", price: 240 },
        { id: "br_vs13", name: "🍄 Mushroom Pepper Dry", price: 240 },
        { id: "br_vs14", name: "🍄 Mushroom 65", price: 240 },
        { id: "br_vs15", name: "🍄 Ginger Mushroom", price: 240 },
        { id: "br_vs16", name: "🥗 Veg Spring Roll", price: 230 },
        { id: "br_vs17", name: "🧀 Crispy Paneer", price: 260 },
        { id: "br_vs18", name: "🍄 Ginger Pepper Mushroom", price: 250 },
        { id: "br_vs19", name: "🌽 Sesmi Babycorn", price: 240 },
        { id: "br_vs20", name: "🧀 Paneer Bujji", price: 260 },
        { id: "br_vs21", name: "🍟 French Fries", price: 140 },
      ],
    },
    {
      id: "br_biryani",
      title: "Biryanis",
      items: [
        { id: "br_b1", name: "🍗 Chicken Biryani Single Piece", price: 180 },
        { id: "br_b2", name: "🍗 Chicken Dum Biryani", price: 230 },
        { id: "br_b3", name: "🍗 Chicken Fry Piece Biryani", price: 270 },
        { id: "br_b4", name: "🍗 Spl Chicken Biryani", price: 280 },
        { id: "br_b5", name: "🦐 Prawns Biryani", price: 310 },
        { id: "br_b6", name: "🥩 Mutton Fry Piece Biryani", price: 380 },
        { id: "br_b7", name: "🥜 Kaju Biryani", price: 310 },
        { id: "br_b8", name: "🥚 Egg Biryani", price: 190 },
        { id: "br_b9", name: "🍚 Biryani Rice", price: 160 },
        { id: "br_b10", name: "🍗 Chicken Biryani Family Pack", price: 620 },
        { id: "br_b11", name: "🍗 Spl Chicken Biryani Family Pack", price: 770 },
        { id: "br_b12", name: "🍗 Fry Piece Chicken Biryani Family Pack", price: 680 },
        { id: "br_b13", name: "🥩 Mutton Family Pack Biryani", price: 1020 },
        { id: "br_b14", name: "🥜 Kaju Biryani - Veg", price: 280 },
        { id: "br_b15", name: "🧀 Paneer Biryani - Veg", price: 240 },
        { id: "br_b16", name: "🍄 Mushroom Biryani - Veg", price: 240 },
        { id: "br_b17", name: "🥗 Veg Pulao", price: 220 },
        { id: "br_b18", name: "🍗 Chicken Pulao", price: 270 },
      ],
    },
    {
      id: "br_rice",
      title: "Rice",
      items: [
        { id: "br_r1", name: "🍚 Curd Rice", price: 109 },
        { id: "br_r2", name: "🍚 Spl. Curd Rice", price: 119 },
      ],
    },
    {
      id: "br_veg_fried_rice",
      title: "Veg Fried Rice",
      items: [
        { id: "br_vfr1", name: "🥗 Veg Fried Rice", price: 190 },
        { id: "br_vfr2", name: "🥦 Gobi Fried Rice", price: 190 },
        { id: "br_vfr3", name: "🍄 Mushroom Fried Rice", price: 210 },
        { id: "br_vfr4", name: "🧀 Paneer Fried Rice", price: 210 },
        { id: "br_vfr5", name: "🍚 Jeera Rice", price: 180 },
        { id: "br_vfr6", name: "🥜 Kaju Fried Rice", price: 230 },
        { id: "br_vfr7", name: "🥗 Schezwan Fried Rice", price: 200 },
        { id: "br_vfr8", name: "🥦 Schezwan Gobi Fried Rice", price: 200 },
        { id: "br_vfr9", name: "🍄 Schezwan Mushroom Fried Rice", price: 220 },
      ],
    },
    {
      id: "br_breads",
      title: "Breads",
      items: [
        { id: "br_br1", name: "🫓 Pulka", price: 70 },
        { id: "br_br2", name: "🫓 Tandoori Roti", price: 75 },
        { id: "br_br3", name: "🫓 Butter Roti", price: 75 },
        { id: "br_br4", name: "🫓 Rumali Roti", price: 75 },
        { id: "br_br5", name: "🫓 Plain Naan", price: 75 },
        { id: "br_br6", name: "🫓 Butter Naan", price: 80 },
        { id: "br_br7", name: "🫓 Plain Kulcha", price: 75 },
        { id: "br_br8", name: "🫓 Masala Kulcha", price: 90 },
        { id: "br_br9", name: "🫓 Garlic Naan", price: 90 },
        { id: "br_br10", name: "🫓 Paneer Stuffed Kulcha", price: 90 },
        { id: "br_br11", name: "🫓 Lacha Paratha", price: 90 },
        { id: "br_br12", name: "🫓 Butter Kulcha", price: 80 },
      ],
    },
    {
      id: "br_main_nv",
      title: "Main Course - Non Veg",
      items: [
        { id: "br_mnv1", name: "🍗 Chicken Maharani", price: 290 },
        { id: "br_mnv2", name: "🍗 Butter Chicken", price: 260 },
        { id: "br_mnv3", name: "🍗 Kaju Chicken Curry", price: 270 },
        { id: "br_mnv4", name: "🍗 Kadai Chicken", price: 260 },
        { id: "br_mnv5", name: "🍗 Afghani Chicken", price: 270 },
        { id: "br_mnv6", name: "🍗 Mughlai Chicken", price: 270 },
        { id: "br_mnv7", name: "🍗 Chicken Chatpat", price: 240 },
        { id: "br_mnv8", name: "🍗 Chicken Kolhapuri (Bone)", price: 260 },
        { id: "br_mnv9", name: "🍗 Kodi Mamsam (Bone)", price: 260 },
        { id: "br_mnv10", name: "🍗 Dum Ka Chicken (Bone)", price: 270 },
        { id: "br_mnv11", name: "🍗 Punjabi Chicken (Bone)", price: 260 },
        { id: "br_mnv12", name: "🍗 Methi Chicken", price: 250 },
        { id: "br_mnv13", name: "🍗 Chicken Fry", price: 260 },
        { id: "br_mnv14", name: "🍗 Chicken Fry Semi Gravy", price: 270 },
        { id: "br_mnv15", name: "🍗 Rayalaseema Chicken (Bone)", price: 260 },
        { id: "br_mnv16", name: "🍗 Chicken Do Pyaza", price: 250 },
        { id: "br_mnv17", name: "🍗 Chicken Masala", price: 270 },
        { id: "br_mnv18", name: "🍗 Chicken Tikka Masala", price: 280 },
        { id: "br_mnv19", name: "🍗 Badshahi Chicken", price: 280 },
      ],
    },
    {
      id: "br_mutton",
      title: "Mutton",
      items: [
        { id: "br_m1", name: "🥩 Mutton Curry", price: 400 },
        { id: "br_m2", name: "🥩 Mutton Fry", price: 400 },
        { id: "br_m3", name: "🥩 Kadai Mutton", price: 400 },
        { id: "br_m4", name: "🥩 Mutton Rogan Josh", price: 400 },
        { id: "br_m5", name: "🥩 Mutton Buna Ghosh", price: 400 },
        { id: "br_m6", name: "🥩 Mutton Sagwala", price: 400 },
      ],
    },
    {
      id: "br_seafood",
      title: "Sea Food",
      items: [
        { id: "br_sf1", name: "🦐 Prawns Curry", price: 300 },
        { id: "br_sf2", name: "🦐 Prawns Masala", price: 300 },
        { id: "br_sf3", name: "🦐 Prawns Fry", price: 340 },
        { id: "br_sf4", name: "🦐 Kadai Prawns", price: 300 },
        { id: "br_sf5", name: "🐟 Fish Curry (Boneless)", price: 270 },
      ],
    },
    {
      id: "br_main_veg",
      title: "Main Course - Veg",
      items: [
        { id: "br_mv1", name: "🧀 Paneer Butter Masala", price: 260 },
        { id: "br_mv2", name: "🧀 Kadai Paneer", price: 260 },
        { id: "br_mv3", name: "🍄 Mushroom Curry", price: 240 },
        { id: "br_mv4", name: "🥜 Kaju Masala", price: 290 },
        { id: "br_mv5", name: "🥜 Kaju Paneer", price: 280 },
        { id: "br_mv6", name: "🥜 Kaju Curry", price: 290 },
        { id: "br_mv7", name: "🥜 Kaju Mushroom Curry", price: 270 },
        { id: "br_mv8", name: "🥗 Mix Veg Curry", price: 230 },
        { id: "br_mv9", name: "🌽 Babycorn Masala", price: 250 },
        { id: "br_mv10", name: "🧀 Shahi Paneer", price: 250 },
        { id: "br_mv11", name: "🌿 Methi Chaman", price: 260 },
        { id: "br_mv12", name: "🥬 Palak Paneer", price: 250 },
        { id: "br_mv13", name: "🥬 Plain Palak", price: 210 },
        { id: "br_mv14", name: "🍲 Dal Tadka", price: 170 },
        { id: "br_mv15", name: "🍲 Dal Fry", price: 200 },
        { id: "br_mv16", name: "🧀 Malai Kofta", price: 260 },
        { id: "br_mv17", name: "🥗 Veg Chatpat", price: 240 },
        { id: "br_mv18", name: "🥦 Kadai Veg", price: 240 },
        { id: "br_mv19", name: "🥦 Veg Kolhapuri", price: 240 },
        { id: "br_mv20", name: "🥗 Spl. Mix Veg Curry", price: 250 },
        { id: "br_mv21", name: "🧀 Paneer Lababdar", price: 280 },
      ],
    },
    {
      id: "br_desserts",
      title: "Ice Creams & Desserts",
      items: [
        { id: "br_d1", name: "🍦 Vanilla (1 Scoop)", price: 90 },
        { id: "br_d2", name: "🍦 Vanilla (2 Scoops)", price: 120 },
        { id: "br_d3", name: "🍓 Strawberry (1 Scoop)", price: 90 },
        { id: "br_d4", name: "🍓 Strawberry (2 Scoops)", price: 120 },
        { id: "br_d5", name: "🍦 Butterscotch (1 Scoop)", price: 100 },
        { id: "br_d6", name: "🍦 Butterscotch (2 Scoops)", price: 140 },
        { id: "br_d7", name: "🟢 Pista (1 Scoop)", price: 95 },
        { id: "br_d8", name: "🟢 Pista (2 Scoops)", price: 130 },
        { id: "br_d9", name: "🥥 Dry Fruit (1 Scoop)", price: 115 },
        { id: "br_d10", name: "🥥 Dry Fruit (2 Scoops)", price: 165 },
        { id: "br_d11", name: "🍇 Black Current (1 Scoop)", price: 100 },
        { id: "br_d12", name: "🍇 Black Current (2 Scoops)", price: 140 },
        { id: "br_d13", name: "🍫 Chocolate (1 Scoop)", price: 100 },
        { id: "br_d14", name: "🍫 Chocolate (2 Scoops)", price: 140 },
        { id: "br_d15", name: "🍯 Fig & Honey (1 Scoop)", price: 105 },
        { id: "br_d16", name: "🍯 Fig & Honey (2 Scoops)", price: 145 },
        { id: "br_d17", name: "🍫 Sizzler Brownie", price: 169 },
      ],
    },
    {
      id: "br_shakes",
      title: "Milkshakes",
      items: [
        { id: "br_ms1", name: "🥤 Vanilla Shake", price: 139 },
        { id: "br_ms2", name: "🍓 Strawberry Shake", price: 139 },
        { id: "br_ms3", name: "🍫 Chocolate Shake", price: 139 },
        { id: "br_ms4", name: "🍦 Butterscotch Shake", price: 139 },
        { id: "br_ms5", name: "🍪 Oreo Shake", price: 139 },
        { id: "br_ms6", name: "🍇 Black Current Shake", price: 139 },
        { id: "br_ms7", name: "🍫 KitKat Shake", price: 139 },
        { id: "br_ms8", name: "🍫 Brownie Shake", price: 149 },
        { id: "br_ms9", name: "🟢 Pista Shake", price: 139 },
      ],
    },
    {
      id: "br_lassi",
      title: "Lassis",
      items: [
        { id: "br_l1", name: "🥛 Sweet Lassi", price: 119 },
        { id: "br_l2", name: "🥭 Mango Lassi", price: 119 },
        { id: "br_l3", name: "🍓 Strawberry Lassi", price: 129 },
        { id: "br_l4", name: "🍫 Chocolate Lassi", price: 119 },
        { id: "br_l5", name: "🍉 Watermelon Lassi", price: 129 },
        { id: "br_l6", name: "🟢 Pista Lassi", price: 129 },
      ],
    },
    {
      id: "br_mocktails",
      title: "Mocktails",
      items: [
        { id: "br_m1", name: "🍹 Virgin Mojito", price: 119 },
        { id: "br_m2", name: "🍏 Green Apple", price: 119 },
        { id: "br_m3", name: "🍓 Strawberry Mocktail", price: 119 },
        { id: "br_m4", name: "🌿 Fresh Mint", price: 119 },
        { id: "br_m5", name: "🍉 Watermelon", price: 129 },
        { id: "br_m6", name: "🍊 Orange", price: 119 },
        { id: "br_m7", name: "🍇 Black Current", price: 129 },
        { id: "br_m8", name: "🔵 Blue Curacao", price: 129 },
      ],
    },
  ],
};

// ==================================================
// TEA TIME MENU (+₹50 on every item)
// ==================================================
const teaTimeMenu = {
  categories: [
    {
      id: "tt_rice_noodles",
      title: "Rice & Noodles",
      items: [
        { id: "tt_1", name: "🍚 Gobi Rice", price: 130 },
        { id: "tt_2", name: "🍜 Gobi Noodles", price: 130 },
        { id: "tt_3", name: "🍳 Egg Rice", price: 120 },
        { id: "tt_4", name: "🍜 Egg Noodles", price: 120 },
        { id: "tt_5", name: "🍗 Chicken Rice", price: 150 },
        { id: "tt_6", name: "🍜 Chicken Noodles", price: 150 },
      ],
    },
    {
      id: "tt_starters",
      title: "Starters & Pakoda",
      items: [
        { id: "tt_7", name: "🥦 Gobi Manchuria", price: 200 },
        { id: "tt_8", name: "🍗 Chicken Manchuria", price: 220 },
        { id: "tt_9", name: "🍗 Chicken 65", price: 230 },
        { id: "tt_10", name: "🍗 Chilli Chicken", price: 220 },
        { id: "tt_11", name: "🍗 Chicken Pakoda (1 kg)", price: 500 },
      ],
    },
    {
      id: "tt_rolls",
      title: "Rolls",
      items: [
        { id: "tt_12", name: "🌯 Veg Roll", price: 100 },
        { id: "tt_13", name: "🌯 Egg Roll", price: 110 },
        { id: "tt_14", name: "🌯 Chicken Roll", price: 140 },
        { id: "tt_15", name: "🌯 Gobi Roll", price: 120 },
      ],
    },
  ],
};

const restaurantMenus = {
  food_palace: foodPalaceMenu,
  brindavanam: brindavanMenu,
  tea_time: teaTimeMenu,
};

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 👇 Static files & track.html explicit routing
app.use(express.static(path.join(__dirname)));

app.get("/track.html", (req, res) => {
  res.sendFile(path.join(__dirname, "track.html"));
});

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
// DISTANCE & DELIVERY FEE RULES
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

// 1. Get Order Status API for Tracking Page
app.get("/api/order-status/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const details = parseOrderDetails(order.details);
    res.json({
      order_id: order.id,
      status: order.status,
      service_type: order.service_type,
      items_summary: details.items_summary || "",
      total: details.total || 0,
      created_at: order.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Admin API to Update Order Status
app.post("/api/update-status", async (req, res) => {
  try {
    const { order_id, status } = req.body;
    if (!order_id || !status) {
      return res.status(400).json({ error: "Missing order_id or status" });
    }
    const order = await getOrderById(order_id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await updateOrder(order_id, { status });

    let customerMsg = "";
    if (status === "CONFIRMED") {
      const trackingUrl = `https://www.aventonow.live/track.html?id=${order.id}`;
      customerMsg = `🎉 *మంచి వార్త!* మీ ఆర్డర్ కన్ఫర్మ్ అయింది (#${order.id}).\n\n🛵 మీ ఫుడ్ లైవ్ ట్రాకింగ్ కోసం కింద ఉన్న లింక్ క్లిక్ చేయండి:\n🔗 ${trackingUrl}`;
    } else if (status === "PREPARING") {
      customerMsg = `👨‍🍳 *మీ ఫుడ్ ప్రిపేర్ అవుతోంది!* ఆర్డర్ #${order.id} కిచెన్‌లో తయారవుతోంది (10-20 mins). వేడివేడిగా మీ ముందుకు వస్తుంది! 🛵`;
    } else if (status === "OUT_FOR_DELIVERY") {
      customerMsg = `🛵 *డెలివరీ భాగస్వామి బయలుదేరారు!* మీ ఆర్డర్ #${order.id} మీ లొకేషన్‌కి వస్తోంది. కొద్దిసేపట్లో చేరుకుంటుంది! 📦`;
    } else if (status === "DELIVERED") {
      customerMsg = `✅ *డెలివరీ విజయవంతమైంది!* మీ ఆర్డర్ #${order.id} డెలివరీ చేయబడింది. అవెంటో సర్వీసెస్ వాడినందుకు ధన్యవాదాలు! 🙏`;
    }

    if (customerMsg && order.user_phone) {
      await sendText(order.user_phone, customerMsg);
    }

    res.json({ success: true, message: "Status updated and customer notified successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    
    // Check interactive buttons click from admin panel in WhatsApp
    const callbackButtonId = message?.interactive?.button_reply?.id;
    if (callbackButtonId && callbackButtonId.startsWith("adm_")) {
      const parts = callbackButtonId.split("_");
      const action = parts[1]; 
      const orderId = parts.slice(2).join("_");

      if (action === "paid") {
        const order = await getOrderById(orderId);
        if (order) {
          await updateOrder(orderId, { status: "CONFIRMED" });
          const trackingUrl = `https://www.aventonow.live/track.html?id=${order.id}`;
          
          await sendText(order.user_phone, `🎉 *అభినందనలు!* మీ పేమెంట్ వెరిఫై అయింది మరియు ఆర్డర్ కన్ఫర్మ్ చేయబడింది! (#${order.id})\n\n🛵 మీ ఫుడ్ లైవ్ ట్రాకింగ్ కోసం కింద ఉన్న లింక్ క్లిక్ చేయండి:\n🔗 ${trackingUrl}`);
          
          await sendWhatsApp({
            to: message.from,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: `✅ Order #${orderId} CONFIRMED.\n\nప్రస్తుత తదుపరి దశను ఎంచుకోండి:` },
              action: {
                buttons: [
                  { type: "reply", reply: { id: `adm_prep_${order.id}`, title: "👨‍🍳 Preparing" } },
                  { type: "reply", reply: { id: `adm_out_${order.id}`, title: "🛵 Out for Delivery" } },
                  { type: "reply", reply: { id: `adm_del_${order.id}`, title: "✅ Delivered" } }
                ]
              }
            }
          });
        }
      } else if (action === "prep") {
        const order = await getOrderById(orderId);
        if (order) {
          await updateOrder(orderId, { status: "PREPARING" });
          await sendText(order.user_phone, `👨‍🍳 *మీ ఫుడ్ ప్రిపేర్ అవుతోంది!* ఆర్డర్ #${order.id} కిచెన్‌లో తయారవుతోంది (10-20 mins).`);
          
          await sendWhatsApp({
            to: message.from,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: `👨‍🍳 Order #${orderId} is now PREPARING.\n\nతదుపరి దశను ఎంచుకోండి:` },
              action: {
                buttons: [
                  { type: "reply", reply: { id: `adm_out_${order.id}`, title: "🛵 Out for Delivery" } },
                  { type: "reply", reply: { id: `adm_del_${order.id}`, title: "✅ Delivered" } }
                ]
              }
            }
          });
        }
      } else if (action === "out") {
        const order = await getOrderById(orderId);
        if (order) {
          await updateOrder(orderId, { status: "OUT_FOR_DELIVERY" });
          await sendText(order.user_phone, `🛵 *డెలివరీ భాగస్వామి బయలుదేరారు!* ఆర్డర్ #${order.id} మీ లొకేషన్‌కి వస్తోంది.`);
          
          await sendWhatsApp({
            to: message.from,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: `🛵 Order #${orderId} is OUT FOR DELIVERY.\n\nమార్క్ చేయండి:` },
              action: {
                buttons: [
                  { type: "reply", reply: { id: `adm_del_${order.id}`, title: "✅ Delivered" } }
                ]
              }
            }
          });
        }
      } else if (action === "del") {
        const order = await getOrderById(orderId);
        if (order) {
          await updateOrder(orderId, { status: "DELIVERED" });
          await sendText(order.user_phone, `✅ *డెలివరీ విజయవంతమైంది!* మీ ఆర్డర్ #${order.id} డెలివరీ చేయబడింది. ధన్యవాదాలు! 🙏`);
          await sendText(message.from, `✅ Order #${orderId} marked as DELIVERED successfully! 🎉`);
        }
      } else if (action === "ask") {
        const order = await getOrderById(orderId);
        if (order) {
          await sendText(order.user_phone, `📸 దయచేసి మీ పేమెంట్ QR స్క్రీన్ షాట్ (Payment Screenshot) లేదా UTR నంబర్‌ను పంపండి.`);
          await sendText(message.from, `📸 Requested payment proof from customer for Order #${orderId}.`);
        }
      } else if (action === "rej") {
        const order = await getOrderById(orderId);
        if (order) {
          await updateOrder(orderId, { status: "REJECTED" });
          await sendText(order.user_phone, `❌ క్షమించండి, మీ ఆర్డర్ #${order.id} పేమెంట్ వెరిఫై కాలేకపోవడం వల్ల క్యాన్సిల్ చేయబడింది.`);
          await sendText(message.from, `❌ Order #${orderId} REJECTED.`);
        }
      }
      return;
    }

    if (!message) return;

    const phone = message.from;
    const type = message.type;
    const text = type === "text" ? message.text?.body?.trim() || "" : "";
    const command = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || text;
    const normalized = normalize(command);

    const user = await getOrCreateUser(phone);
    const temp = getTemp(user);

    // 0. Customer asks "Where is my order" / "Track order"
    if (normalized.includes("where is my order") || normalized.includes("track order") || normalized.includes("నా ఆర్డర్") || normalized.includes("ట్రాక్")) {
      const latestOrder = await getLatestCustomerOrder(phone);
      if (latestOrder) {
        const trackingUrl = `https://www.aventonow.live/track.html?id=${latestOrder.id}`;
        await sendText(phone, `🛵 *మీ లైవ్ ఆర్డర్ ట్రాకింగ్ వివరాలు (#${latestOrder.id}):*\n\nఆర్డర్ ప్రస్తుతం *${latestOrder.status}* స్టేటస్‌లో ఉంది.\n\n🔗 ఫుల్ డెలివరీ ట్రాకింగ్ కోసం ఇక్కడ క్లిక్ చేయండి:\n${trackingUrl}`);
      } else {
        await sendText(phone, `మీ వివరాలలో ప్రస్తుతం ఎలాంటి ఆర్డర్‌లు కనబడలేదు.`);
      }
      return;
    }

    // 1. Web Order Received (Handles Food Palace, Brindavan, and Tea Time)
    if (text.includes("New Food Order") || text.includes("Food Place") || text.includes("Food Palace") || text.includes("Brindavan") || text.includes("Tea Time")) {
      let selectedRestKey = "food_palace";
      if (text.toLowerCase().includes("brindavan")) {
        selectedRestKey = "brindavanam";
      } else if (text.toLowerCase().includes("tea time")) {
        selectedRestKey = "tea_time";
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

    // 2. Text without location
    if (user.current_state === "AWAITING_LOCATION" && type === "text") {
      await sendText(
        phone,
        "📍 *దయచేసి మీ లొకేషన్ షేర్ చేయండి!*\n\n" +
        "కింద వాట్సాప్ అటాచ్‌మెంట్ (📎 లేదా ➕) ఐకాన్ నొక్కి, అందులో **'Location'** సెలెక్ట్ చేసి మీ లైవ్/కరెంట్ లొకేషన్‌ను పంపితేనే ఆర్డర్ కన్ఫర్మ్ అవుతుంది. 🙏"
      );
      return;
    }

    // 3. Location received
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
        `✅ *ORDER CREATED!* (#${order.id})\n\n` +
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
                `🔔 *New Order Created! (#${order.id})*\n\n` +
                `👤 Customer WhatsApp: ${phone}\n` +
                `💬 Chat: ${chatLink}\n` +
                `📏 Distance: ${distance.toFixed(1)} km | Delivery: ₹${deliveryFee}\n` +
                `💰 Total: ₹${totalAmount}\n` +
                `📍 Map: ${mapLink}\n\n` +
                `⏳ కస్టమర్ పేమెంట్ పూర్తి చేసి UTR / స్క్రీన్ షాట్ పంపడానికి వేచి ఉంది.`,
            },
            action: {
              buttons: [
                { type: "reply", reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm Order" } },
                { type: "reply", reply: { id: `adm_ask_${order.id}`, title: "📸 Send QR / Proof" } },
                { type: "reply", reply: { id: `adm_rej_${order.id}`, title: "❌ Reject Order" } },
              ],
            },
          },
        });
      }

      await sendOrderEmail(
        `🚀 New Food Order Created! (#${order.id})`,
        `<h2>🍽️ New Food Order Created (Railway Kodur)</h2>
         <p><b>Order ID:</b> #${order.id}</p>
         <p><b>Customer WhatsApp:</b> <a href="${chatLink}" target="_blank">${phone}</a></p>
         <p><b>Distance:</b> ${distance.toFixed(1)} km</p>
         <p><b>Delivery Fee:</b> ${deliveryFee}</p>
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
          await sendWhatsApp({
            to: AVENTO_ADMIN_PHONE,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: `⚡ Action required for Order #${order.id}:` },
              action: {
                buttons: [
                  { type: "reply", reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm Order" } },
                  { type: "reply", reply: { id: `adm_ask_${order.id}`, title: "📸 Send QR / Proof" } },
                  { type: "reply", reply: { id: `adm_rej_${order.id}`, title: "❌ Reject Order" } }
                ]
              }
            }
          });
        } else {
          await sendText(AVENTO_ADMIN_PHONE, `📸 Payment UTR received from Customer (${phone}) for Order #${order.id}:\n*${text}*`);
          await sendWhatsApp({
            to: AVENTO_ADMIN_PHONE,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: `⚡ Action required for Order #${order.id}:` },
              action: {
                buttons: [
                  { type: "reply", reply: { id: `adm_paid_${order.id}`, title: "✅ Confirm Order" } },
                  { type: "reply", reply: { id: `adm_ask_${order.id}`, title: "📸 Send QR / Proof" } },
                  { type: "reply", reply: { id: `adm_rej_${order.id}`, title: "❌ Reject Order" } }
                ]
              }
            }
          });
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