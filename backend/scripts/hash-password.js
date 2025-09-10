const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = process.env.ADMIN_PASSWORD || "CHANGE_THIS_PASSWORD_BEFORE_USE"; // Set via environment variable
    if (password === "CHANGE_THIS_PASSWORD_BEFORE_USE") {
        console.log('Please set ADMIN_PASSWORD environment variable or edit this script');
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Copy this hashed password:', hashedPassword);
}

hashPassword();
