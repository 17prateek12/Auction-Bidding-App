import { pool } from '../connection/postgresConfig';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';

export const registerUserService = async ({
  email,
  name,
  password,
  confirmPassword,
}: any) => {
  if (!email || !name || !password || !confirmPassword) {
    throw new ApiError(400, 'All fields are mandatory');
  }

  const userExistRes = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );
  if (userExistRes.rows.length > 0) {
    throw new ApiError(400, 'User already exists with this email');
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  const registrationTime = Date.now().toString();
  const salt = await bcrypt.genSalt(10);
  const hashpassword = await bcrypt.hash(password + registrationTime, salt);

  const newUserRes = await pool.query(
    `
    INSERT INTO users (name, email, password_hash, registration_time)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, registration_time;
  `,
    [name, email, hashpassword, registrationTime]
  );

  const user = newUserRes.rows[0];

  return { _id: user.id, id: user.id, email: user.email, name: user.name };
};

export const loginUserService = async ({ email, password }: any) => {
  if (!email || !password) {
    throw new ApiError(400, 'All fields are mandatory');
  }

  const userRes = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userRes.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  const user = userRes.rows[0];
  const registrationTime = user.registration_time || '';
  const isMatch = await bcrypt.compare(
    password + registrationTime,
    user.password_hash
  );

  if (!isMatch) {
    throw new ApiError(401, 'Invalid password or email');
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    userId: user.id,
    userEmail: user.email,
    name: user.name,
  };
};

export const getAllUsersService = async () => {
  const alluserRes = await pool.query(
    `SELECT id, name, email, registration_time, created_at FROM users ORDER BY created_at DESC`
  );
  if (alluserRes.rows.length === 0) {
    throw new ApiError(404, 'No users found');
  }
  return alluserRes.rows;
};
