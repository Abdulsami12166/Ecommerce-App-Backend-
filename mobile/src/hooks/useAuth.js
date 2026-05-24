import { useState } from 'react';

const useAuth = () => {
  const [token, setToken] = useState(null);

  return {
    token,
    isAuthenticated: Boolean(token),
    setToken,
    clearToken: () => setToken(null),
  };
};

export default useAuth;
