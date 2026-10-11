export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type RoomCategory = 'boarding' | 'mini_apartment' | 'studio' | 'dormitory' | 'full_house';

export interface RoomAmenities {
  airConditioner: boolean;
  waterHeater: boolean;
  mezzanine: boolean;       // Gác lửng
  balcony: boolean;         // Ban công / Cửa sổ lớn
  fridge: boolean;
  washingMachine: boolean;
  privateBathroom: boolean; // Vệ sinh khép kín
  freeHours: boolean;       // Giờ giấc tự do
  petsAllowed: boolean;     // Cho nuôi thú cưng
  wifi: boolean;
  securityCamera: boolean;
  parking: boolean;         // Chỗ để xe máy
  kitchenShelf: boolean;    // Kệ bếp riêng
}

export interface Room {
  id: string;
  buildingId: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  category: RoomCategory;
  area: number;             // m²
  price: number;            // VNĐ / tháng
  deposit: number;          // Tiền cọc VNĐ
  status: RoomStatus;
  maxOccupants: number;
  currentOccupants: number;
  amenities: RoomAmenities;
  images: string[];
  description: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  electricityRate: number;  // VNĐ/kWh
  waterRate: number;        // VNĐ/khối hoặc VNĐ/người
  waterRateType: 'per_m3' | 'per_person';
  internetFee: number;      // VNĐ/phòng hoặc tháng
  garbageFee: number;       // VNĐ/tháng
  parkingFee: number;       // VNĐ/xe/tháng
  currentTenantId?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  totalFloors: number;
  totalRooms: number;
  electricityRate: number;
  waterRate: number;
  waterRateType: 'per_m3' | 'per_person';
  garbageFee: number;
  internetFee: number;
  parkingFee: number;
  landlordName: string;
  landlordPhone: string;
  landlordZalo?: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

export interface Tenant {
  id: string;
  roomId: string;
  roomNumber: string;
  buildingId: string;
  fullName: string;
  phone: string;
  email?: string;
  idCardNumber: string;     // CCCD/CMND
  birthYear?: number;
  hometown: string;         // Quê quán
  job: string;              // Nghề nghiệp / Sinh viên
  licensePlate?: string;    // Biển số xe
  startDate: string;        // YYYY-MM-DD
  endDate?: string;         // Ngày hết hạn hợp đồng
  contractMonths: number;
  depositPaid: number;      // Tiền cọc đã đóng
  notes?: string;
  avatar?: string;
}

export interface Bill {
  id: string;
  roomId: string;
  roomNumber: string;
  buildingId: string;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  monthYear: string;        // e.g. "10/2026"
  createdAt: string;        // YYYY-MM-DD
  roomPrice: number;
  
  prevElectric: number;
  currElectric: number;
  electricKwh: number;
  electricRate: number;
  electricTotal: number;
  
  prevWater: number;
  currWater: number;
  waterUsage: number;
  waterRate: number;
  waterRateType: 'per_m3' | 'per_person';
  waterTotal: number;
  
  internetFee: number;
  garbageFee: number;
  parkingCount: number;
  parkingFee: number;
  parkingTotal: number;
  otherFee: number;
  otherFeeNote?: string;
  discount: number;
  
  totalAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
  paidDate?: string;
  paymentMethod?: 'bank_transfer' | 'cash';
  notes?: string;
}

export type IncidentCategory = 'electricity' | 'water' | 'appliance' | 'security' | 'cleanliness' | 'other';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type IncidentStatus = 'pending' | 'in_progress' | 'resolved';

export interface Incident {
  id: string;
  roomId: string;
  roomNumber: string;
  buildingId: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  reportedBy: string;
  reportedPhone: string;
  createdAt: string;
  resolvedAt?: string;
  cost?: number;
  notes?: string;
}

export interface ViewingAppointment {
  id: string;
  roomId: string;
  roomNumber: string;
  buildingName: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  viewingDate: string;      // YYYY-MM-DD
  viewingTime: string;      // HH:mm
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}
