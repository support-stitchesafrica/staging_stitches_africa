/** Mintsoft API shapes (subset of Swagger models). */

export type MintsoftNewOrderResult = {
	OrderId?: number;
	OrderNumber?: string;
	Success?: boolean;
	OrderStatusId?: number;
	OrderStatus?: string;
	Message?: string;
};

export type MintsoftOrderRecord = {
	ID?: number;
	OrderNumber?: string;
	ExternalOrderReference?: string;
	OrderStatusId?: number;
	OrderStatus?: string;
	TrackingNumber?: string;
	TrackingURL?: string;
	CourierServiceName?: string;
	DespatchDate?: string;
	OrderItems?: unknown[];
};

export type MintsoftStockLevel = {
	ProductId?: number;
	WarehouseId?: number;
	SKU?: string;
	Level?: number;
	TotalStockLevel?: number;
	LastUpdated?: string;
};

export type MintsoftConnectAction = {
	Type?: string;
	SourceOrderId?: string;
	Complete?: boolean;
	ExtraCode1?: string;
	ExtraCode2?: string;
	ExtraCode3?: string;
	ExtraCode4?: string;
	ExtraCode5?: string;
};

export type MintsoftOrderStatus = {
	ID?: number;
	Name?: string;
	ExternalName?: string;
};
