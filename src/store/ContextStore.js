import { createContext, useState } from 'react';

const ContextStore = createContext()


export function ContextProvider({children}) {
  const [activeClient, setActiveClient] = useState('')
  const getClientData = (data) => {
    setActiveClient(data)
  }

  const [activeVehicle, setActiveVehicle] = useState('')
  const getVehicleData = (data) => {
    setActiveVehicle(data)
  }

  const [activeTask, setActiveTask] = useState('')
  const getActiveTask = (data) => {
    setActiveTask(data)
  }

  const [activeInvoice, setActiveInvoice] = useState('')
  const getActiveInvoice = (data) => {
    setActiveInvoice(data)
  }

  const [activePhoneNumber, setActivePhoneNumber] = useState('')
  const getActivePhoneNumber = (data) => {
    setActivePhoneNumber(data)
  }

  const [activeSearchResults, setActiveSearchResults] = useState('')
  const getActiveSearchResults = (data) => {
    setActiveSearchResults(data)
  }



  return (
    <ContextStore.Provider value={{activeClient, getClientData, activeVehicle, getVehicleData, activePhoneNumber, getActivePhoneNumber, activeTask, getActiveTask, activeInvoice, getActiveInvoice, activeSearchResults, getActiveSearchResults}}>
      {children}
    </ContextStore.Provider>
  )


}

export default ContextStore
