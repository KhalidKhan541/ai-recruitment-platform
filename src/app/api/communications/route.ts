import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createMessageSchema = z.object({
  receiverId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  type: z.enum(["EMAIL", "SMS", "IN_APP", "WHATSAPP", "LINKED_IN"]).default("IN_APP"),
  relatedType: z.string().max(50).optional(),
  relatedId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const type = searchParams.get("type") || undefined;
    const folder = searchParams.get("folder") || "inbox";
    const search = searchParams.get("search") || undefined;
    const unread = searchParams.get("unread") === "true";

    const where: any = {};

    if (folder === "inbox") {
      where.receiverId = session.user.id;
    } else if (folder === "sent") {
      where.senderId = session.user.id;
    } else {
      where.OR = [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ];
    }

    if (type) where.type = type;
    if (unread) where.readAt = null;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [messages, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
          receiver: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ]);

    const unreadCount = await prisma.communication.count({
      where: { receiverId: session.user.id, readAt: null },
    });

    return NextResponse.json({
      data: messages,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/communications error:", error);
    return NextResponse.json({ error: "Failed to fetch communications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createMessageSchema.parse(body);

    const receiver = await prisma.user.findUnique({
      where: { id: validated.receiverId },
    });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const message = await prisma.communication.create({
      data: {
        senderId: session.user.id,
        receiverId: validated.receiverId,
        subject: validated.subject,
        body: validated.body,
        type: validated.type,
        status: "SENT",
        sentAt: new Date(),
        relatedType: validated.relatedType,
        relatedId: validated.relatedId,
        templateId: validated.templateId,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: validated.receiverId,
        title: validated.subject,
        message: validated.body.substring(0, 500),
        type: "MESSAGE",
        actionUrl: `/communications/${message.id}`,
      },
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/communications error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
