"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Plus, Search, Send, Clock, CheckCheck } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

import { useState } from "react"

// Fetch messages from API
const fetchMessages = async () => {
  const response = await fetch('/api/admin/messages')
  if (!response.ok) throw new Error('Failed to fetch messages')
  return response.json()
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time messaging
  })

  const conversations = messages || []
  const filteredConversations = conversations.filter((conversation: any) =>
    conversation.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Ink37 Tattoos
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Messages</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground">
                  Communicate with clients and manage inquiries
                </p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    {isLoading ? (
                      <div className="space-y-4 p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredConversations.length > 0 ? (
                      filteredConversations.map((conversation: any) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isSelected={selectedConversation?.id === conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                        />
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No conversations found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Message Thread */}
              <Card className="lg:col-span-2">
                {selectedConversation ? (
                  <MessageThread conversation={selectedConversation} />
                ) : (
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Select a conversation</h3>
                      <p className="text-muted-foreground">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

  )
}

function ConversationItem({ conversation, isSelected, onClick }: {
  conversation: any
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.clientAvatar} />
          <AvatarFallback>
            {conversation.clientName?.split(' ').map((n: string) => n[0]).join('') || 'CN'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium truncate">
              {conversation.clientName || 'Unknown Client'}
            </h4>
            <div className="flex items-center gap-2">
              {conversation.unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 text-xs">
                  {conversation.unreadCount}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {conversation.lastMessageTime ?
                  new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) :
                  'No time'
                }
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-1">
            {conversation.lastMessage || 'No messages yet'}
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageThread({ conversation }: { conversation: any }) {
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const response = await fetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            content: newMessage,
            sender: 'admin'
          })
        });

        if (response.ok) {
          setNewMessage('');
          // Refresh messages to show the new message
          window.location.reload();
        } else {
          console.error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  return (
    <>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.clientAvatar} />
            <AvatarFallback>
              {conversation.clientName?.split(' ').map((n: string) => n[0]).join('') || 'CN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {conversation.clientName || 'Unknown Client'}
            </CardTitle>
            <CardDescription>
              {conversation.clientEmail || 'No email provided'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
          {conversation.messages?.length > 0 ? (
            conversation.messages.map((message: any, index: number) => (
              <MessageBubble key={index} message={message} />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="mx-auto h-8 w-8 mb-2" />
              <p>No messages in this conversation yet</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              className="bg-orange-500 hover:bg-orange-600 px-3"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  )
}

function MessageBubble({ message }: { message: any }) {
  const isFromClient = message.sender === 'client'

  return (
    <div className={`flex ${isFromClient ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        isFromClient
          ? 'bg-gray-100 text-gray-900'
          : 'bg-orange-500 text-white'
      }`}>
        <p className="text-sm">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs ${
          isFromClient ? 'text-gray-500' : 'text-orange-100'
        }`}>
          <Clock className="h-3 w-3" />
          <span>
            {message.timestamp ?
              new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              }) :
              'Unknown time'
            }
          </span>
          {!isFromClient && (
            <CheckCheck className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  )
}
