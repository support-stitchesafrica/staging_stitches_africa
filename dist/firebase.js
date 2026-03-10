"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functions = exports.storage = exports.db = exports.auth = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
const functions_1 = require("firebase/functions");
const firebaseConfig = {
    apiKey: "AIzaSyAU8mfUgPZZzLPJXZlibKCkei-DifO_LXQ",
    authDomain: "stitches-africa.firebaseapp.com",
    projectId: "stitches-africa",
    storageBucket: "stitches-africa.firebasestorage.app", // ✅ correct bucket
    messagingSenderId: "72103487036",
    appId: "1:72103487036:web:ebed8812bf2b5fe4ddc539",
    measurementId: "G-LR7MYF6MJ6",
};
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
exports.storage = (0, storage_1.getStorage)(app);
exports.functions = (0, functions_1.getFunctions)(app, "us-central1");
// Set session persistence globally
(0, auth_1.setPersistence)(exports.auth, auth_1.browserLocalPersistence).catch((err) => {
    console.error("Failed to set auth persistence:", err);
});
