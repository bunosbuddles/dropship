import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext();

export const ImpersonationProvider = ({ children }) => {
  const [impersonatedUserId, setImpersonatedUserId] = useState(null);

  const startImpersonation = (userId) => setImpersonatedUserId(userId);
  const stopImpersonation = () => setImpersonatedUserId(null);

  return (
    <ImpersonationContext.Provider value={{ impersonatedUserId, startImpersonation, stopImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => useContext(ImpersonationContext); 