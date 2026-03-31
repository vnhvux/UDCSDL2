import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const COURSES = [
  {
    room: 'A2-101',
    building: 'Giảng đường A2',
    subjectName: 'Ứng dụng Cơ sở dữ liệu',
    subjectCode: 'TIKT1124',
    classCode: 'TIKT1124(225)_03',
    periods: '1-2',
    timeRange: '06h45 - 09h25',
    dayOfWeek: 'Thứ 3',
    startDate: '2025-12-27',
    endDate: '2026-04-21',
    lecturer: 'Trần Thanh Hải'
  },
  {
    room: 'C-103',
    building: 'Giảng đường C',
    subjectName: 'Lịch sử Đảng Cộng sản Việt Nam',
    subjectCode: 'LLDL1102',
    classCode: 'LLDL1102(225)_13',
    periods: '3-4',
    timeRange: '09h35 - 12h15',
    dayOfWeek: 'Thứ 3',
    startDate: '2025-12-27',
    endDate: '2026-04-21',
    lecturer: 'Trần Thị Thu Hoài'
  },
  {
    room: 'A2-102',
    building: 'Giảng đường A2',
    subjectName: 'Ứng dụng Cơ sở dữ liệu',
    subjectCode: 'TIKT1124',
    classCode: 'TIKT1124(225)_01',
    periods: '7-8',
    timeRange: '15h50 - 18h30',
    dayOfWeek: 'Thứ 4',
    startDate: '2025-12-28',
    endDate: '2026-04-22',
    lecturer: 'Trần Thanh Hải'
  },
  {
    room: 'A2-102',
    building: 'Giảng đường A2',
    subjectName: 'Phân tích và thiết kế hệ thống',
    subjectCode: 'CNTT1117',
    classCode: 'CNTT1117(225)_01',
    periods: '5-6',
    timeRange: '13h00 - 15h40',
    dayOfWeek: 'Thứ 4',
    startDate: '2025-12-28',
    endDate: '2026-04-22',
    lecturer: 'Nguyễn Ngọc Tuấn'
  }
];

export async function seedDatabase() {
  if (!auth.currentUser) {
    console.log('Skipping seed: User not authenticated.');
    return;
  }

  const path = 'courses';
  try {
    const coursesRef = collection(db, path);
    const snapshot = await getDocs(coursesRef);
    
    if (snapshot.empty) {
      console.log('Seeding database...');
      for (const course of COURSES) {
        await addDoc(coursesRef, course);
      }
      console.log('Database seeded successfully!');
    } else {
      console.log('Database already has data, skipping seed.');
    }
  } catch (error) {
    // If it's a permission error, it might be because the user is not an admin
    // We handle it gracefully for the seed function
    if (error instanceof Error && error.message.includes('insufficient permissions')) {
      console.log('Skipping seed: User does not have permission to seed (not an admin).');
    } else {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
}
