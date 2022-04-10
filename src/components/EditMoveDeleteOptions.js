import { getTime } from './getCurrentTime'
import firebase from 'firebase/app'
import { toast } from 'react-toastify'

//
// Deletes any provided data from Firestore database: car/client/ticket
// DeleteFunc is also triggered when relocating ticket between states
//
export async function DeleteFunc(objectType, docPath, ID, operationType) {
  let ConfirmDelete
  
  try{
    const docReference = docPath.doc(`${objectType === 'Ticket' ? 'zlecenie-' : ''}${ID}`)
    
    const referenceExists = await docReference.get()
    if(referenceExists.exists) {
      if(objectType === 'Ticket' || objectType === 'Client' || objectType === 'Vehicle') await docReference.delete()
      else throw Error('Unable to get valid object type.')

      if(objectType === 'Ticket'){
        const counterPathTickets = firebase.firestore().collection('warsztat').doc('zlecenia')
        if (operationType !== 'justRelocate') await counterPathTickets.update("IloscZlecen", firebase.firestore.FieldValue.increment(-1))
        if (docPath.id === 'wolne' && operationType !== 'justRelocate') await counterPathTickets.update("Wolne", firebase.firestore.FieldValue.increment(-1))
        if (docPath.id === 'obecne' && operationType !== 'justRelocate') await counterPathTickets.update("Obecne", firebase.firestore.FieldValue.increment(-1))
        if (docPath.id === 'zakonczone' && operationType !== 'justRelocate') await counterPathTickets.update("Zakonczone", firebase.firestore.FieldValue.increment(-1))
      }
      else if(objectType === 'Client'){
        const counterPathClients = firebase.firestore().collection('warsztat').doc('Klienci')
        if(operationType !== 'doNotCount'){
          await counterPathClients.update("Klienci", firebase.firestore.FieldValue.increment(-1))
          await fetchAndCountClientVehicles(ID)
        }
        ConfirmDelete = true
      }
      else if(objectType === 'Vehicle'){     
        const counterPathVehicles = firebase.firestore().collection('warsztat').doc('Pojazdy')
        if(operationType !== 'doNotCount') await counterPathVehicles.update("Pojazdy", firebase.firestore.FieldValue.increment(-1))
      }
      ConfirmDelete = true
      toast.success(`${objectType}'s data successfully deleted.`)

    } else throw Error('Mismatch of object path.')
  } catch(err){
    toast.error(`Failed to delete data... ${err.message}`)
    ConfirmDelete = false
}
    return ConfirmDelete
}

//
// Relocate target ticket between collections
//
export async function RelocateTicket(type, object, ticketsPath, currentDocPath, newDocPath, ID) {
  const counterPathTickets = firebase.firestore().collection('warsztat').doc('zlecenia')
  const docReference = ticketsPath.collection(newDocPath).doc(`zlecenie-${ID}`)
  const currentTime = getTime()
  let ConfirmRelocate, clientIsOffline

  async function changeDataFunc(doc) {
    try{
      if(doc.exists) await docReference.update({...object})
      else await docReference.set({...object})
    } 
    catch(err){
      toast.error(`${err.code}:  ${err.message}`)
      return ConfirmRelocate = false
    }
    return ConfirmRelocate
  }

    // This counter func will be removed later when I move them to Server side functions
  function updateCountersFunc() {
    if(currentDocPath === 'wolne') counterPathTickets.update("Wolne", firebase.firestore.FieldValue.increment(-1))
    if(currentDocPath === 'obecne') counterPathTickets.update("Obecne", firebase.firestore.FieldValue.increment(-1))
    if(currentDocPath === 'zakonczone') counterPathTickets.update("Zakonczone", firebase.firestore.FieldValue.increment(-1))
    if(newDocPath === 'wolne') counterPathTickets.update("Wolne", firebase.firestore.FieldValue.increment(1))
    if(newDocPath === 'obecne') counterPathTickets.update("Obecne", firebase.firestore.FieldValue.increment(1))
    if(newDocPath === 'zakonczone') counterPathTickets.update("Zakonczone", firebase.firestore.FieldValue.increment(1))
    let deleteThis = ticketsPath.collection(currentDocPath)
    DeleteFunc(type, deleteThis, ID, 'justRelocate')
  }

  if (currentDocPath !== newDocPath) {
  if(newDocPath === 'zakonczone') object['Zakonczone_Czas'] = currentTime
  object['Aktualizacja'] = currentTime

    try{
      const getDocReference = await docReference.get()
      await changeDataFunc(getDocReference)
      updateCountersFunc()
      ConfirmRelocate = true
    }
    catch (err){
      if(err.message.indexOf('offline') > 0) {
        ConfirmRelocate = false 
        clientIsOffline = true
        return {ConfirmRelocate, clientIsOffline}
      }
        ConfirmRelocate = false
    }
  } 
  else ConfirmRelocate = false
return { ConfirmRelocate, clientIsOffline}
}

