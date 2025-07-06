export type LoginInput = {
    email:string;
    password: string;
};

export type RegisterInput = {
    name:string;
    email:string;
    password:string;
    confirmPassword:string;
}

export type LoginResponse = {
    accessToken: string;
    userId: string;
    userEmail: string;
    name: string;
};

export type RegisterResponse = {
    _id: string;
    email: string;
};

export type LogoutResponse = {
    message: string;
    accessToken: null;
  };
  