const bcrypt = require('bcryptjs');

const password = 'password123';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
  } else {
    console.log('Password: password123');
    console.log('Hash:', hash);
    console.log('\nSQL Update Commands:');
    console.log(`UPDATE Users SET Password = '${hash}' WHERE Email = 'admin@eshanee-chetan.com';`);
    console.log(`UPDATE Users SET Password = '${hash}' WHERE Email = 'employee@eshanee-chetan.com';`);
    console.log(`UPDATE Users SET Password = '${hash}' WHERE Email = 'customer@eshanee-chetan.com';`);
  }
});