import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Database, 
  FolderTree, 
  ShieldCheck, 
  Users, 
  Wrench, 
  KeyRound, 
  PlusCircle, 
  Zap, 
  DoorClosed, 
  Smartphone, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Star, 
  Camera, 
  Home, 
  MapPin, 
  CreditCard,
  History,
  Phone,
  HelpCircle,
  Sparkles,
  Flame,
  ArrowRight,
  SlidersHorizontal,
  FileCode2,
  UserPlus
} from 'lucide-react';

import { 
  User, 
  RoleType, 
  ManagementNode, 
  ObjectType, 
  RentalContract, 
  Roommate, 
  MonthlyInvoice, 
  DeviceIssueReport, 
  TwoWayReview, 
  BuildingPost,
  DeviceCondition,
  RoomReservation
} from './types/rental';
import { 
  getDeviceLatestPriceForMonth, 
  getDeviceCurrentLatestPrice, 
  buildDeviceBreakdownForMonth 
} from './utils/pricingUtils';
import { 
  checkIsResidenceFeeBillingMonth, 
  getRoomOccupantCount 
} from './utils/utilityCalculations';
import { formatDateVN, formatDateTimeVN } from './utils/dateUtils';

import { 
  INITIAL_USERS, 
  INITIAL_OBJECT_TYPES, 
  INITIAL_TREE_NODES, 
  INITIAL_CONTRACTS, 
  INITIAL_ROOMMATES, 
  INITIAL_INVOICES, 
  INITIAL_DEVICE_ISSUES, 
  INITIAL_SHARED_LOGS, 
  INITIAL_REVIEWS, 
  INITIAL_POSTS,
  INITIAL_RESERVATIONS
} from './data/mockData';

import { Navbar, PageId } from './components/Navbar';
import { TenantView } from './components/TenantView';
import { ManagerView } from './components/ManagerView';
import { AdminView } from './components/AdminView';
import { UserModal } from './components/UserModal';
import { SqlModal } from './components/SqlModal';
import { SqlServerConnectionModal } from './components/SqlServerConnectionModal';
import { AddBuildingModal } from './components/AddBuildingModal';
import { AddRoomModal } from './components/AddRoomModal';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { ReviewsPage } from './components/pages/ReviewsPage';

