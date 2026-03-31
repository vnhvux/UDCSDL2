import React, { useState, useMemo, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Building2, 
  LogOut, 
  Search, 
  Bell, 
  User, 
  Home, 
  Calendar, 
  FileText, 
  Menu, 
  X,
  ChevronRight,
  ClipboardList,
  Filter,
  RefreshCw,
  Info,
  Clock,
  BookOpen,
  UserCheck,
  Clock3,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { MockUser } from '../data/mockUsers';

interface DashboardProps {
  onLogout: () => void;
  mockUser?: MockUser | null;
}

interface Course {
  id: string;
  room: string;
  building: string;
  subjectName: string;
  subjectCode: string;
  classCode: string;
  periods: string;
  timeRange: string;
  dayOfWeek: string;
  startDate: string;
  endDate: string;
  lecturer: string;
}

const ROOM_DATA: Record<string, string[]> = {
  'Tòa A1': ['A1-101', 'A1-102', 'A1-103'],
  'Giảng đường A2': ['A2-101', 'A2-102', 'A2-103'],
  'Giảng đường B': ['B-101', 'B-102', 'B-103'],
  'Giảng đường C': ['C-101', 'C-102', 'C-103'],
  'Giảng đường D': ['D-101', 'D-102', 'D-103'],
  'Giảng đường D2': ['D2-101', 'D2-102', 'D2-103'],
  'Sân KTX': ['SanKTX-1', 'SanKTX-2', 'SanKTX-3'],
};

const ROOM_TYPES = ['Phòng học lý thuyết', 'Phòng máy tính', 'Hội trường', 'Phòng thực hành'];

const LECTURER_DEPARTMENTS: Record<string, string> = {
  'Trần Thanh Hải': 'Khoa Hệ thống thông tin quản lý',
  'Trần Thị Thu Hoài': 'Khoa Lý luận chính trị',
  'Nguyễn Ngọc Tuấn': 'Khoa Công nghệ thông tin',
};

const BORROWING_UNITS = [
  "Khoa Hệ thống thông tin quản lý",
  "Khoa Công nghệ thông tin",
  "Ban Đối ngoại - HSV - NEU",
  "CLB Âm nhạc Cổ điển Đại học Kinh tế Quốc Dân - NEU Philharmonic"
];

const getNavGroups = (role?: string) => {
  if (role === 'qldt') {
    return [
      {
        title: "TRANG CHỦ",
        items: [
          { id: 'trang-chu', label: 'Trang chủ', icon: Home },
        ]
      },
      {
        title: "QUẢN LÝ ĐÀO TẠO",
        items: [
          { id: 'quan-ly-lich-hoc', label: 'Quản lý lịch học', icon: Calendar },
          { id: 'duyet-muon-phong', label: 'Duyệt mượn phòng', icon: ClipboardList },
        ]
      }
    ];
  }

  if (role === 'qlcsvc') {
    return [
      {
        title: "TRANG CHỦ",
        items: [
          { id: 'trang-chu', label: 'Trang chủ', icon: Home },
        ]
      },
      {
        title: "QUẢN LÝ CƠ SỞ VẬT CHẤT",
        items: [
          { id: 'quan-ly-su-co', label: 'Quản lý sự cố', icon: AlertTriangle },
          { id: 'quan-ly-bao-tri', label: 'Bảo trì & CSVC', icon: Building2 },
        ]
      }
    ];
  }

  return [
    {
      title: "TRANG CHỦ",
      items: [
        { id: 'trang-chu', label: 'Trang chủ', icon: Home },
      ]
    },
    {
      title: "TRA CỨU GIẢNG ĐƯỜNG - TKB",
      items: [
        { id: 'tra-cuu-gd', label: 'Tra cứu giảng đường', icon: Search },
        { id: 'tra-cuu-tkb', label: 'Tra cứu thời khóa biểu', icon: Calendar },
        { id: 'tra-cuu-tkb-gv', label: 'Tra cứu TKB giảng viên', icon: User },
      ]
    },
    {
      title: "CHỨC NĂNG TRỰC TUYẾN",
      items: [
        { id: 'muon-phong', label: 'Mượn phòng', icon: ClipboardList },
        { id: 'xin-giay-xn', label: 'Xin giấy xác nhận', icon: FileText },
        { id: 'phan-anh', label: 'Phản ánh sự cố', icon: AlertTriangle },
      ]
    }
  ];
};

interface SidebarContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
  mockUser?: MockUser | null;
}

