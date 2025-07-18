import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request:NextRequest){
    const token = request.cookies.get('accessToken')?.value;

    if(!token){
        return NextResponse.redirect(new URL('/',request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher:[
        '/dashboard/:path*',
        '/live-event/:path*',
        '/home/:path*'
    ],
};