export default function App() {
  // Trang hiện tại: 'home' (Trang chủ) | 'about' (Giới thiệu) | 'reviews' (Nhận định) | 'dashboard' (Bảng điều khiển)
  const [activePage, setActivePage] = useState<PageId>('home');

  // Trạng thái tài khoản người dùng
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rental_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Người dùng đang đăng nhập (hoặc null nếu là khách vãng lai)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem('rental_current_user_id');
    if (savedId) {
      const u = allUsers.find(user => user.userId === Number(savedId));
      if (u) return u;
    }
    // Mặc định đăng nhập tài khoản Khách thuê Nguyễn Văn An để trải nghiệm, có nút Đăng xuất trên thanh điều hướng
    return allUsers.find(u => u.roleId === 3) || allUsers[0];
  });

  const [objectTypes, setObjectTypes] = useState<ObjectType[]>(() => {
    const saved = localStorage.getItem('rental_object_types');
    return saved ? JSON.parse(saved) : INITIAL_OBJECT_TYPES;
  });

  const [nodes, setNodes] = useState<ManagementNode[]>(() => {
    const saved = localStorage.getItem('rental_tree_nodes_v3');
    return saved ? JSON.parse(saved) : INITIAL_TREE_NODES;
  });

  const [contracts, setContracts] = useState<RentalContract[]>(() => {
    const saved = localStorage.getItem('rental_contracts');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
  });

  const [roommates, setRoommates] = useState<Roommate[]>(() => {
    const saved = localStorage.getItem('rental_roommates');
    return saved ? JSON.parse(saved) : INITIAL_ROOMMATES;
  });

  const [invoices, setInvoices] = useState<MonthlyInvoice[]>(() => {
    const saved = localStorage.getItem('rental_invoices_v3');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [issues, setIssues] = useState<DeviceIssueReport[]>(() => {
    const saved = localStorage.getItem('rental_issues');
    return saved ? JSON.parse(saved) : INITIAL_DEVICE_ISSUES;
  });

  const [reviews, setReviews] = useState<TwoWayReview[]>(() => {
    const saved = localStorage.getItem('rental_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [posts, setPosts] = useState<BuildingPost[]>(() => {
    const saved = localStorage.getItem('rental_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  // Danh sách giữ phòng / đặt trước
  const [reservations, setReservations] = useState<RoomReservation[]>(() => {
    const saved = localStorage.getItem('rental_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  // Số ngày sắp hết hạn hợp đồng để cho phép đặt trước (do Quản lý ấn định, mặc định 30 ngày)
  const [expiringLeadDays, setExpiringLeadDays] = useState<number>(() => {
    const saved = localStorage.getItem('rental_lead_days');
    return saved ? Number(saved) : 30;
  });

  // Tương tác thiết bị trực tiếp
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [activeSharedSession, setActiveSharedSession] = useState<{
    deviceName: string;
    remainingMinutes: number;
  } | null>(null);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showSqlConnectionModal, setShowSqlConnectionModal] = useState(false);
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [preselectedBuildingIdForRoom, setPreselectedBuildingIdForRoom] = useState<number | null>(null);

  const handleOpenAddRoomModal = (buildingId?: number) => {
    if (buildingId) {
      setPreselectedBuildingIdForRoom(buildingId);
    } else {
      setPreselectedBuildingIdForRoom(null);
    }
    setShowAddRoomModal(true);
  };

  // Trạng thái kết nối MS SQL Server thực tế
  const [isSqlConnected, setIsSqlConnected] = useState(false);
  const [sqlServerInfo, setSqlServerInfo] = useState<any>(null);

  // Kiểm tra trạng thái SQL Server backend khi khởi chạy
  useEffect(() => {
    fetch('/api/sql/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setIsSqlConnected(true);
          setSqlServerInfo(data);
        }
      })
      .catch(() => {});
  }, []);

  // Lưu trữ localStorage
  useEffect(() => {
    localStorage.setItem('rental_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rental_current_user_id', currentUser.userId.toString());
    } else {
      localStorage.removeItem('rental_current_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('rental_object_types', JSON.stringify(objectTypes));
  }, [objectTypes]);

  useEffect(() => {
    localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('rental_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('rental_invoices_v3', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('rental_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('rental_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('rental_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('rental_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('rental_lead_days', expiringLeadDays.toString());
  }, [expiringLeadDays]);

  // Bộ đếm lùi thời gian thiết bị dùng chung
  useEffect(() => {
    if (!activeSharedSession) return;
    const timer = setInterval(() => {
      setActiveSharedSession((prev) => {
        if (!prev) return null;
        if (prev.remainingMinutes <= 1) return null;
        return { ...prev, remainingMinutes: prev.remainingMinutes - 1 };
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [activeSharedSession]);

  // 1. Mở cổng an ninh
  const handleOpenGate = (buildingNodeId: number) => {
    setGateUnlocked(true);
    setTimeout(() => {
      setGateUnlocked(false);
    }, 4000);
  };

  // 2. Kích hoạt thiết bị dùng chung
  const handleActivateSharedDevice = (
    deviceNodeId: number, 
    deviceName: string, 
    cost: number, 
    durationMinutes: number
  ) => {
    setActiveSharedSession({
      deviceName,
      remainingMinutes: durationMinutes
    });

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.contractId === 1) {
          return {
            ...inv,
            sharedDeviceCost: inv.sharedDeviceCost + cost,
            totalAmount: inv.totalAmount + cost
          };
        }
        return inv;
      })
    );
  };

  // 3. Báo hỏng thiết bị
  const handleSubmitIssue = (newIssue: { 
    nodeId: number; 
    issueType: 'DAMAGED' | 'DIRTY' | 'DIFFICULT_TO_USE'; 
    description: string 
  }) => {
    if (!currentUser) return;
    const targetNode = nodes.find((n) => n.nodeId === newIssue.nodeId);
    const report: DeviceIssueReport = {
      reportId: Date.now(),
      nodeId: newIssue.nodeId,
      deviceName: targetNode?.nodeName || 'Thiết bị',
      location: targetNode?.addressOrLocation || 'Tòa nhà',
      isSharedDevice: targetNode?.isShared ?? true,
      roomNodeId: targetNode?.roomNodeId,
      buildingNodeId: targetNode?.buildingNodeId,
      reportedByUserId: currentUser.userId,
      reportedByName: currentUser.fullName,
      issueType: newIssue.issueType,
      description: newIssue.description,
      status: 'PENDING',
      reportedAt: formatDateTimeVN(new Date()),
      warrantyInfo: targetNode?.warrantyExpiryDate 
        ? `Bảo hành đến: ${formatDateVN(targetNode.warrantyExpiryDate)} (Số serial: ${targetNode.serialNumber || 'N/A'})`
        : undefined
    };

    setIssues([report, ...issues]);

    const condCode: DeviceCondition = newIssue.issueType === 'DAMAGED' ? 3 : newIssue.issueType === 'DIRTY' ? 1 : 2;
    setNodes((prev) =>
      prev.map((n) => (n.nodeId === newIssue.nodeId ? { ...n, currentCondition: condCode } : n))
    );
  };

  // 4. Khách thuê đánh giá Quản lý (Khóa vĩnh viễn)
  const handleSubmitReviewByTenant = (newReview: {
    contractId: number;
    targetUserId: number;
    rating: number;
    comment: string;
  }) => {
    if (!currentUser) return;
    const rev: TwoWayReview = {
      reviewId: Date.now(),
      contractId: newReview.contractId,
      roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
      reviewerUserId: currentUser.userId,
      reviewerName: `${currentUser.fullName} (Khách thuê)`,
      reviewerRole: 'TENANT',
      targetUserId: newReview.targetUserId,
      targetUserName: 'Lê Văn Hoàng (Quản lý)',
      rating: newReview.rating,
      comment: newReview.comment,
      isLocked: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setReviews([rev, ...reviews]);
  };

  // 5. Quản lý đánh giá khách thuê
  const handleManagerReviewTenant = (
    contractId: number,
    tenantUserId: number,
    rating: number,
    comment: string
  ) => {
    if (!currentUser) return;
    const contract = contracts.find((c) => c.contractId === contractId);
    const existingIndex = reviews.findIndex(
      (r) => r.contractId === contractId && r.reviewerRole === 'BUILDING_MANAGER'
    );

    if (existingIndex >= 0) {
      if (reviews[existingIndex].isLocked) {
        alert('Đánh giá này đã bị khóa do khách đã trả phòng, không thể chỉnh sửa!');
        return;
      }
      const updated = [...reviews];
      updated[existingIndex] = {
        ...updated[existingIndex],
        rating,
        comment,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setReviews(updated);
    } else {
      const rev: TwoWayReview = {
        reviewId: Date.now(),
        contractId,
        roomName: contract?.roomName || 'Phòng thuê',
        reviewerUserId: currentUser.userId,
        reviewerName: `${currentUser.fullName} (Quản lý)`,
        reviewerRole: 'BUILDING_MANAGER',
        targetUserId: tenantUserId,
        targetUserName: contract?.primaryTenantName || 'Khách thuê',
        rating,
        comment,
        isLocked: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setReviews([rev, ...reviews]);
    }
  };

  // 6. Quản lý hoàn tất thủ tục trả phòng -> Khóa đánh giá
  const handleCheckoutAndLockReview = (contractId: number) => {
    const today = new Date().toISOString().split('T')[0];
    setContracts((prev) =>
      prev.map((c) =>
        c.contractId === contractId
          ? { ...c, status: 'CHECKED_OUT', actualCheckOutDate: today }
          : c
      )
    );

    setReviews((prev) =>
      prev.map((r) =>
        r.contractId === contractId && r.reviewerRole === 'BUILDING_MANAGER'
          ? { ...r, isLocked: true }
          : r
      )
    );

    alert(`Đã hoàn tất trả phòng ngày ${today}! Đánh giá của Quản lý đã được KHÓA HOÀN TOÀN.`);
  };

  // 7. Cập nhật số điện nước, đơn giá điện nước & phí dịch vụ của hóa đơn
  const handleUpdateInvoiceMeters = (
    invoiceId: number, 
    currElectric: number, 
    currWater: number,
    newElectricRate?: number,
    newWaterRate?: number,
    newOccupantCount?: number,
    newSanitationFeePerPerson?: number,
    newResidenceFeePerPerson?: number,
    newIsResidenceFeeApplied?: boolean
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.invoiceId === invoiceId) {
          const electricRate = newElectricRate !== undefined && newElectricRate > 0 ? newElectricRate : inv.electricRate;
          const waterRate = newWaterRate !== undefined && newWaterRate > 0 ? newWaterRate : inv.waterRate;
          const electricDiff = Math.max(0, currElectric - inv.prevElectric);
          const waterDiff = Math.max(0, currWater - inv.prevWater);

          const occupantCount = newOccupantCount !== undefined && newOccupantCount > 0 ? newOccupantCount : (inv.occupantCount || 1);
          const sanitationFeePerPerson = newSanitationFeePerPerson !== undefined && newSanitationFeePerPerson >= 0 ? newSanitationFeePerPerson : (inv.sanitationFeePerPerson || 30000);
          const sanitationFee = occupantCount * sanitationFeePerPerson;

          const isResidenceFeeApplied = newIsResidenceFeeApplied !== undefined ? newIsResidenceFeeApplied : (inv.isResidenceFeeApplied ?? false);
          const residenceFeePerPerson = newResidenceFeePerPerson !== undefined && newResidenceFeePerPerson >= 0 ? newResidenceFeePerPerson : (inv.residenceFeePerPerson || 100000);
          const residenceFee = isResidenceFeeApplied ? (occupantCount * residenceFeePerPerson) : 0;

          const newTotal = inv.roomRent + (electricDiff * electricRate) + (waterDiff * waterRate) + (inv.roomDeviceRentalCost || 0) + inv.sharedDeviceCost + inv.internetAndTrash + sanitationFee + residenceFee;
          return {
            ...inv,
            currElectric,
            currWater,
            electricRate,
            waterRate,
            occupantCount,
            sanitationFeePerPerson,
            sanitationFee,
            residenceFeePerPerson,
            isResidenceFeeApplied,
            residenceFee,
            totalAmount: newTotal
          };
        }
        return inv;
      })
    );
  };

  // 7.1 Cập nhật đơn giá điện nước cơ sở & phí dịch vụ của tòa nhà
  const handleUpdateBuildingUtilityRates = (
    buildingNodeId: number, 
    electricRate: number, 
    waterRate: number,
    sanitationFeePerPerson?: number,
    residenceFeePerPerson?: number
  ) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.nodeId === buildingNodeId) {
          return {
            ...n,
            electricRate,
            waterRate,
            sanitationFeePerPerson: sanitationFeePerPerson !== undefined ? sanitationFeePerPerson : (n.sanitationFeePerPerson || 30000),
            residenceFeePerPerson: residenceFeePerPerson !== undefined ? residenceFeePerPerson : (n.residenceFeePerPerson || 100000)
          };
        }
        return n;
      })
    );
  };

  // 8. Đăng bài viết
  const handlePublishPost = (buildingNodeId: number, title: string, summary: string, content: string) => {
    if (!currentUser) return;
    const building = nodes.find((n) => n.nodeId === buildingNodeId);
    const post: BuildingPost = {
      postId: Date.now(),
      buildingNodeId,
      buildingName: building?.nodeName || 'Tòa Nhà',
      authorName: currentUser.fullName,
      authorRole: currentUser.roleId === 1 ? 'Ban Quản Trị Cấp Cao' : 'Quản Lý Tòa Nhà',
      title,
      summary,
      content,
      coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPosts([post, ...posts]);
  };

  // 9. Thêm Loại đối tượng
  const handleAddObjectType = (
    typeCode: string, 
    typeName: string, 
    categoryGroup: 'PROPERTY' | 'ROOM' | 'DEVICE' | 'PUBLIC_SERVICE', 
    metricUnit: string
  ) => {
    const newType: ObjectType = {
      typeId: objectTypes.length + 1,
      typeCode,
      typeName,
      categoryGroup,
      metricUnit,
      hasSubItems: categoryGroup === 'PROPERTY' || categoryGroup === 'ROOM'
    };
    setObjectTypes([...objectTypes, newType]);
  };

  // 10. Thêm Node mới vào Cây
  const handleAddChildNode = (
    parentNodeId: number, 
    typeId: number, 
    nodeCode: string, 
    nodeName: string, 
    unitPrice?: number
  ) => {
    const parentNode = nodes.find((n) => n.nodeId === parentNodeId);
    const isRoomParent = parentNode?.typeId === 3;
    const isDevice = typeId >= 4;
    const priceVal = unitPrice || 0;

    // Tìm buildingNodeId từ parentNode
    let buildingId = parentNode?.buildingNodeId;
    if (!buildingId) {
      if (parentNode?.typeId === 1) buildingId = parentNode.nodeId;
      else {
        let curr = parentNode;
        while (curr && curr.parentNodeId) {
          const p = nodes.find(n => n.nodeId === curr!.parentNodeId);
          if (p?.typeId === 1) {
            buildingId = p.nodeId;
            break;
          }
          curr = p;
        }
      }
    }

    const isShared = !isRoomParent;
    const roomNodeId = isRoomParent ? parentNodeId : null;

    const newNode: ManagementNode = {
      nodeId: Date.now(),
      parentNodeId,
      typeId,
      nodeCode,
      nodeName,
      unitPrice: isShared ? priceVal : priceVal,
      monthlyRentalPrice: !isShared ? priceVal : 0,
      monthlyPriceSchedule: !isShared && priceVal > 0 ? {
        '08/2026': priceVal,
        '09/2026': priceVal,
        '10/2026': priceVal,
        '11/2026': priceVal,
        '12/2026': priceVal,
        '01/2027': priceVal
      } : undefined,
      isShared,
      buildingNodeId: buildingId,
      roomNodeId,
      addressOrLocation: isRoomParent ? `Phòng ${parentNode?.nodeName}` : (parentNode?.nodeName || 'Tòa nhà'),
      currentCondition: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(nextNodes));
  };

  // 10.1 Sửa đối tượng trong Cây Quản Lý Thực Thể Đệ Quy
  const handleUpdateNode = (nodeId: number, updates: Partial<ManagementNode>) => {
    let nextNodesList: ManagementNode[] = [];

    // 1. Cập nhật nodes và đồng bộ liên kết cha-con
    setNodes((prev) => {
      const nextNodes = prev.map((n) => {
        if (n.nodeId === nodeId) {
          const merged: ManagementNode = { ...n, ...updates };

          // Đồng bộ giá nếu là thiết bị theo phòng
          if (merged.typeId >= 4 && !merged.isShared) {
            if (updates.monthlyRentalPrice !== undefined) {
              merged.monthlyRentalPrice = updates.monthlyRentalPrice;
              if (updates.unitPrice === undefined) {
                merged.unitPrice = updates.monthlyRentalPrice;
              }
            } else if (updates.unitPrice !== undefined && updates.unitPrice > 0 && (!merged.monthlyRentalPrice || merged.monthlyRentalPrice === 0)) {
              merged.monthlyRentalPrice = updates.unitPrice;
            }
          }

          // Đồng bộ giá thiết bị theo tháng vào bảng giá lịch sử
          if (merged.monthlyRentalPrice && merged.monthlyRentalPrice > 0) {
            if (!merged.monthlyPriceSchedule) merged.monthlyPriceSchedule = {};
            merged.monthlyPriceSchedule['09/2026'] = merged.monthlyRentalPrice;
            merged.monthlyPriceSchedule['10/2026'] = merged.monthlyRentalPrice;
            merged.monthlyPriceSchedule['11/2026'] = merged.monthlyRentalPrice;
            merged.monthlyPriceSchedule['12/2026'] = merged.monthlyRentalPrice;
            merged.monthlyPriceSchedule['01/2027'] = merged.monthlyRentalPrice;
          } else if (merged.isShared || (merged.typeId >= 4 && (!merged.monthlyRentalPrice || merged.monthlyRentalPrice === 0))) {
            merged.monthlyPriceSchedule = {};
            merged.monthlyRentalPrice = 0;
          }

          // Tự động suy ra buildingNodeId và roomNodeId cho thiết bị
          if (merged.typeId >= 4) {
            if (merged.isShared) {
              merged.roomNodeId = null;
              // Tìm buildingNodeId từ parentNodeId
              let currP = merged.parentNodeId;
              while (currP) {
                const parent = prev.find(p => p.nodeId === currP);
                if (parent && parent.typeId === 1) {
                  merged.buildingNodeId = parent.nodeId;
                  break;
                }
                currP = parent?.parentNodeId || null;
              }
            } else {
              // Thiết bị trong phòng
              if (updates.roomNodeId !== undefined) {
                merged.roomNodeId = updates.roomNodeId;
              } else {
                let currP = merged.parentNodeId;
                while (currP) {
                  const parent = prev.find(p => p.nodeId === currP);
                  if (parent && parent.typeId === 3) {
                    merged.roomNodeId = parent.nodeId;
                    break;
                  }
                  if (parent && parent.typeId === 1) {
                    merged.buildingNodeId = parent.nodeId;
                    break;
                  }
                  currP = parent?.parentNodeId || null;
                }
              }
            }
          }
          return merged;
        }
        return n;
      });
      nextNodesList = nextNodes;
      localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(nextNodes));
      return nextNodes;
    });

    // 2. Đồng bộ hóa với hợp đồng (contracts), hóa đơn (invoices) và báo cáo (issues)
    const targetNode = nodes.find(n => n.nodeId === nodeId);
    if (targetNode) {
      // Nếu đổi tên hoặc giá phòng
      if (targetNode.typeId === 3) {
        if (updates.nodeName) {
          setContracts(prev => {
            const next = prev.map(c => c.roomNodeId === nodeId ? { ...c, roomName: updates.nodeName! } : c);
            localStorage.setItem('rental_contracts', JSON.stringify(next));
            return next;
          });
        }
        if (updates.unitPrice !== undefined && updates.unitPrice > 0) {
          setContracts(prev => {
            const next = prev.map(c => c.roomNodeId === nodeId ? { ...c, monthlyRent: updates.unitPrice! } : c);
            localStorage.setItem('rental_contracts', JSON.stringify(next));
            return next;
          });
        }
      }

      // Nếu đổi tên tòa nhà
      if (targetNode.typeId === 1 && updates.nodeName) {
        setContracts(prev => {
          const next = prev.map(c => c.buildingNodeId === nodeId ? { ...c, buildingName: updates.nodeName! } : c);
          localStorage.setItem('rental_contracts', JSON.stringify(next));
          return next;
        });
      }

      // Nếu đổi tên thiết bị
      if (targetNode.typeId >= 4 && updates.nodeName) {
        setIssues(prev => {
          const next = prev.map(iss => iss.nodeId === nodeId ? { ...iss, deviceName: updates.nodeName! } : iss);
          localStorage.setItem('rental_issues', JSON.stringify(next));
          return next;
        });
      }
    }

    // 3. Tự động tính toán lại hóa đơn chưa duyệt/chưa khóa của phòng bị ảnh hưởng
    setInvoices(prev => {
      const next = prev.map(inv => {
        if (inv.isLocked || inv.isApproved) return inv;

        const isRoomAffected = inv.roomNodeId === nodeId;
        const targetOldNode = targetNode;
        const isDeviceAffected = nextNodesList.some(
          d => d.nodeId === nodeId && d.typeId >= 4 && (d.roomNodeId === inv.roomNodeId || d.parentNodeId === inv.roomNodeId)
        ) || (targetOldNode && targetOldNode.typeId >= 4 && (targetOldNode.roomNodeId === inv.roomNodeId || targetOldNode.parentNodeId === inv.roomNodeId));

        if (!isRoomAffected && !isDeviceAffected) return inv;

        // Tính lại danh sách thiết bị phòng
        const currentNodes = nextNodesList.length > 0 ? nextNodesList : nodes;
        const roomDevs = currentNodes.filter(
          n => n.typeId >= 4 && !n.isShared && (n.roomNodeId === inv.roomNodeId || n.parentNodeId === inv.roomNodeId)
        );

        const breakdown = roomDevs.map(d => ({
          deviceNodeId: d.nodeId,
          deviceCode: d.nodeCode,
          deviceName: d.nodeName,
          monthlyPrice: getDeviceLatestPriceForMonth(d, inv.monthYear),
          category: d.deviceCategory,
          snapshotAppliedAt: new Date().toISOString().split('T')[0]
        }));

        const totalDeviceRent = breakdown.reduce((sum, item) => sum + item.monthlyPrice, 0);
        const currentRoomRent = isRoomAffected && updates.unitPrice !== undefined && updates.unitPrice > 0 ? updates.unitPrice : inv.roomRent;
        const currentRoomName = isRoomAffected && updates.nodeName ? updates.nodeName : inv.roomName;
        const electricDiff = Math.max(0, inv.currElectric - inv.prevElectric);
        const waterDiff = Math.max(0, inv.currWater - inv.prevWater);
        const newTotal = currentRoomRent + (electricDiff * inv.electricRate) + (waterDiff * inv.waterRate) + totalDeviceRent + inv.sharedDeviceCost + inv.internetAndTrash;

        return {
          ...inv,
          roomName: currentRoomName,
          roomRent: currentRoomRent,
          roomDeviceRentalCost: totalDeviceRent,
          deviceBreakdown: breakdown,
          totalAmount: newTotal
        };
      });
      localStorage.setItem('rental_invoices_v3', JSON.stringify(next));
      return next;
    });
  };

  // 10.2 Xóa đối tượng khỏi Cây Quản Lý Thực Thể Đệ Quy
  const handleDeleteNode = (nodeId: number) => {
    const target = nodes.find((n) => n.nodeId === nodeId);
    if (!target) return;
    const hasChildren = nodes.some((n) => n.parentNodeId === nodeId);
    if (hasChildren) {
      if (!confirm(`Đối tượng "${target.nodeName}" (${target.nodeCode}) đang có các mục con trực thuộc. Bạn có chắc chắn muốn xóa đối tượng này cùng TOÀN BỘ các mục con của nó không?`)) {
        return;
      }
      const getAllDescendantIds = (parentId: number): number[] => {
        const directChildren = nodes.filter((n) => n.parentNodeId === parentId);
        let ids: number[] = [];
        directChildren.forEach((c) => {
          ids.push(c.nodeId);
          ids = ids.concat(getAllDescendantIds(c.nodeId));
        });
        return ids;
      };
      const idsToDelete = [nodeId, ...getAllDescendantIds(nodeId)];
      setNodes((prev) => prev.filter((n) => !idsToDelete.includes(n.nodeId)));
      setIssues((prev) => prev.filter((iss) => !idsToDelete.includes(iss.nodeId)));
    } else {
      if (!confirm(`Bạn có chắc chắn muốn xóa đối tượng "${target.nodeName}" (${target.nodeCode}) khỏi cây quản lý không?`)) {
        return;
      }
      setNodes((prev) => prev.filter((n) => n.nodeId !== nodeId));
      setIssues((prev) => prev.filter((iss) => iss.nodeId !== nodeId));
    }
  };

  // 11. Cập nhật tình trạng node
  const handleUpdateCondition = (nodeId: number, condition: DeviceCondition) => {
    setNodes((prev) =>
      prev.map((n) => (n.nodeId === nodeId ? { ...n, currentCondition: condition } : n))
    );
    if (condition === 0) {
      setIssues((prev) =>
        prev.map((iss) => (iss.nodeId === nodeId ? { ...iss, status: 'RESOLVED' } : iss))
      );
    }
  };

  // 12. Quản lý thêm phòng mới (Quản lý cấp 1 và 2)
  const handleAddRoom = (
    buildingNodeId: number, 
    roomName: string, 
    rent: number, 
    deposit: number, 
    roomCode?: string, 
    priceNote?: string,
    imageUrl?: string
  ) => {
    const roomId = Date.now();
    const newRoomNode: ManagementNode = {
      nodeId: roomId,
      parentNodeId: buildingNodeId,
      typeId: 3,
      nodeCode: roomCode || `P-${Math.floor(Math.random() * 900) + 100}`,
      nodeName: roomName,
      unitPrice: rent,
      depositAmount: deposit,
      pricePeriodNote: priceNote || 'Giá tiêu chuẩn',
      imageUrl,
      currentCondition: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Phòng tạo bởi ${currentUser?.fullName || 'Quản lý'}`
    };
    setNodes((prev) => [...prev, newRoomNode]);
    alert(`Đã thêm phòng "${roomName}" (${newRoomNode.nodeCode}) với giá ${rent.toLocaleString('vi-VN')} đ/tháng (${priceNote || 'Giá tiêu chuẩn'}) thành công!`);
  };

  // 12.1 Bớt phòng (Xóa phòng)
  const handleDeleteRoom = (roomNodeId: number) => {
    const room = nodes.find((n) => n.nodeId === roomNodeId);
    if (!room) return;
    const hasActiveContract = contracts.some((c) => c.roomNodeId === roomNodeId && c.status === 'ACTIVE');
    if (hasActiveContract) {
      alert(`Không thể bớt phòng "${room.nodeName}" vì đang có hợp đồng khách thuê đang ở! Vui lòng thực hiện thủ tục trả phòng trước khi bớt phòng.`);
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn bớt phòng "${room.nodeName}" (${room.nodeCode}) khỏi tòa nhà không?`)) {
      setNodes((prev) => prev.filter((n) => n.nodeId !== roomNodeId));
      setReservations((prev) => prev.filter((r) => r.roomNodeId !== roomNodeId));
      alert(`Đã bớt phòng "${room.nodeName}" thành công!`);
    }
  };

  // 12.2 Ấn định mức giá theo từng thời điểm
  const handleUpdateRoomPrice = (roomNodeId: number, newPrice: number, priceNote?: string) => {
    setNodes((prev) => {
      const next = prev.map((n) => {
        if (n.nodeId === roomNodeId) {
          const currentSeasonal = n.seasonalPrices || {};
          const noteKey = priceNote || 'Giá tiêu chuẩn';
          return {
            ...n,
            unitPrice: newPrice,
            depositAmount: newPrice,
            pricePeriodNote: priceNote,
            seasonalPrices: {
              ...currentSeasonal,
              [noteKey]: newPrice
            }
          };
        }
        return n;
      });
      localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(next));
      return next;
    });
  };

  // 12.3 Phân công quản lý cấp 2 phụ trách tòa nhà (Admin cấp 1 ấn định)
  const handleAssignManagerToBuilding = (buildingNodeId: number, managerUserId: number) => {
    const targetMgr = allUsers.find((u) => u.userId === managerUserId);
    setNodes((prev) => {
      const next = prev.map((n) => {
        if (n.nodeId === buildingNodeId) {
          return {
            ...n,
            managerUserId,
            notes: `Người quản lý phụ trách: ${targetMgr?.fullName || 'Quản lý'} (ID: ${managerUserId})`
          };
        }
        return n;
      });
      localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(next));
      return next;
    });
  };

  // 12.4 Thêm thiết bị vào tòa nhà (Đi theo từng nhà: Dùng chung hoặc Gán vào phòng)
  const handleAddDeviceToBuilding = (
    buildingNodeId: number,
    deviceName: string,
    typeId: number,
    serialNumber?: string,
    isShared: boolean = true,
    roomNodeId: number | null = null,
    location?: string,
    unitPrice?: number,
    monthlyRentalPrice?: number,
    monthlyPriceSchedule?: { [monthYear: string]: number },
    imageUrl?: string
  ) => {
    const devId = Date.now();
    const typeObj = objectTypes.find((t) => t.typeId === typeId);
    const building = nodes.find((n) => n.nodeId === buildingNodeId);
    const room = roomNodeId ? nodes.find((n) => n.nodeId === roomNodeId) : null;
    const parentId = roomNodeId ? roomNodeId : buildingNodeId;

    const newDevNode: ManagementNode = {
      nodeId: devId,
      parentNodeId: parentId,
      typeId,
      nodeCode: `${typeObj?.typeCode || 'DEV'}-${Math.floor(Math.random() * 900) + 100}`,
      nodeName: deviceName,
      serialNumber: serialNumber || `SN-${Math.floor(Math.random() * 90000) + 10000}`,
      isShared,
      buildingNodeId,
      roomNodeId: isShared ? null : roomNodeId,
      addressOrLocation: location || (isShared ? `Khu dùng chung ${building?.nodeName || ''}` : `Phòng ${room?.nodeName || ''}`),
      unitPrice: isShared ? (unitPrice || 0) : 0, // Đơn giá theo lượt dùng nếu là thiết bị dùng chung
      monthlyRentalPrice: !isShared ? (monthlyRentalPrice || 0) : 0, // Đơn giá thuê theo tháng nếu là thiết bị phòng
      monthlyPriceSchedule: !isShared ? (monthlyPriceSchedule || { '08/2026': monthlyRentalPrice || 0, '09/2026': monthlyRentalPrice || 0, '10/2026': monthlyRentalPrice || 0, '11/2026': monthlyRentalPrice || 0, '12/2026': monthlyRentalPrice || 0, '01/2027': monthlyRentalPrice || 0 }) : undefined,
      priceHistory: !isShared && monthlyRentalPrice ? [
        {
          recordId: Date.now(),
          effectiveMonthYear: '08/2026',
          oldPrice: 0,
          newPrice: monthlyRentalPrice,
          changedAt: new Date().toISOString().split('T')[0],
          changedByName: currentUser ? `${currentUser.fullName} (${currentUser.roleId === 1 ? 'Admin' : 'Quản lý'})` : 'Hệ thống',
          reason: `Khởi tạo mức giá thuê thiết bị phòng: ${monthlyRentalPrice.toLocaleString('vi-VN')} đ/tháng`
        }
      ] : undefined,
      imageUrl,
      currentCondition: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setNodes((prev) => [...prev, newDevNode]);
    alert(`Thành công! Đã thêm thiết bị "${deviceName}" (${isShared ? `Dùng chung: ${(unitPrice || 0).toLocaleString('vi-VN')} đ/lượt` : `Trang bị phòng: ${(monthlyRentalPrice || 0).toLocaleString('vi-VN')} đ/tháng`}) vào ${building?.nodeName}!`);
  };

  // Cập nhật giá thuê theo tháng của thiết bị phòng dựa trên bảng giá của từng tháng & lưu lịch sử biến động giá
  const handleUpdateDeviceMonthlyPrice = (
    deviceNodeId: number,
    monthYear: string,
    newPrice: number,
    reason?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const changerName = currentUser ? `${currentUser.fullName} (${currentUser.roleId === 1 ? 'Admin' : 'Quản lý'})` : 'Ban Quản Trị';

    setNodes((prev) =>
      prev.map((n) => {
        if (n.nodeId === deviceNodeId) {
          const oldPrice = n.monthlyPriceSchedule?.[monthYear] ?? n.monthlyRentalPrice ?? 0;
          const schedule = { ...(n.monthlyPriceSchedule || {}) };
          schedule[monthYear] = newPrice;

          const history = [...(n.priceHistory || [])];
          history.push({
            recordId: Date.now(),
            effectiveMonthYear: monthYear,
            oldPrice,
            newPrice,
            changedAt: today,
            changedByName: changerName,
            reason: reason || (oldPrice > 0 ? `Điều chỉnh giá thuê từ ${oldPrice.toLocaleString('vi-VN')}đ lên ${newPrice.toLocaleString('vi-VN')}đ/tháng (Áp dụng tháng ${monthYear})` : `Thiết lập giá thuê tháng ${monthYear}: ${newPrice.toLocaleString('vi-VN')}đ/tháng`)
          });

          return {
            ...n,
            monthlyRentalPrice: newPrice,
            monthlyPriceSchedule: schedule,
            priceHistory: history
          };
        }
        return n;
      })
    );
  };

  // Tự động tính toán lại các hóa đơn DỰ THẢO theo giá mới nhất của thiết bị phòng
  // BẢO LƯU BẤT BIẾN: Các hóa đơn ĐÃ DUYỆT (isApproved hoặc isLocked) sẽ KHÔNG BAO GIỜ bị tính lại!
  const handleRecalculateInvoicesForMonth = (targetMonthYear?: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        // Hóa đơn đã được quản trị viên duyệt và chốt sổ thì GIỮ NGUYÊN VẸN, không tính lại sau này!
        if (inv.isApproved || inv.isLocked) {
          return inv;
        }
        if (targetMonthYear && inv.monthYear !== targetMonthYear) {
          return inv;
        }
        const roomDevs = nodes.filter(
          (n) => n.typeId >= 4 && !n.isShared && (n.roomNodeId === inv.roomNodeId || n.parentNodeId === inv.roomNodeId)
        );

        // Lấy giá mới nhất từ danh mục bảng giá của thiết bị tại thời điểm tháng đó
        const breakdown = roomDevs.map((d) => {
          const monthlyPrice = getDeviceLatestPriceForMonth(d, inv.monthYear);
          return {
            deviceNodeId: d.nodeId,
            deviceCode: d.nodeCode,
            deviceName: d.nodeName,
            monthlyPrice,
            category: d.deviceCategory,
            snapshotAppliedAt: new Date().toISOString().split('T')[0]
          };
        });

        const totalDeviceRent = breakdown.reduce((sum, item) => sum + item.monthlyPrice, 0);
        const electricDiff = Math.max(0, inv.currElectric - inv.prevElectric);
        const waterDiff = Math.max(0, inv.currWater - inv.prevWater);
        const newTotal = inv.roomRent + (electricDiff * inv.electricRate) + (waterDiff * inv.waterRate) + totalDeviceRent + inv.sharedDeviceCost + inv.internetAndTrash;

        return {
          ...inv,
          roomDeviceRentalCost: totalDeviceRent,
          deviceBreakdown: breakdown,
          totalAmount: newTotal
        };
      })
    );
  };

  // Người quản trị duyệt hóa đơn -> Lưu cố định hóa đơn gồm tháng, năm và đơn giá thuê thiết bị của tháng đấy
  const handleApproveInvoice = (invoiceId: number) => {
    const approverName = currentUser 
      ? `${currentUser.fullName} (${currentUser.roleId === 1 ? 'Ban Quản Trị' : 'Quản Lý'})`
      : 'Người Quản Trị Hệ Thống';
    const approvedTimestamp = formatDateTimeVN(new Date());

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.invoiceId === invoiceId) {
          const roomDevs = nodes.filter(
            (n) => n.typeId >= 4 && !n.isShared && (n.roomNodeId === inv.roomNodeId || n.parentNodeId === inv.roomNodeId)
          );

          // Chốt danh sách thiết bị kèm đơn giá của tháng này
          const finalBreakdown = inv.deviceBreakdown && inv.deviceBreakdown.length > 0
            ? inv.deviceBreakdown.map((item) => ({
                ...item,
                snapshotAppliedAt: approvedTimestamp
              }))
            : roomDevs.map((d) => ({
                deviceNodeId: d.nodeId,
                deviceCode: d.nodeCode,
                deviceName: d.nodeName,
                monthlyPrice: getDeviceLatestPriceForMonth(d, inv.monthYear),
                category: d.deviceCategory,
                snapshotAppliedAt: approvedTimestamp
              }));

          const totalDeviceRent = finalBreakdown.reduce((sum, d) => sum + d.monthlyPrice, 0);
          const electricDiff = Math.max(0, inv.currElectric - inv.prevElectric);
          const waterDiff = Math.max(0, inv.currWater - inv.prevWater);
          const finalTotal = inv.roomRent + (electricDiff * inv.electricRate) + (waterDiff * inv.waterRate) + totalDeviceRent + inv.sharedDeviceCost + inv.internetAndTrash;

          const [mStr, yStr] = inv.monthYear.split('/');
          const m = parseInt(mStr, 10) || 1;
          const y = parseInt(yStr, 10) || 2026;

          return {
            ...inv,
            month: m,
            year: y,
            roomDeviceRentalCost: totalDeviceRent,
            deviceBreakdown: finalBreakdown,
            totalAmount: finalTotal,
            isApproved: true,
            approvalStatus: 'APPROVED' as const,
            isLocked: true, // Chốt sổ: Lưu cố định đơn giá thiết bị và số tiền, không tính lại sau này
            approvedAt: approvedTimestamp,
            approvedByName: approverName
          };
        }
        return inv;
      })
    );
  };

  // Lập hóa đơn tháng mới: Tự động lấy giá mới nhất từ danh mục bảng giá thiết bị, đơn giá điện nước tòa nhà, phí vệ sinh/người và phí tạm trú theo chu kỳ 12 tháng
  const handleCreateMonthlyInvoice = (
    contractId: number,
    targetMonthYear: string,
    currElectric: number,
    currWater: number,
    sharedCost: number = 0,
    customElectricRate?: number,
    customWaterRate?: number,
    customOccupantCount?: number,
    customSanitationFeePerPerson?: number,
    customResidenceFeePerPerson?: number,
    customIsResidenceFeeApplied?: boolean
  ) => {
    const contract = contracts.find((c) => c.contractId === contractId);
    if (!contract) return;

    // Lấy đơn giá điện nước cơ sở và phí dịch vụ từ Tòa Nhà trực thuộc
    const buildingNode = nodes.find((n) => n.nodeId === contract.buildingNodeId);
    const defaultElecRate = buildingNode?.electricRate || 3800;
    const defaultWaterRate = buildingNode?.waterRate || 30000;
    const defaultSanitationRate = buildingNode?.sanitationFeePerPerson || 30000;
    const defaultResidenceRate = buildingNode?.residenceFeePerPerson || 100000;

    const electricRate = customElectricRate !== undefined && customElectricRate > 0 ? customElectricRate : defaultElecRate;
    const waterRate = customWaterRate !== undefined && customWaterRate > 0 ? customWaterRate : defaultWaterRate;

    // Tính số người ở thực tế (đầu người)
    const occupantCount = customOccupantCount !== undefined && customOccupantCount > 0 
      ? customOccupantCount 
      : getRoomOccupantCount(contract, roommates);

    // Phí vệ sinh: Tính trên đầu người / tháng
    const sanitationFeePerPerson = customSanitationFeePerPerson !== undefined && customSanitationFeePerPerson >= 0 
      ? customSanitationFeePerPerson 
      : defaultSanitationRate;
    const sanitationFee = occupantCount * sanitationFeePerPerson;

    // Phí tạm trú tạm vắng: Tính trên đầu người / năm
    // Quy tắc: Bắt đầu thu từ tháng bắt đầu ở đến hết 12 tháng sẽ tính phí tiếp vào hóa đơn
    const residenceFeePerPerson = customResidenceFeePerPerson !== undefined && customResidenceFeePerPerson >= 0 
      ? customResidenceFeePerPerson 
      : defaultResidenceRate;
    const residenceCheck = checkIsResidenceFeeBillingMonth(
      contract.actualCheckInDate || contract.startDateContract, 
      targetMonthYear
    );
    const isResidenceFeeApplied = customIsResidenceFeeApplied !== undefined 
      ? customIsResidenceFeeApplied 
      : residenceCheck.isBillingMonth;
    const residenceFee = isResidenceFeeApplied ? (occupantCount * residenceFeePerPerson) : 0;
    const residenceFeeNote = residenceCheck.note;

    // Tìm các hóa đơn cũ để lấy số điện nước cũ
    const prevInvoices = invoices.filter((inv) => inv.contractId === contractId);
    const lastInvoice = prevInvoices[prevInvoices.length - 1];
    const prevElectric = lastInvoice ? lastInvoice.currElectric : 1000;
    const prevWater = lastInvoice ? lastInvoice.currWater : 40;

    const roomDevs = nodes.filter(
      (n) => n.typeId >= 4 && !n.isShared && (n.roomNodeId === contract.roomNodeId || n.parentNodeId === contract.roomNodeId)
    );

    // LẤY GIÁ MỚI NHẤT CỦA THIẾT BỊ TÍNH ĐẾN THÁNG ĐÓ
    const breakdown = roomDevs.map((d) => {
      const latestPrice = getDeviceLatestPriceForMonth(d, targetMonthYear);
      return {
        deviceNodeId: d.nodeId,
        deviceCode: d.nodeCode,
        deviceName: d.nodeName,
        monthlyPrice: latestPrice,
        category: d.deviceCategory,
        snapshotAppliedAt: new Date().toISOString().split('T')[0]
      };
    });

    const totalDeviceRent = breakdown.reduce((sum, item) => sum + item.monthlyPrice, 0);
    const electricDiff = Math.max(0, currElectric - prevElectric);
    const waterDiff = Math.max(0, currWater - prevWater);
    const internetAndTrash = 150000;
    const totalAmount = contract.monthlyRent + (electricDiff * electricRate) + (waterDiff * waterRate) + totalDeviceRent + sharedCost + internetAndTrash + sanitationFee + residenceFee;

    const [mStr, yStr] = targetMonthYear.split('/');
    const m = parseInt(mStr, 10) || 11;
    const y = parseInt(yStr, 10) || 2026;

    const newInvoice: MonthlyInvoice = {
      invoiceId: Date.now(),
      contractId,
      roomNodeId: contract.roomNodeId,
      roomName: contract.roomName,
      monthYear: targetMonthYear,
      month: m,
      year: y,
      prevElectric,
      currElectric,
      electricRate,
      prevWater,
      currWater,
      waterRate,
      roomRent: contract.monthlyRent,
      roomDeviceRentalCost: totalDeviceRent,
      sharedDeviceCost: sharedCost,
      occupantCount,
      sanitationFeePerPerson,
      sanitationFee,
      residenceFeePerPerson,
      isResidenceFeeApplied,
      residenceFee,
      residenceFeeNote,
      internetAndTrash,
      totalAmount,
      status: 'UNPAID',
      isApproved: false,
      approvalStatus: 'DRAFT',
      isLocked: false,
      deviceBreakdown: breakdown
    };

    setInvoices((prev) => [...prev, newInvoice]);
  };

  // 12.5 Gán hoặc chuyển đổi thiết bị vào phòng và cập nhật cách tính tiền
  const handleAssignDeviceToRoom = (
    deviceNodeId: number, 
    targetRoomNodeId: number | null, 
    isShared: boolean = false,
    newPrice?: number
  ) => {
    const targetRoom = targetRoomNodeId ? nodes.find((n) => n.nodeId === targetRoomNodeId) : null;
    let nextNodesList: ManagementNode[] = [];

    setNodes((prev) => {
      const next = prev.map((n) => {
        if (n.nodeId === deviceNodeId) {
          const updated: ManagementNode = {
            ...n,
            isShared,
            roomNodeId: isShared ? null : targetRoomNodeId,
            parentNodeId: targetRoomNodeId ? targetRoomNodeId : (n.buildingNodeId || n.parentNodeId),
            addressOrLocation: isShared ? 'Khu công cộng dùng chung' : (targetRoom ? `Phòng ${targetRoom.nodeName}` : 'Kho phòng chưa gán')
          };
          if (newPrice !== undefined && newPrice >= 0) {
            if (isShared) {
              updated.unitPrice = newPrice;
              updated.monthlyRentalPrice = 0;
              updated.monthlyPriceSchedule = {};
            } else {
              updated.monthlyRentalPrice = newPrice;
              if (!updated.monthlyPriceSchedule) updated.monthlyPriceSchedule = {};
              updated.monthlyPriceSchedule['09/2026'] = newPrice;
              updated.monthlyPriceSchedule['10/2026'] = newPrice;
              updated.monthlyPriceSchedule['11/2026'] = newPrice;
              updated.monthlyPriceSchedule['12/2026'] = newPrice;
              updated.monthlyPriceSchedule['01/2027'] = newPrice;
            }
          }
          return updated;
        }
        return n;
      });
      nextNodesList = next;
      localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(next));
      return next;
    });

    // Cập nhật lại hóa đơn chưa duyệt
    setInvoices((prev) => {
      const nextInv = prev.map((inv) => {
        if (inv.isLocked || inv.isApproved) return inv;
        const currentNodes = nextNodesList.length > 0 ? nextNodesList : nodes;
        const roomDevs = currentNodes.filter(
          (n) => n.typeId >= 4 && !n.isShared && (n.roomNodeId === inv.roomNodeId || n.parentNodeId === inv.roomNodeId)
        );
        const breakdown = roomDevs.map((d) => ({
          deviceNodeId: d.nodeId,
          deviceCode: d.nodeCode,
          deviceName: d.nodeName,
          monthlyPrice: getDeviceLatestPriceForMonth(d, inv.monthYear),
          category: d.deviceCategory,
          snapshotAppliedAt: new Date().toISOString().split('T')[0]
        }));
        const totalDeviceRent = breakdown.reduce((sum, item) => sum + item.monthlyPrice, 0);
        const electricDiff = Math.max(0, inv.currElectric - inv.prevElectric);
        const waterDiff = Math.max(0, inv.currWater - inv.prevWater);
        const newTotal = inv.roomRent + (electricDiff * inv.electricRate) + (waterDiff * inv.waterRate) + totalDeviceRent + inv.sharedDeviceCost + inv.internetAndTrash;
        return {
          ...inv,
          roomDeviceRentalCost: totalDeviceRent,
          deviceBreakdown: breakdown,
          totalAmount: newTotal
        };
      });
      localStorage.setItem('rental_invoices_v3', JSON.stringify(nextInv));
      return nextInv;
    });

    const priceText = newPrice !== undefined && newPrice > 0 ? ` với mức giá ${newPrice.toLocaleString('vi-VN')} đ/${isShared ? 'lượt' : 'tháng'}` : '';
    alert(
      isShared 
        ? `Đã chuyển cách tính tiền thành: THEO LƯỢT DÙNG (Dùng chung cả tòa nhà${priceText})!` 
        : `Đã chuyển cách tính tiền thành: THEO THÁNG (Lắp đặt phòng ${targetRoom?.nodeName || 'kho'}${priceText})!`
    );
  };

  // 12.6 Xóa thiết bị khỏi tòa nhà
  const handleDeleteDevice = (deviceNodeId: number) => {
    const dev = nodes.find((n) => n.nodeId === deviceNodeId);
    if (!dev) return;
    if (confirm(`Bạn có chắc chắn muốn xóa thiết bị "${dev.nodeName}" (${dev.nodeCode}) khỏi hệ thống không?`)) {
      setNodes((prev) => prev.filter((n) => n.nodeId !== deviceNodeId));
      setIssues((prev) => prev.filter((i) => i.nodeId !== deviceNodeId));
      alert(`Đã xóa thiết bị "${dev.nodeName}" thành công!`);
    }
  };

  // 13. Đăng ký tài khoản người dùng mới
  const handleRegisterUser = (newUser: Omit<User, 'userId' | 'isActive' | 'createdAt'>): { success: boolean; message: string } => {
    const existsCccd = allUsers.some((u) => u.citizenId.trim() === newUser.citizenId.trim());
    if (existsCccd) {
      return {
        success: false,
        message: `Số CCCD ${newUser.citizenId} đã tồn tại trong hệ thống! Quy tắc: 1 người chỉ được đăng ký 1 tài khoản.`
      };
    }

    const existsPhone = allUsers.some((u) => u.phoneNumber.trim() === newUser.phoneNumber.trim());
    if (existsPhone) {
      return {
        success: false,
        message: `Số điện thoại ${newUser.phoneNumber} đã được đăng ký cho tài khoản khác!`
      };
    }

    const created: User = {
      ...newUser,
      roleId: 3, // Mặc định là Cấp 3 (khách thuê / cư dân - cấp thấp nhất) theo đúng quy định hệ thống
      userId: Date.now(),
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAllUsers([...allUsers, created]);
    setCurrentUser(created); // Tự động đăng nhập luôn sau khi đăng ký

    // Đồng bộ nếu SQL Server đang kết nối
    if (isSqlConnected) {
      fetch('/api/sql/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created)
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Đăng ký thành công tài khoản cho ${newUser.fullName} (Địa chỉ: ${newUser.address})! Cấp tài khoản mặc định: Khách thuê Cấp 3.`
    };
  };

  // 14. Phân quyền & Ấn định vai trò tài khoản:
  // - Admin (Cấp 1) ấn định tài khoản khác thành Admin Cấp 1 (ngang quyền mình), Quản lý Cấp 2, hoặc Khách thuê Cấp 3.
  // - Quản lý (Cấp 2) được phép ấn định tài khoản khác thành Quản lý Cấp 2 (ngang quyền mình với đầy đủ chức năng quản lý), hoặc hạ về Cấp 3.
  const handleUpdateUserRole = (targetUserId: number, newRoleId: RoleType) => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để thực hiện chức năng này!');
      return;
    }

    const targetUser = allUsers.find((u) => u.userId === targetUserId);
    if (!targetUser) {
      alert('Không tìm thấy tài khoản người dùng!');
      return;
    }

    // Kiểm tra thẩm quyền
    if (currentUser.roleId === 1) {
      // Admin (Cấp 1): Có quyền ấn định Cấp 1 (ngang quyền mình), Cấp 2, hoặc Cấp 3
    } else if (currentUser.roleId === 2) {
      // Quản lý (Cấp 2): Được phép ấn định tài khoản khác ngang quyền mình (Cấp 2) hoặc hạ về Cấp 3
      if (newRoleId === 1) {
        alert('Từ chối: Quản lý (Cấp 2) không có thẩm quyền ấn định tài khoản thành Admin Cấp 1!');
        return;
      }
      if (targetUser.roleId === 1) {
        alert('Từ chối: Quản lý (Cấp 2) không được phép can thiệp vào tài khoản của Admin Cấp 1!');
        return;
      }
    } else {
      alert('Từ chối: Khách thuê (Cấp 3) không có thẩm quyền ấn định vai trò!');
      return;
    }

    const roleName = newRoleId === 1 ? 'Admin (Cấp 1)' : newRoleId === 2 ? 'Quản Lý Tòa Nhà (Cấp 2)' : 'Khách Thuê / Cư Dân (Cấp 3)';

    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.userId === targetUserId) {
          return {
            ...u,
            roleId: newRoleId,
            designatedByUserId: currentUser.userId,
            designatedByName: currentUser.fullName
          };
        }
        return u;
      })
    );

    if (currentUser.userId === targetUserId) {
      setCurrentUser((prev) => (prev ? {
        ...prev,
        roleId: newRoleId,
        designatedByUserId: currentUser.userId,
        designatedByName: currentUser.fullName
      } : null));
    }

    // Đồng bộ nếu SQL Server đang kết nối
    if (isSqlConnected) {
      fetch('/api/sql/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetUser,
          roleId: newRoleId
        })
      }).catch(() => {});
    }

    alert(`Thành công! Đã ấn định tài khoản "${targetUser.fullName}" thành ${roleName} theo thẩm quyền của ${currentUser.fullName} (${currentUser.roleId === 1 ? 'Admin Cấp 1' : 'Quản lý Cấp 2'})!`);
  };

  // 14. Kiểm tra kết nối SQL Server
  const handleTestSqlConnection = async (config: any) => {
    try {
      const res = await fetch('/api/sql/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.connected) {
        setIsSqlConnected(true);
        setSqlServerInfo(data.serverInfo);
      } else {
        setIsSqlConnected(false);
      }
      return data;
    } catch (err: any) {
      setIsSqlConnected(false);
      return {
        connected: false,
        message: err?.message || 'Không thể gọi backend Node.js để kết nối MS SQL Server.'
      };
    }
  };

  // 14.1 Nạp dữ liệu từ SQL Server về Web (Pull Data)
  const handlePullDataFromSql = async () => {
    try {
      const res = await fetch('/api/sql/pull-all-data');
      const data = await res.json();
      if (data.success && data.hasData && data.data) {
        if (data.data.users && data.data.users.length > 0) {
          setAllUsers(data.data.users);
          localStorage.setItem('rental_users', JSON.stringify(data.data.users));
        }
        if (data.data.nodes && data.data.nodes.length > 0) {
          setNodes(data.data.nodes);
          localStorage.setItem('rental_tree_nodes_v3', JSON.stringify(data.data.nodes));
        }
        if (data.data.contracts && data.data.contracts.length > 0) {
          setContracts(data.data.contracts);
          localStorage.setItem('rental_contracts', JSON.stringify(data.data.contracts));
        }
      }
      return data;
    } catch (err: any) {
      return { success: false, message: 'Lỗi khi gọi API kéo dữ liệu: ' + err.message };
    }
  };

  // 14.2 Đẩy toàn bộ dữ liệu Web hiện tại lên SQL Server (Push Data)
  const handlePushDataToSql = async () => {
    try {
      const res = await fetch('/api/sql/push-all-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: allUsers,
          nodes: nodes
        })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: 'Lỗi khi đẩy dữ liệu: ' + err.message };
    }
  };

  // 14.3 Khởi tạo schema & seed data trực tiếp lên SQL Server
  const handleInitSqlSchema = async () => {
    try {
      const res = await fetch('/api/sql/init-schema', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await handlePullDataFromSql();
      }
      return data;
    } catch (err: any) {
      return { success: false, message: 'Lỗi khởi tạo schema: ' + err.message };
    }
  };

  // 15. Khách gửi yêu cầu Giữ phòng / Đặt trước
  const handleRequestReservation = (roomNodeId: number, expectedCheckIn: string) => {
    if (!currentUser) return;
    const room = nodes.find((n) => n.nodeId === roomNodeId);
    if (!room) return;

    const building = nodes.find((b) => b.nodeId === room.parentNodeId || b.parentNodeId === null);
    const activeContract = contracts.find((c) => c.roomNodeId === roomNodeId && c.status === 'ACTIVE');

    const newRes: RoomReservation = {
      reservationId: Date.now(),
      roomNodeId,
      roomName: room.nodeName,
      buildingNodeId: building?.nodeId || 1,
      buildingName: building?.nodeName || 'Tòa nhà',
      userId: currentUser.userId,
      userName: currentUser.fullName,
      userPhone: currentUser.phoneNumber,
      userCitizenId: currentUser.citizenId,
      userAddress: currentUser.address,
      status: 'PENDING',
      requestedAt: formatDateTimeVN(new Date()),
      expectedCheckInDate: expectedCheckIn,
      monthlyRent: room.unitPrice || 4500000,
      depositAmount: room.depositAmount || 4500000,
      availableReason: activeContract ? 'CONTRACT_EXPIRING_SOON' : 'ROOM_VACANT',
      contractEndDate: activeContract?.endDateContract
    };

    setReservations([newRes, ...reservations]);
  };

  // 16. Quản lý Xác nhận duyệt giữ phòng -> Chính thức tạo hợp đồng và loại khỏi danh sách giữ phòng
  const handleConfirmReservation = (reservationId: number) => {
    const res = reservations.find((r) => r.reservationId === reservationId);
    if (!res) return;

    // Cập nhật trạng thái reservation sang CONFIRMED
    setReservations((prev) =>
      prev.map((r) => r.reservationId === reservationId ? { ...r, status: 'CONFIRMED' } : r)
    );

    // Tạo hợp đồng cư trú chính thức
    const newContract: RentalContract = {
      contractId: Date.now(),
      roomNodeId: res.roomNodeId,
      roomName: res.roomName,
      buildingName: res.buildingName,
      buildingNodeId: res.buildingNodeId,
      primaryTenantUserId: res.userId,
      primaryTenantName: res.userName,
      startDateContract: res.expectedCheckInDate,
      endDateContract: '2027-04-30', // Mặc định 6 tháng
      actualCheckInDate: res.expectedCheckInDate,
      actualCheckOutDate: null,
      monthlyRent: res.monthlyRent,
      depositAmount: res.depositAmount,
      status: 'ACTIVE',
      notes: `Hợp đồng tạo từ yêu cầu giữ phòng trực tuyến ngày ${formatDateTimeVN(res.requestedAt)}`
    };

    setContracts([newContract, ...contracts]);
    alert(`Đã xác nhận duyệt giữ phòng cho ${res.userName}! Phòng ${res.roomName} đã chính thức được loại khỏi danh sách giữ phòng và tạo hợp đồng cư trú.`);
  };

  // 17. Quản lý Từ chối giữ phòng
  const handleRejectReservation = (reservationId: number) => {
    setReservations((prev) =>
      prev.map((r) => r.reservationId === reservationId ? { ...r, status: 'REJECTED' } : r)
    );
    alert('Đã từ chối yêu cầu giữ phòng. Phòng đã được mở lại cho khách khác đặt trước.');
  };

  // 18. Thêm Tòa Nhà Mới Vào Hệ Thống Cây Thực Thể Đa Cấp
  const handleAddBuilding = async (buildingData: {
    code: string;
    name: string;
    address: string;
    managerUserId: number;
    floors: number;
    hasSharedWashing: boolean;
    hasEvCharger: boolean;
    hasSmartGate: boolean;
    autoCreateSampleRooms?: boolean;
    imageUrl?: string;
    electricRate?: number;
    waterRate?: number;
    sanitationFeePerPerson?: number;
    residenceFeePerPerson?: number;
  }) => {
    const today = new Date().toISOString().split('T')[0];
    const newBuildingId = Date.now();
    const rootBuildingNode: ManagementNode = {
      nodeId: newBuildingId,
      parentNodeId: null,
      typeId: 1, // PROPERTY / TÒA NHÀ
      nodeCode: buildingData.code,
      nodeName: buildingData.name,
      addressOrLocation: buildingData.address,
      imageUrl: buildingData.imageUrl,
      electricRate: buildingData.electricRate || 3800,
      waterRate: buildingData.waterRate || 30000,
      sanitationFeePerPerson: buildingData.sanitationFeePerPerson || 30000,
      residenceFeePerPerson: buildingData.residenceFeePerPerson || 100000,
      currentCondition: 0,
      unitPrice: 0,
      depositAmount: 0,
      isActive: true,
      createdAt: today,
      managerUserId: buildingData.managerUserId,
      notes: `Người quản lý phụ trách ID: ${buildingData.managerUserId}`
    };

    const newGeneratedNodes: ManagementNode[] = [rootBuildingNode];

    // Tự động tạo các tầng (Floor)
    for (let f = 1; f <= buildingData.floors; f++) {
      const floorId = newBuildingId + f * 100;
      newGeneratedNodes.push({
        nodeId: floorId,
        parentNodeId: newBuildingId,
        typeId: 2, // FLOOR
        nodeCode: `${buildingData.code}-T${f.toString().padStart(2, '0')}`,
        nodeName: `Tầng ${f} - ${buildingData.name}`,
        addressOrLocation: `Tầng ${f}`,
        currentCondition: 0,
        unitPrice: 0,
        depositAmount: 0,
        isActive: true,
        createdAt: today
      });

      // Tùy chọn: Tự động tạo 2 phòng mẫu nếu autoCreateSampleRooms = true
      if (buildingData.autoCreateSampleRooms) {
        for (let r = 1; r <= 2; r++) {
          const roomId = floorId + r;
          const roomNumber = `${f}0${r}`;
          newGeneratedNodes.push({
            nodeId: roomId,
            parentNodeId: floorId,
            typeId: 3, // ROOM
            nodeCode: `P-${roomNumber}`,
            nodeName: `Phòng ${roomNumber} - ${buildingData.name}`,
            addressOrLocation: `Tầng ${f}, Phòng ${roomNumber}`,
            currentCondition: 0,
            unitPrice: 4000000 + f * 200000,
            depositAmount: 4000000 + f * 200000,
            pricePeriodNote: 'Giá mùa cao điểm tháng 9/2026',
            isActive: true,
            createdAt: today,
            notes: 'Phòng mới khép kín, ban công thoáng mát'
          });
        }
      }
    }

    // Tự động tạo cổng từ vân tay
    if (buildingData.hasSmartGate) {
      newGeneratedNodes.push({
        nodeId: newBuildingId + 901,
        parentNodeId: newBuildingId,
        typeId: 6, // SMART_GATE
        nodeCode: `GATE-${buildingData.code}`,
        nodeName: `Cổng Từ Vân Tay & Mã Số - ${buildingData.name}`,
        addressOrLocation: 'Cổng chính tầng 1',
        currentCondition: 0,
        hardwareMacOrTopic: `00:1A:79:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
        unitPrice: 0,
        depositAmount: 0,
        isActive: true,
        createdAt: today
      });
    }

    // Tự động tạo máy giặt chung
    if (buildingData.hasSharedWashing) {
      newGeneratedNodes.push({
        nodeId: newBuildingId + 902,
        parentNodeId: newBuildingId,
        typeId: 4, // WASHING_MACHINE
        nodeCode: `WASH-${buildingData.code}`,
        nodeName: `Máy Giặt Chung Cửa Ngang IoT - ${buildingData.name}`,
        addressOrLocation: 'Khu giặt phơi tầng thượng',
        currentCondition: 0,
        unitPrice: 15000,
        hardwareMacOrTopic: `00:1A:79:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
        isActive: true,
        createdAt: today,
        notes: '15.000đ/lần, kích hoạt từ xa'
      });
    }

    // Tự động tạo trạm sạc xe điện
    if (buildingData.hasEvCharger) {
      newGeneratedNodes.push({
        nodeId: newBuildingId + 903,
        parentNodeId: newBuildingId,
        typeId: 5, // EV_CHARGER
        nodeCode: `EV-${buildingData.code}`,
        nodeName: `Trạm Sạc Xe Điện Thông Minh - ${buildingData.name}`,
        addressOrLocation: 'Khu để xe tầng 1',
        currentCondition: 0,
        unitPrice: 3500,
        hardwareMacOrTopic: `00:1A:79:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
        isActive: true,
        createdAt: today,
        notes: '3.500đ/kWh, tự ngắt khi đầy'
      });
    }

    setNodes((prev) => [...prev, ...newGeneratedNodes]);

    // Nếu MS SQL Server đang kết nối, đồng bộ vào bảng ManagementNodes
    if (isSqlConnected) {
      fetch('/api/sql/sync-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeCode: buildingData.code,
          nodeName: buildingData.name,
          addressOrLocation: buildingData.address,
          managerUserId: buildingData.managerUserId
        })
      }).catch(() => {});
    }

    alert(`Thành công! Đã thêm tòa nhà "${buildingData.name}" (${buildingData.code}) vào hệ thống với ${buildingData.floors} tầng, ${buildingData.floors * 2} phòng và các tiện ích dùng chung!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header & Navigation */}
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={setCurrentUser}
        onLogout={() => setCurrentUser(null)}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenRegisterModal={() => setShowRegisterModal(true)}
        onOpenSqlModal={() => setShowSqlModal(true)}
        isSqlConnected={isSqlConnected}
        onOpenSqlConnectionModal={() => setShowSqlConnectionModal(true)}
        onOpenAddBuildingModal={() => setShowAddBuildingModal(true)}
        onOpenAddRoomModal={handleOpenAddRoomModal}
      />

      {/* Main Content Render theo PageId */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* 1. TRANG CHỦ (Home Page) */}
        {activePage === 'home' && (
          <HomePage
            currentUser={currentUser}
            nodes={nodes}
            contracts={contracts}
            posts={posts}
            reservations={reservations}
            expiringLeadDays={expiringLeadDays}
            onSetExpiringLeadDays={setExpiringLeadDays}
            onOpenLoginModal={() => setShowLoginModal(true)}
            onOpenRegisterModal={() => setShowRegisterModal(true)}
            onRequestReservation={handleRequestReservation}
            onConfirmReservation={handleConfirmReservation}
            onRejectReservation={handleRejectReservation}
            onOpenAddBuildingModal={() => setShowAddBuildingModal(true)}
            onOpenAddRoomModal={handleOpenAddRoomModal}
            onDeleteRoom={handleDeleteRoom}
            onUpdateRoomPrice={handleUpdateRoomPrice}
            onNavigate={setActivePage}
          />
        )}

        {/* 2. TRANG GIỚI THIỆU (About Page) */}
        {activePage === 'about' && (
          <AboutPage />
        )}

        {/* 3. TRANG NHẬN ĐỊNH & ĐÁNH GIÁ (Reviews Page) */}
        {activePage === 'reviews' && (
          <ReviewsPage reviews={reviews} />
        )}

        {/* 4. KHU VỰC BẢNG ĐIỀU KHIỂN / QUẢN TRỊ (Dành cho người đã đăng nhập) */}
        {activePage === 'dashboard' && currentUser && (
          <>
            {currentUser.roleId === 3 && (
              <TenantView
                currentUser={currentUser}
                contracts={contracts}
                roommates={roommates}
                invoices={invoices}
                nodes={nodes}
                issues={issues}
                reviews={reviews}
                posts={posts}
                onOpenGate={handleOpenGate}
                onActivateSharedDevice={handleActivateSharedDevice}
                onSubmitIssue={handleSubmitIssue}
                onSubmitReview={handleSubmitReviewByTenant}
                activeSharedSession={activeSharedSession}
                gateUnlocked={gateUnlocked}
              />
            )}

            {currentUser.roleId === 2 && (
              <ManagerView
                currentUser={currentUser}
                allUsers={allUsers}
                contracts={contracts}
                roommates={roommates}
                invoices={invoices}
                nodes={nodes}
                issues={issues}
                reviews={reviews}
                objectTypes={objectTypes}
                onAddRoom={handleAddRoom}
                onDeleteRoom={handleDeleteRoom}
                onUpdateRoomPrice={handleUpdateRoomPrice}
                onAddDeviceToRoom={() => {}}
                onAddDeviceToBuilding={handleAddDeviceToBuilding}
                onAssignDeviceToRoom={handleAssignDeviceToRoom}
                onDeleteDevice={handleDeleteDevice}
                onResolveIssue={(reportId) => {
                  setIssues((prev) =>
                    prev.map((iss) => (iss.reportId === reportId ? { ...iss, status: 'RESOLVED' } : iss))
                  );
                }}
                onCheckoutAndLockReview={handleCheckoutAndLockReview}
                onUpdateInvoiceMeters={handleUpdateInvoiceMeters}
                onUpdateBuildingUtilityRates={handleUpdateBuildingUtilityRates}
                onManagerReviewTenant={handleManagerReviewTenant}
                onPublishPost={handlePublishPost}
                onOpenAddBuildingModal={() => setShowAddBuildingModal(true)}
                onOpenAddRoomModal={handleOpenAddRoomModal}
                onUpdateCondition={handleUpdateCondition}
                onUpdateDeviceMonthlyPrice={handleUpdateDeviceMonthlyPrice}
                onRecalculateInvoicesForMonth={handleRecalculateInvoicesForMonth}
                onApproveInvoice={handleApproveInvoice}
                onCreateMonthlyInvoice={handleCreateMonthlyInvoice}
                onUpdateUserRole={handleUpdateUserRole}
                onUpdateNode={handleUpdateNode}
                onAddChildNode={handleAddChildNode}
                onDeleteNode={handleDeleteNode}
              />
            )}

            {currentUser.roleId === 1 && (
              <AdminView
                currentUser={currentUser}
                allUsers={allUsers}
                nodes={nodes}
                objectTypes={objectTypes}
                issues={issues}
                contracts={contracts}
                roommates={roommates}
                invoices={invoices}
                onAddObjectType={handleAddObjectType}
                onAddChildNode={handleAddChildNode}
                onUpdateCondition={handleUpdateCondition}
                onOpenAddBuildingModal={() => setShowAddBuildingModal(true)}
                onAddRoom={handleAddRoom}
                onDeleteRoom={handleDeleteRoom}
                onUpdateRoomPrice={handleUpdateRoomPrice}
                onAssignManagerToBuilding={handleAssignManagerToBuilding}
                onAddDeviceToBuilding={handleAddDeviceToBuilding}
                onAssignDeviceToRoom={handleAssignDeviceToRoom}
                onDeleteDevice={handleDeleteDevice}
                onUpdateDeviceMonthlyPrice={handleUpdateDeviceMonthlyPrice}
                onRecalculateInvoicesForMonth={handleRecalculateInvoicesForMonth}
                onApproveInvoice={handleApproveInvoice}
                onCreateMonthlyInvoice={handleCreateMonthlyInvoice}
                onUpdateInvoiceMeters={handleUpdateInvoiceMeters}
                onUpdateBuildingUtilityRates={handleUpdateBuildingUtilityRates}
                onUpdateUserRole={handleUpdateUserRole}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Hệ Thống Quản Lý 100 Nhà Trọ • CSDL MS SQL Server Express • Cột <strong>Address</strong> trong bảng Users
          </p>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button 
              onClick={() => setActivePage('home')}
              className={`hover:text-white transition-colors ${activePage === 'home' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Trang Chủ
            </button>
            <button 
              onClick={() => setActivePage('about')}
              className={`hover:text-white transition-colors ${activePage === 'about' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Giới Thiệu
            </button>
            <button 
              onClick={() => setActivePage('reviews')}
              className={`hover:text-white transition-colors ${activePage === 'reviews' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Nhận Định
            </button>
            <button
              onClick={() => setShowAddBuildingModal(true)}
              className="hover:text-blue-400 transition-colors flex items-center gap-1 font-medium text-slate-300"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Thêm Tòa Nhà</span>
            </button>
            <button 
              onClick={() => setShowSqlConnectionModal(true)} 
              className={`transition-colors flex items-center gap-1 ${isSqlConnected ? 'text-emerald-400 font-semibold' : 'hover:text-cyan-400'}`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSqlConnected ? 'SQL Server: Đã kết nối' : 'Kết Nối SQL Server'}</span>
            </button>
            <button onClick={() => setShowSqlModal(true)} className="hover:text-cyan-400 transition-colors">
              Mã Nguồn SQL
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="hover:text-rose-400 transition-colors"
              title="Khôi phục lại dữ liệu mẫu ban đầu"
            >
              Đặt Lại Mẫu Thử
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddBuildingModal
        isOpen={showAddBuildingModal}
        onClose={() => setShowAddBuildingModal(false)}
        managers={allUsers.filter((u) => u.roleId === 2 || u.roleId === 1)}
        onAddBuilding={handleAddBuilding}
      />

      <AddRoomModal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        buildings={nodes.filter((n) => n.parentNodeId === null)}
        allNodes={nodes}
        currentUser={currentUser}
        preselectedBuildingId={preselectedBuildingIdForRoom}
        onAddRoom={handleAddRoom}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        allUsers={allUsers}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActivePage('home');
        }}
        onOpenRegister={() => setShowRegisterModal(true)}
      />

      <UserModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterUser={handleRegisterUser}
        allUsers={allUsers}
        isSqlConnected={isSqlConnected}
        currentUser={currentUser}
        onUpdateUserRole={handleUpdateUserRole}
      />

      <SqlModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
      />

      <SqlServerConnectionModal
        isOpen={showSqlConnectionModal}
        onClose={() => setShowSqlConnectionModal(false)}
        isSqlConnected={isSqlConnected}
        serverInfo={sqlServerInfo}
        onTestConnection={handleTestSqlConnection}
        onPullData={handlePullDataFromSql}
        onPushData={handlePushDataToSql}
        onInitSchema={handleInitSqlSchema}
      />
    </div>
  );
}
