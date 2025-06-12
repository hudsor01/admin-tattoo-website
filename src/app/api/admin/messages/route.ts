import { NextRequest } from 'next/server';
import { withApiHandler } from '@/lib/api-helpers';
import { z } from 'zod';

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
  sender: z.enum(['admin', 'client']).default('admin')
});

export const GET = withApiHandler(async () => {
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

  return mockConversations;
});

export const POST = withApiHandler(async (request: NextRequest) => {
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

  return { data: newMessage, message: 'Message sent successfully', status: 201 };
});