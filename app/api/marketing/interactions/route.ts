import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface VendorInteraction {
    id?: string;
    vendorId: string;
    userId: string;
    type: 'call' | 'email' | 'meeting' | 'note';
    description: string;
    date: Timestamp;
    outcome?: string;
    followUpRequired?: boolean;
    followUpDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// GET - Get interactions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const vendorId = searchParams.get('vendorId');
        const type = searchParams.get('type');
        const limit = searchParams.get('limit');

        let queryRef = adminDb.collection('marketing_interactions').orderBy('date', 'desc');

        // Filter by user ID if provided
        if (userId) {
            queryRef = queryRef.where('userId', '==', userId);
        }

        // Filter by vendor ID if provided
        if (vendorId) {
            queryRef = queryRef.where('vendorId', '==', vendorId);
        }

        // Filter by type if provided
        if (type) {
            queryRef = queryRef.where('type', '==', type);
        }

        const querySnapshot = await queryRef.get();
        let interactions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
                followUpDate: data.followUpDate?.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            };
        });

        // Apply limit if provided
        if (limit) {
            interactions = interactions.slice(0, parseInt(limit));
        }

        return NextResponse.json({
            success: true,
            data: interactions
        });

    } catch (error) {
        console.error('Error fetching interactions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch interactions' },
            { status: 500 }
        );
    }
}

// POST - Create new interaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            vendorId, 
            userId, 
            type, 
            description, 
            date,
            outcome,
            followUpRequired = false,
            followUpDate
        } = body;

        if (!vendorId || !userId || !type || !description || !date) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate interaction type
        const validTypes = ['call', 'email', 'meeting', 'note'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid interaction type' },
                { status: 400 }
            );
        }

        const now = Timestamp.now();
        const interactionData: any = {
            vendorId,
            userId,
            type,
            description,
            date: Timestamp.fromDate(new Date(date)),
            outcome,
            followUpRequired,
            createdAt: now,
            updatedAt: now
        };

        if (followUpDate) {
            interactionData.followUpDate = Timestamp.fromDate(new Date(followUpDate));
        }

        const docRef = await adminDb.collection('marketing_interactions').add(interactionData);

        // Update vendor assignment last engagement date
        const assignmentSnapshot = await adminDb.collection('vendor_assignments')
            .where('vendorId', '==', vendorId)
            .where('assignedToUserId', '==', userId)
            .where('status', '==', 'active')
            .get();
            
        if (!assignmentSnapshot.empty) {
            const assignmentDoc = assignmentSnapshot.docs[0];
            await assignmentDoc.ref.update({
                lastEngagementDate: Timestamp.fromDate(new Date(date))
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: docRef.id,
                ...interactionData,
                date: new Date(date),
                followUpDate: followUpDate ? new Date(followUpDate) : undefined,
                createdAt: now.toDate(),
                updatedAt: now.toDate()
            }
        });

    } catch (error) {
        console.error('Error creating interaction:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create interaction' },
            { status: 500 }
        );
    }
}

// PUT - Update interaction
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            interactionId, 
            description, 
            outcome, 
            followUpRequired, 
            followUpDate 
        } = body;

        if (!interactionId) {
            return NextResponse.json(
                { success: false, error: 'Interaction ID is required' },
                { status: 400 }
            );
        }

        const updateData: any = {
            updatedAt: Timestamp.now()
        };

        if (description) updateData.description = description;
        if (outcome !== undefined) updateData.outcome = outcome;
        if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
        if (followUpDate) updateData.followUpDate = Timestamp.fromDate(new Date(followUpDate));

        const interactionRef = adminDb.collection('marketing_interactions').doc(interactionId);
        await interactionRef.update(updateData);

        return NextResponse.json({
            success: true,
            message: 'Interaction updated successfully'
        });

    } catch (error) {
        console.error('Error updating interaction:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update interaction' },
            { status: 500 }
        );
    }
}