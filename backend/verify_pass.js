import bcrypt from 'bcryptjs';

const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const password = 'admin123';

bcrypt.compare(password, hash).then(res => {
    console.log('Password match:', res);
});
