import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handling';
import { z } from 'zod';

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
  sender: z.enum(['admin', 'client']).default('admin')
});

export async function GET() {
  try {
    // Mock conversations data since Contact model doesn't exist yet
    const mockConversations = [
      {
        id: '1',
        clientName: 'Sarah Johnson',
        clientEmail: 'sarah@example.com',
        clientAvatar: null,
        lastMessage: 'Hi, I would like to schedule a consultation for a sleeve tattoo.',
        lastMessageTime: new Date(),
        unreadCount: 2,
        messages: [
          {
            id: 'msg_1',
            content: 'Hi, I would like to schedule a consultation for a sleeve tattoo.',
            sender: 'client',
            timestamp: new Date()
          }
        ]
      },
      {
        id: '2',
        clientName: 'Mike Chen',
        clientEmail: 'mike@example.com',
        clientAvatar: null,
        lastMessage: 'Thank you for the amazing work on my back piece!',
        lastMessageTime: new Date(Date.now() - 86400000),
        unreadCount: 0,
        messages: [
          {
            id: 'msg_2',
            content: 'Thank you for the amazing work on my back piece!',
            sender: 'client',
            timestamp: new Date(Date.now() - 86400000)
          }
        ]
      }
    ];

    return NextResponse.json(createSuccessResponse(mockConversations));
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

    // Mock update contact status - would update database in production
    // const _updatedContact = {
    //   id: validatedData.conversationId,
    //   status: 'REPLIED',
    //   updatedAt: new Date()
    // };

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