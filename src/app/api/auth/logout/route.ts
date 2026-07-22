import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (token?.refreshToken) {
      // Call the Django backend to blacklist the refresh token
      await axios.post(
        `${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000/api'}/auth/logout/`,
        { refresh: token.refreshToken },
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during backend logout:", error);
    // Return success anyway so NextAuth can proceed to clear local cookies
    return NextResponse.json({ success: true, error: "Backend logout failed" });
  }
}