//
// Relocating cars between different client numbers or when they are unassigned
//
export async function relocateCarsFunc(vehicleData, targetVIN, newPhoneNum){
  let confirmUnassign
  const vehiclePath = firebase.firestore()
    .collection('warsztat')
    .doc('Pojazdy').collection('VIN').doc(targetVIN)

    try{
      let doc = await vehiclePath.get()
      let data = doc?.data()
        
      if (data.exists) {
        await vehiclePath.update({...vehicleData, Tel: newPhoneNum ? newPhoneNum : ''})
        confirmUnassign = true
      } 
      else {
        await vehiclePath.set({...vehicleData, Tel: newPhoneNum ? newPhoneNum : ''})
        confirmUnassign = true
      }
    } 
    catch(err){
      toast.error(`${err.message}`)
      confirmUnassign = false
    }
    return confirmUnassign 
}


export async function updateClientNumber(oldData, updatedData) {
  let ConfirmUpdateClientData
  const currentTime = getTime()
  const clientsPath = firebase.firestore()
                        .collection('warsztat').doc('Klienci')
                        .collection('Numery')

  const newClientPath = clientsPath.doc(updatedData.Tel)

    // Re-assign old data to new one. (parse and stringify are required to correctly assign clustered functions)
  let setNewData = Object.assign(JSON.parse(JSON.stringify(oldData)), updatedData)

  try{
    let doc = await newClientPath.get()
    if (doc.exists) throw Error('This phone number is already used by another client!')
    else {
      await newClientPath.set({...setNewData, currentTime})
      await fetchAndCountClientVehicles(oldData.Tel, updatedData.Tel)
      await DeleteFunc('Client', clientsPath, oldData.Tel, 'doNotCount')
      ConfirmUpdateClientData = true
      toast.success(`Client's contact number has been updated: \n${updatedData.Tel}`)
    }
  }
  catch(err){
    toast.error(err.message)
    ConfirmUpdateClientData = false
  }
  return ConfirmUpdateClientData
}

export async function updateVehicleVIN(oldData, updatedData){

  let ConfirmUpdateVehicleData
  const currentTime = getTime()
  const vehiclePath = firebase.firestore()
    .collection('warsztat')
    .doc('Pojazdy').collection('VIN')

  const newVehiclePath = vehiclePath.doc(updatedData.VIN)

    // Re-assign old data to new one. (parse and stringify are required to correctly assign clustered functions)
  let setNewData = Object.assign(JSON.parse(JSON.stringify(oldData)), updatedData)

  try{
    let doc = await newVehiclePath.get()
    if (doc.exists) throw Error('Vehicle with this VIN already exists!') 
    else {
      await newVehiclePath.set({...setNewData, currentTime })
      await DeleteFunc('Vehicle', vehiclePath, oldData.VIN, 'doNotCount')
      ConfirmUpdateVehicleData = true
      toast.success(`Successfully updated VIN: ${updatedData.VIN}.`)
    }
    return ConfirmUpdateVehicleData = true
  }
  catch(err){
    toast.error(`Failed to update VIN... ${err.message}`)
    ConfirmUpdateVehicleData = false
  }
  return ConfirmUpdateVehicleData
}


export async function fetchAndCountClientVehicles(currentTel, newTelUpdate){
  const vehiclesPath = firebase.firestore().collection('warsztat').doc('Pojazdy').collection('VIN').where('Tel', '==', currentTel)

  const getVehicles = await vehiclesPath.get()
  const allVehicles = getVehicles.docs.map(doc => doc.data())

  allVehicles.forEach(async (car) => await relocateCarsFunc(car, car.VIN, newTelUpdate))
  return allVehicles
}