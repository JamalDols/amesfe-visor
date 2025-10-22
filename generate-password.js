const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  console.log("\n===========================================");
  console.log("📝 Contraseña:", password);
  console.log("🔐 Hash bcrypt:", hash);
  console.log("===========================================\n");
  console.log("Ejecuta este comando en MySQL:\n");
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'pablo.dols@gmail.com';`);
  console.log("\n===========================================\n");
}

generateHash();
