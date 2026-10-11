import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Building,
  Room,
  Tenant,
  Bill,
  Incident,
  ViewingAppointment,
  RoomStatus,
} from '../types';
import {
  initialBuildings,
  initialRooms,
  initialTenants,
  initialBills,
  initialIncidents,
  initialAppointments,
} from '../data/mockData';

export type UserRole = 'renter' | 'landlord' | 'tenant';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedBuildingId: string;
  setSelectedBuildingId: (id: string) => void;
  
  // Data
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  bills: Bill[];
  incidents: Incident[];
  appointments: ViewingAppointment[];

  // Room Actions
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  updateRoomStatus: (id: string, status: RoomStatus) => void;

  // Tenant Actions
  addTenant: (tenant: Omit<Tenant, 'id'>) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  checkoutTenant: (tenantId: string) => void;

  // Bill Actions
  createBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  markBillPaid: (id: string, method?: 'bank_transfer' | 'cash') => void;
  deleteBill: (id: string) => void;

  // Incident Actions
  addIncident: (incident: Omit<Incident, 'id' | 'createdAt'>) => void;
  updateIncidentStatus: (id: string, status: Incident['status'], cost?: number, notes?: string) => void;

  // Appointment Actions
  addAppointment: (appointment: Omit<ViewingAppointment, 'id' | 'createdAt' | 'status'>) => void;
  updateAppointmentStatus: (id: string, status: ViewingAppointment['status']) => void;

  // Reset
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUILDINGS: 'nhatro_buildings',
  ROOMS: 'nhatro_rooms',
  TENANTS: 'nhatro_tenants',
  BILLS: 'nhatro_bills',
  INCIDENTS: 'nhatro_incidents',
  APPOINTMENTS: 'nhatro_appointments',
  ROLE: 'nhatro_role',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'renter';
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');

  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    return saved ? JSON.parse(saved) : initialBuildings;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TENANTS);
    return saved ? JSON.parse(saved) : initialTenants;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
    return saved ? JSON.parse(saved) : initialBills;
  });

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
    return saved ? JSON.parse(saved) : initialIncidents;
  });

  const [appointments, setAppointments] = useState<ViewingAppointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  // Room Actions
  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now()}`,
    };
    setRooms(prev => [newRoom, ...prev]);
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const updateRoomStatus = (id: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // Tenant Actions
  const addTenant = (tenantData: Omit<Tenant, 'id'>) => {
    const newId = `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      ...tenantData,
      id: newId,
    };
    setTenants(prev => [newTenant, ...prev]);

    // Update room status to occupied
    updateRoom(tenantData.roomId, {
      status: 'occupied',
      currentOccupants: 1,
      currentTenantId: newId,
    });
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const checkoutTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      updateRoom(tenant.roomId, {
        status: 'available',
        currentOccupants: 0,
        currentTenantId: undefined,
      });
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    }
  };

  // Bill Actions
  const createBill = (billData: Omit<Bill, 'id'>) => {
    const newBill: Bill = {
      ...billData,
      id: `bill-${Date.now()}`,
    };
    setBills(prev => [newBill, ...prev]);
  };

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const markBillPaid = (id: string, method: 'bank_transfer' | 'cash' = 'bank_transfer') => {
    const today = new Date().toISOString().split('T')[0];
    setBills(prev => prev.map(b => b.id === id ? {
      ...b,
      status: 'paid',
      paidDate: today,
      paymentMethod: method,
    } : b));
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  // Incident Actions
  const addIncident = (incidentData: Omit<Incident, 'id' | 'createdAt'>) => {
    const newIncident: Incident = {
      ...incidentData,
      id: `inc-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    setIncidents(prev => [newIncident, ...prev]);
  };

  const updateIncidentStatus = (
    id: string,
    status: Incident['status'],
    cost?: number,
    notes?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          ...(status === 'resolved' ? { resolvedAt: today } : {}),
          ...(cost !== undefined ? { cost } : {}),
          ...(notes !== undefined ? { notes } : {}),
        };
      }
      return inc;
    }));
  };

  // Appointment Actions
  const addAppointment = (appointmentData: Omit<ViewingAppointment, 'id' | 'createdAt' | 'status'>) => {
    const newAppointment: ViewingAppointment = {
      ...appointmentData,
      id: `app-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAppointments(prev => [newAppointment, ...prev]);
  };

  const updateAppointmentStatus = (id: string, status: ViewingAppointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  // Reset to default
  const resetToSampleData = () => {
    setBuildings(initialBuildings);
    setRooms(initialRooms);
    setTenants(initialTenants);
    setBills(initialBills);
    setIncidents(initialIncidents);
    setAppointments(initialAppointments);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        selectedBuildingId,
        setSelectedBuildingId,
        buildings,
        rooms,
        tenants,
        bills,
        incidents,
        appointments,
        addRoom,
        updateRoom,
        deleteRoom,
        updateRoomStatus,
        addTenant,
        updateTenant,
        checkoutTenant,
        createBill,
        updateBill,
        markBillPaid,
        deleteBill,
        addIncident,
        updateIncidentStatus,
        addAppointment,
        updateAppointmentStatus,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
