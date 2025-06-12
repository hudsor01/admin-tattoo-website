import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handling';
import { z } from 'zod';

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
  sender: z.enum(['admin', 'client']).default('admin')
});

export async function GET() {
  try {
    // Get all contact form submissions as conversations
    const conversations = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        createdAt: true,
        status: true
      }
    });

    // Transform contacts into conversation format
    const formattedConversations = conversations.map(contact => ({
      id: contact.id,
      clientName: contact.name,
      clientEmail: contact.email,
      clientAvatar: null,
      lastMessage: contact.message?.substring(0, 100) + (contact.message && contact.message.length > 100 ? '...' : ''),
      lastMessageTime: contact.createdAt,
      unreadCount: contact.status === 'NEW' ? 1 : 0,
      messages: [
        {
          id: `msg_${contact.id}`,
          content: contact.message,
          sender: 'client',
          timestamp: contact.createdAt
        }
      ]
    }));

    return NextResponse.json(createSuccessResponse(formattedConversations));
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch conversations'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Update contact status to indicate admin has replied
    const updatedContact = await prisma.contact.update({
      where: { id: validatedData.conversationId },
      data: { 
        status: 'REPLIED',
        updatedAt: new Date()
      }
    });

    const newMessage = {
      id: `msg_${Date.now()}`,
      conversationId: validatedData.conversationId,
      content: validatedData.content,
      sender: validatedData.sender,
      timestamp: new Date(),
      delivered: true
    };

    return NextResponse.json(
      createSuccessResponse(newMessage, 'Message sent successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Invalid message data'),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createErrorResponse('Failed to send message'),
      { status: 500 }
    );
  }
}