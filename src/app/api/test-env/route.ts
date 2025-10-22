import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    FTP_HOST: process.env.FTP_HOST,
    FTP_USER: process.env.FTP_USER,
    FTP_PASSWORD_LENGTH: process.env.FTP_PASSWORD?.length || 0,
    FTP_PASSWORD_EXISTS: !!process.env.FTP_PASSWORD,
    FTP_PASSWORD_FIRST_3: process.env.FTP_PASSWORD?.substring(0, 3) || "none",
    MYSQL_HOST: process.env.MYSQL_HOST,
    NODE_ENV: process.env.NODE_ENV,
  });
}
