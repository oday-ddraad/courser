import connectDB from "@/lib/mongodb/connection";
import User from "@/lib/mongodb/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, name, country, locale } = await req.json();
    await connectDB();

    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    await User.create({
      email,
      name,
      password: hashedPassword,
      country, // ISO code from your types
      locale,  // Store the user's current language preference
      role: 'user', // Default role from your UserRole type
      isActive: true,
    });

    return NextResponse.json({ message: "User registered" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}