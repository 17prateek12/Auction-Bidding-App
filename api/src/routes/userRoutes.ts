import express from "express";
import { registerUser, loginuser, logoutUser } from "../controllers/userController";
import validateToken from "../middleware/validateTokenHandler";

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginuser);
router.route("/logout").post(validateToken, logoutUser);

export default router;