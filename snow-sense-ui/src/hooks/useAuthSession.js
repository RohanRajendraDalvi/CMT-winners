import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuthInstance } from '../api/firebase';

export const useAuthSession = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;

    const setup = async () => {
      const auth = await getAuthInstance();
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser || null);
        setLoading(false);
      });
    };

    setup();
    return () => unsubscribe?.();
  }, []);

  return { user, loading };
};
