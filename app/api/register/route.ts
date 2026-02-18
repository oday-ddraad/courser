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
    
    const newUser = await User.create({
      email,
      name,
      password: hashedPassword,
      country, // ISO code from your types
      locale,  // Store the user's current language preference
      role: 'user', // Default role from your UserRole type
      isActive: true,
      profileCompleted: false, // New users need to complete profile
      provider: 'credentials',
    });

    return NextResponse.json({ 
      message: "User registered",
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        profileCompleted: newUser.profileCompleted,
        provider: newUser.provider,
        emailVerified: newUser.emailVerified,
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
