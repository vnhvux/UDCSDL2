#!/bin/bash
cat << 'INNER_EOF' > /tmp/merge.patch
<<<<<<< SEARCH
  useEffect(() => {
    if (!auth.currentUser) return;

    setIsLoadingBookings(true);
    const bookingsRef = collection(db, 'roomBookings');
    const qBookings = query(bookingsRef, where('userId', '==', auth.currentUser.uid));
    const unsubscribeMyBookings = onSnapshot(qBookings, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyBookings(bookings.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
      setIsLoadingBookings(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'roomBookings');
      setIsLoadingBookings(false);
    });

    const unsubscribeAllBookings = onSnapshot(bookingsRef, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllBookings(bookings.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'roomBookings');
    });
=======
  useEffect(() => {
    setIsLoadingBookings(true);
    const bookingsRef = collection(db, 'roomBookings');

    // For normal users, fetch their own bookings
    // For QLDT, we fetch all bookings
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
>>>>>>> REPLACE
INNER_EOF
patch src/components/Dashboard.tsx < /tmp/merge.patch
