import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // In development, return mock payments data
    if (process.env.NODE_ENV === 'development') {
      const mockPayments = [
        {
          id: 'pay_001',
          clientName: 'John Doe',
          clientAvatar: null,
          amount: 500,
          status: 'completed',
          sessionType: 'Full Sleeve Session',
          transactionId: 'TXN_20241201_001',
          paymentDate: new Date('2024-12-01').toISOString(),
          method: 'card'
        },
        {
          id: 'pay_002',
          clientName: 'Jane Smith',
          clientAvatar: null,
          amount: 250,
          status: 'pending',
          sessionType: 'Touch-up Session',
          transactionId: 'TXN_20241202_002',
          paymentDate: new Date('2024-12-02').toISOString(),
          method: 'cash'
        },
        {
          id: 'pay_003',
          clientName: 'Mike Johnson',
          clientAvatar: null,
          amount: 800,
          status: 'completed',
          sessionType: 'New Piece',
          transactionId: 'TXN_20241203_003',
          paymentDate: new Date('2024-12-03').toISOString(),
          method: 'card'
        },
        {
          id: 'pay_004',
          clientName: 'Sarah Wilson',
          clientAvatar: null,
          amount: 350,
          status: 'failed',
          sessionType: 'Consultation',
          transactionId: 'TXN_20241204_004',
          paymentDate: new Date('2024-12-04').toISOString(),
          method: 'card'
        },
        {
          id: 'pay_005',
          clientName: 'David Brown',
          clientAvatar: null,
          amount: 600,
          status: 'completed',
          sessionType: 'Large Back Piece',
          transactionId: 'TXN_20241205_005',
          paymentDate: new Date('2024-12-05').toISOString(),
          method: 'card'
        }
      ]
      
      return NextResponse.json(mockPayments)
    }

    // TODO: Implement real database query when ready
    // const payments = await prisma.payment.findMany({
    //   include: {
    //     client: true,
    //     session: true
    //   },
    //   orderBy: {
    //     paymentDate: 'desc'
    //   }
    // })

    return NextResponse.json([])
  } catch (error) {
    console.error('Payments API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Implement payment creation logic
    console.log('Creating payment:', body)
    
    return NextResponse.json(
      { message: 'Payment created successfully', id: `pay_${Date.now()}` },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}