const SidebarContent = memo(({ activeTab, setActiveTab, setIsMobileMenuOpen, onLogout, mockUser }: SidebarContentProps) => {
  const displayName = mockUser?.displayName || auth.currentUser?.displayName || 'Vũ Trí Quang Vinh';
  const roleDisplay = mockUser?.role === 'student' ? 'Sinh viên' : 
                      mockUser?.role === 'lecturer' ? 'Giảng viên' : 
                      mockUser?.role === 'qldt' ? 'Phòng QLĐT' : 
                      mockUser?.role === 'qlcsvc' ? 'Phòng QLCSVC' : 'Sinh viên';

  return (
  <div className="flex flex-col h-full bg-white border-r border-gray-200">
    {/* Logo Section */}
    <div className="p-6 border-b border-gray-100 flex items-center justify-center">
      <img 
        src="https://upload.wikimedia.org/wikipedia/vi/c/c6/Logo_Đại_học_Kinh_tế_Quốc_dân.png" 
        alt="NEU Logo" 
        className="w-24 h-24 object-contain"
        referrerPolicy="no-referrer"
      />
    </div>

    {/* User Info Section */}
    <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
        <User className="w-7 h-7 text-gray-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">{displayName}</p>
        <p className="text-xs text-gray-500">{roleDisplay}</p>
      </div>
    </div>

    {/* Navigation Section */}
    <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
      {getNavGroups(mockUser?.role).map((group, idx) => (
        <div key={idx}>
          <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-red-50 text-[#8b0000] font-semibold' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#8b0000]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="text-sm">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Logout Section */}
    <div className="p-4 border-t border-gray-100">
      <button 
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Đăng xuất</span>
      </button>
    </div>
  </div>
  );
});

const ClockDisplay = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const timeStr = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
      setTime(timeStr);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-gray-600">
      <Clock className="w-4 h-4 text-[#8b0000]" />
      <span className="text-sm font-mono font-bold tracking-wider">{time}</span>
      <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold">UTC+7</span>
    </div>
  );
};

export default function Dashboard({ onLogout, mockUser }: DashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('trang-chu');
  const [prevTab, setPrevTab] = useState('trang-chu');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to get Hanoi date in YYYY-MM-DD
  const getHanoiDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * 7)); // UTC+7
    return nd.toISOString().split('T')[0];
  };

  // Filter States (Hall Search)
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState(getHanoiDate());
  const [endDate, setEndDate] = useState(getHanoiDate());
  const [searchResultsGd, setSearchResultsGd] = useState<Course[]>([]);
  const [isSearchingGd, setIsSearchingGd] = useState(false);
  const [hasSearchedGd, setHasSearchedGd] = useState(false);

  // Timetable Search States
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [classCodeInput, setClassCodeInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [searchResultsTkb, setSearchResultsTkb] = useState<Course[]>([]);
  const [isSearchingTkb, setIsSearchingTkb] = useState(false);
  const [hasSearchedTkb, setHasSearchedTkb] = useState(false);

  // Lecturer Search States
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Có lịch giảng');
  const [startDateGv, setStartDateGv] = useState(getHanoiDate());
  const [endDateGv, setEndDateGv] = useState(getHanoiDate());
  const [allLecturers, setAllLecturers] = useState<string[]>([]);
  const [scheduledResultsGv, setScheduledResultsGv] = useState<Course[]>([]);
  const [searchResultsGv, setSearchResultsGv] = useState<Course[]>([]);
  const [isSearchingGv, setIsSearchingGv] = useState(false);
  const [hasSearchedGv, setHasSearchedGv] = useState(false);

  // Room Booking States
  const [bookingSubTab, setBookingSubTab] = useState<'register' | 'list'>('register');
  const [bookingForm, setBookingForm] = useState({
    borrowDate: getHanoiDate(),
    returnDate: getHanoiDate(),
    startTime: '07:00',
    endTime: '09:00',
    building: '',
    room: '',
    reason: '',
    unit: BORROWING_UNITS[0]
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [homeSelectedBuilding, setHomeSelectedBuilding] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // QLDT Course Management States
  const [qldtCourseSubTab, setQldtCourseSubTab] = useState<'list' | 'add'>('list');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<Omit<Course, 'id'>>({
    room: '',
    building: '',
    subjectName: '',
    subjectCode: '',
    classCode: '',
    periods: '',
    timeRange: '',
    dayOfWeek: 'Thứ 2',
    startDate: getHanoiDate(),
    endDate: getHanoiDate(),
    lecturer: ''
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // QLDT Room Bookings States
  const [allBookings, setAllBookings] = useState<any[]>([]);

  // QLCSVC Incident Management & Maintenance States
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [allMaintenanceTickets, setAllMaintenanceTickets] = useState<any[]>([]);
  const [maintenanceSubTab, setMaintenanceSubTab] = useState<'list' | 'add'>('list');
  const [isSubmittingMaintenance, setIsSubmittingMaintenance] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    description: '',
    building: '',
    room: '',
    khoa_phong: false,
    startDate: getHanoiDate(),
    endDate: getHanoiDate()
  });

  // Incident States
  const [incidentSubTab, setIncidentSubTab] = useState<'report' | 'list'>('report');
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    location: '',
    type: 'Sự cố phòng học',
    equipment: 'Máy chiếu / Màn chiếu'
  });
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [isDeleteIncidentModalOpen, setIsDeleteIncidentModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const INCIDENT_EQUIPMENT = {
    'Sự cố phòng học': ['Máy chiếu / Màn chiếu', 'Điều hòa', 'Quạt', 'Đèn chiếu sáng', 'Âm thanh (Loa/Mic)', 'Bàn ghế', 'Bảng', 'Khác'],
    'Sự cố Cơ sở vật chất': ['Thang máy', 'Nhà vệ sinh', 'Cửa sổ / Cửa ra vào', 'Hành lang / Cầu thang', 'Điện / Nước', 'Khác']
  };

  // Update current time every minute for status sync
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate 5 most recent academic years
  const academicYears = useMemo(() => {
    const now = new Date();
    const currentAcademicYearStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const years = [];
    for (let i = 0; i < 5; i++) {
      const start = currentAcademicYearStart - i;
      const end = start + 1;
      years.push(`${start}-${end}`);
    }
    return years;
  }, []);

  const notifications = useMemo(() => {
    const notifs: any[] = [];
    myBookings.forEach(booking => {
      if (booking.status !== 'pending') {
        notifs.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'Kết quả mượn phòng',
          message: `Yêu cầu mượn phòng ${booking.room} (${booking.building}) đã ${booking.status === 'approved' ? 'được chấp nhận' : 'bị từ chối'}.`,
          status: booking.status,
          createdAt: booking.createdAt,
        });
      }
    });

    myIncidents.forEach(incident => {
      if (incident.status !== 'pending') {
        notifs.push({
          id: `incident-${incident.id}`,
          type: 'incident',
          title: 'Cập nhật sự cố',
          message: `Sự cố "${incident.title}" đang ở trạng thái ${incident.status === 'in-progress' ? 'đang xử lý' : 'đã xử lý'}.`,
          status: incident.status,
          createdAt: incident.createdAt,
        });
      }
    });

    return notifs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [myBookings, myIncidents]);

  // Semesters based on selected academic year
  const semesters = useMemo(() => {
    if (!selectedAcademicYear) return [];
    const [startYear, endYear] = selectedAcademicYear.split('-');
    return [
      { id: `Thu ${startYear}`, label: `Học kỳ Thu ${startYear}` },
      { id: `Xuan ${endYear}`, label: `Học kỳ Xuân ${endYear}` },
      { id: `He ${endYear}`, label: `Học kỳ Hè ${endYear}` },
    ];
  }, [selectedAcademicYear]);

  // Fetch all courses for real-time status and unique subjects/lecturers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        const subjects = new Set<string>();
        const lecturers = new Set<string>();
        const courses: Course[] = [];
        
        snapshot.docs.forEach(doc => {
          const data = doc.data() as Course;
          const course = { id: doc.id, ...data };
          courses.push(course);
          if (data.subjectName) subjects.add(data.subjectName);
          if (data.lecturer) lecturers.add(data.lecturer);
        });
        
        setAllCourses(courses);
        setAllSubjects(Array.from(subjects).sort());
        setAllLecturers(Array.from(lecturers).sort());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Reset logic when switching tabs
  useEffect(() => {
    if (activeTab !== prevTab) {
      // Only reset 'tra-cuu-gd' when leaving it, as per user request
      if (prevTab === 'tra-cuu-gd') {
        resetTabState(prevTab);
      }
      setPrevTab(activeTab);
    }
  }, [activeTab, prevTab]);

  const getRoomStatus = (building: string, room: string) => {
    // Check if room is under maintenance and locked
    const isMaintenance = allMaintenanceTickets.some(ticket =>
      ticket.building === building &&
      ticket.room === room &&
      ticket.status !== 'resolved' &&
      ticket.khoa_phong === true
    );
    if (isMaintenance) return { status: 'maintenance', label: 'Bảo trì', color: 'bg-gray-100 border-gray-200 text-gray-400' };

    const now = currentTime;
    const hanoiTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const todayStr = getHanoiDate();
    const dayMap: Record<number, string> = {
      0: 'Chủ nhật', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7'
    };
    const todayDayOfWeek = dayMap[now.getDay()];

    const activeCourse = allCourses.find(course => {
      if (course.building !== building || course.room !== room) return false;
      if (course.dayOfWeek !== todayDayOfWeek) return false;
      if (todayStr < course.startDate || todayStr > course.endDate) return false;
      
      const [start, end] = course.timeRange.split(' - ');
      return hanoiTime >= start && hanoiTime <= end;
    });

    if (activeCourse) {
      return { 
        status: 'occupied', 
        label: 'Đang học', 
        color: 'bg-green-50 border-green-200 text-green-700',
        course: activeCourse 
      };
    }

    return { status: 'empty', label: 'Trống', color: 'bg-white border-gray-100 text-gray-500' };
  };

  const resetTabState = (tabId: string) => {
    const today = getHanoiDate();
    if (tabId === 'tra-cuu-gd') {
      setSelectedBuilding('');
      setSelectedRoom('');
      setSelectedType('');
      setStartDate(today);
      setEndDate(today);
      setSearchResultsGd([]);
      setHasSearchedGd(false);
      setIsSearchingGd(false);
    } else if (tabId === 'tra-cuu-tkb') {
      setSelectedAcademicYear('');
      setSelectedSemester('');
      setClassCodeInput('');
      setSelectedSubject('');
      setSearchResultsTkb([]);
      setHasSearchedTkb(false);
      setIsSearchingTkb(false);
    } else if (tabId === 'tra-cuu-tkb-gv') {
      setSelectedDepartment('');
      setSelectedLecturer('');
      setSelectedStatus('Có lịch giảng');
      setStartDateGv(today);
      setEndDateGv(today);
      setSearchResultsGv([]);
      setHasSearchedGv(false);
      setIsSearchingGv(false);
      setScheduledResultsGv([]);
    }
  };

  const availableRooms = useMemo(() => {
    if (selectedBuilding) {
      return ROOM_DATA[selectedBuilding] || [];
    }
    // If no building is selected, return all rooms from all buildings
    return Object.values(ROOM_DATA).flat();
  }, [selectedBuilding]);

  const handleResetFilters = () => {
    resetTabState(activeTab);
  };

  const handleSearchTkb = async () => {
    setIsSearchingTkb(true);
    setHasSearchedTkb(true);
    try {
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      
      // Filter by Academic Year and Semester if selected
      if (selectedSemester) {
        const [type, year] = selectedSemester.split(' ');
        let semStart = '';
        let semEnd = '';
        
        if (type === 'Thu') {
          semStart = `${year}-08-01`;
          semEnd = `${year}-12-31`;
        } else if (type === 'Xuan') {
          semStart = `${year}-01-01`;
          semEnd = `${year}-05-31`;
        } else if (type === 'He') {
          semStart = `${year}-06-01`;
          semEnd = `${year}-07-31`;
        }

        if (semStart && semEnd) {
          results = results.filter(c => c.startDate <= semEnd && c.endDate >= semStart);
        }
      }

      if (selectedSubject && selectedSubject !== '--Tất cả--') {
        results = results.filter(c => c.subjectName === selectedSubject);
      }
      
      if (classCodeInput) {
        results = results.filter(c => c.classCode.toLowerCase().includes(classCodeInput.toLowerCase()));
      }
      
      setSearchResultsTkb(results);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'courses');
    } finally {
      setIsSearchingTkb(false);
    }
  };

  const handleSearchGv = async () => {
    setIsSearchingGv(true);
    setHasSearchedGv(true);
    try {
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      
      // Filter by lecturer
      if (selectedLecturer) {
        results = results.filter(c => c.lecturer === selectedLecturer);
      } else if (selectedDepartment) {
        // Filter by department (find lecturers in that department)
        const lecturersInDept = Object.entries(LECTURER_DEPARTMENTS)
          .filter(([_, dept]) => dept === selectedDepartment)
          .map(([name, _]) => name);
        results = results.filter(c => lecturersInDept.includes(c.lecturer));
      }

      // Filter by date range and day of week
      const daysInRange = getDaysInDateRange(startDateGv, endDateGv);
      const scheduledResults = results.filter(course => {
        const overlaps = course.startDate <= endDateGv && course.endDate >= startDateGv;
        return overlaps && daysInRange.includes(course.dayOfWeek);
      });

      setScheduledResultsGv(scheduledResults);

      if (selectedStatus === 'Có lịch giảng') {
        setSearchResultsGv(scheduledResults);
      } else {
        // "Không có lịch giảng" - we show empty results but the message will reflect the status
        setSearchResultsGv([]);
      }
      
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'courses');
    } finally {
      setIsSearchingGv(false);
    }
  };

  useEffect(() => {
    const fetchAllData = () => {
      setIsLoadingBookings(true);
      const bookingsRef = collection(db, 'roomBookings');
      let unsubscribeMyBookings = () => {};

      if (auth.currentUser) {
        const qBookings = query(bookingsRef, where('userId', '==', auth.currentUser.uid));
        unsubscribeMyBookings = onSnapshot(qBookings, (snapshot) => {
          const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyBookings(bookings.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
          setIsLoadingBookings(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'roomBookings');
          setIsLoadingBookings(false);
        });
      } else {
        setIsLoadingBookings(false);
      }

      const unsubscribeAllBookings = onSnapshot(bookingsRef, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllBookings(bookings.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'roomBookings');
      });

      setIsLoadingIncidents(true);
      const incidentsRef = collection(db, 'incidents');
      let unsubscribeMyIncidents = () => {};

      if (auth.currentUser) {
        const qIncidents = query(incidentsRef, where('userId', '==', auth.currentUser.uid));
        unsubscribeMyIncidents = onSnapshot(qIncidents, (snapshot) => {
          const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyIncidents(incidents.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
          setIsLoadingIncidents(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'incidents');
          setIsLoadingIncidents(false);
        });
      } else {
        setIsLoadingIncidents(false);
      }

    const unsubscribeAllIncidents = onSnapshot(incidentsRef, (snapshot) => {
      const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllIncidents(incidents.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incidents');
    });

      const maintenanceRef = collection(db, 'maintenanceTickets');
      const unsubscribeMaintenance = onSnapshot(maintenanceRef, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllMaintenanceTickets(tickets.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'maintenanceTickets');
      });

      return () => {
        unsubscribeMyBookings();
        unsubscribeAllBookings();
        unsubscribeMyIncidents();
        unsubscribeAllIncidents();
        unsubscribeMaintenance();
      };
    };

    return fetchAllData();
  }, [auth.currentUser]);

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmittingMaintenance(true);
    try {
      const maintenanceRef = collection(db, 'maintenanceTickets');
      const newTicket = {
        ...maintenanceForm,
        userId: auth.currentUser.uid,
        userName: mockUser?.displayName || auth.currentUser.displayName || 'Vũ Trí Quang Vinh',
        status: 'in-progress',
        createdAt: new Date().toISOString()
      };
      await addDoc(maintenanceRef, newTicket);
      alert('Tạo phiếu bảo trì thành công!');
      setMaintenanceSubTab('list');
      setMaintenanceForm({
        title: '', description: '', building: '', room: '', khoa_phong: false, startDate: getHanoiDate(), endDate: getHanoiDate()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'maintenanceTickets');
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  const handleUpdateMaintenanceStatus = async (ticketId: string, status: 'resolved') => {
    try {
      const ticketRef = doc(db, 'maintenanceTickets', ticketId);
      // Automatically unlock the room if it's resolved
      await updateDoc(ticketRef, { status, khoa_phong: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'maintenanceTickets');
    }
  };

  const handleUpdateIncidentStatus = async (incidentId: string, status: 'received' | 'in-progress' | 'resolved' | 'rejected') => {
    try {
      const incidentRef = doc(db, 'incidents', incidentId);
      await updateDoc(incidentRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'incidents');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      const bookingRef = doc(db, 'roomBookings', bookingId);
      await updateDoc(bookingRef, { status });
      alert(`Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} yêu cầu mượn phòng.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'roomBookings');
    }
  };

  const checkTimeOverlap = (building: string, room: string, startDate: string, startTime: string, endDate: string, endTime: string) => {
    // Basic day conversion from start date
    // (A full implementation would check each day in the range, but we assume single-day booking for simplicity here,
    // or at least that we need to check if the day of week matches the course day of week)
    const borrowStart = new Date(`${startDate}T${startTime}`);
    const borrowEnd = new Date(`${endDate}T${endTime}`);

    // Create an array of days within the booking period
    const bookingDays = getDaysInDateRange(startDate, endDate);

    for (const course of allCourses) {
      if (course.building !== building || course.room !== room) continue;

      // Check if course duration overlaps with booking duration
      const courseStartDate = course.startDate;
      const courseEndDate = course.endDate;
      if (endDate < courseStartDate || startDate > courseEndDate) continue;

      // Check if course day of week falls within the booking days
      if (!bookingDays.includes(course.dayOfWeek)) continue;

      // Check time overlap
      const [courseStartTime, courseEndTime] = course.timeRange.split(' - ');

      // Proper string comparison works for HH:mm format
      // Formula: (StartA < EndB) and (EndA > StartB)
      if (startTime < courseEndTime && endTime > courseStartTime) {
        return course; // Conflict found
      }
    }
    return null; // No conflict
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const startDateTime = `${bookingForm.borrowDate}T${bookingForm.startTime}`;
    const endDateTime = `${bookingForm.returnDate}T${bookingForm.endTime}`;

    if (endDateTime < startDateTime) {
      alert('Ngày và thời gian kết thúc phải sau hoặc bằng ngày và thời gian mượn.');
      return;
    }

    // Check for overlap with existing courses
    const conflictingCourse = checkTimeOverlap(
      bookingForm.building,
      bookingForm.room,
      bookingForm.borrowDate,
      bookingForm.startTime,
      bookingForm.returnDate,
      bookingForm.endTime
    );

    if (conflictingCourse) {
      alert(`Không thể mượn phòng! Phòng ${bookingForm.room} đang có lớp học (${conflictingCourse.subjectName}) từ ${conflictingCourse.timeRange} vào ${conflictingCourse.dayOfWeek}. Vui lòng chọn thời gian hoặc phòng khác.`);
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const bookingsRef = collection(db, 'roomBookings');
      const newBooking = {
        ...bookingForm,
        userId: auth.currentUser.uid,
        userName: mockUser?.displayName || auth.currentUser.displayName || 'Vũ Trí Quang Vinh',
        studentId: mockUser?.username || auth.currentUser.email?.split('@')[0] || '20210001',
        lecturerId: mockUser?.role === 'lecturer' ? mockUser.username : '0',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addDoc(bookingsRef, newBooking);
      alert('Đăng ký mượn phòng thành công! Vui lòng chờ phê duyệt.');
      setBookingSubTab('list');
      setBookingForm({
        borrowDate: getHanoiDate(),
        returnDate: getHanoiDate(),
        startTime: '07:00',
        endTime: '09:00',
        building: '',
        room: '',
        reason: '',
        unit: BORROWING_UNITS[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'roomBookings');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu mượn phòng này?')) return;
    try {
      const bookingRef = doc(db, 'roomBookings', bookingId);
      await deleteDoc(bookingRef);
      setMyBookings(myBookings.filter(b => b.id !== bookingId));
      alert('Đã hủy yêu cầu thành công.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'roomBookings');
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCourse(true);
    try {
      if (editingCourseId) {
        const courseRef = doc(db, 'courses', editingCourseId);
        await updateDoc(courseRef, courseForm as any);
        alert('Cập nhật lịch học thành công!');
      } else {
        const coursesRef = collection(db, 'courses');
        await addDoc(coursesRef, courseForm);
        alert('Thêm lịch học thành công!');
      }
      setQldtCourseSubTab('list');
      setEditingCourseId(null);
      setCourseForm({
        room: '', building: '', subjectName: '', subjectCode: '', classCode: '',
        periods: '', timeRange: '', dayOfWeek: 'Thứ 2', startDate: getHanoiDate(), endDate: getHanoiDate(), lecturer: ''
      });
      // Optionally re-fetch courses here, but we rely on the realtime listener or general state
      // Actually, allCourses is fetched once on mount. Let's force a window reload or better, just re-fetch.
      // For simplicity in this mock, we'll reload or let the user refresh.
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'courses');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setCourseForm({
      room: course.room,
      building: course.building,
      subjectName: course.subjectName,
      subjectCode: course.subjectCode,
      classCode: course.classCode,
      periods: course.periods,
      timeRange: course.timeRange,
      dayOfWeek: course.dayOfWeek,
      startDate: course.startDate,
      endDate: course.endDate,
      lecturer: course.lecturer
    });
    setEditingCourseId(course.id);
    setQldtCourseSubTab('add');
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) return;
    try {
      const courseRef = doc(db, 'courses', courseId);
      await deleteDoc(courseRef);
      alert('Đã xóa lịch học thành công.');
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'courses');
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmittingIncident(true);
    try {
      const incidentsRef = collection(db, 'incidents');
      const newIncident = {
        ...incidentForm,
        userId: auth.currentUser.uid,
        userName: mockUser?.displayName || auth.currentUser.displayName || 'Vũ Trí Quang Vinh',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addDoc(incidentsRef, newIncident);
      alert('Phản ánh sự cố thành công! Chúng tôi sẽ xử lý trong thời gian sớm nhất.');
      setIncidentSubTab('list');
      setIncidentForm({
        title: '',
        description: '',
        location: '',
        type: 'Sự cố phòng học',
        equipment: 'Máy chiếu / Màn chiếu'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'incidents');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const handleCancelIncident = async () => {
    if (!incidentToDelete) return;
    try {
      const incidentRef = doc(db, 'incidents', incidentToDelete);
      await deleteDoc(incidentRef);
      setMyIncidents(myIncidents.filter(i => i.id !== incidentToDelete));
      setIsDeleteIncidentModalOpen(false);
      setIncidentToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'incidents');
    }
  };

  const getDaysInDateRange = (start: string, end: string) => {
    const [sYear, sMonth, sDay] = start.split('-').map(Number);
    const [eYear, eMonth, eDay] = end.split('-').map(Number);
    
    const startDate = new Date(sYear, sMonth - 1, sDay);
    const endDate = new Date(eYear, eMonth - 1, eDay);
    
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 6) {
      return ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    }

    const days = new Set<string>();
    const dayMap: Record<number, string> = {
      0: 'Chủ Nhật',
      1: 'Thứ 2',
      2: 'Thứ 3',
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7'
    };

    let current = new Date(startDate);
    while (current <= endDate) {
      days.add(dayMap[current.getDay()]);
      current.setDate(current.getDate() + 1);
    }
    return Array.from(days);
  };

  const handleSearch = async () => {
    setIsSearchingGd(true);
    setHasSearchedGd(true);
    const path = 'courses';
    try {
      const coursesRef = collection(db, path);
      let q = query(coursesRef);

      if (selectedBuilding) {
        q = query(q, where('building', '==', selectedBuilding));
      }
      if (selectedRoom) {
        q = query(q, where('room', '==', selectedRoom));
      }

      const snapshot = await getDocs(q);
      const results: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Course));

      // Get the list of Vietnamese day names that occur within the selected range
      const daysInRange = getDaysInDateRange(startDate, endDate);

      // Filter results based on both date range overlap AND day of week occurrence
      const filteredResults = results.filter(course => {
        // 1. Check if the course's overall duration overlaps with the search range
        const overlaps = course.startDate <= endDate && course.endDate >= startDate;
        if (!overlaps) return false;

        // 2. Check if the course's specific day of the week occurs within the search range
        // e.g., If searching for 31/3/2026 (Tuesday), only courses with dayOfWeek === 'Thứ 3' should show
        return daysInRange.includes(course.dayOfWeek);
      });

      setSearchResultsGd(filteredResults);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setIsSearchingGd(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-0'} h-screen sticky top-0`}>
        <SidebarContent 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          onLogout={onLogout} 
          mockUser={mockUser}
        />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[70] lg:hidden"
            >
              <SidebarContent 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                onLogout={onLogout} 
                mockUser={mockUser}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <h2 className="text-lg font-bold text-gray-800 hidden sm:block">
              {getNavGroups(mockUser?.role).flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Hệ thống Quản lý'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ClockDisplay />
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-all"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Thông báo</h3>
                        <span className="text-xs font-medium bg-[#8b0000] text-white px-2 py-0.5 rounded-full">
                          {notifications.length} mới
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-50">
                            {notifications.map((notif) => (
                              <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-sm font-bold text-gray-800">{notif.title}</h4>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                    {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-snug">{notif.message}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">Không có thông báo nào</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'quan-ly-lich-hoc' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="text-[#8b0000]" />
                      Quản lý Lịch học
                    </h2>
                    <p className="text-gray-500 mt-1">Xem, thêm, sửa, xóa thông tin thời khóa biểu và lịch giảng dạy.</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setQldtCourseSubTab('list');
                      setEditingCourseId(null);
                      setCourseForm({
                        room: '', building: '', subjectName: '', subjectCode: '', classCode: '',
                        periods: '', timeRange: '', dayOfWeek: 'Thứ 2', startDate: getHanoiDate(), endDate: getHanoiDate(), lecturer: ''
                      });
                    }}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${qldtCourseSubTab === 'list' ? 'bg-[#8b0000] text-white shadow-lg shadow-red-900/10' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                  >
                    Danh sách Lịch học
                  </button>
                  <button
                    onClick={() => setQldtCourseSubTab('add')}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${qldtCourseSubTab === 'add' ? 'bg-[#8b0000] text-white shadow-lg shadow-red-900/10' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                  >
                    {editingCourseId ? 'Sửa Lịch học' : 'Thêm Lịch học'}
                  </button>
                </div>

                {qldtCourseSubTab === 'add' ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleCourseSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Tên môn học */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tên môn học</label>
                          <input type="text" required value={courseForm.subjectName} onChange={e => setCourseForm({...courseForm, subjectName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Mã môn học */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mã môn học</label>
                          <input type="text" required value={courseForm.subjectCode} onChange={e => setCourseForm({...courseForm, subjectCode: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Lớp học phần */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mã Lớp học phần</label>
                          <input type="text" required value={courseForm.classCode} onChange={e => setCourseForm({...courseForm, classCode: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Tòa nhà */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tòa nhà</label>
                          <select required value={courseForm.building} onChange={e => setCourseForm({...courseForm, building: e.target.value, room: ''})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm">
                            <option value="">-- Chọn tòa nhà --</option>
                            {Object.keys(ROOM_DATA).map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        {/* Phòng học */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phòng học</label>
                          <select required value={courseForm.room} onChange={e => setCourseForm({...courseForm, room: e.target.value})} disabled={!courseForm.building} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm disabled:opacity-50">
                            <option value="">-- Chọn phòng --</option>
                            {(ROOM_DATA[courseForm.building] || []).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        {/* Giảng viên */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Giảng viên</label>
                          <input type="text" required value={courseForm.lecturer} onChange={e => setCourseForm({...courseForm, lecturer: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Thứ */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Thứ</label>
                          <select required value={courseForm.dayOfWeek} onChange={e => setCourseForm({...courseForm, dayOfWeek: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm">
                            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        {/* Tiết */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tiết học</label>
                          <input type="text" required placeholder="VD: 1,2,3" value={courseForm.periods} onChange={e => setCourseForm({...courseForm, periods: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Thời gian */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Khung giờ</label>
                          <input type="text" required placeholder="VD: 07:00 - 09:30" value={courseForm.timeRange} onChange={e => setCourseForm({...courseForm, timeRange: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Ngày bắt đầu */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày bắt đầu</label>
                          <input type="date" required value={courseForm.startDate} onChange={e => setCourseForm({...courseForm, startDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                        {/* Ngày kết thúc */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày kết thúc</label>
                          <input type="date" required value={courseForm.endDate} onChange={e => setCourseForm({...courseForm, endDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] outline-none text-sm" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        {editingCourseId && (
                          <button type="button" onClick={() => { setQldtCourseSubTab('list'); setEditingCourseId(null); }} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Hủy</button>
                        )}
                        <button type="submit" disabled={isSubmittingCourse} className="px-10 py-3 bg-[#8b0000] text-white rounded-xl font-bold hover:bg-[#a00000] shadow-lg disabled:opacity-70 flex items-center gap-2">
                          {isSubmittingCourse ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                          {editingCourseId ? 'Cập nhật' : 'Lưu Lịch học'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-4">Môn học</th>
                            <th className="px-6 py-4">Giảng viên</th>
                            <th className="px-6 py-4">Phòng</th>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allCourses.length > 0 ? allCourses.map((c) => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {c.subjectName} <br/><span className="text-xs text-gray-500">{c.classCode}</span>
                              </td>
                              <td className="px-6 py-4">{c.lecturer}</td>
                              <td className="px-6 py-4">{c.building} - {c.room}</td>
                              <td className="px-6 py-4">{c.dayOfWeek}, {c.timeRange} <br/><span className="text-xs text-gray-500">{c.startDate} - {c.endDate}</span></td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleEditCourse(c)} className="text-blue-600 hover:underline mr-3">Sửa</button>
                                <button onClick={() => handleDeleteCourse(c.id)} className="text-red-600 hover:underline">Xóa</button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'quan-ly-bao-tri' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Building2 className="text-blue-600" />
                      Bảo trì & CSVC
                    </h2>
                    <p className="text-gray-500 mt-1">Quản lý các phiếu bảo trì, cập nhật trạng thái hoạt động của phòng.</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setMaintenanceSubTab('list')}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${maintenanceSubTab === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/10' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                  >
                    Danh sách bảo trì
                  </button>
                  <button
                    onClick={() => setMaintenanceSubTab('add')}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${maintenanceSubTab === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/10' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                  >
                    Tạo phiếu bảo trì mới
                  </button>
                </div>

                {maintenanceSubTab === 'add' ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleMaintenanceSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tiêu đề */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tiêu đề / Tên phiếu bảo trì</label>
                          <input type="text" required placeholder="VD: Sửa chữa điều hòa phòng A2-101" value={maintenanceForm.title} onChange={e => setMaintenanceForm({...maintenanceForm, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        {/* Dãy nhà */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tòa nhà</label>
                          <select required value={maintenanceForm.building} onChange={e => setMaintenanceForm({...maintenanceForm, building: e.target.value, room: ''})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                            <option value="">-- Chọn tòa nhà --</option>
                            {Object.keys(ROOM_DATA).map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        {/* Phòng học */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phòng học / Khu vực</label>
                          <select required value={maintenanceForm.room} onChange={e => setMaintenanceForm({...maintenanceForm, room: e.target.value})} disabled={!maintenanceForm.building} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50">
                            <option value="">-- Chọn phòng --</option>
                            {(ROOM_DATA[maintenanceForm.building] || []).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        {/* Ngày bắt đầu */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày bắt đầu</label>
                          <input type="date" required value={maintenanceForm.startDate} onChange={e => setMaintenanceForm({...maintenanceForm, startDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        {/* Ngày dự kiến hoàn thành */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày dự kiến hoàn thành</label>
                          <input type="date" required value={maintenanceForm.endDate} min={maintenanceForm.startDate} onChange={e => setMaintenanceForm({...maintenanceForm, endDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        {/* Khóa phòng */}
                        <div className="space-y-2 md:col-span-2 mt-2">
                          <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                            <input type="checkbox" checked={maintenanceForm.khoa_phong} onChange={e => setMaintenanceForm({...maintenanceForm, khoa_phong: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">Khóa phòng (Tạm ngừng sử dụng)</span>
                              <span className="text-xs text-gray-500 mt-0.5">Phòng sẽ được hiển thị "Bảo trì" trên sơ đồ giảng đường và không thể đặt mượn.</span>
                            </div>
                          </label>
                        </div>
                        {/* Mô tả chi tiết */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mô tả công việc bảo trì</label>
                          <textarea required rows={4} value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} placeholder="Nhập chi tiết các hạng mục cần sửa chữa, bảo trì..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
                        </div>
                      </div>
                      <div className="flex justify-end mt-6">
                        <button type="submit" disabled={isSubmittingMaintenance} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-70 flex items-center gap-2">
                          {isSubmittingMaintenance ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                          Tạo phiếu bảo trì
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allMaintenanceTickets.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {allMaintenanceTickets.map((ticket) => (
                          <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                    ticket.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {ticket.status === 'resolved' ? 'Hoàn thành' : 'Đang tiến hành'}
                                  </span>
                                  {ticket.khoa_phong && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-600 uppercase tracking-wider border border-red-200 flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> Đã khóa phòng
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">Tạo ngày: {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>

                                <h4 className="text-lg font-bold text-gray-800">
                                  {ticket.title}
                                </h4>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>{ticket.building} - {ticket.room}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(ticket.startDate).toLocaleDateString('vi-VN')} đến {new Date(ticket.endDate).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    <span>Người tạo: {ticket.userName}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                  "{ticket.description}"
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                {ticket.status !== 'resolved' && (
                                  <button
                                    onClick={() => handleUpdateMaintenanceStatus(ticket.id, 'resolved')}
                                    className="w-full md:w-auto px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-900/10"
                                  >
                                    Đánh dấu Hoàn thành
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Building2 className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Chưa có phiếu bảo trì nào</h3>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'quan-ly-su-co' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="text-orange-600" />
                      Quản lý Sự cố
                    </h2>
                    <p className="text-gray-500 mt-1">Tiếp nhận và xử lý các báo cáo, phản ánh sự cố cơ sở vật chất.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {allIncidents.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {allIncidents.map((incident) => {
                        return (
                          <motion.div
                            key={incident.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all ${incident.status === 'pending' ? 'border-orange-300 bg-orange-50/10' : 'border-gray-100'}`}
                            onMouseEnter={() => {
                              if (incident.status === 'pending') {
                                handleUpdateIncidentStatus(incident.id, 'received');
                              }
                            }}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                    incident.status === 'resolved' ? 'bg-green-50 text-green-600' :
                                    incident.status === 'in-progress' ? 'bg-blue-50 text-blue-600' :
                                    incident.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                    incident.status === 'received' ? 'bg-orange-50 text-orange-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {incident.status === 'resolved' ? 'Đã xử lý' :
                                     incident.status === 'in-progress' ? 'Đang xử lý' :
                                     incident.status === 'rejected' ? 'Từ chối' :
                                     incident.status === 'received' ? 'Đã tiếp nhận' : 'Chờ (Mới)'}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-gray-100 text-gray-600`}>
                                    {incident.type}
                                  </span>
                                  <span className="text-xs text-gray-400">Ngày gửi: {new Date(incident.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>

                                <h4 className="text-lg font-bold text-gray-800">
                                  {incident.title}
                                </h4>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    <span>{incident.userName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>{incident.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{incident.equipment}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                  "{incident.description}"
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                {incident.status !== 'resolved' && incident.status !== 'rejected' && (
                                  <>
                                    {incident.status !== 'in-progress' && (
                                      <button
                                        onClick={() => handleUpdateIncidentStatus(incident.id, 'in-progress')}
                                        className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10"
                                      >
                                        Lập phiếu bảo trì
                                      </button>
                                    )}
                                    {incident.status === 'in-progress' && (
                                      <button
                                        onClick={() => handleUpdateIncidentStatus(incident.id, 'resolved')}
                                        className="w-full md:w-auto px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-900/10"
                                      >
                                        Đánh dấu Đã xử lý
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleUpdateIncidentStatus(incident.id, 'rejected')}
                                      className="w-full md:w-auto px-6 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all border border-red-200"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Chưa có sự cố nào được báo cáo</h3>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'duyet-muon-phong' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <ClipboardList className="text-[#8b0000]" />
                      Duyệt Mượn phòng
                    </h2>
                    <p className="text-gray-500 mt-1">Quản lý và phê duyệt các yêu cầu mượn phòng từ Giảng viên / Sinh viên.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {allBookings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {allBookings.map((booking) => {
                        const overlap = booking.status === 'pending' ? checkTimeOverlap(booking.building, booking.room, booking.borrowDate, booking.startTime, booking.returnDate, booking.endTime) : null;
                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                    booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                                    booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                    'bg-yellow-50 text-yellow-600'
                                  }`}>
                                    {booking.status === 'approved' ? 'Đã duyệt' :
                                     booking.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                                  </span>
                                  {overlap && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-600 uppercase tracking-wider border border-red-200">
                                      Trùng lịch học
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">Ngày đăng ký: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>

                                <h4 className="text-lg font-bold text-gray-800">
                                  {booking.building} - Phòng {booking.room}
                                </h4>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    <span>{booking.userName} ({booking.studentId})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(booking.borrowDate).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{booking.startTime} - {booking.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>{booking.unit}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                  "{booking.reason}"
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                {booking.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'approved')}
                                      className="w-full md:w-auto px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-900/10"
                                    >
                                      Phê duyệt
                                    </button>
                                    <button
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                      className="w-full md:w-auto px-6 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all border border-red-200"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Chưa có yêu cầu mượn phòng</h3>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'trang-chu' ? (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <MapPin className="text-[#8b0000]" />
                      {homeSelectedBuilding ? `Chi tiết: ${homeSelectedBuilding}` : 'Sơ đồ giảng đường NEU'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                      {homeSelectedBuilding 
                        ? `Danh sách phòng học và trạng thái sử dụng tại ${homeSelectedBuilding}` 
                        : 'Chọn một tòa nhà để xem chi tiết phòng học và lịch trình.'}
                    </p>
                  </div>
                  {homeSelectedBuilding && (
                    <button 
                      onClick={() => setHomeSelectedBuilding(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-bold text-sm shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Quay lại sơ đồ
                    </button>
                  )}
                </div>

                {!homeSelectedBuilding ? (
                  <>
                    {/* Map Container */}
                    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-12 border border-gray-100 relative overflow-hidden min-h-[600px] md:min-h-[800px] flex items-center justify-center">
                      {/* Background Grid */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                      {/* Campus Map Layout */}
                      <div className="relative w-full max-w-4xl aspect-[4/5] md:aspect-square">
                        
                        {/* Connector A1 - A2 (Moved here to be below in Z-index) */}
                        <div className="absolute left-[33%] top-[12%] w-[20%] h-[16%] border-y-2 border-gray-300 bg-gray-100 z-0" />

                        {/* Tòa A1 */}
                        <motion.div 
                          whileHover={{ scale: 1.05, zIndex: 20 }}
                          onClick={() => setHomeSelectedBuilding('Tòa A1')}
                          className="absolute left-[5%] top-[5%] w-[28%] h-[30%] bg-[#8b0000] rounded-[2rem] shadow-lg flex flex-col items-center justify-center text-white cursor-pointer group border-2 border-[#600000] z-10"
                        >
                          <span className="font-bold text-2xl">Tòa A1</span>
                        </motion.div>

                        {/* Giảng đường A2 */}
                        <motion.div 
                          whileHover={{ scale: 1.05, zIndex: 20 }}
                          onClick={() => setHomeSelectedBuilding('Giảng đường A2')}
                          className="absolute left-[50%] top-[5%] w-[38%] h-[30%] flex items-center justify-center cursor-pointer group z-10"
                        >
                          {/* Main Square Body */}
                          <div className="absolute inset-4 border-2 border-[#c53030] bg-[#fff5f5] rounded-xl shadow-inner" />
                          
                          {/* 4 Corner Circles */}
                          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-[#c53030] bg-[#feb2b2] shadow-sm" />
                          <div className="absolute top-0 right-0 w-12 h-12 rounded-full border-2 border-[#c53030] bg-[#feb2b2] shadow-sm" />
                          <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full border-2 border-[#c53030] bg-[#feb2b2] shadow-sm" />
                          <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full border-2 border-[#c53030] bg-[#feb2b2] shadow-sm" />
                          
                          {/* Center Circle */}
                          <div className="relative w-[60%] aspect-square rounded-full border-2 border-[#c53030] bg-white flex items-center justify-center text-center p-2 shadow-md">
                            <span className="font-bold text-[#c53030] text-2xl">Giảng đường<br/>A2</span>
                          </div>
                        </motion.div>

                        {/* Giảng đường D2 */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setHomeSelectedBuilding('Giảng đường D2')}
                          className="absolute left-[12%] top-[45%] w-[18%] h-[48%] border-2 border-[#2b6cb0] bg-[#ebf8ff] rounded-[2rem] shadow-md flex items-center justify-center text-center p-4 cursor-pointer"
                        >
                          <span className="font-bold text-[#2b6cb0] text-2xl">Giảng đường<br/>D2</span>
                        </motion.div>

                        {/* Giảng đường B */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setHomeSelectedBuilding('Giảng đường B')}
                          className="absolute left-[45%] top-[45%] w-[46%] h-[11%] border-2 border-[#2f855a] bg-[#f0fff4] rounded-2xl shadow-sm flex items-center justify-center cursor-pointer"
                        >
                          <span className="font-bold text-[#2f855a] text-2xl">Giảng đường B</span>
                        </motion.div>

                        {/* Giảng đường D */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setHomeSelectedBuilding('Giảng đường D')}
                          className="absolute left-[45%] top-[58%] w-[14%] h-[22%] border-2 border-[#6b46c1] bg-[#faf5ff] rounded-xl shadow-sm flex items-center justify-center text-center p-2 cursor-pointer"
                        >
                          <span className="font-bold text-[#6b46c1] text-2xl">Giảng đường D</span>
                        </motion.div>

                        {/* Sân KTX */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setHomeSelectedBuilding('Sân KTX')}
                          className="absolute left-[65%] top-[58%] w-[22%] aspect-square border-2 border-[#2c7a7b] bg-[#e6fffa] rounded-full shadow-sm flex items-center justify-center cursor-pointer"
                        >
                          <span className="font-bold text-[#2c7a7b] text-2xl">Sân KTX</span>
                        </motion.div>

                        {/* Giảng đường C */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setHomeSelectedBuilding('Giảng đường C')}
                          className="absolute left-[45%] top-[82%] w-[46%] h-[11%] border-2 border-[#c05621] bg-[#fffaf0] rounded-2xl shadow-sm flex items-center justify-center cursor-pointer"
                        >
                          <span className="font-bold text-[#c05621] text-2xl">Giảng đường C</span>
                        </motion.div>

                      </div>
                    </div>

                    {/* Legend / Quick Stats */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#8b0000]">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tổng số giảng đường</p>
                          <p className="text-xl font-bold text-gray-800">150+</p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sức chứa tối đa</p>
                          <p className="text-xl font-bold text-gray-800">15,000+</p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tình trạng hiện tại</p>
                          <p className="text-xl font-bold text-gray-800">Đang hoạt động</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ROOM_DATA[homeSelectedBuilding]?.map((room) => {
                        const info = getRoomStatus(homeSelectedBuilding, room);
                        return (
                          <motion.div 
                            key={room}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-6 rounded-3xl border ${info.color} shadow-sm transition-all flex flex-col justify-between min-h-[180px]`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold">{room}</h3>
                                <p className="text-xs opacity-70 uppercase tracking-widest font-bold mt-1">Phòng học</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                info.status === 'occupied' ? 'bg-green-600 text-white' : 
                                info.status === 'maintenance' ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {info.label}
                              </div>
                            </div>

                            {info.status === 'occupied' && info.course ? (
                              <div className="space-y-2">
                                <p className="text-sm font-bold line-clamp-1">{info.course.subjectName}</p>
                                <div className="flex items-center gap-2 text-xs opacity-80">
                                  <User className="w-3 h-3" />
                                  <span>GV: {info.course.lecturer}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs opacity-80">
                                  <Clock3 className="w-3 h-3" />
                                  <span>{info.course.timeRange}</span>
                                </div>
                              </div>
                            ) : info.status === 'maintenance' ? (
                              <div className="flex items-center gap-2 text-xs opacity-80">
                                <Info className="w-4 h-4" />
                                <span>Đang trong quá trình bảo trì định kỳ</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs opacity-80">
                                <UserCheck className="w-4 h-4" />
                                <span>Phòng hiện đang trống</span>
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                              <button 
                                onClick={() => {
                                  setSelectedBuilding(homeSelectedBuilding);
                                  setSelectedRoom(room);
                                  setActiveTab('tra-cuu-gd');
                                }}
                                className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                              >
                                Xem chi tiết
                              </button>
                              <button 
                                onClick={() => {
                                  setBookingForm(prev => ({ ...prev, building: homeSelectedBuilding, room }));
                                  setActiveTab('muon-phong');
                                  setBookingSubTab('register');
                                }}
                                className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                              >
                                Mượn phòng
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === 'tra-cuu-gd' ? (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Search className="text-[#8b0000]" />
                    Tra cứu giảng đường
                  </h2>
                  <p className="text-gray-500 mt-1">Tìm kiếm thông tin phòng học và tình trạng sử dụng.</p>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-6 text-[#8b0000]">
                    <Filter className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-sm">Lọc dữ liệu</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Dãy nhà */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Dãy nhà</label>
                      <select 
                        value={selectedBuilding}
                        onChange={(e) => {
                          setSelectedBuilding(e.target.value);
                          setSelectedRoom(''); // Reset room when building changes
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                      >
                        <option value="">-- Chọn dãy nhà --</option>
                        {Object.keys(ROOM_DATA).map(building => (
                          <option key={building} value={building}>{building}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tên phòng */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tên phòng</label>
                      <select 
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                      >
                        <option value="">-- Chọn tên phòng --</option>
                        {availableRooms.map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>

                    {/* Loại phòng */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Loại phòng</label>
                      <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        disabled={!selectedBuilding}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Chọn loại phòng --</option>
                        {ROOM_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Ngày bắt đầu */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày bắt đầu</label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setStartDate(newStart);
                          // If new start date is after current end date, push end date forward
                          if (newStart > endDate) {
                            setEndDate(newStart);
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày kết thúc</label>
                      <input 
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          // Ensure end date is never before start date
                          if (newEnd >= startDate) {
                            setEndDate(newEnd);
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end gap-3">
                      <button 
                        onClick={handleSearch}
                        disabled={isSearchingGd}
                        className="flex-1 bg-[#8b0000] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#a00000] transition-all shadow-lg shadow-red-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSearchingGd ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        Lọc dữ liệu
                      </button>
                      <button 
                        onClick={handleResetFilters}
                        className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all"
                        title="Làm mới"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                {hasSearchedGd ? (
                  searchResultsGd.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-gray-800">Kết quả tìm kiếm ({searchResultsGd.length})</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {searchResultsGd.map((course) => (
                          <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-0.5 bg-red-50 text-[#8b0000] text-[10px] font-bold rounded uppercase tracking-wider">
                                        {course.building}
                                      </span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                        Phòng {course.room}
                                      </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 group-hover:text-[#8b0000] transition-colors">
                                      {course.subjectName}
                                    </h4>
                                    <p className="text-sm text-gray-500 font-medium">Mã môn: {course.subjectCode} | LHP: {course.classCode}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock3 className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Tiết {course.periods}</p>
                                      <p className="opacity-70">{course.timeRange}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">{course.dayOfWeek}</p>
                                      <p className="opacity-70">Hàng tuần</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <UserCheck className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Giảng viên</p>
                                      <p className="opacity-70">{course.lecturer}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Thời gian</p>
                                      <p className="opacity-70">{new Date(course.startDate).toLocaleDateString('vi-VN')} - {new Date(course.endDate).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="lg:border-l lg:pl-8 flex flex-row lg:flex-col items-center justify-center gap-4">
                                <button className="px-6 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-full hover:bg-gray-100 transition-all border border-gray-100">
                                  Chi tiết
                                </button>
                                <button className="px-6 py-2 bg-[#8b0000] text-white text-sm font-bold rounded-full hover:bg-[#a00000] transition-all shadow-lg shadow-red-900/10">
                                  Đăng ký
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Không tìm thấy kết quả</h3>
                      <p className="text-gray-500 mt-2">Vui lòng thử lại với các tiêu chí lọc khác.</p>
                    </div>
                  )
                ) : (
                  /* Initial State Placeholder */
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Chưa có dữ liệu tra cứu</h3>
                    <p className="text-gray-500 mt-2">Vui lòng chọn các tiêu chí lọc và nhấn "Lọc dữ liệu" để xem kết quả.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'tra-cuu-tkb-gv' ? (
              <div className="space-y-8">
                {/* Search Filters Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Tra cứu TKB giảng viên</h2>
                      <p className="text-sm text-gray-500">Xem lịch giảng dạy chi tiết của giảng viên</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Khoa bộ môn */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Khoa bộ môn</label>
                      <select 
                        value={selectedDepartment}
                        onChange={(e) => {
                          setSelectedDepartment(e.target.value);
                          setSelectedLecturer(''); // Reset lecturer when department changes
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="">--Tất cả--</option>
                        {Array.from(new Set(Object.values(LECTURER_DEPARTMENTS))).map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Giảng viên */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Giảng viên</label>
                      <select 
                        value={selectedLecturer}
                        onChange={(e) => setSelectedLecturer(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="">-- Chọn giảng viên --</option>
                        {allLecturers
                          .filter(name => !selectedDepartment || LECTURER_DEPARTMENTS[name] === selectedDepartment)
                          .map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Tình trạng */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tình trạng</label>
                      <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="Có lịch giảng">Có lịch giảng</option>
                        <option value="Không có lịch giảng">Không có lịch giảng</option>
                      </select>
                    </div>

                    {/* Ngày bắt đầu */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày bắt đầu</label>
                      <input 
                        type="date"
                        value={startDateGv}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setStartDateGv(newStart);
                          if (newStart > endDateGv) {
                            setEndDateGv(newStart);
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày kết thúc</label>
                      <input 
                        type="date"
                        value={endDateGv}
                        min={startDateGv}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          if (newEnd >= startDateGv) {
                            setEndDateGv(newEnd);
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end gap-3">
                      <button 
                        onClick={handleSearchGv}
                        disabled={isSearchingGv}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSearchingGv ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        XEM
                      </button>
                      <button 
                        onClick={handleResetFilters}
                        className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all"
                        title="Làm mới"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                {hasSearchedGv ? (
                  searchResultsGv.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-gray-800">Lịch giảng dạy ({searchResultsGv.length} lớp học phần)</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {searchResultsGv.map((course) => (
                          <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                              <div className="flex-1 space-y-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                      {course.lecturer}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                      {LECTURER_DEPARTMENTS[course.lecturer] || 'Khoa bộ môn'}
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                                    {course.subjectName}
                                  </h4>
                                  <p className="text-sm text-gray-500">Phòng: {course.building} - {course.room} | LHP: {course.classCode}</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-50">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock3 className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Tiết {course.periods}</p>
                                      <p className="opacity-70">{course.timeRange}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">{course.dayOfWeek}</p>
                                      <p className="opacity-70">Hàng tuần</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Thời gian</p>
                                      <p className="opacity-70">{new Date(course.startDate).toLocaleDateString('vi-VN')} - {new Date(course.endDate).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="lg:border-l lg:pl-8 flex flex-row lg:flex-col items-center justify-center gap-4">
                                <button className="px-6 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-full hover:bg-gray-100 transition-all border border-gray-100">
                                  Chi tiết
                                </button>
                                <button className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-full hover:bg-green-700 transition-all shadow-lg shadow-green-900/10">
                                  Đăng ký
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {selectedStatus === 'Có lịch giảng' 
                          ? 'Không tìm thấy lịch giảng' 
                          : scheduledResultsGv.length > 0 
                            ? 'Giảng viên CÓ lịch giảng trong thời gian này' 
                            : 'Giảng viên không có lịch giảng trong thời gian này'}
                      </h3>
                      <p className="text-gray-500 mt-2">
                        {selectedStatus === 'Không có lịch giảng' && scheduledResultsGv.length > 0 
                          ? 'Lịch giảng dạy đã được tìm thấy, không khớp với tiêu chí "Không có lịch giảng".' 
                          : 'Vui lòng thử lại với các tiêu chí lọc khác.'}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Tra cứu TKB giảng viên</h3>
                    <p className="text-gray-500 mt-2">Chọn khoa, giảng viên và thời gian để xem lịch giảng dạy chi tiết.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'tra-cuu-tkb' ? (
              <div className="space-y-8">
                {/* Search Filters Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Tra cứu thời khóa biểu</h2>
                      <p className="text-sm text-gray-500">Xem lịch học chi tiết theo học kỳ và học phần</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Năm học */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Năm học</label>
                      <select 
                        value={selectedAcademicYear}
                        onChange={(e) => {
                          setSelectedAcademicYear(e.target.value);
                          setSelectedSemester(''); // Reset semester when year changes
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="">--Chọn năm học--</option>
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Học kỳ */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Học kỳ</label>
                      <select 
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        disabled={!selectedAcademicYear}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">--Chọn học kỳ--</option>
                        {semesters.map(sem => (
                          <option key={sem.id} value={sem.id}>{sem.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mã lớp học phần */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mã lớp học phần</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: TIKT1124(225)_03"
                        value={classCodeInput}
                        onChange={(e) => setClassCodeInput(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Chọn học phần */}
                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chọn học phần (môn học)</label>
                      <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="">--Tất cả--</option>
                        {allSubjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end gap-3">
                      <button 
                        onClick={handleSearchTkb}
                        disabled={isSearchingTkb}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSearchingTkb ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        XEM
                      </button>
                      <button 
                        onClick={handleResetFilters}
                        className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all"
                        title="Làm mới"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                {hasSearchedTkb ? (
                  searchResultsTkb.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-gray-800">Thời khóa biểu ({searchResultsTkb.length} lớp học phần)</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {searchResultsTkb.map((course) => (
                          <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                              <div className="flex-1 space-y-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                      {course.classCode}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                      {course.building} - {course.room}
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                    {course.subjectName}
                                  </h4>
                                  <p className="text-sm text-gray-500">Giảng viên: {course.lecturer}</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-50">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock3 className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Tiết {course.periods}</p>
                                      <p className="opacity-70">{course.timeRange}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">{course.dayOfWeek}</p>
                                      <p className="opacity-70">Hàng tuần</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    <div className="text-xs">
                                      <p className="font-bold">Thời gian</p>
                                      <p className="opacity-70">{new Date(course.startDate).toLocaleDateString('vi-VN')} - {new Date(course.endDate).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="lg:border-l lg:pl-8 flex flex-row lg:flex-col items-center justify-center gap-4">
                                <button className="px-6 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-full hover:bg-gray-100 transition-all border border-gray-100">
                                  Chi tiết
                                </button>
                                <button className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10">
                                  Đăng ký
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Không tìm thấy thời khóa biểu</h3>
                      <p className="text-gray-500 mt-2">Vui lòng thử lại với các tiêu chí lọc khác.</p>
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Tra cứu thời khóa biểu</h3>
                    <p className="text-gray-500 mt-2">Chọn năm học, học kỳ và học phần để xem lịch học chi tiết.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'muon-phong' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <ClipboardList className="text-[#8b0000]" />
                      Mượn phòng
                    </h2>
                    <p className="text-gray-500 mt-1">Đăng ký mượn phòng học cho các hoạt động ngoại khóa, sự kiện.</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setBookingSubTab('register')}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${bookingSubTab === 'register' ? 'bg-[#8b0000] text-white shadow-lg shadow-red-900/10' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                  >
                    Tìm/đăng ký phòng
                  </button>
                  <button 
                    onClick={() => setBookingSubTab('list')}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${bookingSubTab === 'list' ? 'bg-[#8b0000] text-white shadow-lg shadow-red-900/10' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                  >
                    Danh sách phòng đã đăng ký
                  </button>
                </div>

                {bookingSubTab === 'register' ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleBookingSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Ngày mượn */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày mượn</label>
                          <input 
                            type="date"
                            required
                            value={bookingForm.borrowDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setBookingForm(prev => ({
                                ...prev, 
                                borrowDate: newDate,
                                returnDate: prev.returnDate < newDate ? newDate : prev.returnDate
                              }));
                            }}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>

                        {/* Thời gian mượn */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Thời gian mượn</label>
                          <input 
                            type="time"
                            required
                            value={bookingForm.startTime}
                            onChange={(e) => setBookingForm({...bookingForm, startTime: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>

                        {/* Ngày trả */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày trả</label>
                          <input 
                            type="date"
                            required
                            min={bookingForm.borrowDate}
                            value={bookingForm.returnDate}
                            onChange={(e) => setBookingForm({...bookingForm, returnDate: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>

                        {/* Thời gian kết thúc */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Thời gian trả</label>
                          <input 
                            type="time"
                            required
                            value={bookingForm.endTime}
                            onChange={(e) => setBookingForm({...bookingForm, endTime: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>

                        {/* Dãy nhà */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Dãy nhà</label>
                          <select 
                            required
                            value={bookingForm.building}
                            onChange={(e) => setBookingForm({...bookingForm, building: e.target.value, room: ''})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                          >
                            <option value="">-- Chọn dãy nhà --</option>
                            {Object.keys(ROOM_DATA).map(building => (
                              <option key={building} value={building}>{building}</option>
                            ))}
                          </select>
                        </div>

                        {/* Tên phòng */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tên phòng</label>
                          <select 
                            required
                            value={bookingForm.room}
                            onChange={(e) => setBookingForm({...bookingForm, room: e.target.value})}
                            disabled={!bookingForm.building}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm disabled:opacity-50"
                          >
                            <option value="">-- Chọn tên phòng --</option>
                            {(ROOM_DATA[bookingForm.building] || []).map(room => (
                              <option key={room} value={room}>{room}</option>
                            ))}
                          </select>
                        </div>

                        {/* Đơn vị mượn */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Đơn vị mượn</label>
                          <select 
                            required
                            value={bookingForm.unit}
                            onChange={(e) => setBookingForm({...bookingForm, unit: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm"
                          >
                            {BORROWING_UNITS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>

                        {/* Người mượn (Auto-set) */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Người mượn</label>
                          <input 
                            type="text"
                            readOnly
                            value={mockUser?.displayName || auth.currentUser?.displayName || 'Vũ Trí Quang Vinh'}
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Mã Sinh viên/Giảng viên (Auto-set) */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">{mockUser?.role === 'lecturer' ? 'Mã Giảng viên' : 'Mã Sinh viên'}</label>
                          <input 
                            type="text"
                            readOnly
                            value={mockUser?.username || auth.currentUser?.email?.split('@')[0] || '20210001'}
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Mã giảng viên (Auto-set) */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mã giảng viên</label>
                          <input 
                            type="text"
                            readOnly
                            value="0"
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Lý do, mục đích mượn phòng */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Lý do, mục đích mượn phòng</label>
                        <textarea 
                          required
                          rows={4}
                          value={bookingForm.reason}
                          onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                          placeholder="Nhập lý do mượn phòng cụ thể..."
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent outline-none transition-all text-sm resize-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button 
                          type="submit"
                          disabled={isSubmittingBooking}
                          className="px-10 py-3 bg-[#8b0000] text-white rounded-xl font-bold hover:bg-[#a00000] transition-all shadow-lg shadow-red-900/20 disabled:opacity-70 flex items-center gap-2"
                        >
                          {isSubmittingBooking ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ClipboardList className="w-5 h-5" />}
                          Đăng ký mượn phòng
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isLoadingBookings ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw className="w-10 h-10 text-[#8b0000] animate-spin mb-4" />
                        <p className="text-gray-500">Đang tải danh sách đăng ký...</p>
                      </div>
                    ) : myBookings.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {myBookings.map((booking) => (
                          <motion.div 
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                    booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                                    booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                    'bg-yellow-50 text-yellow-600'
                                  }`}>
                                    {booking.status === 'approved' ? 'Đã duyệt' :
                                     booking.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                                  </span>
                                  <span className="text-xs text-gray-400">Ngày đăng ký: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">
                                  {booking.building} - Phòng {booking.room}
                                </h4>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(booking.borrowDate).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{booking.startTime} - {booking.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>{booking.unit}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                  "{booking.reason}"
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
                                  Chi tiết
                                </button>
                                {booking.status === 'pending' && (
                                  <button 
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    Hủy yêu cầu
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ClipboardList className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Chưa có đăng ký nào</h3>
                        <p className="text-gray-500 mt-2">Bạn chưa thực hiện đăng ký mượn phòng nào.</p>
                        <button 
                          onClick={() => setBookingSubTab('register')}
                          className="mt-6 px-6 py-2 bg-[#8b0000] text-white rounded-full font-medium hover:bg-[#a00000] transition-all"
                        >
                          Đăng ký ngay
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'phan-anh' ? (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-red-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Phản ánh sự cố</h2>
                    </div>
                    <p className="text-gray-500 font-medium">Báo cáo các vấn đề về cơ sở vật chất, trang thiết bị</p>
                  </div>
                  
                  <div className="flex bg-gray-100/80 p-1.5 rounded-2xl relative z-10 w-full md:w-auto">
                    <button
                      onClick={() => setIncidentSubTab('report')}
                      className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        incidentSubTab === 'report' 
                          ? 'bg-white text-orange-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      Gửi phản ánh
                    </button>
                    <button
                      onClick={() => setIncidentSubTab('list')}
                      className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        incidentSubTab === 'list' 
                          ? 'bg-white text-orange-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      Lịch sử phản ánh
                    </button>
                  </div>
                </div>

                {incidentSubTab === 'report' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="text-xl font-bold text-gray-800">Thông tin sự cố</h3>
                      <p className="text-sm text-gray-500 mt-1">Vui lòng cung cấp chi tiết để chúng tôi xử lý nhanh chóng</p>
                    </div>
                    
                    <form onSubmit={handleIncidentSubmit} className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Tiêu đề */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tiêu đề sự cố</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ví dụ: Hỏng máy chiếu phòng D3-201"
                            value={incidentForm.title}
                            onChange={(e) => setIncidentForm({...incidentForm, title: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>

                        {/* Vị trí */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Vị trí (Tòa nhà - Phòng)</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ví dụ: Tòa D3, Phòng 201"
                            value={incidentForm.location}
                            onChange={(e) => setIncidentForm({...incidentForm, location: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>

                        {/* Loại sự cố */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Loại sự cố</label>
                          <select 
                            required
                            value={incidentForm.type}
                            onChange={(e) => setIncidentForm({
                              ...incidentForm, 
                              type: e.target.value as 'Sự cố phòng học' | 'Sự cố Cơ sở vật chất',
                              equipment: INCIDENT_EQUIPMENT[e.target.value as 'Sự cố phòng học' | 'Sự cố Cơ sở vật chất'][0]
                            })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm appearance-none"
                          >
                            <option value="Sự cố phòng học">Sự cố phòng học</option>
                            <option value="Sự cố Cơ sở vật chất">Sự cố Cơ sở vật chất</option>
                          </select>
                        </div>

                        {/* Thiết bị gặp sự cố */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Thiết bị gặp sự cố</label>
                          <select 
                            required
                            value={incidentForm.equipment}
                            onChange={(e) => setIncidentForm({...incidentForm, equipment: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm appearance-none"
                          >
                            {INCIDENT_EQUIPMENT[incidentForm.type as 'Sự cố phòng học' | 'Sự cố Cơ sở vật chất'].map((eq) => (
                              <option key={eq} value={eq}>{eq}</option>
                            ))}
                          </select>
                        </div>

                        {/* Mô tả chi tiết */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mô tả chi tiết</label>
                          <textarea 
                            required
                            rows={4}
                            placeholder="Mô tả rõ tình trạng sự cố đang gặp phải..."
                            value={incidentForm.description}
                            onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                          />
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end gap-4">
                        <button 
                          type="button"
                          onClick={() => setIncidentForm({title: '', description: '', location: '', urgency: 'Bình thường'})}
                          className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          Làm lại
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmittingIncident}
                          className="px-8 py-3 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-70 flex items-center gap-2"
                        >
                          {isSubmittingIncident ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4" />
                              Gửi phản ánh
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {isLoadingIncidents ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                      </div>
                    ) : myIncidents.length > 0 ? (
                      <div className="grid gap-4">
                        {myIncidents.map((incident) => (
                          <motion.div 
                            key={incident.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                                    incident.status === 'resolved' ? 'bg-green-50 text-green-600 border border-green-200' :
                                    incident.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                    'bg-gray-50 text-gray-500 border border-gray-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      incident.status === 'resolved' ? 'bg-green-500' :
                                      incident.status === 'in-progress' ? 'bg-blue-500' :
                                      'bg-gray-400'
                                    }`}></span>
                                    {incident.status === 'resolved' ? 'Đã xử lý' :
                                     incident.status === 'in-progress' ? 'Đang xử lý' : 'Chờ'}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-gray-100 text-gray-600`}>
                                    {incident.type}
                                  </span>
                                  <span className="text-xs text-gray-400">Ngày gửi: {new Date(incident.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">
                                  {incident.title}
                                </h4>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>{incident.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{incident.equipment}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                  "{incident.description}"
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {incident.status === 'pending' && (
                                  <button 
                                    onClick={() => {
                                      setIncidentToDelete(incident.id);
                                      setIsDeleteIncidentModalOpen(true);
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    Xóa phản ánh
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Chưa có phản ánh nào</h3>
                        <p className="text-gray-500 mt-2">Bạn chưa gửi phản ánh sự cố nào.</p>
                        <button 
                          onClick={() => setIncidentSubTab('report')}
                          className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-all"
                        >
                          Gửi phản ánh ngay
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Tính năng đang phát triển</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  Chức năng "{getNavGroups(mockUser?.role).flatMap(g => g.items).find(i => i.id === activeTab)?.label}" hiện đang được cập nhật dữ liệu. Vui lòng quay lại sau.
                </p>
                <button 
                  onClick={() => setActiveTab('trang-chu')}
                  className="mt-6 px-6 py-2 bg-[#8b0000] text-white rounded-full font-medium hover:bg-[#a00000] transition-all"
                >
                  Quay lại Trang chủ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDeleteIncidentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-500 mt-1">Bạn có chắc chắn muốn xóa phản ánh này không? Hành động này không thể hoàn tác.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsDeleteIncidentModalOpen(false);
                    setIncidentToDelete(null);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCancelIncident}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                  Xóa phản ánh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
