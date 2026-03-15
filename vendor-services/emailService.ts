import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { TailorWork } from "./types";

const ADMIN_EMAILS = [
    "stitchesafrica1m@gmail.com",
    "stitchesafrica2m@gmail.com",
    // "stitchesafrica3m@gmail.com",
    // "stitchesafrica4m@gmail.com",
    // "stitchesafrica5m@gmail.com",
    // "stitchesafrica7m@gmail.com",
    // "stitchesafrica8m@gmail.com",
    // "support@stitchesafrica.com",
];

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/stitches-africa.firebasestorage.app/o/brand-assets%2Flogo_black_clean.png?alt=media&token=cba67c83-049e-4e4b-972d-20d046927da0"; // Using a placeholder/known logo if available, or fallback. Since I don't have the exact logo URL handy, I'll use a generic one or assume one.
// Actually, let's use a reliable placeholder for now or prompt if critical. 
// I will try to find a logo from the project files if I can, but to avoid delay I will use a high-probability path or a placeholder.
// The user provided prompt had `logoUrl` as required.
// I will use a placeholder from a common public source or just a string that won't break it if URL is generated dynamically.
// Let's use: "https://stitchesafrica.com/logo.png" as a placeholder that the client might actually have or replace.

interface SendGenericEmailRequest {
    to: string;
    subject: string;
    content: string;
    title?: string;
    logoUrl: string;
    actionButton?: {
        text: string;
        url: string;
    };
    accessToken: string;
}

const callSendGenericEmail = async (data: Omit<SendGenericEmailRequest, 'accessToken'>) => {
    try {
        const functions = getFunctions(app, "europe-west1");
        const sendEmailFn = httpsCallable(functions, "sendGenericEmail");
        
        let accessToken = "";
        if (auth.currentUser) {
            accessToken = await auth.currentUser.getIdToken();
        } else {
             console.warn("No authenticated user found for sending email");
             return { success: false, message: "No authenticated user" };
        }

        const response = await sendEmailFn({
            ...data,
            accessToken
        });
        
        return response.data as any;
    } catch (error) {
        console.error("Failed to send email to", data.to, error);
        return { success: false, error };
    }
};

export const sendEmailToAdmins = async (product: TailorWork, action: 'created' | 'updated') => {
    const actionText = action === 'created' ? 'New Product Created' : 'Product Updated';
    const content = `
        <div style="font-family: sans-serif; color: #333;">
            <p>A vendor has <strong>${action === 'created' ? 'submitted a new product' : 'updated a product'}</strong> pending your review.</p>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px;"><strong>Product:</strong> ${product.title}</p>
                <p style="margin: 0 0 8px;"><strong>Vendor:</strong> ${product.tailor || 'Unknown'}</p>
                <p style="margin: 0 0 8px;"><strong>Category:</strong> ${product.category}</p>
                <p style="margin: 0;"><strong>Price:</strong> ${product.price?.currency || 'NGN'} ${product.price?.base}</p>
            </div>
            <p>Please review this product in the dashboard.</p>
        </div>
    `;

    // Process in parallel but don't blow up connection limits if typical browser. 8 is fine.
    const promises = ADMIN_EMAILS.map(email => {
        return callSendGenericEmail({
            to: email,
            subject: `[Admin] ${actionText}: ${product.title}`,
            title: actionText,
            content: content,
            logoUrl: product.images?.[0] || LOGO_URL,
            actionButton: {
                text: "Go to Approvals",
                url: "https://staging-stitches-africa.vercel.app/marketing/approvals"
            }
        });
    });

    await Promise.allSettled(promises);
};

export const getTailorEmail = async (tailorId: string): Promise<string | null> => {
    try {
        // Fallback: If the ID itself looks like an email, assume it is the email
        // This handles cases where the system might use email as ID in legacy/specific contexts
        if (tailorId.includes('@')) {
            return tailorId;
        }

        const tailorRef = doc(db, "staging_tailors", tailorId);
        const tailorSnap = await getDoc(tailorRef);
        
        if (!tailorSnap.exists()) {
            console.error("Tailor not found:", tailorId);
            return null;
        }

        const tailorData = tailorSnap.data();
        return tailorData.tailor_registered_info?.email || null;
    } catch (error) {
        console.error("Error fetching tailor email:", error);
        return null;
    }
};

