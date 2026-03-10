import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

interface Task {
    id?: string;
    vendorId: string;
    assignedToUserId: string;
    title: string;
    description: string;
    dueDate: Timestamp;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdByUserId: string;
}

// GET - Get tasks
export async function GET(request: NextRequest) {
    try {
        // Authenticate request
        const authResult = await authenticateRequest(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const vendorId = searchParams.get('vendorId');
        const status = searchParams.get('status');

        let queryRef = adminDb.collection('marketing_tasks').orderBy('dueDate', 'asc');

        // Filter by user ID if provided
        if (userId) {
            queryRef = queryRef.where('assignedToUserId', '==', userId);
        }

        // Filter by vendor ID if provided
        if (vendorId) {
            queryRef = queryRef.where('vendorId', '==', vendorId);
        }

        // Filter by status if provided
        if (status) {
            queryRef = queryRef.where('status', '==', status);
        }

        const querySnapshot = await queryRef.get();
        const tasks = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: data.dueDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            };
        });

        return NextResponse.json({
            success: true,
            data: tasks
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}

// POST - Create new task
export async function POST(request: NextRequest) {
    try {
        // Authenticate request
        const authResult = await authenticateRequest(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const body = await request.json();
        const { 
            vendorId, 
            assignedToUserId, 
            title, 
            description, 
            dueDate, 
            priority = 'medium',
            createdByUserId 
        } = body;

        if (!vendorId || !assignedToUserId || !title || !dueDate || !createdByUserId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const now = Timestamp.now();
        const taskData: any = {
            vendorId,
            assignedToUserId,
            title,
            description: description || '',
            dueDate: Timestamp.fromDate(new Date(dueDate)),
            status: 'pending',
            priority,
            createdAt: now,
            updatedAt: now,
            createdByUserId
        };

        const docRef = await adminDb.collection('marketing_tasks').add(taskData);

        return NextResponse.json({
            success: true,
            data: {
                id: docRef.id,
                ...taskData,
                dueDate: new Date(dueDate),
                createdAt: now.toDate(),
                updatedAt: now.toDate()
            }
        });

    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create task' },
            { status: 500 }
        );
    }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
    try {
        // Authenticate request
        const authResult = await authenticateRequest(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const body = await request.json();
        const { 
            taskId, 
            title, 
            description, 
            dueDate, 
            status, 
            priority 
        } = body;

        if (!taskId) {
            return NextResponse.json(
                { success: false, error: 'Task ID is required' },
                { status: 400 }
            );
        }

        const updateData: any = {
            updatedAt: Timestamp.now()
        };

        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate) updateData.dueDate = Timestamp.fromDate(new Date(dueDate));
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;

        const taskRef = adminDb.collection('marketing_tasks').doc(taskId);
        await taskRef.update(updateData);

        return NextResponse.json({
            success: true,
            message: 'Task updated successfully'
        });

    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update task' },
            { status: 500 }
        );
    }
}

// DELETE - Delete task
export async function DELETE(request: NextRequest) {
    try {
        // Authenticate request
        const authResult = await authenticateRequest(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            return NextResponse.json(
                { success: false, error: 'Task ID is required' },
                { status: 400 }
            );
        }

        const taskRef = adminDb.collection('marketing_tasks').doc(taskId);
        await taskRef.delete();

        return NextResponse.json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete task' },
            { status: 500 }
        );
    }
}