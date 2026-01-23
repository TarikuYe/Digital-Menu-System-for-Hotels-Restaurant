import bcrypt from 'bcryptjs';
import fs from 'fs';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log('New Hash:', hash);
    fs.writeFileSync('new_hash.txt', hash);
});
