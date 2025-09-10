const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = "YourAdminPassword123!"; // Change this to your desired admin password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Copy this hashed password:', hashedPassword);
}

hashPassword();
