import User from '../model/userModel';
import asyncHandler from "express-async-handler";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthenticationRequest } from '../interface/interface';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    
    const { email, name, password, confirmPassword } = req.body;

    if (!email || !name || !password || !confirmPassword) {
        throw new ApiError(400, 'All field are mandatory');
    };

    const userExist = await User.findOne({ email });
    if (userExist) {
        throw new ApiError(400, 'User Already Exist with this email id');
    };

    if (password !== confirmPassword) {
        throw new ApiError(400, 'Password do not match');
    }

    const registrationTime = Date.now().toString();
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password + registrationTime, salt);

    const user = await User.create({
        name: name,
        email,
        password: hashpassword,
        registrationTime
    });

    if (user) {
        res.status(201).json({ _id: user.id, email: user.email });
    } else {
        throw new ApiError(400, 'User Data is not valid');
    }
});


const loginuser = asyncHandler(async (req: Request, res: Response) => {
    
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'All field are mandatory');
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const registrationTime = user.registrationTime || '';

    const isMatch = await bcrypt.compare(password + registrationTime, user.password);

    if (isMatch) {
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, name: user.name },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '7d' }
        );
        res.status(200).json({
            'accessToken': accessToken,
            'userId': user.id,
            'userEmail': user.email,
            'name':user.name
        });
    } else {
        throw new ApiError(401, 'Invalid Password or Email');
    }
});

const logoutUser = asyncHandler(async (req: AuthenticationRequest, res: Response) => {

    if (!req.user) {
        throw new ApiError(401, 'No user session Found');
    }
    res.status(200).json({
        message: "User logged out successfully",
        accessToken: null
    });
});

const getAllUser = asyncHandler(async (req: Request, res: Response) => {
    
    const alluser = await User.find();
    if (!alluser || alluser.length === 0) {
        throw new ApiError(404, 'No users found')
    }
    res.status(200), ({
        message: 'Get All Users',
        user: alluser
    })
});


export { registerUser, loginuser, logoutUser, getAllUser }