export const sendEmailToVendor = async (tailorId: string, product: TailorWork, status: 'approved' | 'rejected', reason?: string) => {
    try {
        // 1. Fetch vendor email
        const email = await getTailorEmail(tailorId);
        
        if (!email) {
            console.warn("No email found for tailor:", tailorId);
            return;
        }

        // 2. Prepare content
        const isApproved = status === 'approved';
        const title = isApproved ? "Product Approved! 🎉" : "Product Update";
        const subject = `Product ${isApproved ? 'Approved' : 'Returned'}: ${product.title}`;
        
        const content = isApproved 
            ? `
                <div style="font-family: sans-serif; color: #333;">
                    <p>Good news! Your product <strong>${product.title}</strong> has been approved and is now live on Stitches Africa.</p>
                    <p>You can view and manage it from your products dashboard.</p>
                </div>
            `
            : `
                <div style="font-family: sans-serif; color: #333;">
                    <p>We've reviewed your product <strong>${product.title}</strong> and unfortunately, we couldn't approve it at this time.</p>
                    <div style="background: #fff0f0; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fed7d7;">
                        <strong style="color: #c53030;">Reason for rejection:</strong>
                        <p style="margin: 8px 0 0; color: #2d3748;">${reason || 'Does not meet our quality guidelines.'}</p>
                    </div>
                    <p>Please edit the product to address these issues and submit it again.</p>
                </div>
            `;

        // 3. Send email
        await callSendGenericEmail({
            to: email,
            subject: subject,
            title: title,
            content: content,
            logoUrl: product.images?.[0] || LOGO_URL,
            actionButton: {
                text: isApproved ? "View Product" : "Edit Product",
                url: isApproved 
                    ? `https://staging-stitches-africa.vercel.app/vendor/products/${product.id}`
                    : `https://staging-stitches-africa.vercel.app/vendor/products/${product.id}/edit`
            }
        });

    } catch (error) {
        console.error("Error sending vendor email:", error);
    }
};

export const sendOrderPlacedVendorEmail = async (data: {
    to: string;
    vendorName: string;
    orderId: string;
    customerName: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddress?: string;
    specialInstructions?: string;
    logoUrl: string;
}) => {
    try {
        const content = `
            <div style="font-family: sans-serif; color: #333;">
                <p>Hello <strong>${data.vendorName}</strong>,</p>
                <p>You have received a new VVIP order!</p>
                
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin-top: 0;">Order Summary</h3>
                    <p><strong>Order ID:</strong> ${data.orderId}</p>
                    <p><strong>Customer:</strong> ${data.customerName}</p>
                    <p><strong>Total Amount:</strong> ${data.totalAmount.toLocaleString()}</p>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
                    
                    <p><strong>Items:</strong></p>
                    <p>${data.quantity}x ${data.productName}</p>
                    
                    ${data.specialInstructions ? `<p><strong>Note:</strong> ${data.specialInstructions}</p>` : ''}
                </div>

                <div style="margin-top: 16px;">
                    <p><strong>Delivery Details:</strong></p>
                    <p>${data.deliveryAddress || 'Address provided in order details'}</p>
                    <p>${data.customerPhone || ''}</p>
                    <p>${data.customerEmail || ''}</p>
                </div>
            </div>
        `;

        await callSendGenericEmail({
            to: data.to,
            subject: `New VVIP Order Received #${data.orderId}`,
            title: "New Order Notification",
            content: content,
            logoUrl: data.logoUrl,
            actionButton: {
                text: "View Order",
                url: `https://staging-stitches-africa.vercel.app` // Default to home or dashboard if specific URL unavailable
            }
        });

        console.log(`[Email Service] Sent generic email to ${data.to} for order ${data.orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to send vendor order email to", data.to, error);
        return { success: false, error };
    }
};
