export interface MintsoftOrder {
  OrderNumber: string;
  /** Required when the API user is a Mintsoft admin (3PL). See GET /api/Client → `ID`. */
  ClientId?: number;
  /** Optional Mintsoft field for 3PL / external reference (same as order id if set). */
  ExternalOrderReference?: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;

  Address1: string;
  Address2?: string;
  Town: string;
  County?: string;
  PostCode: string;
  Country: string;

  CourierService: string;
  Warehouse: string;
  Currency: string;

  OrderValue: number;

  OrderItems: {
    SKU: string;
    Quantity: number;
    UnitPrice: number;
    UnitPriceVat?: number;
  }[];
}