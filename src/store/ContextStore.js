import { createContext, useState } from 'react';

const ContextStore = createContext()


export function ContextProvider({children}) {
  const [activeClient, setActiveClient] = useState({})
  const getClientData = (data) => {
    setActiveClient(data)
  }

  const [activeVehicle, setActiveVehicle] = useState({})
  const getVehicleData = (data) => {
    setActiveVehicle(data)
  }


  return (
    <ContextStore.Provider value={{activeClient, getClientData, activeVehicle, getVehicleData}}>
      {children}
    </ContextStore.Provider>
  )


}

export default ContextStore
