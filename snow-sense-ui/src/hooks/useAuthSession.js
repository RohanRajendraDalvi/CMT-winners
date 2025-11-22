import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthSession = (authInstance) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authInstance]);

  return { user, loading };
};
